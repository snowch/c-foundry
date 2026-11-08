#!/usr/bin/env python3
"""Compile and run every complete Part 1 example with the selected native compiler."""
import json
import shlex
import subprocess
import sys
from pathlib import Path

compiler = shlex.split(sys.argv[1] if len(sys.argv) > 1 else 'gcc')
root = Path(__file__).resolve().parent.parent
build = root / '.build/part1' / Path(compiler[0]).name
build.mkdir(parents=True, exist_ok=True)
tests = json.loads((root / 'native/examples/tests.json').read_text())
for name, cases in tests.items():
    binary = build / name
    subprocess.run(compiler + ['-std=c17', '-Wall', '-Wextra', '-Wpedantic', '-Werror', str(root / 'native/examples' / (name + '.c')), '-o', str(binary)], check=True)
    for case in cases:
        run = subprocess.run([str(binary)], input=case['input'], text=True, capture_output=True, timeout=5, check=True)
        assert run.stdout.strip() == case['expected'].strip(), (name, run.stdout, case['expected'])
    print('PASS Part 1 native example', name)
