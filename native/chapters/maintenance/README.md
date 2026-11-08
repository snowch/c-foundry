# Chapter 42: Recovery and maintenance

Part 9: Advanced TinyDB. Teaching baseline: C17.

Make recovery work with snapshots, log positions, and reusable storage without freeing data that remains referenced.

## Outcomes

- Replay only complete committed work after an applied log position.
- Order checkpoint publication before log truncation.
- Check page integrity before compaction and reuse.

## 42.1 Extending the write-ahead log

A log sequence number identifies a position in a stable ordered log. Recovery must know which committed position a checkpoint already includes.

The typed-record model skips records at or before the checkpoint’s applied LSN, requires a contiguous suffix, and updates the checkpoint only on a matching COMMIT. It retains the one-value single-writer transaction restriction. An on-disk log needs explicit record encoding, checksums, and torn-record framing; this struct is not a file format.

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

**Try:** Serialize explicit LSNs with checksums and test missing, duplicated, reordered, and torn records.

Run from the repository root:

```sh
make example EXAMPLE=maintenance-1
```

## 42.2 Checkpoints and log truncation

A checkpoint permits old log removal only after the snapshot is safely published. Reversing that order can erase the only recoverable copy.

This Linux/POSIX teaching fixture pauses writers, writes and syncs a temporary snapshot, renames it to the checkpoint path, syncs the directory, then truncates and syncs the older log. The fixed 16-byte snapshot encodes a small LSN and value with zero high bytes. A concurrent engine additionally needs a consistent snapshot boundary, complete page coverage, checksums, and a carefully defined log retention horizon.

### main.c

```c
#define _POSIX_C_SOURCE 200809L
#include <fcntl.h>
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main(void) {
  unsigned char snapshot[16] = {0x53, 0x4e, 0x50, 0x31};
  snapshot[4] = 3;
  snapshot[12] = 10;
  FILE *log = fopen("wal.log", "w+b");
  if (!log)
    return 1;
  if (fwrite("old-log", 1, 7, log) != 7 || fflush(log) || fsync(fileno(log))) {
    fclose(log);
    return 1;
  }
  FILE *temp = fopen("checkpoint.tmp", "wb");
  if (!temp) {
    fclose(log);
    return 1;
  }
  bool ok = fwrite(snapshot, 1, sizeof snapshot, temp) == sizeof snapshot &&
            fflush(temp) == 0 && fsync(fileno(temp)) == 0;
  int closed = fclose(temp);
  if (!ok || closed || rename("checkpoint.tmp", "checkpoint.db")) {
    fclose(log);
    return 1;
  }
  int dir = open(".", O_RDONLY);
  if (dir < 0) {
    fclose(log);
    return 1;
  }
  int synced = fsync(dir), dir_closed = close(dir);
  if (synced || dir_closed || ftruncate(fileno(log), 0) || fsync(fileno(log))) {
    fclose(log);
    return 1;
  }
  if (fclose(log))
    return 1;
  FILE *read = fopen("checkpoint.db", "rb");
  if (!read)
    return 1;
  unsigned char bytes[16];
  ok = fread(bytes, 1, sizeof bytes, read) == sizeof bytes &&
       memcmp(bytes, snapshot, sizeof bytes) == 0;
  if (fclose(read) || !ok)
    return 1;
  puts("checkpoint=10 applied_lsn=3 wal_truncated=1");
  return 0;
}
```

Output:

```text
checkpoint=10 applied_lsn=3 wal_truncated=1
```

The pass line follows checked file and directory synchronization and a byte-for-byte reload of the published snapshot. It exercises a local filesystem, not all possible power-loss or remote-filesystem behavior.

**Watch for:** Atomic rename alone does not establish every required durability guarantee, and truncating the log first is unsafe.

**Check:** When may the old log be truncated?

1. Before writing the snapshot to save space
2. After the covering checkpoint is durably published

<details><summary>Answer</summary>

After the covering checkpoint is durably published. Recovery needs at least one complete surviving representation of every acknowledged change.

</details>

**Try:** Use KEEP_FILES=1 to inspect the artifacts, then inject failure after each protocol step and verify a valid recovery source remains.

Run from the repository root:

```sh
make example EXAMPLE=maintenance-2 KEEP_FILES=1
```

## 42.3 Free-page reuse, compaction, and integrity checking

