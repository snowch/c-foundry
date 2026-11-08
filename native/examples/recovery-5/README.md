# Recovery after an interrupted write

Complete native example, ready to edit and run in Codespaces or locally.

## 29.5 Recovery after an interrupted write

Recovery should apply committed transactions and ignore an incomplete final transaction. Test every interruption boundary rather than only whole-record cuts.

The bounded redo model scans complete eight-byte records, retains tentative state until a matching COMMIT, and stops at invalid structure. A short tail is ignored. SET stores the final value rather than an increment, making replay idempotent for the same log and base. This format has no checksum, so it cannot reliably detect every bit flip that still forms a valid record.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };
void put32(unsigned char *out, uint32_t value) {
  for (unsigned i = 0; i < 4; ++i)
    out[i] = (unsigned char)(value >> (8 * i));
}
uint32_t get32(const unsigned char *in) {
  uint32_t value = 0;
  for (unsigned i = 0; i < 4; ++i)
    value |= (uint32_t)in[i] << (8 * i);
  return value;
}
enum { BEGIN_REC = 1, SET_REC = 2, COMMIT_REC = 3, LOG_BYTES = 8 };
void log_record(unsigned char *out, unsigned kind, unsigned tx,
                uint32_t value) {
  memset(out, 0, LOG_BYTES);
  out[0] = (unsigned char)kind;
  out[1] = (unsigned char)tx;
  put32(out + 4, value);
}
uint32_t recover(const unsigned char *log, size_t length, uint32_t base) {
  unsigned active = 0;
  uint32_t pending = base;
  for (size_t at = 0; at <= length && length - at >= LOG_BYTES;
       at += LOG_BYTES) {
    const unsigned char *r = log + at;
    if (!r[1] || r[2] || r[3])
      break;
    if (r[0] == BEGIN_REC) {
      if (active)
        break;
      active = r[1];
      pending = base;
    } else if (r[0] == SET_REC) {
      if (active != r[1])
        break;
      pending = get32(r + 4);
    } else if (r[0] == COMMIT_REC) {
      if (active != r[1])
        break;
      base = pending;
      active = 0;
    } else
      break;
  }
  return base;
}

int main(void) {
  unsigned char log[40];
  log_record(log, BEGIN_REC, 1, 0);
  log_record(log + 8, SET_REC, 1, 10);
  log_record(log + 16, COMMIT_REC, 1, 0);
  log_record(log + 24, BEGIN_REC, 2, 0);
  log_record(log + 32, SET_REC, 2, 99);
  printf("committed=%u torn=%u\n", (unsigned)recover(log, sizeof log, 0),
         (unsigned)recover(log, 19, 0));
  return 0;
}
```

Output:

```text
committed=10 torn=0
```

The complete first transaction publishes ten. The later uncommitted 99 is ignored. Cutting the first COMMIT record at byte nineteen leaves no committed change.

**Watch for:** Ignoring a torn tail is not a general policy for silently skipping corruption in the middle of a log.

**Check:** Is a SET record enough to publish a transaction?

1. No, a valid matching COMMIT is required
2. Yes

<details><summary>Answer</summary>

No, a valid matching COMMIT is required. Tentative state remains separate until the commit boundary.

</details>

**Try:** Replay every prefix of this log and verify values against an independently listed set of committed boundaries.

Run from the repository root:

```sh
make example EXAMPLE=recovery-5
```

