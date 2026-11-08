# Chapter 29: Transactions and recovery

Part 6: Make the database faster and more reliable. Teaching baseline: C17.

Separate transaction visibility from durable acknowledgement. Model interrupted log prefixes and preserve committed state.

## Outcomes

- Apply transaction changes atomically to a single-writer in-memory state.
- Explain write-ahead ordering and durable commit records.
- Replay committed records while ignoring an incomplete tail.

## 29.1 Atomicity, consistency, isolation, and durability

Atomicity, consistency, isolation, and durability describe different obligations. Name which ones an implementation actually provides.

The copy-on-begin transaction model keeps uncommitted changes in a private working table, providing an all-or-nothing publication step for this single-threaded fixture. Table operations enforce schema consistency. It provides neither concurrent isolation nor crash durability by itself; those need synchronization and a persistence protocol. A process-local struct assignment is not a durable commit.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { TABLE_CAP = 8 };
typedef struct {
  uint32_t id;
  char name[32];
  uint32_t score;
} Row;
typedef struct {
  Row rows[TABLE_CAP];
  size_t count;
} Table;
typedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;
int find_row(const Table *t, uint32_t id) {
  for (size_t i = 0; i < t->count; ++i)
    if (t->rows[i].id == id)
      return (int)i;
  return -1;
}
Status insert_row(Table *t, Row row) {
  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)
    return INVALID;
  if (find_row(t, row.id) >= 0)
    return DUPLICATE;
  if (t->count == TABLE_CAP)
    return FULL;
  t->rows[t->count++] = row;
  return OK;
}
Status update_score(Table *t, uint32_t id, uint32_t score) {
  int i = find_row(t, id);
  if (i < 0)
    return MISSING;
  t->rows[i].score = score;
  return OK;
}
Status delete_row(Table *t, uint32_t id) {
  int i = find_row(t, id);
  if (i < 0)
    return MISSING;
  for (size_t j = (size_t)i + 1; j < t->count; ++j)
    t->rows[j - 1] = t->rows[j];
  --t->count;
  return OK;
}
void display(const Table *t) {
  for (size_t i = 0; i < t->count; ++i)
    printf("%u | %s | %u\n", (unsigned)t->rows[i].id, t->rows[i].name,
           (unsigned)t->rows[i].score);
}
typedef struct {
  Table working;
  Table *live;
  bool active;
} Transaction;
bool begin(Transaction *tx, Table *live) {
  if (tx->active)
    return false;
  tx->working = *live;
  tx->live = live;
  tx->active = true;
  return true;
}
bool commit(Transaction *tx) {
  if (!tx->active)
    return false;
  *tx->live = tx->working;
  tx->active = false;
  return true;
}
void rollback(Transaction *tx) {
  tx->active = false;
  tx->live = NULL;
}

