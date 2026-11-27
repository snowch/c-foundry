# Snapshot reads

Complete Linux example, ready to edit and run in the browser terminal.

## 41.1 Snapshot reads

A snapshot read chooses versions according to a stable committed-time boundary, not according to the latest value at each statement.

Also editable and runnable inline in the browser course.

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

### Which version can this snapshot see?

Why does snapshot 2 see 10 while snapshot 3 sees 20?

Why does snapshot 2 see 10 while snapshot 3 sees 20? Version value; Visible snapshots; Example reader. 10; 1 ≤ snapshot < 3; snapshot 2 → 10; 20; 3 ≤ snapshot; snapshot 3 → 20. Committed version intervals. . Creation is inclusive and deletion is exclusive. These are committed sequence numbers, not wall-clock time. At oldest snapshot 2 keep both versions; at oldest snapshot 3 the old version may be reclaimed.

Creation is inclusive and deletion is exclusive. These are committed sequence numbers, not wall-clock time. At oldest snapshot 2 keep both versions; at oldest snapshot 3 the old version may be reclaimed. Illustration of the supplied example; edits do not update this picture.

**Watch for:** A snapshot timestamp must refer to a known committed state; wall-clock comparisons alone do not establish commit order.

**Check:** In the original model, value 10 is superseded by 20 at timestamp 3. What does a reader fixed at snapshot timestamp 2 see?

1. Ten
2. Twenty

<details><summary>Answer</summary>

Ten. Its visibility boundary remains fixed rather than advancing between reads.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/snapshots/1). In main.c, change the second version’s value from 20 to 25. Run code and compare snapshot2= and snapshot3=. Which snapshot falls before the new version becomes visible?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: isolation (included in the explanation above) — Compare committed visibility and snapshot behavior with the lesson’s explicit contract.
- Course notes: write-ahead logging (included in the explanation above) — Compare logging, checkpoints, and durability assumptions with the bounded redo models.

**Optional further reading (internet required):**

- [SQLite documentation: isolation](https://www.sqlite.org/isolation.html)
- [SQLite documentation: write-ahead logging](https://www.sqlite.org/wal.html)

Native source: `native/examples/snapshots-1/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=snapshots-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

