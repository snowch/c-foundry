# Extending the write-ahead log

Complete Linux example, ready to edit and run in the browser terminal.

## 42.1 Extending the write-ahead log

A log sequence number (LSN) identifies a position in a stable ordered log. Recovery must know which committed position a checkpoint already includes.

Also editable and runnable inline in the browser course.

The typed-record model skips records at or before the checkpoint’s applied LSN, requires a contiguous suffix, and updates the checkpoint only on a matching COMMIT. It retains the one-value single-writer transaction restriction. An on-disk log needs explicit record encoding, checksums, and torn-record framing; this struct is not a file format.

### Recovery keeps committed work and ignores an incomplete tail

A complete commit record separates published work from tentative work.

Read a log containing BEGIN, SET score to 42, COMMIT, then a second BEGIN and SET score to 99 with no complete matching COMMIT. Recovery applies the first transaction. It ignores the incomplete second transaction, so the recovered score is 42. A short or invalid tail must be handled according to the log format.

These are logical records, not their byte encoding. Checksums and host write ordering require separate mechanisms.

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
typedef struct {
  uint64_t lsn;
  unsigned kind, tx;
  uint32_t value;
} LogRecord;
typedef struct {
  uint64_t applied;
  uint32_t value;
} Checkpoint;
Checkpoint replay(const LogRecord *log, size_t n, Checkpoint base) {
  unsigned active = 0;
  uint64_t seen = base.applied;
  uint32_t pending = base.value;
  for (size_t i = 0; i < n; ++i) {
    LogRecord r = log[i];
    if (r.lsn <= base.applied)
      continue;
    if (seen == UINT64_MAX || r.lsn != seen + 1 || !r.tx)
      break;
    seen = r.lsn;
    if (r.kind == BEGIN_REC) {
      if (active)
        break;
      active = r.tx;
      pending = base.value;
    } else if (r.kind == SET_REC) {
      if (active != r.tx)
        break;
      pending = r.value;
    } else if (r.kind == COMMIT_REC) {
      if (active != r.tx)
        break;
      base = (Checkpoint){r.lsn, pending};
      active = 0;
    } else
      break;
  }
  return base;
}

int main(void) {
  LogRecord log[] = {{1, BEGIN_REC, 1, 0},  {2, SET_REC, 1, 10},
                     {3, COMMIT_REC, 1, 0}, {4, BEGIN_REC, 2, 0},
                     {5, SET_REC, 2, 20},   {6, COMMIT_REC, 2, 0}};
  Checkpoint result = replay(log, 6, (Checkpoint){3, 10});
  printf("value=%u applied=%llu\n", (unsigned)result.value,
         (unsigned long long)result.applied);
  return 0;
}
```

Output:

```text
value=20 applied=6
```

The first committed transaction is already represented by the checkpoint. Only the second changes the recovered state.

**Watch for:** A log offset that changes meaning after truncation is not a stable global LSN without an epoch or base-offset convention.

**Check:** Which records are skipped during replay?

1. Those already covered by the applied checkpoint LSN
2. Every record before the most recent SET regardless of commit

<details><summary>Answer</summary>

Those already covered by the applied checkpoint LSN. A committed applied boundary identifies what the snapshot already contains.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/maintenance/1). In main.c, change the SET_REC value for transaction 2 from 20 to 25, retaining the sequence numbers. Run code and compare value= and applied=. Which record publishes the new value, and what advances the applied checkpoint?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [SQLite documentation: write-ahead logging](https://www.sqlite.org/wal.html) (online) — Compare logging, checkpoints, and durability assumptions with the bounded redo models.
- [SQLite documentation: integrity checks](https://www.sqlite.org/pragma.html#pragma_integrity_check) (online) — Compare structural checks with the invariants tested in the teaching database.

Native source: `native/examples/maintenance-1/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=maintenance-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

