"""Split the guest archive into files small enough for static hosting."""
import json
from pathlib import Path
import sys

source, destination = map(Path, sys.argv[1:])
parts = []
with source.open("rb") as archive:
    for index, block in enumerate(iter(lambda: archive.read(16 * 1024**2), b"")):
        name = f"guest-{index:02d}.bin"
        (destination / name).write_bytes(block)
        parts.append(name)
(destination / "parts.json").write_text(
    json.dumps({"parts": parts, "bytes": source.stat().st_size}) + "\n"
)
