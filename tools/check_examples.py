#!/usr/bin/env python3
"""Compile complete authored examples with strict warnings, then verify their output."""
import argparse
import json
import shlex
import subprocess
import tempfile
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--part', type=int, choices=[1, 2], required=True)
parser.add_argument('--compiler', default='gcc')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
chapters = json.loads((root / 'native/course.json').read_text())['chapters']
ids = {c['id'] for c in chapters if c['part'] == args.part - 1}
tests = json.loads((root / 'native/examples/tests.json').read_text())
build = root / '.build/examples' / Path(shlex.split(args.compiler)[0]).name
build.mkdir(parents=True, exist_ok=True)
for name, cases in tests.items():
    if name.rsplit('-', 1)[0] not in ids:
        continue
    sources = cases[0].get('sources', [name + '.c'])
    binary = build / name
    subprocess.run(shlex.split(args.compiler) + ['-std=c17', '-Wall', '-Wextra', '-Wpedantic', '-Werror', '-g', '-O1'] + [str(root / 'native/examples' / s) for s in sources] + ['-o', str(binary)], check=True)
    with tempfile.TemporaryDirectory() as work:
        for case in cases:
            run = subprocess.run([str(binary)], input=case['input'], text=True, capture_output=True, timeout=5, check=True, cwd=work)
            assert run.stdout.strip() == case['expected'].strip(), (name, run.stdout, case['expected'])
    print('PASS Part', args.part, 'native example', name)
