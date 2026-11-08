# Snapshot reads

Complete native example, ready to edit and run in Codespaces or locally.

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

