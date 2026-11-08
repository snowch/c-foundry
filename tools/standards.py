#!/usr/bin/env python3
"""Show feature support instead of equating a standard flag with full conformance."""
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

source = '''#include <stdio.h>
int main(void) {
#ifdef __STDC_VERSION__
    printf("__STDC_VERSION__=%ld\\n", (long)__STDC_VERSION__);
#else
    puts("__STDC_VERSION__ not defined (expected in C90)");
#endif
    return 0;
}
'''
compilers = [c for c in ('gcc', 'clang') if shutil.which(c)]
if not compilers:
    raise SystemExit('Install GCC or Clang first.')
with tempfile.TemporaryDirectory() as tmp:
    path = Path(tmp) / 'probe.c'
    path.write_text(source)
    binary = Path(tmp) / 'probe'
    for cc in compilers:
        print(subprocess.check_output([cc, '--version'], text=True).splitlines()[0])
        for standard in ('c90', 'c99', 'c11', 'c17', 'c23'):
            flag = standard
            result = subprocess.run([cc, '-std=' + flag, '-pedantic-errors', str(path), '-o', str(binary)], capture_output=True, text=True)
            if result.returncode and standard == 'c23':
                flag = 'c2x'
                result = subprocess.run([cc, '-std=c2x', '-pedantic-errors', str(path), '-o', str(binary)], capture_output=True, text=True)
            if result.returncode:
                raise SystemExit(f'{cc}: could not compile baseline {standard} probe: {result.stderr}')
            print(' ', flag, subprocess.check_output([str(binary)], text=True).strip())
        path.write_text('int main(void) { typeof_unqual(1) n = 1; return n != 1; }\n')
        feature = subprocess.run([cc, '-std=' + flag, '-pedantic-errors', str(path), '-o', str(binary)], capture_output=True, text=True)
        print('  C23 typeof_unqual:', 'supported' if feature.returncode == 0 else 'not supported by this compiler')
        path.write_text(source)
