# An introduction to MVCC

Complete native example, ready to edit and run in Codespaces or locally.

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

