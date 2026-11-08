#!/usr/bin/env python3
"""Compatibility entry point for the Part 1 native checks."""
import subprocess
import sys
from pathlib import Path
subprocess.run([sys.executable, str(Path(__file__).with_name('check_examples.py')), '--part', '1', '--compiler', sys.argv[1] if len(sys.argv) > 1 else 'gcc'], check=True)
