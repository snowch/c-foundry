#!/usr/bin/env python3
"""Resolve only known course IDs; no chapter or exercise text becomes a shell command."""
import argparse
import json
import shlex
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
course = json.loads((ROOT / 'native/course.json').read_text())
parser = argparse.ArgumentParser()
parser.add_argument('--chapter')
parser.add_argument('--exercise')
parser.add_argument('--example')
parser.add_argument('--compiler', default='gcc')
parser.add_argument('--sanitize', action='store_true')
parser.add_argument('--keep-files', action='store_true')
parser.add_argument('--run-only', action='store_true',
                    help='Print example output and report the process exit status.')
args = parser.parse_args()
if args.run_only and not args.example:
    parser.error('--run-only requires --example.')
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
    sources = exercises[selected][0].get('sources', [selected + '.c'])
    flags = ['-std=c17', '-Wall', '-Wextra', '-Wpedantic', '-Werror', '-O1', '-g']
    flags += exercises[selected][0].get('flags', [])
    if args.sanitize:
        flags += ['-fno-omit-frame-pointer', '-fsanitize=address,undefined']
    libraries = [flag for flag in flags if flag.startswith('-l')]
    compile_flags = [flag for flag in flags if not flag.startswith('-l')]
    source_paths = [str(ROOT / 'native' / folder / source) for source in sources]
    build_result = subprocess.run(shlex.split(args.compiler) + compile_flags + source_paths
                                  + libraries + ['-o', str(binary)])
    if build_result.returncode:
        print('Build failed. The program did not run.')
        raise SystemExit(build_result.returncode)
    failed = False
    for test in exercises[selected]:
        if args.keep_files:
            work = ROOT / '.build/files' / selected
            work.mkdir(parents=True, exist_ok=True)
            run = subprocess.run([str(binary)], input=test['input'], capture_output=True, text=True, timeout=15, cwd=work)
        else:
            with tempfile.TemporaryDirectory() as work:
                run = subprocess.run([str(binary)], input=test['input'], capture_output=True, text=True, timeout=15, cwd=work)
        if args.run_only:
            print(run.stdout, end='')
            if run.stderr:
                print(run.stderr, end='')
            if run.returncode:
                print('Program exited with status', run.returncode)
            failed |= run.returncode != 0
        else:
            passed = run.returncode == 0 and run.stdout.strip() == test['expected'].strip()
            print(('PASS ' if passed else 'TRY AGAIN ') + test['name'])
            if not passed:
                print('Expected:', repr(test['expected']), 'received:', repr(run.stdout), 'exit:', run.returncode)
                failed = True
    if args.keep_files:
        print('Retained program files:', ROOT / '.build/files' / selected)
    raise SystemExit(int(failed))
else:
    print('C Foundry Browser Linux workspace\n')
    print('make check-native          Test the five runnable foundations')
    print('make check-native-clang    Repeat with Clang')
    print('make standards-matrix      Compare language modes and a C23 feature')
    print('make sanitize              AddressSanitizer and UndefinedBehaviorSanitizer')
    print('make tsan                  ThreadSanitizer (requires runtime/kernel support)')
    print('make exercise EXERCISE=hello  Compile your editable exercise and check output')
    print('make example EXAMPLE=values-1  Compare the example with its original output')
    print('make example EXAMPLE=values-1 RUN_ONLY=1  Print the result of the current source')
    print('make project PROJECT=record-store  Run your Part 2 project checks')
    print('make check-examples        Compile and run all 227 authored programs')
    print('make debug-lab LAB=basics   Optional GDB investigation; use LAB=tinydb for repair')
    print('make debug-gdb LAB=basics   Launch the guided GDB session')
    print('make debug-check LAB=basics  Run student regression checks (initially fail)')
    print('make check-portability     Native C17 fixtures across GCC/Clang/MSVC hosts')
    print('make serve                 Preview the course on port 8000\n')
    for c in course['chapters']:
        print(f"{c['number']:2}. {c['id']}: {c['title']}")
