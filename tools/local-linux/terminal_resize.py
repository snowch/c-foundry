#!/usr/bin/env python3
"""Apply the browser terminal's bounded dimensions without typing into a pager."""
import fcntl, os, re, struct, time
terminal = os.open('/dev/ttyS0', os.O_RDWR | os.O_NOCTTY)
while True:
    try:
        files = [p for p in os.listdir('/exchange') if re.fullmatch(r'tty-size-\d+', p)]
        if files:
            latest = max(files, key=lambda p: int(p.rsplit('-', 1)[1]))
            with open('/exchange/' + latest) as source:
                rows, cols = map(int, source.read(32).split())
            if 6 <= rows <= 120 and 18 <= cols <= 240:
                fcntl.ioctl(terminal, 0x5414, struct.pack('HHHH', rows, cols, 0, 0))
            for name in files:
                try: os.unlink('/exchange/' + name)
                except OSError: pass
    except (OSError, ValueError):
        pass
    time.sleep(0.2)
