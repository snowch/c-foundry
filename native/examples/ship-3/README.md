# Fault injection and recovery tests

Complete native example, ready to edit and run in Codespaces or locally.

## 30.3 Fault injection and recovery tests

Fault injection makes rare failure paths repeatable. Test exactly where the protocol permits acknowledged state to survive.

For each possible byte cut in a single transaction log, the reference expectation is zero before the full COMMIT record and 42 afterward. The loop tests every prefix from zero through 24 bytes. This is an interruption model; it does not simulate all filesystem reorderings, device failures, or checksum-valid corruption.

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
  unsigned char log[24];
  log_record(log, BEGIN_REC, 1, 0);
  log_record(log + 8, SET_REC, 1, 42);
  log_record(log + 16, COMMIT_REC, 1, 0);
  for (size_t cut = 0; cut <= sizeof log; ++cut) {
    uint32_t expected = cut == sizeof log ? 42 : 0;
    if (recover(log, cut, 0) != expected)
      return 1;
  }
  puts("25 interruption boundaries passed");
  return 0;
}
```

Output:

```text
25 interruption boundaries passed
```

The only prefix containing a complete matching COMMIT is the full 24-byte log. Every shorter prefix leaves the base unchanged.

**Watch for:** Killing a process at one convenient point does not cover all interruption boundaries.

**Check:** Which prefixes may recover 42 in this fixture?

1. Only the prefix containing the full commit record
2. Every prefix containing the SET value

<details><summary>Answer</summary>

Only the prefix containing the full commit record. Uncommitted records cannot establish acknowledged transaction state.

</details>

**Try:** Add two committed transactions, an incomplete third, invalid headers, and repeated replay checks.

Run from the repository root:

```sh
make example EXAMPLE=ship-3
```

