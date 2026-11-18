# Write-ahead logging

Complete native example, ready to edit and run in Codespaces or locally.

## 29.4 Write-ahead logging

Write-ahead logging records enough information for recovery before acknowledging a durable commit or persisting dependent data pages.

The one-value redo log uses eight-byte BEGIN, SET, and COMMIT records with transaction IDs. In this POSIX fixture, the program checks the write, flushes the library buffer, calls fsync on the temporary file and then runs recovery over the same prepared bytes. A database also needs a recovery-visible log path, error handling and an ordering contract for log and data files.

### Recovery keeps committed work and ignores an incomplete tail

A complete commit record separates published work from tentative work.

Read a log containing BEGIN, SET score to 42, COMMIT, then a second BEGIN and SET score to 99 with no complete matching COMMIT. Recovery applies the first transaction. It ignores the incomplete second transaction, so the recovered score is 42. A short or invalid tail must be handled according to the log format.

These are logical records, not their byte encoding. Checksums and host write ordering require separate mechanisms.

### main.c

```c
#define _POSIX_C_SOURCE 200809L
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

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
  FILE *f = tmpfile();
  if (!f)
    return 1;
  unsigned char bytes[24];
  log_record(bytes, BEGIN_REC, 1, 0);
  log_record(bytes + 8, SET_REC, 1, 42);
  log_record(bytes + 16, COMMIT_REC, 1, 0);
  bool ok = fwrite(bytes, 1, sizeof bytes, f) == sizeof bytes &&
            fflush(f) == 0 && fsync(fileno(f)) == 0;
  if (!ok) {
    fclose(f);
    return 1;
  }
  printf("sync_calls_succeeded value=%u\n",
         (unsigned)recover(bytes, sizeof bytes, 0));
  if (fclose(f) != 0)
    return 1;
  return 0;
}
```

Output:

```text
sync_calls_succeeded value=42
```

The prepared log decodes to 42. The success line follows the checked sync call. The fixture uses a temporary file and runs no crash or power-loss test.

**Watch for:** fflush alone moves bytes to the operating-system interface; it is not equivalent to a platform durable-sync operation.

**Check:** When may a durable commit be acknowledged under this protocol?

1. Immediately after writing a private memory copy
2. After its required log synchronization succeeds

<details><summary>Answer</summary>

After its required log synchronization succeeds. Recovery must be able to find a durable commit record before success is promised.

</details>

**Try:** Edit the example in your native checkout. In native/examples/recovery-4/main.c, change the value argument of the SET_REC log_record call from 42 to 17. Repeat the terminal command. Find sync_calls_succeeded and value=17. Which code checks the write, flush, and sync before the recovery result is printed?

### References and help

- [SQLite documentation: atomic commit](https://www.sqlite.org/atomiccommit.html) — Read the failure assumptions and ordering required for a durable commit protocol.
- [SQLite documentation: write-ahead logging](https://www.sqlite.org/wal.html) — Compare logging, checkpoints, and durability assumptions with the bounded redo models.
- [Linux/POSIX manual: fsync(2)](https://man7.org/linux/man-pages/man2/fsync.2.html) — Compare an OS synchronization request with C stream flushing; read filesystem-specific limitations.

**Use the documentation (optional):** Does a successful fflush alone establish that a committed record survives power loss?

<details><summary>Compare your answer</summary>

No. fflush addresses C stream buffering. Durable commit needs a host/storage protocol and explicit failure assumptions; read how the reference separates these layers.

</details>

Native source: `native/examples/recovery-4/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=recovery-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