int main(void) {
  Table live = {0};
  insert_row(&live, (Row){1, "Ada", 90});
  Transaction tx = {0};
  begin(&tx, &live);
  update_score(&tx.working, 1, 1);
  rollback(&tx);
  printf("after_rollback=%u\n", (unsigned)live.rows[0].score);
  return 0;
}
```

Output:

```text
after_rollback=90
```

The tentative score one was never copied into live state. Rollback discards the transaction’s publication ability.

**Watch for:** Passing a rollback test does not establish the other ACID properties.

**Check:** Does this memory-only rollback guarantee durability?

1. No
2. Yes

<details><summary>Answer</summary>

No. Process memory can disappear without a persistent recovery protocol.

</details>

**Try:** Write a guarantee table for each ACID property and identify the mechanism or missing work for each.

Run from the repository root:

```sh
make example EXAMPLE=recovery-1
```

## 29.2 A single-writer transaction model

A single-writer transaction model serializes mutations and simplifies conflict handling. The restriction must be enforced by the caller or service.

begin refuses to start another transaction using the same active handle, but the model has no global lock. A real multi-client service must route all writers through one owner or protect admission with synchronization. Readers also need a contract about whether they see committed state or a working copy.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { TABLE_CAP = 8 };
typedef struct {
  uint32_t id;
  char name[32];
  uint32_t score;
} Row;
typedef struct {
  Row rows[TABLE_CAP];
  size_t count;
} Table;
typedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;
int find_row(const Table *t, uint32_t id) {
  for (size_t i = 0; i < t->count; ++i)
    if (t->rows[i].id == id)
      return (int)i;
  return -1;
}
Status insert_row(Table *t, Row row) {
  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)
    return INVALID;
  if (find_row(t, row.id) >= 0)
    return DUPLICATE;
  if (t->count == TABLE_CAP)
    return FULL;
  t->rows[t->count++] = row;
  return OK;
}
Status update_score(Table *t, uint32_t id, uint32_t score) {
  int i = find_row(t, id);
  if (i < 0)
    return MISSING;
  t->rows[i].score = score;
  return OK;
}
Status delete_row(Table *t, uint32_t id) {
  int i = find_row(t, id);
  if (i < 0)
    return MISSING;
  for (size_t j = (size_t)i + 1; j < t->count; ++j)
    t->rows[j - 1] = t->rows[j];
  --t->count;
  return OK;
}
void display(const Table *t) {
  for (size_t i = 0; i < t->count; ++i)
    printf("%u | %s | %u\n", (unsigned)t->rows[i].id, t->rows[i].name,
           (unsigned)t->rows[i].score);
}
typedef struct {
  Table working;
  Table *live;
  bool active;
} Transaction;
bool begin(Transaction *tx, Table *live) {
  if (tx->active)
    return false;
  tx->working = *live;
  tx->live = live;
  tx->active = true;
  return true;
}
bool commit(Transaction *tx) {
  if (!tx->active)
    return false;
  *tx->live = tx->working;
  tx->active = false;
  return true;
}
void rollback(Transaction *tx) {
  tx->active = false;
  tx->live = NULL;
}

int main(void) {
  Table live = {0};
  Transaction tx = {0};
  bool first = begin(&tx, &live), nested = begin(&tx, &live);
  printf("first=%d nested=%d live_rows=%zu\n", first, nested, live.count);
  rollback(&tx);
  return 0;
}
```

Output:

```text
first=1 nested=0 live_rows=0
```

The active flag protects one handle’s lifecycle. It does not prevent a second unrelated handle from writing the same live table.

**Watch for:** A comment saying single writer does not synchronize multiple clients.

**Check:** What must the surrounding service enforce?

1. Only a per-thread local variable name
2. Exclusive mutation ownership

<details><summary>Answer</summary>

Exclusive mutation ownership. The same live state must not be concurrently mutated through independent handles.

</details>

**Try:** Add an admission lock or a request queue and test two competing transaction starts.

Run from the repository root:

```sh
make example EXAMPLE=recovery-2
```

## 29.3 BEGIN, COMMIT, and ROLLBACK

BEGIN establishes a working state, COMMIT publishes it under the model’s contract, and ROLLBACK discards it. Repeated or out-of-order commands need defined failures.

