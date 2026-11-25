# Chapter 26: Organizing pages

Part 6: Make the database faster and more reliable. Teaching baseline: C17.

Represent records inside bounded storage pages and keep cache and free-space state consistent.

## Outcomes

- Validate offsets before accessing page bytes.
- Manage slotted-page insertion and deletion.
- Distinguish cache hits, dirty eviction, and durable storage.

## 26.1 Page IDs, headers, and record offsets

A page ID locates a page; a slot locates a logical record within that page. Validate both levels before reading bytes.

The small page model keeps slot metadata in a separate C struct so pointer arithmetic and bounds can be inspected easily. An on-disk implementation must encode that metadata into a documented page header and reserve its space. Check offset≤page_size and length≤page_size−offset rather than adding two untrusted values that may overflow.

### A slot is an indirection to record bytes

Moving a live record changes its offset, not necessarily its slot number.

Before compaction, live slot 0 points to record A at illustrative byte offset 96. After compaction moves A to offset 72, slot 0 is updated to point to the same record at 72. A locator using the page ID and live slot 0 can still find A. Deleting and reusing that slot is a separate identity problem.

Offsets are illustrative. Slot reuse can make an old locator refer to a different record.

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

int main(void) {
  Page p;
  page_init(&p);
  size_t slot;
  const unsigned char *data;
  size_t n;
  page_insert(&p, (const unsigned char *)"Ada", 3, &slot);
  if (!page_read(&p, slot, &data, &n))
    return 1;
  printf("slot=%zu offset=%zu length=%zu text=%.*s\n", slot, p.offset[slot], n,
         (int)n, (const char *)data);
  return 0;
}
```

Output:

```text
slot=0 offset=61 length=3 text=Ada
```

The record’s three bytes occupy offsets 61..63. The precision-limited print does not require a stored zero terminator.

**Watch for:** The external metadata arrays in this model are not free space in a real 64-byte serialized page.

**Check:** Which bound avoids an unchecked offset+length addition?

1. length ≤ page_size - offset after validating offset
2. offset + length may wrap safely

<details><summary>Answer</summary>

length ≤ page_size - offset after validating offset. Subtraction is safe only after offset is known to be within the page.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/pages/1). In main.c, change the page_insert text and length from "Ada", 3 to "Grace", 5. Run code and compare slot=, offset=, length=, and text=. Which address moves when the same page holds a longer payload?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [SQLite documentation: database file format](https://www.sqlite.org/fileformat.html) (online) — Compare explicit headers, page layouts, and encoding rules with the teaching format.

Native source: `native/examples/pages-1.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=pages-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 26.2 Fixed-length and variable-length records

Variable-length records need explicit lengths; fixed-width rows trade space for simpler addressing.

The model copies payload bytes downward from the end of a bounded byte area and records offset/length pairs. Lengths count bytes, not Unicode characters. A successful insert consumes one slot and payload space; rejection leaves the page unchanged. The public slot is a logical locator, not a raw pointer valid across future compaction.

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

int main(void) {
  Page p;
  page_init(&p);
  size_t a, b;
  page_insert(&p, (const unsigned char *)"A", 1, &a);
  page_insert(&p, (const unsigned char *)"Grace", 5, &b);
  printf("lengths=%zu,%zu used=%zu\n", p.length[a], p.length[b],
         (size_t)PSIZE - p.free_end);
  return 0;
}
```

Output:

```text
lengths=1,5 used=6
```

The two variable payloads consume six bytes instead of two equal-width name fields. Their metadata consumes additional space outside this teaching byte area.

**Watch for:** A byte length is not a guarantee that an arbitrary string is valid UTF-8 or terminated.

**Check:** Why store a length with each variable payload?

1. All byte arrays have hidden terminators
2. Its size cannot be inferred from a fixed row width

<details><summary>Answer</summary>

Its size cannot be inferred from a fixed row width. The reader needs an explicit bounded region to interpret.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/pages/2). In main.c, replace "Grace", 5 with "Go", 2 in the second page_insert. Run code and compare lengths= and used=. Which memory usage is counted by PSIZE - free_end?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [SQLite documentation: database file format](https://www.sqlite.org/fileformat.html) (online) — Compare explicit headers, page layouts, and encoding rules with the teaching format.

Native source: `native/examples/pages-2.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=pages-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 26.3 Slotted pages

