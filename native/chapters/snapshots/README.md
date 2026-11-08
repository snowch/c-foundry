# Chapter 41: Snapshots and versioned records

Part 9: Advanced TinyDB. Teaching baseline: C17.

Retain committed versions so readers can use a stable visibility boundary. Reclaim only after the active-snapshot horizon permits it.

## Outcomes

- Define inclusive creation and exclusive deletion timestamps.
- Separate visibility from physical version storage.
- Protect old versions while any reader can still observe them.

## 41.1 Snapshot reads

A snapshot read chooses versions according to a stable committed-time boundary, not according to the latest value at each statement.

The one-key model has value ten created at time one and superseded at time three; value twenty becomes visible at time three. A snapshot at time two continues to see ten. Timestamps here are bounded committed sequence numbers, not wall-clock time. Concurrent publication of version metadata needs synchronization in an assembled engine.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  int value;
  uint64_t created, deleted;
} Version;
bool visible(const Version *v, uint64_t snapshot) {
  return v->created <= snapshot && (v->deleted == 0 || snapshot < v->deleted);
}
bool snapshot_read(const Version *versions, size_t count, uint64_t snapshot,
                   int *out) {
  for (size_t i = count; i > 0; --i)
    if (visible(&versions[i - 1], snapshot)) {
      *out = versions[i - 1].value;
      return true;
    }
  return false;
}
size_t reclaim(Version *versions, size_t count, uint64_t oldest) {
  size_t kept = 0;
  for (size_t i = 0; i < count; ++i)
    if (versions[i].deleted == 0 || versions[i].deleted > oldest)
      versions[kept++] = versions[i];
  return kept;
}

int main(void) {
  Version v[] = {{10, 1, 3}, {20, 3, 0}};
  int old = 0, current = 0;
  if (!snapshot_read(v, 2, 2, &old) || !snapshot_read(v, 2, 3, &current))
    return 1;
  printf("snapshot2=%d snapshot3=%d\n", old, current);
  return 0;
}
```

Output:

```text
snapshot2=10 snapshot3=20
```

The old version’s deletion boundary is exclusive: it is visible before time three, not at three. The new version is visible starting at three.

**Watch for:** A snapshot timestamp must refer to a known committed state; wall-clock comparisons alone do not establish commit order.

**Check:** Which value does snapshot two see after time three commits?

1. Ten
2. Twenty

<details><summary>Answer</summary>

Ten. Its visibility boundary remains fixed rather than advancing between reads.

</details>

**Try:** Add a later committed version and verify that repeated reads at snapshot two remain unchanged.

Run from the repository root:

```sh
make example EXAMPLE=snapshots-1
```

## 41.2 An introduction to MVCC

MVCC stores multiple committed versions and uses a visibility rule to decide which one a reader sees. It does not by itself solve write conflicts or serializability.

The model tests created≤snapshot and either no deletion or snapshot<deleted. It searches newest to oldest and returns a copied value. A real implementation also needs transaction status for uncommitted versions, atomic publication of multi-row commits, conflict handling, indexes that respect visibility, and safe version lifetimes. The fixture deliberately contains only committed immutable version records.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  int value;
  uint64_t created, deleted;
} Version;
bool visible(const Version *v, uint64_t snapshot) {
  return v->created <= snapshot && (v->deleted == 0 || snapshot < v->deleted);
}
bool snapshot_read(const Version *versions, size_t count, uint64_t snapshot,
                   int *out) {
  for (size_t i = count; i > 0; --i)
    if (visible(&versions[i - 1], snapshot)) {
      *out = versions[i - 1].value;
      return true;
    }
  return false;
}
size_t reclaim(Version *versions, size_t count, uint64_t oldest) {
  size_t kept = 0;
  for (size_t i = 0; i < count; ++i)
    if (versions[i].deleted == 0 || versions[i].deleted > oldest)
      versions[kept++] = versions[i];
  return kept;
}

int main(void) {
  Version old = {10, 1, 3}, fresh = {20, 3, 0};
  for (uint64_t s = 2; s <= 3; ++s)
    printf("snapshot=%llu old=%d new=%d\n", (unsigned long long)s,
           visible(&old, s), visible(&fresh, s));
  return 0;
}
```

Output:

```text
snapshot=2 old=1 new=0
snapshot=3 old=0 new=1
```

At the exact boundary, visibility switches without a gap or overlap between these two versions.

**Watch for:** Calling a store MVCC does not establish a particular isolation level or automatic conflict detection.

**Check:** Does retaining versions alone guarantee serializable transactions?

1. Yes
2. No

<details><summary>Answer</summary>

No. Visibility, conflict rules, and transaction coordination jointly determine isolation.

</details>

**Try:** Add transaction-status metadata for tentative versions and reject their visibility until commit publication.

Run from the repository root:

```sh
make example EXAMPLE=snapshots-2
```

## 41.3 Visibility rules and reclaiming old versions

Old versions can be reclaimed only when no active snapshot may still need them. Version retention is a concurrency and lifetime problem.

For exclusive deletion time d, a version is no longer visible to snapshots at or after d. If the oldest active snapshot is at least d, the version can be removed under this model. Protect the active-reader registry and reclamation decision with synchronization, and prevent raw version pointers from escaping their protected lifetime. Timestamp wrap and abandoned reader handling need explicit policies.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  int value;
  uint64_t created, deleted;
} Version;
bool visible(const Version *v, uint64_t snapshot) {
  return v->created <= snapshot && (v->deleted == 0 || snapshot < v->deleted);
}
bool snapshot_read(const Version *versions, size_t count, uint64_t snapshot,
                   int *out) {
  for (size_t i = count; i > 0; --i)
    if (visible(&versions[i - 1], snapshot)) {
      *out = versions[i - 1].value;
      return true;
    }
  return false;
}
size_t reclaim(Version *versions, size_t count, uint64_t oldest) {
  size_t kept = 0;
  for (size_t i = 0; i < count; ++i)
    if (versions[i].deleted == 0 || versions[i].deleted > oldest)
      versions[kept++] = versions[i];
  return kept;
}

int main(void) {
  Version a[] = {{10, 1, 3}, {20, 3, 0}}, b[] = {{10, 1, 3}, {20, 3, 0}};
  size_t retained = reclaim(a, 2, 2), released = reclaim(b, 2, 3);
  printf("old_reader_keeps=%zu horizon3_keeps=%zu\n", retained, released);
  return 0;
}
```

Output:

```text
old_reader_keeps=2 horizon3_keeps=1
```

A reader at time two keeps the old version alive. Once the horizon reaches three, only the current version remains.

**Watch for:** Compacting a version array invalidates borrowed addresses even for surviving entries.

**Check:** May the old version be freed while snapshot two is active?

1. No
2. Yes

<details><summary>Answer</summary>

No. That reader still requires the value visible before deletion time three.

</details>

**Try:** Implement an active-snapshot registry and test reader start/end interleavings with reclamation under one documented protocol.

Run from the repository root:

```sh
make example EXAMPLE=snapshots-3
```

## Build it yourself

Design version visibility tests before implementing snapshot reads.

1. Retain committed versions so readers can use a stable visibility boundary. Reclaim only after the active-snapshot horizon permits it.
2. Implement an active-snapshot registry and test reader start/end interleavings with reclamation under one documented protocol.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=snapshots-3
```

Chapter workspace command: `make chapter CHAPTER=snapshots`.

Generated from dist/part9.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/snapshots
