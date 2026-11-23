"""Pack an Alpine filesystem as a deterministic Linux initramfs."""
from pathlib import Path
import stat
import sys

root, output = map(Path, sys.argv[1:])
align = lambda length: b"\0" * (-length % 4)

def entry(out, name, mode, data=b"", major=0, minor=0):
    name = name.encode() + b"\0"
    fields = (0, mode, 0, 0, 1, 0, len(data), 0, 0, major, minor, len(name), 0)
    out.write(b"070701" + b"".join(f"{field:08x}".encode() for field in fields))
    out.write(name + align(110 + len(name)))
    out.write(data + align(len(data)))

with output.open("wb") as out:
    for path in sorted(root.rglob("*")):
        name = path.relative_to(root).as_posix()
        if name.startswith(("boot/", "usr/share/man/", "usr/share/doc/")):
            continue
        if "/kernel/" in name and name.endswith(".ko.gz") and not name.endswith(
            ("/9pnet.ko.gz", "/9pnet_virtio.ko.gz", "/9p.ko.gz", "/netfs.ko.gz")
        ):
            continue
        mode = path.lstat().st_mode
        if stat.S_ISLNK(mode):
            data = str(path.readlink()).encode()
        elif stat.S_ISREG(mode):
            data = path.read_bytes()
        elif stat.S_ISDIR(mode):
            data = b""
        else:
            continue
        entry(out, name, mode, data)
    entry(out, "dev/console", stat.S_IFCHR | 0o600, major=5, minor=1)
    entry(out, "TRAILER!!!", 0)
