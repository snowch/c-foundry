#!/usr/bin/env python3
"""One native C17 suite for GCC/Clang/MSVC; fixture bytes are an independent oracle."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--compiler', default='gcc')
parser.add_argument('--sanitize', action='store_true')
parser.add_argument('--artifacts', type=Path)
parser.add_argument('--incoming', type=Path)
args = parser.parse_args()
compiler = shlex.split(args.compiler)
msvc = Path(compiler[0]).stem.lower() in ['cl', 'clang-cl']
if msvc and args.sanitize:
    parser.error('This sanitizer mode targets GCC/Clang; MSVC runs the shared behavioral and byte fixtures.')
build = ROOT / '.build/portability' / ('msvc' if msvc else Path(compiler[0]).name) / ('sanitize' if args.sanitize else 'plain')
build.mkdir(parents=True, exist_ok=True)

probe_report = {}

def compile_sources(label, sources, defines=(), probe=False):
    folder = build / label
    folder.mkdir(parents=True, exist_ok=True)
    binary = folder / ('program.exe' if os.name == 'nt' else 'program')
    sources = [str(Path(source).resolve()) for source in sources]
    if msvc:
        flags = ['/nologo', '/TC', '/std:c17', '/W4', '/WX', '/utf-8', '/D_CRT_SECURE_NO_WARNINGS', '/O1', '/Fe:' + str(binary), '/Fo' + str(folder) + os.sep]
        flags += ['/D' + item for item in defines]
    else:
        flags = ['-std=c17', '-Wall', '-Wextra', '-Wpedantic', '-Werror', '-O1', '-g', '-o', str(binary)]
        flags += ['-D' + item for item in defines]
        if args.sanitize:
            flags += ['-fsanitize=address,undefined', '-fno-omit-frame-pointer']
    result = subprocess.run(compiler + flags + sources, cwd=folder, capture_output=True, text=True, timeout=120, check=False)
    if probe:
        probe_report[label] = {'accepted': result.returncode == 0, 'diagnostics': (result.stdout + result.stderr)[-6000:]}
        return binary if result.returncode == 0 else None
    assert result.returncode == 0, (label, result.stdout, result.stderr)
    return binary

def run(binary, arguments=(), cwd=None, code=0):
    result = subprocess.run([str(binary), *map(str, arguments)], cwd=cwd, capture_output=True, text=True, timeout=20, check=False)
    assert result.returncode == code, (arguments, result.returncode, result.stdout, result.stderr)
    return result.stdout

manifest = json.loads((ROOT / 'native/examples/tests.json').read_text())
for number in range(1, 10):
    name = f'portable-c-{number}'
    case = manifest[name][0]
    binary = compile_sources(name, [ROOT / 'native/examples' / source for source in case['sources']])
    with tempfile.TemporaryDirectory(prefix='c foundry text ') as work:
        assert run(binary, cwd=work).strip() == case['expected'].strip(), name

probe = build / 'monotonic-probe.c'
probe.write_text('#define _POSIX_C_SOURCE 200809L\n#include <time.h>\nint main(void){struct timespec now;return clock_gettime(CLOCK_MONOTONIC,&now);}\n')
monotonic = compile_sources('monotonic-probe', [probe], probe=True)
configured = int(monotonic is not None)
binary = compile_sources('configured-capability', [ROOT / 'native/examples/portable-c-3/main.c'], [f'CF_HAVE_MONOTONIC={configured}'])
assert run(binary).strip() == f'monotonic_configured={configured}'

folder = ROOT / 'native/portability'
core = [folder / 'codec.c', folder / 'files.c']
audit = compile_sources('audit-db', [folder / 'main.c', *core])
unit = compile_sources('codec-api', [folder / 'tests.c', *core])
assert run(unit).startswith('PASS codec rejection')

def fixture(rows):
    return bytes([84, 68, 66, 49, 1, 40, len(rows), 0]) + b''.join(
        ident.to_bytes(4, 'little') + name.ljust(32, b'\0') + score.to_bytes(4, 'little') for ident, name, score in rows)

ordinary = fixture([(1, b'Ada', 90), (2, b'Grace', 80)])
control = fixture([(0x010a0d1a, 'Chloé'.encode('utf-8'), 0x020d0a1a), (0xffffffff, b'Z', 0xffffffff)])
assert ordinary == (ROOT / 'dist/assets/tinydb-sample.tdb').read_bytes()
with tempfile.TemporaryDirectory(prefix='c foundry database ') as work:
    work = Path(work)
    assert run(audit, ['emit', 'people.tdb'], work) == 'rows=2 bytes=88\n'
    assert (work / 'people.tdb').read_bytes() == ordinary
    # Exclusive create must preserve an existing file, including an input/output alias.
    run(audit, ['emit', 'people.tdb'], work, code=3)
    assert (work / 'people.tdb').read_bytes() == ordinary
    run(audit, ['copy', 'people.tdb', 'people.tdb'], work, code=3)
    assert (work / 'people.tdb').read_bytes() == ordinary
    (work / 'control.tdb').write_bytes(control)
    run(audit, ['copy', 'control.tdb', 'control-copy.tdb'], work)
    assert (work / 'control-copy.tdb').read_bytes() == control
    for n in range(len(ordinary)):
        (work / 'bad.tdb').write_bytes(ordinary[:n])
        run(audit, ['copy', 'bad.tdb', 'forbidden.tdb'], work, code=2)
        assert not (work / 'forbidden.tdb').exists()
    mutations = [ordinary + b'x']
    for at, value in [(0, 0), (4, 2), (5, 39), (6, 9), (7, 1), (8, 0), (12, 0xff), (15, 1), (16, 1)]:
        altered = bytearray(ordinary); altered[at] = value; mutations.append(bytes(altered))
    duplicate = bytearray(ordinary); duplicate[48:52] = duplicate[8:12]; mutations.append(bytes(duplicate))
    for altered in mutations:
        (work / 'bad.tdb').write_bytes(altered)
        run(audit, ['copy', 'bad.tdb', 'forbidden.tdb'], work, code=2)
        assert (work / 'bad.tdb').read_bytes() == altered
        assert not (work / 'forbidden.tdb').exists()
    for filename in ['CON.txt', 'COM1.tdb', '../escape.tdb', 'trailing.', 'has space.tdb']:
        run(audit, ['emit', filename], work, code=3)
    if args.incoming:
        incoming = sorted(args.incoming.resolve().rglob('*.tdb'))
        assert len(incoming) >= 8, 'Expected two database artifacts from each of four producers.'
        for i, path in enumerate(incoming):
            contents = path.read_bytes()
            assert contents in [ordinary, control], ('Unexpected producer bytes', path)
            (work / 'incoming.tdb').write_bytes(contents)
            output = f'copy-{i}.tdb'
            run(audit, ['copy', 'incoming.tdb', output], work)
            assert (work / output).read_bytes() == contents, path
        print('PASS cross-host exchange:', len(incoming), 'producer files verified and copied')
    if args.artifacts:
        destination = args.artifacts.resolve()
        destination.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(work / 'people.tdb', destination / 'ordinary.tdb')
        shutil.copyfile(work / 'control-copy.tdb', destination / 'control.tdb')
        (destination / 'report.json').write_text(json.dumps({'platform': sys.platform, 'compiler': args.compiler, 'monotonic_compile_link': bool(configured), 'probes': probe_report, 'ordinary_sha256': hashlib.sha256(ordinary).hexdigest(), 'control_sha256': hashlib.sha256(control).hexdigest()}, indent=2) + '\n')
print('PASS nine portable C examples, capability branches, codec API, exact bytes, malformed/truncated input, UTF-8, filename policy and existing-file preservation:', sys.platform, args.compiler)
