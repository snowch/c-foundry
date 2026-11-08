#!/usr/bin/env python3
"""Build the named chapter project and execute its tests outside the repository tree."""
import argparse
import shlex
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('project', choices=['record-store', 'binary-record'])
parser.add_argument('--compiler', default='gcc')
parser.add_argument('--reference', action='store_true')
parser.add_argument('--sanitize', action='store_true')
args = parser.parse_args()
folder = root / 'native/projects' / args.project
module = 'store.c' if args.project == 'record-store' else 'record.c'
source = folder / '.reference' / module if args.reference else folder / module
build = root / '.build/projects' / args.project / ('reference' if args.reference else 'student')
build.mkdir(parents=True, exist_ok=True)
binary = build / ('sanitized' if args.sanitize else 'tests')
flags = ['-std=c17', '-Wall', '-Wextra', '-Wpedantic', '-Werror', '-g', '-O1']
if args.sanitize:
    flags += ['-fsanitize=address,undefined', '-fno-omit-frame-pointer']
subprocess.run(shlex.split(args.compiler) + flags + ['-I', str(folder), str(source), str(folder / 'tests.c'), '-o', str(binary)], check=True)
with tempfile.TemporaryDirectory(prefix='c-foundry-project-') as work:
    result = subprocess.run([str(binary)], cwd=work, timeout=15)
if result.returncode:
    raise SystemExit('Project checks failed. Complete the TODOs or compare the documented reference.')
