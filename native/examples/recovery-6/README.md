# Browser storage guarantees and their limits

Complete native example, ready to edit and run in Codespaces or locally.

## 29.6 Browser storage guarantees and their limits

Browser persistence APIs have their own atomicity and completion contracts. A native filesystem protocol cannot simply be assumed to transfer to browser storage.

The executable model illustrates a complete versus interrupted commit boundary. In a browser host, IndexedDB transactions or OPFS operations need an explicit integration layer, quota/error handling, and documented acknowledgement rules. localStorage lesson marks and downloadable files are useful product features but are not a write-ahead-log durability mechanism for the C program. The course’s current runner keeps program files temporary.

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
  log_record(log + 8, SET_REC, 1, 7);
  log_record(log + 16, COMMIT_REC, 1, 0);
  printf("before_commit=%u after_commit=%u\n", (unsigned)recover(log, 16, 0),
         (unsigned)recover(log, 24, 0));
  return 0;
}
```

Output:

```text
before_commit=0 after_commit=7
```

The boundary model is portable C, but the host mechanism that persists and acknowledges those bytes is environment-specific.

**Watch for:** Do not label a successful browser download or a saved editor draft as an atomic database transaction.

**Check:** Does localStorage progress persistence make the C filesystem durable?

1. Yes
2. No

<details><summary>Answer</summary>

No. The two stores have different owners, data, and failure contracts.

</details>

**Try:** Specify a browser host persistence adapter and list its transaction, quota, crash, and export guarantees before implementing it.

Run from the repository root:

```sh
make example EXAMPLE=recovery-6
```

