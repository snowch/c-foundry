# Free-page reuse, compaction, and integrity checking

Complete native example, ready to edit and run in Codespaces or locally.

## 42.3 Free-page reuse, compaction, and integrity checking

Free-page reuse and compaction require a reachability and identity policy. An unlinked physical page may still be needed by a snapshot or recovery log.

Also editable and runnable inline in the browser course. This is a bounded, single-threaded model. Run and change it here; use a native build for the full system and its host-specific guarantees.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/maintenance/3). In main.c, remove bad.offset[b] = bad.offset[a]; and run. Compare valid= and overlap_rejected=. Why does a copied page without deliberate overlap pass the same integrity check?

### References and help

- [SQLite documentation: write-ahead logging](https://www.sqlite.org/wal.html) — Compare logging, checkpoints, and durability assumptions with the bounded redo models.
- [C reference: free](https://en.cppreference.com/w/c/memory/free.html) — Check valid pointer arguments and access after deallocation.
- [SQLite documentation: integrity checks](https://www.sqlite.org/pragma.html#pragma_integrity_check) — Compare structural checks with the invariants tested in the teaching database.

Native source: `native/examples/maintenance-3/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=maintenance-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