A slot directory decouples record identity within a page from the payload’s current byte offset.

The example inserts two records and reads them through their slots. A future compaction can move bytes while preserving live slot indices. Once a slot is reused after deletion, an old locator may identify a different record; a stronger API can add a generation counter or avoid reuse while references exist.

### A slot is an indirection to record bytes

Moving a live record changes its offset, not necessarily its slot number.

Before compaction, live slot 0 points to record A at illustrative byte offset 96. After compaction moves A to offset 72, slot 0 is updated to point to the same record at 72. A locator using the page ID and live slot 0 can still find A. Deleting and reusing that slot is a separate identity problem.

Offsets are illustrative. Slot reuse can make an old locator refer to a different record.

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

int main(void) {
  Page p;
  page_init(&p);
  size_t a, b;
  page_insert(&p, (const unsigned char *)"Ada", 3, &a);
  page_insert(&p, (const unsigned char *)"Ken", 3, &b);
  const unsigned char *data;
  size_t n;
  if (!page_read(&p, b, &data, &n))
    return 1;
  printf("slot=%zu text=%.*s\n", b, (int)n, (const char *)data);
  return 0;
}
```

Output:

```text
slot=1 text=Ken
```

Slot one resolves through the directory to the second payload. Callers do not need to know which direction payload allocation grows.

**Watch for:** Keeping a raw payload pointer across compaction bypasses the slot indirection that makes relocation possible.

**Check:** Which should a long-lived locator retain?

1. A slot identity under a documented reuse policy
2. An unchecked payload address

<details><summary>Answer</summary>

A slot identity under a documented reuse policy. Relocation can change offsets even when the logical record survives.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/pages/3). In main.c, insert page_delete(&p, a); and compact(&p); before the page_read, using the provided operations. Run code and compare slot= and text=. Why can a stable slot still find Ken after compaction?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [SQLite documentation: database file format](https://www.sqlite.org/fileformat.html) (online) — Compare explicit headers, page layouts, and encoding rules with the teaching format.

**Use the documentation (optional):** Which information must a reader have before it can safely interpret a page’s record offsets?

<details><summary>Compare your answer</summary>

It needs the page size, header/layout version, offset encoding, and validated record bounds. Compare the reference’s page and cell rules with the smaller course format.

</details>

Native source: `native/examples/pages-3.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=pages-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 26.4 Free space and deleted records

Deletion can free logical membership before reclaiming contiguous bytes. Fragmentation requires a deliberate reuse or compaction strategy.

Marking a slot deleted sets its length to zero. The compactor copies only live payloads into a new bounded page while retaining slot indices, then replaces the old page. This implementation assumes an internally valid page; an imported page needs validation before any compaction reads. Deleted slots are not reused by this minimal insert routine.

### A slot is an indirection to record bytes

Moving a live record changes its offset, not necessarily its slot number.

Before compaction, live slot 0 points to record A at illustrative byte offset 96. After compaction moves A to offset 72, slot 0 is updated to point to the same record at 72. A locator using the page ID and live slot 0 can still find A. Deleting and reusing that slot is a separate identity problem.

Offsets are illustrative. Slot reuse can make an old locator refer to a different record.

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

int main(void) {
  Page p;
  page_init(&p);
  size_t a, b;
  page_insert(&p, (const unsigned char *)"Ada", 3, &a);
  page_insert(&p, (const unsigned char *)"Grace", 5, &b);
  page_delete(&p, a);
  compact(&p);
  printf("live_bytes=%zu surviving_slot=%zu offset=%zu\n",
         (size_t)PSIZE - p.free_end, b, p.offset[b]);
  return 0;
}
```

Output:

```text
live_bytes=5 surviving_slot=1 offset=59
```

Compaction reclaims the deleted three-byte payload and places Grace at the page end. Its slot remains one.

**Watch for:** A deleted slot is not automatically reusable without considering stale locators.

**Check:** Does marking a slot deleted immediately create a contiguous free prefix?

1. Always
2. Not necessarily; compaction may be required

<details><summary>Answer</summary>

Not necessarily; compaction may be required. The byte placement of remaining live records can leave holes.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/pages/4). In main.c, replace "Grace", 5 with "Ken", 3 in the second page_insert. Run code after deletion and compaction. Compare live_bytes=, surviving_slot=, and offset=. Why does the payload change the offset but preserve the slot?

**Extend the example:** A reusable slot needs a generation number if an older locator can outlive a delete. Sketch the invalid and valid locators for one deleted and reused slot.

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [SQLite documentation: database file format](https://www.sqlite.org/fileformat.html) (online) — Compare explicit headers, page layouts, and encoding rules with the teaching format.
- [C reference: free](https://en.cppreference.com/w/c/memory/free.html) (online) — Check valid pointer arguments and access after deallocation.

Native source: `native/examples/pages-4.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=pages-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 26.5 A bounded page cache

