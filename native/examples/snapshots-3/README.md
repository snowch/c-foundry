# Visibility rules and reclaiming old versions

Complete native example, ready to edit and run in Codespaces or locally.

## 41.3 Visibility rules and reclaiming old versions

Old versions can be reclaimed only when no active snapshot may still need them. Version retention is a concurrency and lifetime problem.

Also editable and runnable inline in the browser course. This is a bounded, single-threaded model. Run and change it here; use a native build for the full system and its host-specific guarantees.

For exclusive deletion time d, a version is no longer visible to snapshots at or after d. If the oldest active snapshot is at least d, the version can be removed under this model. Protect the active-reader registry and reclamation decision with synchronization, and prevent raw version pointers from escaping their protected lifetime. Timestamp wrap and abandoned reader handling need explicit policies.

### A snapshot chooses a visible committed version

Creation is inclusive; deletion is exclusive in this model.

An older committed version has value 10, created at timestamp 1 and deleted at 3. A newer committed version has value 42, created at 3 and not deleted. Snapshot 2 sees value 10. Snapshot 3 does not see the old version because 3 is not less than its deleted timestamp; it sees value 42.

Only committed immutable versions are shown. Conflict handling and safe reclamation are separate responsibilities.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/snapshots/3). In main.c, change the earlier reclaim horizon argument from 2 to 3, leaving the later one fixed. Run code and compare old_reader_keeps= and horizon3_keeps=. When does the modeled horizon make the old version unnecessary?

### References and help

- [SQLite documentation: isolation](https://www.sqlite.org/isolation.html) — Compare committed visibility and snapshot behavior with the lesson’s explicit contract.
- [SQLite documentation: write-ahead logging](https://www.sqlite.org/wal.html) — Compare logging, checkpoints, and durability assumptions with the bounded redo models.

Native source: `native/examples/snapshots-3/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=snapshots-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

