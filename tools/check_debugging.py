#!/usr/bin/env python3
"""Maintainer acceptance: frozen failures, independent repairs, and real GDB stops."""
import os
from pathlib import Path
import re
import shutil
import shlex
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent
compiler = sys.argv[1] if len(sys.argv) > 1 else 'gcc'
if not shutil.which('gdb'):
    raise SystemExit('GDB is required for check-debugging; use the course dev container.')

def command(arguments, code=0):
    result = subprocess.run(arguments, cwd=ROOT, text=True, capture_output=True, timeout=60, check=False, env={**os.environ, 'LC_ALL': 'C'})
    assert result.returncode == code, (arguments, result.stdout, result.stderr)
    return result.stdout + result.stderr

# Build the shipped fault demonstrations in a separate acceptance workspace.
# Learners may repair their editable main.c without breaking maintainer checks.
acceptance = ROOT / '.build/debugging/acceptance' / Path(shlex.split(compiler)[0]).name
for lab in ['basics', 'tinydb']:
    command([sys.executable, 'tools/debug_lab.py', 'check', '--lab', lab, '--compiler', compiler, '--reference'])
    folder = acceptance / lab
    folder.mkdir(parents=True, exist_ok=True)
    source = (ROOT / 'native/debugging' / lab / '.reference/main.c').read_text()
    if lab == 'basics':
        assert 'size_t i = 0;' in source
        source = source.replace('size_t i = 0;', 'size_t i = 1;')
    else:
        assert 'candidate.rows[at].score = statement.row.score;' in source and '--candidate.count;' in source
        source = source.replace('candidate.rows[at].score = statement.row.score;', 'candidate.rows[0].score = statement.row.score;').replace('--candidate.count;', 'candidate.count -= candidate.count > 1 ? 2 : 1;')
    (folder / 'main.c').write_text(source)
    command(shlex.split(compiler) + ['-std=c17', '-Wall', '-Wextra', '-Wpedantic', '-Werror', '-g', '-O0', str(folder / 'main.c'), '-o', str(folder / 'program')])
assert command([str(acceptance / 'basics/program')]).strip() == 'total=20'

def trace(lab, commands, arguments=()):
    # Inspect the frozen demonstration's -g -O0 binary. GDB commands inspect it,
    # without calling functions in the inferior or requiring hardware watchpoints.
    binary = acceptance / lab / 'program'
    with tempfile.TemporaryDirectory() as directory:
        script = Path(directory) / 'inspect.gdb'
        script.write_text('set pagination off\nset confirm off\nset disable-randomization off\nset can-use-hw-watchpoints 0\n' + commands + '\nquit\n')
        output = command(['gdb', '-q', '-nx', '-batch', '-x', str(script), '--args', str(binary), *arguments])
        assert 'Operation not permitted' not in output, output
        return output

output = trace('basics', '''break sum_values
run
printf "CF_COUNT=%lu\\n", (unsigned long)count
print *values@count
backtrace
next
watch total
step
continue
printf "CF_INDEX=%lu CF_TOTAL=%d\\n", (unsigned long)i, total
disable 2
finish
backtrace''')
assert 'CF_COUNT=3' in output and '{4, 8, 12}' in output, output
assert 'CF_INDEX=1 CF_TOTAL=8' in output, output
assert re.search(r'Old value = 0\s+New value = 8', output), output
assert 'sum_values' in output and 'main' in output, output

def seed(path):
    payload = bytes([84, 68, 66, 49, 1, 40, 3, 0])
    for row_id, name, score in [(1, 'Ada', 90), (2, 'Grace', 80), (3, 'Linus', 70)]:
        payload += row_id.to_bytes(4, 'little') + name.encode().ljust(32, b'\0') + score.to_bytes(4, 'little')
    path.write_bytes(payload)

source_path = acceptance / 'tinydb/main.c'
source = source_path.read_text().splitlines()
update_line = next(i for i, text in enumerate(source, 1) if 'candidate.rows[0].score = statement.row.score;' in text)
delete_line = next(i for i, text in enumerate(source, 1) if 'candidate.count -= candidate.count > 1 ? 2 : 1;' in text)
with tempfile.TemporaryDirectory() as directory:
    database = Path(directory) / 'people.db'
    seed(database)
    output = trace('tinydb', f'''break {source_path}:{update_line}
run
printf "CF_ID=%u CF_SLOT=%d CF_MATCH=%u\\n", statement.id, at, candidate.rows[at].id
watch candidate.rows[0].score
continue
printf "CF_NEIGHBOR=%u CF_TARGET=%u\\n", candidate.rows[0].score, candidate.rows[1].score
backtrace''', [str(database), '--execute', 'UPDATE people SET score=99 WHERE id=2;'])
    assert 'CF_ID=2 CF_SLOT=1 CF_MATCH=2' in output, output
    assert 'CF_NEIGHBOR=99 CF_TARGET=80' in output, output
    assert re.search(r'Old value = 90\s+New value = 99', output), output
    # Quit stopped before save: debugging has not committed the broken candidate.
    assert database.read_bytes()[44:48] == (90).to_bytes(4, 'little')
    seed(database)
    output = trace('tinydb', f'''break {source_path}:{delete_line}
run
printf "CF_BEFORE=%lu\\n", (unsigned long)candidate.count
watch candidate.count
continue
printf "CF_AFTER=%lu\\n", (unsigned long)candidate.count
backtrace''', [str(database), '--execute', 'DELETE FROM people WHERE id=2;'])
    assert 'CF_BEFORE=3' in output and 'CF_AFTER=1' in output, output
    assert re.search(r'Old value = 3\s+New value = 1', output), output
print('PASS frozen fault reproduction, reference regressions, and real GDB breakpoint/step/stack/software-watchpoint evidence for both labs')