Free-page reuse and compaction require a reachability and identity policy. An unlinked physical page may still be needed by a snapshot or recovery log.

The fixture checks a slotted-page model for bounds and overlapping live ranges before compaction. It then constructs an overlapping corruption and verifies rejection. A full storage allocator must also track roots, index references, active snapshots, and log dependencies before placing a page on the reusable free list. A generation number can help reject stale external page handles.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { PSIZE = 64, MAX_SLOTS = 8 };
typedef struct {
  unsigned char bytes[PSIZE];
  size_t offset[MAX_SLOTS], length[MAX_SLOTS], count, free_end;
} Page;
void page_init(Page *p) {
  memset(p, 0, sizeof *p);
  p->free_end = PSIZE;
}
bool page_insert(Page *p, const unsigned char *data, size_t n, size_t *slot) {
  if (!n || p->count == MAX_SLOTS || n > p->free_end)
    return false;
  size_t i = p->count;
  p->free_end -= n;
  memcpy(p->bytes + p->free_end, data, n);
  p->offset[i] = p->free_end;
  p->length[i] = n;
  ++p->count;
  *slot = i;
  return true;
}
bool page_read(const Page *p, size_t slot, const unsigned char **data,
               size_t *length) {
  if (slot >= p->count || !p->length[slot] || p->offset[slot] > PSIZE ||
      p->length[slot] > PSIZE - p->offset[slot])
    return false;
  *data = p->bytes + p->offset[slot];
  *length = p->length[slot];
  return true;
}
bool page_delete(Page *p, size_t slot) {
  if (slot >= p->count || !p->length[slot])
    return false;
  p->length[slot] = 0;
  return true;
}
void compact(Page *p) {
  Page next;
  page_init(&next);
  next.count = p->count;
  for (size_t i = 0; i < p->count; ++i)
    if (p->length[i]) {
      next.free_end -= p->length[i];
      next.offset[i] = next.free_end;
      next.length[i] = p->length[i];
      memcpy(next.bytes + next.free_end, p->bytes + p->offset[i], p->length[i]);
    }
  *p = next;
}
bool page_valid(const Page *p) {
  if (p->count > MAX_SLOTS || p->free_end > PSIZE)
    return false;
  for (size_t i = 0; i < p->count; ++i) {
    if (!p->length[i])
      continue;
    if (p->offset[i] < p->free_end || p->offset[i] > PSIZE ||
        p->length[i] > PSIZE - p->offset[i])
      return false;
    for (size_t j = 0; j < i; ++j)
      if (p->length[j]) {
        if (p->offset[j] > PSIZE || p->length[j] > PSIZE - p->offset[j])
          return false;
        size_t end_i = p->offset[i] + p->length[i],
               end_j = p->offset[j] + p->length[j];
        if (p->offset[i] < end_j && p->offset[j] < end_i)
          return false;
      }
  }
  return true;
}

int main(void) {
  Page p;
  page_init(&p);
  size_t a, b;
  page_insert(&p, (const unsigned char *)"Ada", 3, &a);
  page_insert(&p, (const unsigned char *)"Ken", 3, &b);
  bool good = page_valid(&p);
  Page bad = p;
  bad.offset[b] = bad.offset[a];
  printf("valid=%d overlap_rejected=%d\n", good, !page_valid(&bad));
  return 0;
}
```

Output:

```text
valid=1 overlap_rejected=1
```

Both individual ranges fit the byte area, but their overlap violates the page’s stronger structural invariant.

**Watch for:** Bounds checks alone do not prove that two live records occupy distinct bytes.

**Check:** Is an unlinked page always immediately reusable?

1. No, snapshots or recovery may still reference it
2. Yes

<details><summary>Answer</summary>

No, snapshots or recovery may still reference it. Logical unlinking does not automatically end every reader or recovery dependency.

</details>

**Try:** Add free-list generations and a root-to-page integrity walk, then test stale handles after reuse.

Run from the repository root:

```sh
make example EXAMPLE=maintenance-3
```

## Build it yourself

Extend the earlier pager and log with a tested checkpoint protocol.

1. Make recovery work with snapshots, log positions, and reusable storage without freeing data that remains referenced.
2. Add free-list generations and a root-to-page integrity walk, then test stale handles after reuse.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=maintenance-3
```

Chapter workspace command: `make chapter CHAPTER=maintenance`.

Generated from dist/part9.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/maintenance
