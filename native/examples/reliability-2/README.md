# Cache behavior and allocation costs

Complete Linux example, ready to edit and run in the browser terminal.

## 44.2 Cache behavior and allocation costs

Allocation count, object locality, and cache behavior are different measurements. A pool can reduce allocation calls while introducing its own lifetime constraints.

Also editable and runnable inline in the browser course.

The fixture performs eight separate row allocations and one allocation for an eight-row pool, checking every result and freeing every owner. It also exercises the small page-cache model and counts backing-read events. Fewer allocations or reads can motivate a design, but neither proves lower total runtime; choose between designs by measuring the same correct workload, including allocator contention, cache misses, and cleanup costs.

### A cache lookup has a hit path and a miss path

The cache is a bounded copy of selected backing pages.

Look up a page ID in the cache. A hit uses the resident copy. A miss must obtain the page from backing storage and install it in a cache slot, potentially evicting another page. Dirty pages need a writeback and error-handling policy before their storage is reused.

A hit is not a durability guarantee. Dirty eviction and concurrency need additional protocols.

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
  int id;
  unsigned age;
  bool valid, dirty;
  int value;
} Frame;
typedef struct {
  Frame frames[2];
  unsigned clock, reads, writes;
} Cache;
int *fetch(Cache *c, int id) {
  size_t victim = 0;
  for (size_t i = 0; i < 2; ++i)
    if (c->frames[i].valid && c->frames[i].id == id) {
      c->frames[i].age = ++c->clock;
      return &c->frames[i].value;
    }
  for (size_t i = 0; i < 2; ++i)
    if (!c->frames[i].valid) {
      victim = i;
      break;
    } else if (c->frames[i].age < c->frames[victim].age)
      victim = i;
  Frame *f = &c->frames[victim];
  if (f->valid && f->dirty)
    ++c->writes;
  *f = (Frame){id, ++c->clock, true, false, id * 10};
  ++c->reads;
  return &f->value;
}

int main(void) {
  Row *separate[8] = {0};
  unsigned calls = 0;
  for (size_t i = 0; i < 8; ++i) {
    separate[i] = malloc(sizeof *separate[i]);
    ++calls;
    if (!separate[i]) {
      for (size_t j = 0; j < i; ++j)
        free(separate[j]);
      return 1;
    }
  }
  Row *pool = malloc(8 * sizeof *pool);
  if (!pool) {
    for (size_t i = 0; i < 8; ++i)
      free(separate[i]);
    return 1;
  }
  Cache c = {0};
  fetch(&c, 1);
  fetch(&c, 2);
  fetch(&c, 1);
  printf("individual_allocations=%u pooled_allocations=1 cache_reads=%u\n",
         calls, c.reads);
  for (size_t i = 0; i < 8; ++i)
    free(separate[i]);
  free(pool);
  return 0;
}
```

Output:

```text
individual_allocations=8 pooled_allocations=1 cache_reads=2
```

Repeated access to page one hits in the two-frame model. The row pool has one owner, while separate rows have eight cleanup obligations.

**Watch for:** Returning a pointer to pooled storage requires a lifetime policy just as strict as returning an individually allocated row.

**Check:** Does fewer malloc calls prove faster end-to-end queries?

1. Yes
2. No

<details><summary>Answer</summary>

No. It measures one possible cost component rather than the whole workload.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/reliability/2). In main.c, replace the final fetch(&c, 1) with fetch(&c, 3). Run code and compare individual_allocations=, pooled_allocations=, and cache_reads=. Which measure changes when only the last page request changes?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: integrity checks (included in the explanation above) — Compare structural checks with the invariants tested in the teaching database.
- Course notes: atomic commit (included in the explanation above) — Read the failure assumptions and ordering required for a durable commit protocol.

**Optional further reading (internet required):**

- [SQLite documentation: integrity checks](https://www.sqlite.org/pragma.html#pragma_integrity_check)
- [SQLite documentation: atomic commit](https://www.sqlite.org/atomiccommit.html)

Native source: `native/examples/reliability-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=reliability-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

