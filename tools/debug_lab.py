#!/usr/bin/env python3
"""Build isolated debugging starters; check contracts rather than debugger output."""
import argparse
import shlex
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('action', choices=['build', 'gdb', 'check'])
parser.add_argument('--lab', choices=['basics', 'tinydb'], required=True)
parser.add_argument('--compiler', default='gcc')
parser.add_argument('--reference', action='store_true')
parser.add_argument('--case', choices=['update', 'delete'], default='update')
args = parser.parse_args()
folder = ROOT / 'native/debugging' / args.lab
source = folder / ('.reference/main.c' if args.reference else 'main.c')
build = ROOT / '.build/debugging' / args.lab
build.mkdir(parents=True, exist_ok=True)
binary = build / ('reference' if args.reference else 'program')
subprocess.run(shlex.split(args.compiler) + ['-std=c17', '-Wall', '-Wextra', '-Wpedantic', '-Werror', '-g', '-O0', str(source), '-o', str(binary)], check=True)

def execute(*arguments):
    return subprocess.run([str(binary), *arguments], capture_output=True, text=True, timeout=10, check=False)

def seed(path):
    # Independently specified TDB1 bytes; never overwrite an existing database.
    header = bytes([0x54, 0x44, 0x42, 0x31, 1, 40, 3, 0])
    records = b''.join(row_id.to_bytes(4, 'little') + name.encode().ljust(32, b'\0') + score.to_bytes(4, 'little') for row_id, name, score in [(1, 'Ada', 90), (2, 'Grace', 80), (3, 'Linus', 70)])
    with path.open('xb') as file:
        file.write(header + records)

if args.action in ['build', 'gdb']:
    # Every invocation gets its own sandbox so restarts cannot erase prior lab work.
    work = Path(tempfile.mkdtemp(prefix='session-', dir=build))
    if args.lab == 'basics':
        arguments = []
    else:
        database = work / 'people.db'
        seed(database)
        statement = 'UPDATE people SET score=99 WHERE id=2;' if args.case == 'update' else 'DELETE FROM people WHERE id=2;'
        arguments = [str(database), '--execute', statement]
    if args.action == 'build':
        print((folder / 'README.md').read_text())
        print('\nBuilt:', binary.relative_to(ROOT))
        print('Isolated session:', work.relative_to(ROOT))
        print('Reproduce:', shlex.join([str(binary.relative_to(ROOT)), *arguments]))
        print('Guided GDB: make debug-gdb LAB=' + args.lab)
    else:
        if not shutil.which('gdb'):
            parser.exit(2, 'GDB is not installed. Open this lab in Codespaces or install GDB on local Linux/WSL.\n')
        raise SystemExit(subprocess.run(['gdb', '-q', '-x', str(folder / 'start.gdb'), '--args', str(binary), *arguments], cwd=ROOT, check=False).returncode)
else:
    failed = False
    if args.lab == 'basics':
        for arguments, expected in [([], 'total=24\n'), (['single'], 'total=7\n'), (['empty'], 'total=0\n'), (['negative'], 'total=-2\n')]:
            result = execute(*arguments)
            passed = result.returncode == 0 and result.stdout == expected
            print(('PASS ' if passed else 'TRY AGAIN ') + (' '.join(arguments) or 'ordinary') + ': expected ' + expected.strip() + ', got ' + result.stdout.strip())
            failed |= not passed
    else:
        with tempfile.TemporaryDirectory() as temporary:
            for label, statement, expected in [
                ('update preserves neighbors', 'UPDATE people SET score=99 WHERE id=2;', '1 | Ada | 90\n2 | Grace | 99\n3 | Linus | 70\n3 rows\n'),
                ('delete preserves other rows', 'DELETE FROM people WHERE id=2;', '1 | Ada | 90\n3 | Linus | 70\n2 rows\n'),
                ('delete first', 'DELETE FROM people WHERE id=1;', '2 | Grace | 80\n3 | Linus | 70\n2 rows\n'),
                ('delete last', 'DELETE FROM people WHERE id=3;', '1 | Ada | 90\n2 | Grace | 80\n2 rows\n')]:
                database = Path(temporary) / (label.replace(' ', '-') + '.db')
                seed(database)
                changed = execute(str(database), '--execute', statement)
                result = execute(str(database), '--execute', 'SELECT * FROM people;')
                passed = changed.returncode == 0 and result.returncode == 0 and result.stdout == expected
                print(('PASS ' if passed else 'TRY AGAIN ') + label)
                if not passed:
                    print('Expected:\n' + expected + 'Received:\n' + result.stdout + changed.stderr + result.stderr)
                failed |= not passed
    if failed:
        print('Initial failure is intentional. Investigate, repair your starter, then repeat these checks.')
    raise SystemExit(int(failed))
