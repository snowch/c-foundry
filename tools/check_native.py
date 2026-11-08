#!/usr/bin/env python3
"""Run meaningful smoke checks against the native foundations; reject failures/timeouts."""
import subprocess
import sys
from pathlib import Path

build = Path(sys.argv[1])
expected = {
    'hello': 'Hello from native C!',
    'standards': 'little-endian record: 78 56 34 12',
    'counter': 'mutex=40000 atomic=40000',
    'queue': 'consumed=5000 sum=12502500 queue_empty=1',
    'tinydb': 'rows=64 duplicate=rejected full=rejected missing=not-found',
}
for name, text in expected.items():
    # Repeat threaded workloads to exercise more schedules; assertions check internal invariants.
    for _ in range(3 if name in ('counter', 'queue', 'tinydb') else 1):
        result = subprocess.run([str(build / name)], capture_output=True, text=True, timeout=15)
        if result.returncode:
            print(result.stdout, result.stderr, file=sys.stderr)
            raise SystemExit(f"{name} exited with status {result.returncode}")
        assert text in result.stdout, (name, result.stdout, result.stderr)
    print('PASS native', name)
