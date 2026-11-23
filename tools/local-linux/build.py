"""Build a self-contained browser Linux guest. All upstream access is build-time only."""

from pathlib import Path
import concurrent.futures
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request
from support import unpack_cpio, extract

root = Path(__file__).resolve().parents[2]
here = Path(__file__).resolve().parent
kind = sys.argv[1]
out = root / sys.argv[2]
cache = root / ".cache/local-linux"
cache.mkdir(parents=True, exist_ok=True)
assets = json.loads((here / "assets.json").read_text())
by_name = {x.get("path", x.get("name")): x for x in assets}


def fetch(item):
    name = item.get("path", item.get("name")).replace("/", "-")
    p = cache / name
    if p.exists() and hashlib.sha256(p.read_bytes()).hexdigest() == item["sha256"]:
        return p
    for n in range(3):
        try:
            with urllib.request.urlopen(item["url"], timeout=180) as r:
                data = r.read()
            if hashlib.sha256(data).hexdigest() != item["sha256"]:
                raise ValueError("Checksum mismatch: " + name)
            p.write_bytes(data)
            return p
        except Exception:
            if n == 2:
                raise
            time.sleep(n + 1)


# Terminal libraries are committed with licences. QEMU is a build-host fallback only.
selected = [a for a in assets if a["group"] not in ["xterm", "build-only"]]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(fetch, selected))
layer = cache / (kind + "-root")
shutil.rmtree(layer, ignore_errors=True)
if kind == "c":
    unpack_cpio([cache / f"guest-{i:02d}.bin" for i in range(8)], layer)
    for a in selected:
        if a["group"] == "c-package":
            extract(fetch(a), layer)
    # C exercises do not use C++/Perl, kernel development headers, debug symbols or LTO.
    remove = [
        "usr/src",
        "usr/lib/perl5",
        "usr/share/perl5",
        "usr/include/c++",
        "usr/lib/debug",
        "usr/bin/lto-dump",
        "usr/lib/libstdc++.a",
    ]
    remove += [
        str(p.relative_to(layer)) for p in layer.glob("usr/libexec/gcc/*/*/lto1")
    ]
    for name in remove:
        p = layer / name
        if p.is_dir():
            shutil.rmtree(p)
        else:
            p.unlink(missing_ok=True)
    for p in (layer / "usr/lib/python3.12").rglob("__pycache__"):
        shutil.rmtree(p)
    subprocess.run(
        [sys.executable, "tools/build_browser_linux.py"], cwd=root, check=True
    )
    project = layer / "root/work"
    project.mkdir(parents=True, exist_ok=True)
    extract(root / "dist/assets/c-foundry-browser.tar.gz", project)
