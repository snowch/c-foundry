# Visibility rules and reclaiming old versions

Complete native example, ready to edit and run in Codespaces or locally.

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