A bounded cache trades memory for fewer backing reads. Dirty eviction and pinned users complicate replacement.

The two-frame model counts logical reads and dirty writes while using a small LRU age counter. It does not perform file I/O or simulate failures; a real cache must check dirty write-back success before replacing a frame. Borrowed frame pointers become invalid or change meaning on eviction, so pinned frames need a separate lifetime policy.

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
  Cache c = {0};
  fetch(&c, 1);
  fetch(&c, 2);
  fetch(&c, 1);
  fetch(&c, 3);
  printf("reads=%u writes=%u cached1=%d\n", c.reads, c.writes,
         c.frames[0].id == 1 || c.frames[1].id == 1);
  return 0;
}
```

Output:

```text
reads=3 writes=0 cached1=1
```

The second request for page one hits. Page two is least recently used when page three arrives, so it is evicted.

**Watch for:** This bounded trace does not address counter wraparound or pinned-frame exhaustion; those need production policies.

**Check:** Can a dirty frame be discarded before successful write-back?

1. No
2. Yes

<details><summary>Answer</summary>

No. Doing so loses the only modified page contents.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/pages/5). In main.c, replace the final fetch(&c, 3) with fetch(&c, 2). Run code and compare reads=, writes=, and cached1=. Why does the repeated page need fewer backing reads?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [SQLite documentation: database file format](https://www.sqlite.org/fileformat.html) (online) — Compare explicit headers, page layouts, and encoding rules with the teaching format.

Native source: `native/examples/pages-5.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=pages-5 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 26.6 Inspecting a database file visually

A visual file inspector should decode documented fields, not reinterpret native structs. A compact slot map can reveal layout and corruption.

The example prints each slot’s logical status and byte interval. This is a textual visualization that follows the same metadata used by the reader. A full inspector should validate ranges, overlaps, reserved values, and expected page size before rendering them; it must not trust corrupt offsets just because it is a diagnostic tool.

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

int main(void) {
  Page p;
  page_init(&p);
  size_t a, b;
  page_insert(&p, (const unsigned char *)"Ada", 3, &a);
  page_insert(&p, (const unsigned char *)"Ken", 3, &b);
  page_delete(&p, a);
  for (size_t i = 0; i < p.count; ++i)
    printf("slot%zu %s [%zu,%zu)\n", i, p.length[i] ? "live" : "deleted",
           p.offset[i], p.offset[i] + p.length[i]);
  return 0;
}
```

Output:

```text
slot0 deleted [61,61)
slot1 live [58,61)
```

The deleted slot remains in the directory but has no live payload range. The survivor occupies three bytes immediately below the old payload.

**Watch for:** An inspector can contain the same out-of-bounds bugs as a loader if it follows offsets before validating them.

**Check:** Should diagnostic tools validate imported offsets?

1. No, because they only display data
2. Yes

<details><summary>Answer</summary>

Yes. Displaying bytes still requires safe, bounded reads.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/pages/6). In main.c, remove page_delete(&p, a); and run. Compare the two slot state labels and their half-open byte ranges. Which endpoint marks the first byte outside each payload?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [SQLite documentation: database file format](https://www.sqlite.org/fileformat.html) (online) — Compare explicit headers, page layouts, and encoding rules with the teaching format.

Native source: `native/examples/pages-6.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=pages-6 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## Build it yourself

Locate and manage records inside slotted storage pages.

1. Add a hex dump with highlighted validated ranges, then reject overlapping live slots.
2. Test a record ending exactly at the page boundary, one exceeding it, overlapping live slots, and a deleted slot.

### Check your work

- Validate ranges before displaying bytes; after compaction, check surviving slot IDs and payload bytes.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=pages-6
```

Chapter workspace command: `make chapter CHAPTER=pages`.

Generated from dist/part6.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/pages