else:
    extract(fetch(by_name["alpine-base.tar.gz"]), layer)
    base = cache / "module-root"
    shutil.rmtree(base, ignore_errors=True)
    unpack_cpio([cache / f"guest-{i:02d}.bin" for i in range(8)], base)
    shutil.copytree(base / "lib/modules", layer / "lib/modules", symlinks=True)
    shutil.rmtree(base)
    for name in ["sbin/modprobe", "bin/hostname", "usr/bin/setsid"]:
        p = layer / name
        if not p.exists():
            p.parent.mkdir(parents=True, exist_ok=True)
            p.symlink_to("/bin/busybox")
    sdk = cache / "sdk-guest/go"
    host = root / ".cache/sdk/go"
    if not (sdk / "bin/go").exists():
        extract(fetch(by_name["go-guest.tar.gz"]), sdk.parent)
    if not (host / "bin/go").exists():
        extract(fetch(by_name["go-host.tar.gz"]), host.parent)
    prepared = cache / "go-cache"
    prepared.mkdir(exist_ok=True)
    env = dict(
        os.environ,
        GOROOT=str(sdk),
        GOCACHE=str(prepared),
        GOPATH=str(cache / "go-path"),
        GOTOOLCHAIN="local",
        CGO_ENABLED="0",
        GOPROXY="off",
        GOSUMDB="off",
        GOMAXPROCS="1",
        GODEBUG="asyncpreemptoff=1",
    )
    try:
        subprocess.run(
            [str(sdk / "bin/go"), "version"],
            env=env,
            check=True,
            stdout=subprocess.DEVNULL,
        )
        driver = sdk / "bin/go"
        native = True
    except OSError:
        native = False
        driver = host / "bin/go"
        qemu = fetch(by_name["qemu-i386-static"])
        qemu.chmod(0o755)
        tools = sdk / "pkg/tool/linux_amd64"
        tools.mkdir(exist_ok=True)
        for real in (sdk / "pkg/tool/linux_386").iterdir():
            p = tools / real.name
            p.write_text(
                "#!/bin/sh\nexec "
                + str(qemu)
                + " -0 "
                + real.name
                + " "
                + str(real)
                + ' "$@"\n'
            )
            p.chmod(0o755)
        env.update(GOARCH="386", GOOS="linux")
    binaries = cache / "go-bin"
    binaries.mkdir(exist_ok=True)
    for name in ["hello", "channels", "tinydb", "runner"]:
        subprocess.run(
            [
                str(driver),
                "build",
                "-trimpath",
                "-buildvcs=false",
                "-p=1",
                "-o",
                str(binaries / name),
                "./cmd/" + name,
            ],
            cwd=root,
            env=env,
            check=True,
        )
    if native:
        subprocess.run(
            [
                str(driver),
                "test",
                "-trimpath",
                "-buildvcs=false",
                "-count=1",
                "-run=^$",
                "-p=1",
                "./...",
            ],
            cwd=root,
            env=env,
            check=True,
        )
    else:
        for name in ["cmd/channels", "cmd/tinydb", "internal/store"]:
            subprocess.run(
                [
                    str(driver),
                    "test",
                    "-c",
                    "-trimpath",
                    "-buildvcs=false",
                    "-p=1",
                    "-o",
                    str(cache / "prepare.test"),
                    "./" + name,
                ],
                cwd=root,
                env=env,
                check=True,
            )
    shutil.copytree(
        sdk,
        layer / "opt/go",
        symlinks=True,
        ignore=shutil.ignore_patterns("linux_amd64"),
    )
    shutil.copytree(prepared, layer / "var/cache/go")
    for p in (layer / "var/cache/go").rglob("*"):
        if p.is_file():
            data = p.read_bytes()
            if p.name.endswith("-a") and data.startswith(b"v1 "):
                p.write_bytes(data[:-21] + b"0".rjust(20, b" ") + b"\n")
    for name in ["trim.txt", "testexpire.txt"]:
        (layer / "var/cache/go" / name).unlink(missing_ok=True)
    (layer / "usr/local/bin").mkdir(parents=True, exist_ok=True)
    shutil.copy2(binaries / "runner", layer / "usr/local/bin/go-foundry-runner")
    project = layer / "root/work/go-foundry"
    project.mkdir(parents=True, exist_ok=True)
    for name in ["cmd", "internal"]:
        shutil.copytree(
            root / name,
            project / name,
            ignore=shutil.ignore_patterns("migrate_test.go", "testdata")
            if name == "cmd"
            else None,
        )
    for name in ["go.mod", "run", "README.md", "LICENSE"]:
        shutil.copy2(root / name, project / name)
    (project / "tools").mkdir()
    shutil.copy2(root / "tools/go-toolchain.json", project / "tools/go-toolchain.json")
init = (
    (here / "init")
    .read_text()
    .replace(
        "cd /root\n",
        (
            "export PATH=/opt/go/bin:/usr/local/bin:$PATH GOTOOLCHAIN=local CGO_ENABLED=0 GOMAXPROCS=1\ncd /root/work/go-foundry\n"
            if kind == "go"
            else "cd /root/work/c-foundry\n"
        )
        + "export PS1='foundry:~# '\necho 'Foundry workspace prepared.'\n",
    )
)
p = layer / "init"
p.unlink(missing_ok=True)
p.write_text(init)
p.chmod(0o755)
p = layer / "usr/local/bin/export_file"
p.parent.mkdir(parents=True, exist_ok=True)
p.unlink(missing_ok=True)
shutil.copy2(here / "export_file", p)
p.chmod(0o755)
runtime = out / "runtime"
shutil.rmtree(runtime, ignore_errors=True)
runtime.mkdir(parents=True, exist_ok=True)
for name in [
    "libv86.mjs",
    "v86.wasm",
    "v86-LICENSE.txt",
    "seabios.bin",
    "vgabios.bin",
    "vmlinuz-virt",
    "COPYING.LESSER",
]:
    shutil.copy2(cache / name, runtime / name)
