#!/usr/bin/env python3
"""Resolve only known course IDs; no chapter or exercise text becomes a shell command."""
import argparse
import json
import shlex
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
course = json.loads((ROOT / 'native/course.json').read_text())
parser = argparse.ArgumentParser()
parser.add_argument('--chapter')
parser.add_argument('--exercise')
parser.add_argument('--example')
parser.add_argument('--compiler', default='gcc')
args = parser.parse_args()
if args.chapter:
    chapter = next((c for c in course['chapters'] if c['id'] == args.chapter), None)
    if not chapter:
        parser.error('Unknown chapter. Run make help for the valid IDs.')
    print((ROOT / chapter['workspace'] / 'README.md').read_text())
elif args.exercise or args.example:
    selected = args.example or args.exercise
    folder = 'examples' if args.example else 'exercises'
    exercises = json.loads((ROOT / 'native' / folder / 'tests.json').read_text())
    if selected not in exercises:
        parser.error('Unknown exercise.')
    build = ROOT / '.build' / folder
    build.mkdir(parents=True, exist_ok=True)
    binary = build / selected
    subprocess.run(shlex.split(args.compiler) + ['-std=c17', '-Wall', '-Wextra', '-g', str(ROOT / 'native' / folder / (selected + '.c')), '-o', str(binary)], check=True)
    failed = False
    for test in exercises[selected]:
        run = subprocess.run([str(binary)], input=test['input'], capture_output=True, text=True, timeout=5)
        passed = run.returncode == 0 and run.stdout.strip() == test['expected'].strip()
        print(('PASS ' if passed else 'TRY AGAIN ') + test['name'])
        if not passed:
            print('Expected:', repr(test['expected']), 'received:', repr(run.stdout), 'exit:', run.returncode)
            failed = True
    raise SystemExit(int(failed))
else:
    print('C Foundry native workspace\n')
    print('make check-native          Test the five runnable foundations')
    print('make check-native-clang    Repeat with Clang')
    print('make standards-matrix      Compare language modes and a C23 feature')
    print('make sanitize              AddressSanitizer and UndefinedBehaviorSanitizer')
    print('make tsan                  ThreadSanitizer (requires runtime/kernel support)')
    print('make exercise EXERCISE=hello  Compile your editable exercise and check output')
    print('make example EXAMPLE=values-1  Run a complete Part 1 example')
    print('make serve                 Preview the course on port 8000\n')
    for c in course['chapters']:
        print(f"{c['number']:2}. {c['id']}: {c['title']}")