The fixture commits one score update and then rolls back another. In this bounded single-threaded model, readers of live state see only the committed value. A production commit must also handle log failures and durable acknowledgement; copying the table here teaches state transition semantics only.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { TABLE_CAP = 8 };
typedef struct {
  uint32_t id;
  char name[32];
  uint32_t score;
} Row;
typedef struct {
  Row rows[TABLE_CAP];
  size_t count;
} Table;
typedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;
int find_row(const Table *t, uint32_t id) {
  for (size_t i = 0; i < t->count; ++i)
    if (t->rows[i].id == id)
      return (int)i;
  return -1;
}
Status insert_row(Table *t, Row row) {
  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)
    return INVALID;
  if (find_row(t, row.id) >= 0)
    return DUPLICATE;
  if (t->count == TABLE_CAP)
    return FULL;
  t->rows[t->count++] = row;
  return OK;
}
Status update_score(Table *t, uint32_t id, uint32_t score) {
  int i = find_row(t, id);
  if (i < 0)
    return MISSING;
  t->rows[i].score = score;
  return OK;
}
Status delete_row(Table *t, uint32_t id) {
  int i = find_row(t, id);
  if (i < 0)
    return MISSING;
  for (size_t j = (size_t)i + 1; j < t->count; ++j)
    t->rows[j - 1] = t->rows[j];
  --t->count;
  return OK;
}
void display(const Table *t) {
  for (size_t i = 0; i < t->count; ++i)
    printf("%u | %s | %u\n", (unsigned)t->rows[i].id, t->rows[i].name,
           (unsigned)t->rows[i].score);
}
typedef struct {
  Table working;
  Table *live;
  bool active;
} Transaction;
bool begin(Transaction *tx, Table *live) {
  if (tx->active)
    return false;
  tx->working = *live;
  tx->live = live;
  tx->active = true;
  return true;
}
bool commit(Transaction *tx) {
  if (!tx->active)
    return false;
  *tx->live = tx->working;
  tx->active = false;
  return true;
}
void rollback(Transaction *tx) {
  tx->active = false;
  tx->live = NULL;
}

int main(void) {
  Table live = {0};
  insert_row(&live, (Row){1, "Ada", 90});
  Transaction tx = {0};
  begin(&tx, &live);
  update_score(&tx.working, 1, 95);
  commit(&tx);
  begin(&tx, &live);
  update_score(&tx.working, 1, 0);
  rollback(&tx);
  printf("committed_score=%u invalid_commit=%d\n", (unsigned)live.rows[0].score,
         !commit(&tx));
  return 0;
}
```

Output:

```text
committed_score=95 invalid_commit=1
```

The committed 95 survives the later rollback. Committing an inactive transaction fails.

**Watch for:** A failed durable commit must not be reported as successful merely because the working copy is valid.

**Check:** Which score is visible after the rollback?

1. The earlier committed 95
2. The later tentative zero

<details><summary>Answer</summary>

The earlier committed 95. Rollback never publishes its private working table.

</details>

**Try:** Define session ownership and behavior for COMMIT without BEGIN, nested BEGIN, and disconnect during a transaction.

Run from the repository root:

```sh
make example EXAMPLE=recovery-3
```

## 29.4 Write-ahead logging

Write-ahead logging records enough information for recovery before acknowledging a durable commit or persisting dependent data pages.

The one-value redo log uses fixed eight-byte BEGIN, SET, and COMMIT records with transaction IDs. This native fixture flushes stdio and calls POSIX fsync on the log before treating the commit as durable. A real database also needs stable log naming, error handling, checksums, page/log ordering, and platform-specific file and directory guarantees. The example demonstrates the ordering, not a complete storage engine.

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
  printf("durable_log_order_checked value=%u\n",
         (unsigned)recover(bytes, sizeof bytes, 0));
  if (fclose(f) != 0)
    return 1;
  return 0;
}
```

Output:

```text
durable_log_order_checked value=42
```

Recovery can reconstruct 42 from the committed log. The success line follows the checked synchronization call. The temporary file is intentionally not a permanent database path.

**Watch for:** fflush alone moves bytes to the operating-system interface; it is not equivalent to a platform durable-sync operation.

**Check:** When may a durable commit be acknowledged under this protocol?

1. Immediately after writing a private memory copy
2. After its required log synchronization succeeds

<details><summary>Answer</summary>

After its required log synchronization succeeds. Recovery must be able to find a durable commit record before success is promised.

</details>

**Try:** Use a named log under KEEP_FILES=1, inject sync failures, and add a checked data-page write only after the write-ahead condition holds.

Run from the repository root:

```sh
make example EXAMPLE=recovery-4
```

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

## Build it yourself

Recover committed changes after simulated interruptions.

1. Separate transaction visibility from durable acknowledgement. Model interrupted log prefixes and preserve committed state.
2. Specify a browser host persistence adapter and list its transaction, quota, crash, and export guarantees before implementing it.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=recovery-6
```

Chapter workspace command: `make chapter CHAPTER=recovery`.

Generated from dist/part6.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/recovery