subprocess.run(
    [sys.executable, str(here / "newc.py"), str(layer), str(cache / (kind + ".cpio"))],
    check=True,
)
with (
    (cache / (kind + ".cpio")).open("rb") as src,
    (cache / (kind + ".lz4")).open("wb") as dest,
):
    subprocess.run(
        [sys.executable, str(here / "lz4-legacy.py")],
        stdin=src,
        stdout=dest,
        check=True,
    )
subprocess.run(
    [
        sys.executable,
        str(here / "split-image.py"),
        str(cache / (kind + ".lz4")),
        str(runtime),
    ],
    check=True,
)
p = runtime / "parts.json"
manifest = json.loads(p.read_text())
manifest["memory_mib"] = 768 if kind == "go" else 1024
p.write_text(json.dumps(manifest) + "\n")
# Publish exact provenance, source recipes, and unmodified licence notices with the binaries.
notices = out / "notices"
notices.mkdir(exist_ok=True)
for name in [
    "assets.json",
    "packages.tsv",
    "rebuild.sh",
    "init",
    "newc.py",
    "lz4-legacy.py",
    "split-image.py",
    "export_file",
    "support.py",
    "build.py",
]:
    shutil.copy2(here / name, notices / name)
for name in [
    "fetch-and-build-seabios.sh",
    "seabios.config",
    "seabios-debug.config",
    "COPYING.LESSER",
]:
    shutil.copy2(cache / name, notices / name)
(notices / "SOURCES.md").write_text("""# Sources and licences

v86 0.5.473 is BSD-2-Clause; its licence is ../runtime/v86-LICENSE.txt.
SeaBIOS and SeaVGABIOS are LGPL-3.0, built from SeaBIOS rel-1.16.2;
COPYING.LESSER, the exact build script and configurations are included here.
Source: https://git.seabios.org/seabios.git (tag rel-1.16.2).

The Alpine x86 guest is unmodified upstream Linux and user-space packages.
packages.tsv records base package versions, licences and immutable corresponding
Alpine recipes (including upstream source URLs, checksums and downstream patches).
assets.json records every distributed binary package and SHA-256. Additional
package source recipes use Alpine v3.23 main/x86; the original .PKGINFO inside each
locked APK records its source origin and aports commit. Obtain those exact recipes
at https://gitlab.alpinelinux.org/alpine/aports/-/tree/COMMIT/main/ORIGIN.
Build scripts in this directory describe guest assembly; only the filesystem layout
and init/export scripts are course-authored. No upstream binary is patched.

Go 1.27.4 is BSD-3-Clause; its source and LICENSE ship inside /opt/go.
Xterm.js and addon-fit are MIT; their licences are in ../vendor/.
QEMU, when needed to prepare the image on a host without 32-bit execution, is a
build-only tool and is not distributed in the course.
""")
files = []
for p in sorted(runtime.iterdir()):
    if p.is_file():
        files.append(
            dict(
                path=p.name,
                sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
                bytes=p.stat().st_size,
            )
        )
identity = hashlib.sha256(json.dumps(files, sort_keys=True).encode()).hexdigest()
metadata = dict(
    id=identity,
    format="v86-initramfs-v1",
    go_version="go1.27.4" if kind == "go" else None,
    bytes=sum(x["bytes"] for x in files),
    memory_mib=manifest["memory_mib"],
    files=files,
)
(runtime / "image.json").write_text(json.dumps(metadata, indent=2) + "\n")
print("Built self-hosted " + kind + " Linux " + identity, flush=True)
