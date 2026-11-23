"""Deterministic unpacking of the pinned guest and Alpine package overlays."""

from pathlib import Path
import ctypes
import struct
import stat
import tarfile
import os


def unpack_cpio(parts, root):
    lz4 = ctypes.CDLL("liblz4.so.1")
    lz4.LZ4_decompress_safe.argtypes = [
        ctypes.c_char_p,
        ctypes.c_void_p,
        ctypes.c_int,
        ctypes.c_int,
    ]
    buf = ctypes.create_string_buffer(8 * 1024**2)
    raw = b"".join(p.read_bytes() for p in parts)
    assert raw[:4] == struct.pack("<I", 0x184C2102)
    pos = 4
    chunks = []
    while pos < len(raw):
        size = struct.unpack_from("<I", raw, pos)[0]
        pos += 4
        n = lz4.LZ4_decompress_safe(raw[pos : pos + size], buf, size, len(buf))
        assert n >= 0
        chunks.append(buf.raw[:n])
        pos += size
    raw = b"".join(chunks)
    del chunks
    root.mkdir(parents=True, exist_ok=True)
    pos = 0
    links = []
    while pos < len(raw):
        assert raw[pos : pos + 6] == b"070701"
        f = [int(raw[pos + 6 + i * 8 : pos + 14 + i * 8], 16) for i in range(13)]
        pos += 110
        ns = f[11]
        name = raw[pos : pos + ns - 1].decode()
        pos = (pos + ns + 3) // 4 * 4
        data = raw[pos : pos + f[6]]
        pos = (pos + f[6] + 3) // 4 * 4
        if name == "TRAILER!!!":
            break
        assert ".." not in Path(name).parts and not name.startswith("/")
        p = root / name
        mode = f[1]
        if stat.S_ISDIR(mode):
            p.mkdir(parents=True, exist_ok=True)
        elif stat.S_ISREG(mode):
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(data)
            p.chmod(stat.S_IMODE(mode))
        elif stat.S_ISLNK(mode):
            links.append((p, data.decode()))
    for p, target in links:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.symlink_to(target)


def extract(archive, root):
    root = root.resolve()
    links = []
    with tarfile.open(archive, ignore_zeros=True) as package:
        for m in package:
            name = m.name.removeprefix("./")
            if (
                not name
                or name.startswith(".")
                or ".." in Path(name).parts
                or name.startswith("/")
            ):
                continue
            p = root / name
            if not p.parent.resolve().is_relative_to(root):
                raise ValueError("Archive path escapes guest: " + name)
            if m.isdir():
                p.mkdir(parents=True, exist_ok=True)
            elif m.isfile():
                p.parent.mkdir(parents=True, exist_ok=True)
                if p.exists() or p.is_symlink():
                    p.unlink()
                p.write_bytes(package.extractfile(m).read())
                p.chmod(m.mode)
            elif m.issym() or m.islnk():
                links.append((p, m))
    for p, m in links:
        p.parent.mkdir(parents=True, exist_ok=True)
        if p.exists() or p.is_symlink():
            p.unlink()
        if m.islnk():
            target = root / m.linkname.removeprefix("./")
            assert target.resolve().is_relative_to(root)
            os.link(target, p)
        else:
            target = m.linkname
            if target.startswith("/"):
                target = os.path.relpath(root / target.lstrip("/"), p.parent)
            assert (p.parent / target).resolve().is_relative_to(root)
            p.symlink_to(target)
