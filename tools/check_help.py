#!/usr/bin/env python3
"""Verify the installed Linux documentation used by the early help lesson."""
import os
import re
import subprocess

for section in ('1', '3'):
    result = subprocess.run(['man', '-w', section, 'printf'], text=True, capture_output=True, check=True)
    assert result.stdout.strip(), f'Missing printf({section})'
manual = subprocess.run(['man', '-P', 'cat', '3', 'printf'], text=True, capture_output=True,
                        env={**os.environ, 'LC_ALL': 'C', 'MANWIDTH': '100'}, check=True).stdout
assert 'SYNOPSIS' in manual and 'RETURN VALUE' in manual and 'STANDARDS' in manual
assert 'number of characters' in manual
search = subprocess.run(['man', '-k', 'printf'], text=True, capture_output=True, check=True).stdout
assert re.search(r'\(3\)', search), 'Manual keyword database does not include section 3'
print('PASS installed printf(1), printf(3), contract sections, and manual keyword search')
