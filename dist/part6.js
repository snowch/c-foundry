window.PART_SIX = {
  "pages": {
    "intro": "Represent records inside bounded storage pages and keep cache and free-space state consistent.",
    "outcomes": [
      "Validate offsets before accessing page bytes.",
      "Manage slotted-page insertion and deletion.",
      "Distinguish cache hits, dirty eviction, and durable storage."
    ],
    "topics": {
      "1": {
        "intro": "A page ID locates a page; a slot locates a logical record within that page. Validate both levels before reading bytes.",
        "explanation": "The small page model keeps slot metadata in a separate C struct so pointer arithmetic and bounds can be inspected easily. An on-disk implementation must encode that metadata into a documented page header and reserve its space. Check offset≤page_size and length≤page_size−offset rather than adding two untrusted values that may overflow.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { PSIZE = 64, MAX_SLOTS = 8 };\ntypedef struct {\n  unsigned char bytes[PSIZE];\n  size_t offset[MAX_SLOTS], length[MAX_SLOTS], count, free_end;\n} Page;\nvoid page_init(Page *p) {\n  memset(p, 0, sizeof *p);\n  p->free_end = PSIZE;\n}\nbool page_insert(Page *p, const unsigned char *data, size_t n, size_t *slot) {\n  if (!n || p->count == MAX_SLOTS || n > p->free_end)\n    return false;\n  size_t i = p->count;\n  p->free_end -= n;\n  memcpy(p->bytes + p->free_end, data, n);\n  p->offset[i] = p->free_end;\n  p->length[i] = n;\n  ++p->count;\n  *slot = i;\n  return true;\n}\nbool page_read(const Page *p, size_t slot, const unsigned char **data,\n               size_t *length) {\n  if (slot >= p->count || !p->length[slot] || p->offset[slot] > PSIZE ||\n      p->length[slot] > PSIZE - p->offset[slot])\n    return false;\n  *data = p->bytes + p->offset[slot];\n  *length = p->length[slot];\n  return true;\n}\nbool page_delete(Page *p, size_t slot) {\n  if (slot >= p->count || !p->length[slot])\n    return false;\n  p->length[slot] = 0;\n  return true;\n}\nvoid compact(Page *p) {\n  Page next;\n  page_init(&next);\n  next.count = p->count;\n  for (size_t i = 0; i < p->count; ++i)\n    if (p->length[i]) {\n      next.free_end -= p->length[i];\n      next.offset[i] = next.free_end;\n      next.length[i] = p->length[i];\n      memcpy(next.bytes + next.free_end, p->bytes + p->offset[i], p->length[i]);\n    }\n  *p = next;\n}\n\nint main(void) {\n  Page p;\n  page_init(&p);\n  size_t slot;\n  const unsigned char *data;\n  size_t n;\n  page_insert(&p, (const unsigned char *)\"Ada\", 3, &slot);\n  if (!page_read(&p, slot, &data, &n))\n    return 1;\n  printf(\"slot=%zu offset=%zu length=%zu text=%.*s\\n\", slot, p.offset[slot], n,\n         (int)n, (const char *)data);\n  return 0;\n}\n",
        "expected": "slot=0 offset=61 length=3 text=Ada",
        "walkthrough": "The record’s three bytes occupy offsets 61..63. The precision-limited print does not require a stored zero terminator.",
        "pitfall": "The external metadata arrays in this model are not free space in a real 64-byte serialized page.",
        "question": "Which bound avoids an unchecked offset+length addition?",
        "choices": [
          "length ≤ page_size - offset after validating offset",
          "offset + length may wrap safely"
        ],
        "answer": 0,
        "why": "Subtraction is safe only after offset is known to be within the page.",
        "tryit": "Encode the slot directory into the page itself and include its bytes in the free-space calculation.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "Variable-length records need explicit lengths; fixed-width rows trade space for simpler addressing.",
        "explanation": "The model copies payload bytes downward from the end of a bounded byte area and records offset/length pairs. Lengths count bytes, not Unicode characters. A successful insert consumes one slot and payload space; rejection leaves the page unchanged. The public slot is a logical locator, not a raw pointer valid across future compaction.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { PSIZE = 64, MAX_SLOTS = 8 };\ntypedef struct {\n  unsigned char bytes[PSIZE];\n  size_t offset[MAX_SLOTS], length[MAX_SLOTS], count, free_end;\n} Page;\nvoid page_init(Page *p) {\n  memset(p, 0, sizeof *p);\n  p->free_end = PSIZE;\n}\nbool page_insert(Page *p, const unsigned char *data, size_t n, size_t *slot) {\n  if (!n || p->count == MAX_SLOTS || n > p->free_end)\n    return false;\n  size_t i = p->count;\n  p->free_end -= n;\n  memcpy(p->bytes + p->free_end, data, n);\n  p->offset[i] = p->free_end;\n  p->length[i] = n;\n  ++p->count;\n  *slot = i;\n  return true;\n}\nbool page_read(const Page *p, size_t slot, const unsigned char **data,\n               size_t *length) {\n  if (slot >= p->count || !p->length[slot] || p->offset[slot] > PSIZE ||\n      p->length[slot] > PSIZE - p->offset[slot])\n    return false;\n  *data = p->bytes + p->offset[slot];\n  *length = p->length[slot];\n  return true;\n}\nbool page_delete(Page *p, size_t slot) {\n  if (slot >= p->count || !p->length[slot])\n    return false;\n  p->length[slot] = 0;\n  return true;\n}\nvoid compact(Page *p) {\n  Page next;\n  page_init(&next);\n  next.count = p->count;\n  for (size_t i = 0; i < p->count; ++i)\n    if (p->length[i]) {\n      next.free_end -= p->length[i];\n      next.offset[i] = next.free_end;\n      next.length[i] = p->length[i];\n      memcpy(next.bytes + next.free_end, p->bytes + p->offset[i], p->length[i]);\n    }\n  *p = next;\n}\n\nint main(void) {\n  Page p;\n  page_init(&p);\n  size_t a, b;\n  page_insert(&p, (const unsigned char *)\"A\", 1, &a);\n  page_insert(&p, (const unsigned char *)\"Grace\", 5, &b);\n  printf(\"lengths=%zu,%zu used=%zu\\n\", p.length[a], p.length[b],\n         (size_t)PSIZE - p.free_end);\n  return 0;\n}\n",
        "expected": "lengths=1,5 used=6",
        "walkthrough": "The two variable payloads consume six bytes instead of two equal-width name fields. Their metadata consumes additional space outside this teaching byte area.",
        "pitfall": "A byte length is not a guarantee that an arbitrary string is valid UTF-8 or terminated.",
        "question": "Why store a length with each variable payload?",
        "choices": [
          "All byte arrays have hidden terminators",
          "Its size cannot be inferred from a fixed row width"
        ],
        "answer": 1,
        "why": "The reader needs an explicit bounded region to interpret.",
        "tryit": "Compare payload and metadata overhead for many one-byte records versus fewer long records.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "A slot directory decouples record identity within a page from the payload’s current byte offset.",
        "explanation": "The example inserts two records and reads them through their slots. A future compaction can move bytes while preserving live slot indices. Once a slot is reused after deletion, an old locator may identify a different record; a stronger API can add a generation counter or avoid reuse while references exist.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { PSIZE = 64, MAX_SLOTS = 8 };\ntypedef struct {\n  unsigned char bytes[PSIZE];\n  size_t offset[MAX_SLOTS], length[MAX_SLOTS], count, free_end;\n} Page;\nvoid page_init(Page *p) {\n  memset(p, 0, sizeof *p);\n  p->free_end = PSIZE;\n}\nbool page_insert(Page *p, const unsigned char *data, size_t n, size_t *slot) {\n  if (!n || p->count == MAX_SLOTS || n > p->free_end)\n    return false;\n  size_t i = p->count;\n  p->free_end -= n;\n  memcpy(p->bytes + p->free_end, data, n);\n  p->offset[i] = p->free_end;\n  p->length[i] = n;\n  ++p->count;\n  *slot = i;\n  return true;\n}\nbool page_read(const Page *p, size_t slot, const unsigned char **data,\n               size_t *length) {\n  if (slot >= p->count || !p->length[slot] || p->offset[slot] > PSIZE ||\n      p->length[slot] > PSIZE - p->offset[slot])\n    return false;\n  *data = p->bytes + p->offset[slot];\n  *length = p->length[slot];\n  return true;\n}\nbool page_delete(Page *p, size_t slot) {\n  if (slot >= p->count || !p->length[slot])\n    return false;\n  p->length[slot] = 0;\n  return true;\n}\nvoid compact(Page *p) {\n  Page next;\n  page_init(&next);\n  next.count = p->count;\n  for (size_t i = 0; i < p->count; ++i)\n    if (p->length[i]) {\n      next.free_end -= p->length[i];\n      next.offset[i] = next.free_end;\n      next.length[i] = p->length[i];\n      memcpy(next.bytes + next.free_end, p->bytes + p->offset[i], p->length[i]);\n    }\n  *p = next;\n}\n\nint main(void) {\n  Page p;\n  page_init(&p);\n  size_t a, b;\n  page_insert(&p, (const unsigned char *)\"Ada\", 3, &a);\n  page_insert(&p, (const unsigned char *)\"Ken\", 3, &b);\n  const unsigned char *data;\n  size_t n;\n  if (!page_read(&p, b, &data, &n))\n    return 1;\n  printf(\"slot=%zu text=%.*s\\n\", b, (int)n, (const char *)data);\n  return 0;\n}\n",
        "expected": "slot=1 text=Ken",
        "walkthrough": "Slot one resolves through the directory to the second payload. Callers do not need to know which direction payload allocation grows.",
        "pitfall": "Keeping a raw payload pointer across compaction bypasses the slot indirection that makes relocation possible.",
        "question": "Which should a long-lived locator retain?",
        "choices": [
          "A slot identity under a documented reuse policy",
          "An unchecked payload address"
        ],
        "answer": 0,
        "why": "Relocation can change offsets even when the logical record survives.",
        "tryit": "Compact a page and verify that each live slot still resolves to the same bytes.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "Deletion can free logical membership before reclaiming contiguous bytes. Fragmentation requires a deliberate reuse or compaction strategy.",
        "explanation": "Marking a slot deleted sets its length to zero. The compactor copies only live payloads into a new bounded page while retaining slot indices, then replaces the old page. This implementation assumes an internally valid page; an imported page needs validation before any compaction reads. Deleted slots are not reused by this minimal insert routine.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { PSIZE = 64, MAX_SLOTS = 8 };\ntypedef struct {\n  unsigned char bytes[PSIZE];\n  size_t offset[MAX_SLOTS], length[MAX_SLOTS], count, free_end;\n} Page;\nvoid page_init(Page *p) {\n  memset(p, 0, sizeof *p);\n  p->free_end = PSIZE;\n}\nbool page_insert(Page *p, const unsigned char *data, size_t n, size_t *slot) {\n  if (!n || p->count == MAX_SLOTS || n > p->free_end)\n    return false;\n  size_t i = p->count;\n  p->free_end -= n;\n  memcpy(p->bytes + p->free_end, data, n);\n  p->offset[i] = p->free_end;\n  p->length[i] = n;\n  ++p->count;\n  *slot = i;\n  return true;\n}\nbool page_read(const Page *p, size_t slot, const unsigned char **data,\n               size_t *length) {\n  if (slot >= p->count || !p->length[slot] || p->offset[slot] > PSIZE ||\n      p->length[slot] > PSIZE - p->offset[slot])\n    return false;\n  *data = p->bytes + p->offset[slot];\n  *length = p->length[slot];\n  return true;\n}\nbool page_delete(Page *p, size_t slot) {\n  if (slot >= p->count || !p->length[slot])\n    return false;\n  p->length[slot] = 0;\n  return true;\n}\nvoid compact(Page *p) {\n  Page next;\n  page_init(&next);\n  next.count = p->count;\n  for (size_t i = 0; i < p->count; ++i)\n    if (p->length[i]) {\n      next.free_end -= p->length[i];\n      next.offset[i] = next.free_end;\n      next.length[i] = p->length[i];\n      memcpy(next.bytes + next.free_end, p->bytes + p->offset[i], p->length[i]);\n    }\n  *p = next;\n}\n\nint main(void) {\n  Page p;\n  page_init(&p);\n  size_t a, b;\n  page_insert(&p, (const unsigned char *)\"Ada\", 3, &a);\n  page_insert(&p, (const unsigned char *)\"Grace\", 5, &b);\n  page_delete(&p, a);\n  compact(&p);\n  printf(\"live_bytes=%zu surviving_slot=%zu offset=%zu\\n\",\n         (size_t)PSIZE - p.free_end, b, p.offset[b]);\n  return 0;\n}\n",
        "expected": "live_bytes=5 surviving_slot=1 offset=59",
        "walkthrough": "Compaction reclaims the deleted three-byte payload and places Grace at the page end. Its slot remains one.",
        "pitfall": "A deleted slot is not automatically reusable without considering stale locators.",
        "question": "Does marking a slot deleted immediately create a contiguous free prefix?",
        "choices": [
          "Always",
          "Not necessarily; compaction may be required"
        ],
        "answer": 1,
        "why": "The byte placement of remaining live records can leave holes.",
        "tryit": "Add a reusable-slot policy with generations and test that stale locators are rejected.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "A bounded cache trades memory for fewer backing reads. Dirty eviction and pinned users complicate replacement.",
        "explanation": "The two-frame model counts logical reads and dirty writes while using a small LRU age counter. It does not perform file I/O or simulate failures; a real cache must check dirty write-back success before replacing a frame. Borrowed frame pointers become invalid or change meaning on eviction, so pinned frames need a separate lifetime policy.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  int id;\n  unsigned age;\n  bool valid, dirty;\n  int value;\n} Frame;\ntypedef struct {\n  Frame frames[2];\n  unsigned clock, reads, writes;\n} Cache;\nint *fetch(Cache *c, int id) {\n  size_t victim = 0;\n  for (size_t i = 0; i < 2; ++i)\n    if (c->frames[i].valid && c->frames[i].id == id) {\n      c->frames[i].age = ++c->clock;\n      return &c->frames[i].value;\n    }\n  for (size_t i = 0; i < 2; ++i)\n    if (!c->frames[i].valid) {\n      victim = i;\n      break;\n    } else if (c->frames[i].age < c->frames[victim].age)\n      victim = i;\n  Frame *f = &c->frames[victim];\n  if (f->valid && f->dirty)\n    ++c->writes;\n  *f = (Frame){id, ++c->clock, true, false, id * 10};\n  ++c->reads;\n  return &f->value;\n}\n\nint main(void) {\n  Cache c = {0};\n  fetch(&c, 1);\n  fetch(&c, 2);\n  fetch(&c, 1);\n  fetch(&c, 3);\n  printf(\"reads=%u writes=%u cached1=%d\\n\", c.reads, c.writes,\n         c.frames[0].id == 1 || c.frames[1].id == 1);\n  return 0;\n}\n",
        "expected": "reads=3 writes=0 cached1=1",
        "walkthrough": "The second request for page one hits. Page two is least recently used when page three arrives, so it is evicted.",
        "pitfall": "This bounded trace does not address counter wraparound or pinned-frame exhaustion; those need production policies.",
        "question": "Can a dirty frame be discarded before successful write-back?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "Doing so loses the only modified page contents.",
        "tryit": "Connect the cache to the checked pager and inject a write failure during dirty eviction.",
        "input": "",
        "runtime": "browser"
      },
      "6": {
        "intro": "A visual file inspector should decode documented fields, not reinterpret native structs. A compact slot map can reveal layout and corruption.",
        "explanation": "The example prints each slot’s logical status and byte interval. This is a textual visualization that follows the same metadata used by the reader. A full inspector should validate ranges, overlaps, reserved values, and expected page size before rendering them; it must not trust corrupt offsets just because it is a diagnostic tool.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { PSIZE = 64, MAX_SLOTS = 8 };\ntypedef struct {\n  unsigned char bytes[PSIZE];\n  size_t offset[MAX_SLOTS], length[MAX_SLOTS], count, free_end;\n} Page;\nvoid page_init(Page *p) {\n  memset(p, 0, sizeof *p);\n  p->free_end = PSIZE;\n}\nbool page_insert(Page *p, const unsigned char *data, size_t n, size_t *slot) {\n  if (!n || p->count == MAX_SLOTS || n > p->free_end)\n    return false;\n  size_t i = p->count;\n  p->free_end -= n;\n  memcpy(p->bytes + p->free_end, data, n);\n  p->offset[i] = p->free_end;\n  p->length[i] = n;\n  ++p->count;\n  *slot = i;\n  return true;\n}\nbool page_read(const Page *p, size_t slot, const unsigned char **data,\n               size_t *length) {\n  if (slot >= p->count || !p->length[slot] || p->offset[slot] > PSIZE ||\n      p->length[slot] > PSIZE - p->offset[slot])\n    return false;\n  *data = p->bytes + p->offset[slot];\n  *length = p->length[slot];\n  return true;\n}\nbool page_delete(Page *p, size_t slot) {\n  if (slot >= p->count || !p->length[slot])\n    return false;\n  p->length[slot] = 0;\n  return true;\n}\nvoid compact(Page *p) {\n  Page next;\n  page_init(&next);\n  next.count = p->count;\n  for (size_t i = 0; i < p->count; ++i)\n    if (p->length[i]) {\n      next.free_end -= p->length[i];\n      next.offset[i] = next.free_end;\n      next.length[i] = p->length[i];\n      memcpy(next.bytes + next.free_end, p->bytes + p->offset[i], p->length[i]);\n    }\n  *p = next;\n}\n\nint main(void) {\n  Page p;\n  page_init(&p);\n  size_t a, b;\n  page_insert(&p, (const unsigned char *)\"Ada\", 3, &a);\n  page_insert(&p, (const unsigned char *)\"Ken\", 3, &b);\n  page_delete(&p, a);\n  for (size_t i = 0; i < p.count; ++i)\n    printf(\"slot%zu %s [%zu,%zu)\\n\", i, p.length[i] ? \"live\" : \"deleted\",\n           p.offset[i], p.offset[i] + p.length[i]);\n  return 0;\n}\n",
        "expected": "slot0 deleted [61,61)\nslot1 live [58,61)",
        "walkthrough": "The deleted slot remains in the directory but has no live payload range. The survivor occupies three bytes immediately below the old payload.",
        "pitfall": "An inspector can contain the same out-of-bounds bugs as a loader if it follows offsets before validating them.",
        "question": "Should diagnostic tools validate imported offsets?",
        "choices": [
          "No, because they only display data",
          "Yes"
        ],
        "answer": 1,
        "why": "Displaying bytes still requires safe, bounded reads.",
        "tryit": "Add a hex dump with highlighted validated ranges, then reject overlapping live slots.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practicePlan": {
      "goal": "Locate and manage records inside slotted storage pages.",
      "tasks": [
        "Represent records inside bounded storage pages and keep cache and free-space state consistent.",
        "Add a hex dump with highlighted validated ranges, then reject overlapping live slots.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "pages-6"
    }
  },
  "bplus-trees": {
    "intro": "Build and test a bounded B+ index before encoding its pages. Preserve routing, occupancy, and leaf-link invariants.",
    "outcomes": [
      "Route point lookups through separator keys.",
      "Split full leaves and maintain ordered sibling links.",
      "Restore occupancy through borrowing or merging after deletion."
    ],
    "topics": {
      "1": {
        "intro": "Page-oriented trees reduce the number of storage pages visited per lookup by giving each internal page many children.",
        "explanation": "A B+ tree stores record references in leaves and routing separators in internal pages. Its height is logarithmic in key count under occupancy assumptions, with branching tied to page size. The executable model uses four-entry leaves and one routing root; it intentionally rejects growth beyond eight leaves rather than pretending to implement arbitrary-height page storage.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { LEAF_MAX = 4, LEAF_POOL = 8 };\ntypedef struct Leaf {\n  int key[LEAF_MAX], value[LEAF_MAX];\n  size_t n;\n  bool used;\n  struct Leaf *next;\n} Leaf;\ntypedef struct {\n  Leaf pages[LEAF_POOL];\n  Leaf *child[LEAF_POOL];\n  size_t n;\n} BTree;\nvoid tree_init(BTree *t) {\n  memset(t, 0, sizeof *t);\n  t->n = 1;\n  t->pages[0].used = true;\n  t->child[0] = &t->pages[0];\n}\nsize_t route(const BTree *t, int key) {\n  size_t i = 0;\n  while (i + 1 < t->n && t->child[i + 1]->key[0] <= key)\n    ++i;\n  return i;\n}\nbool tree_find(const BTree *t, int key, int *out) {\n  const Leaf *p = t->child[route(t, key)];\n  for (size_t i = 0; i < p->n; ++i)\n    if (p->key[i] == key) {\n      *out = p->value[i];\n      return true;\n    }\n  return false;\n}\nbool tree_put(BTree *t, int key, int value) {\n  size_t at = route(t, key);\n  Leaf *p = t->child[at];\n  int old;\n  if (tree_find(t, key, &old))\n    return false;\n  if (p->n < LEAF_MAX) {\n    size_t i = p->n++;\n    while (i && p->key[i - 1] > key) {\n      p->key[i] = p->key[i - 1];\n      p->value[i] = p->value[i - 1];\n      --i;\n    }\n    p->key[i] = key;\n    p->value[i] = value;\n    return true;\n  }\n  if (t->n == LEAF_POOL)\n    return false;\n  Leaf *right = NULL;\n  for (size_t i = 0; i < LEAF_POOL; ++i)\n    if (!t->pages[i].used) {\n      right = &t->pages[i];\n      break;\n    }\n  if (!right)\n    return false;\n  int keys[5], values[5];\n  size_t j = 0;\n  bool added = false;\n  for (size_t i = 0; i < 5; ++i) {\n    if (!added && (j == p->n || key < p->key[j])) {\n      keys[i] = key;\n      values[i] = value;\n      added = true;\n    } else {\n      keys[i] = p->key[j];\n      values[i] = p->value[j++];\n    }\n  }\n  *right = (Leaf){0};\n  right->used = true;\n  p->n = 2;\n  right->n = 3;\n  for (size_t i = 0; i < 2; ++i) {\n    p->key[i] = keys[i];\n    p->value[i] = values[i];\n  }\n  for (size_t i = 0; i < 3; ++i) {\n    right->key[i] = keys[i + 2];\n    right->value[i] = values[i + 2];\n  }\n  right->next = p->next;\n  p->next = right;\n  for (size_t i = t->n; i > at + 1; --i)\n    t->child[i] = t->child[i - 1];\n  t->child[at + 1] = right;\n  ++t->n;\n  return true;\n}\nbool tree_erase(BTree *t, int key) {\n  size_t at = route(t, key);\n  Leaf *p = t->child[at];\n  size_t pos = 0;\n  while (pos < p->n && p->key[pos] != key)\n    ++pos;\n  if (pos == p->n)\n    return false;\n  for (size_t i = pos + 1; i < p->n; ++i) {\n    p->key[i - 1] = p->key[i];\n    p->value[i - 1] = p->value[i];\n  }\n  --p->n;\n  if (t->n == 1 || p->n >= 2)\n    return true;\n  Leaf *left = at ? t->child[at - 1] : NULL,\n       *right = at + 1 < t->n ? t->child[at + 1] : NULL;\n  if (left && left->n > 2) {\n    for (size_t i = p->n; i > 0; --i) {\n      p->key[i] = p->key[i - 1];\n      p->value[i] = p->value[i - 1];\n    }\n    --left->n;\n    p->key[0] = left->key[left->n];\n    p->value[0] = left->value[left->n];\n    ++p->n;\n    return true;\n  }\n  if (right && right->n > 2) {\n    p->key[p->n] = right->key[0];\n    p->value[p->n++] = right->value[0];\n    for (size_t i = 1; i < right->n; ++i) {\n      right->key[i - 1] = right->key[i];\n      right->value[i - 1] = right->value[i];\n    }\n    --right->n;\n    return true;\n  }\n  size_t removed;\n  if (left) {\n    for (size_t i = 0; i < p->n; ++i) {\n      left->key[left->n] = p->key[i];\n      left->value[left->n++] = p->value[i];\n    }\n    left->next = p->next;\n    p->used = false;\n    removed = at;\n  } else {\n    for (size_t i = 0; i < right->n; ++i) {\n      p->key[p->n] = right->key[i];\n      p->value[p->n++] = right->value[i];\n    }\n    p->next = right->next;\n    right->used = false;\n    removed = at + 1;\n  }\n  for (size_t i = removed + 1; i < t->n; ++i)\n    t->child[i - 1] = t->child[i];\n  --t->n;\n  return true;\n}\nvoid range(const BTree *t, int lo, int hi) {\n  const Leaf *p = t->child[route(t, lo)];\n  for (; p; p = p->next)\n    for (size_t i = 0; i < p->n; ++i) {\n      if (p->key[i] >= hi)\n        return;\n      if (p->key[i] >= lo)\n        printf(\"%d \", p->key[i]);\n    }\n  puts(\"\");\n}\n\nint main(void) {\n  BTree t;\n  tree_init(&t);\n  for (int key = 1; key <= 7; ++key)\n    if (!tree_put(&t, key, key * 10))\n      return 1;\n  printf(\"root_children=%zu leaf_capacity=%d\\n\", t.n, LEAF_MAX);\n  return 0;\n}\n",
        "expected": "root_children=3 leaf_capacity=4",
        "walkthrough": "Seven ascending inserts trigger two splits and leave three root children. Small capacities make structure changes visible.",
        "pitfall": "This in-memory pointer model is not a serialized index; disk pages need stable page IDs and checked encoding.",
        "question": "Why does a large fanout help storage lookup?",
        "choices": [
          "It reduces the number of page levels visited",
          "It eliminates all comparisons"
        ],
        "answer": 0,
        "why": "Many routing choices fit within each fetched page.",
        "tryit": "Calculate leaf and child capacities for a real page format including headers, key widths, and row references.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "Internal separators guide searches while leaf records carry the indexed data. Keep the equality routing convention consistent.",
        "explanation": "This root chooses the rightmost child whose first key is no greater than the search key. Separators are derived from child minima after updates rather than stored separately. That makes separator maintenance observable without an extra cached array, but reading empty nonroot leaves would be invalid; deletion repairs underflow before returning.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { LEAF_MAX = 4, LEAF_POOL = 8 };\ntypedef struct Leaf {\n  int key[LEAF_MAX], value[LEAF_MAX];\n  size_t n;\n  bool used;\n  struct Leaf *next;\n} Leaf;\ntypedef struct {\n  Leaf pages[LEAF_POOL];\n  Leaf *child[LEAF_POOL];\n  size_t n;\n} BTree;\nvoid tree_init(BTree *t) {\n  memset(t, 0, sizeof *t);\n  t->n = 1;\n  t->pages[0].used = true;\n  t->child[0] = &t->pages[0];\n}\nsize_t route(const BTree *t, int key) {\n  size_t i = 0;\n  while (i + 1 < t->n && t->child[i + 1]->key[0] <= key)\n    ++i;\n  return i;\n}\nbool tree_find(const BTree *t, int key, int *out) {\n  const Leaf *p = t->child[route(t, key)];\n  for (size_t i = 0; i < p->n; ++i)\n    if (p->key[i] == key) {\n      *out = p->value[i];\n      return true;\n    }\n  return false;\n}\nbool tree_put(BTree *t, int key, int value) {\n  size_t at = route(t, key);\n  Leaf *p = t->child[at];\n  int old;\n  if (tree_find(t, key, &old))\n    return false;\n  if (p->n < LEAF_MAX) {\n    size_t i = p->n++;\n    while (i && p->key[i - 1] > key) {\n      p->key[i] = p->key[i - 1];\n      p->value[i] = p->value[i - 1];\n      --i;\n    }\n    p->key[i] = key;\n    p->value[i] = value;\n    return true;\n  }\n  if (t->n == LEAF_POOL)\n    return false;\n  Leaf *right = NULL;\n  for (size_t i = 0; i < LEAF_POOL; ++i)\n    if (!t->pages[i].used) {\n      right = &t->pages[i];\n      break;\n    }\n  if (!right)\n    return false;\n  int keys[5], values[5];\n  size_t j = 0;\n  bool added = false;\n  for (size_t i = 0; i < 5; ++i) {\n    if (!added && (j == p->n || key < p->key[j])) {\n      keys[i] = key;\n      values[i] = value;\n      added = true;\n    } else {\n      keys[i] = p->key[j];\n      values[i] = p->value[j++];\n    }\n  }\n  *right = (Leaf){0};\n  right->used = true;\n  p->n = 2;\n  right->n = 3;\n  for (size_t i = 0; i < 2; ++i) {\n    p->key[i] = keys[i];\n    p->value[i] = values[i];\n  }\n  for (size_t i = 0; i < 3; ++i) {\n    right->key[i] = keys[i + 2];\n    right->value[i] = values[i + 2];\n  }\n  right->next = p->next;\n  p->next = right;\n  for (size_t i = t->n; i > at + 1; --i)\n    t->child[i] = t->child[i - 1];\n  t->child[at + 1] = right;\n  ++t->n;\n  return true;\n}\nbool tree_erase(BTree *t, int key) {\n  size_t at = route(t, key);\n  Leaf *p = t->child[at];\n  size_t pos = 0;\n  while (pos < p->n && p->key[pos] != key)\n    ++pos;\n  if (pos == p->n)\n    return false;\n  for (size_t i = pos + 1; i < p->n; ++i) {\n    p->key[i - 1] = p->key[i];\n    p->value[i - 1] = p->value[i];\n  }\n  --p->n;\n  if (t->n == 1 || p->n >= 2)\n    return true;\n  Leaf *left = at ? t->child[at - 1] : NULL,\n       *right = at + 1 < t->n ? t->child[at + 1] : NULL;\n  if (left && left->n > 2) {\n    for (size_t i = p->n; i > 0; --i) {\n      p->key[i] = p->key[i - 1];\n      p->value[i] = p->value[i - 1];\n    }\n    --left->n;\n    p->key[0] = left->key[left->n];\n    p->value[0] = left->value[left->n];\n    ++p->n;\n    return true;\n  }\n  if (right && right->n > 2) {\n    p->key[p->n] = right->key[0];\n    p->value[p->n++] = right->value[0];\n    for (size_t i = 1; i < right->n; ++i) {\n      right->key[i - 1] = right->key[i];\n      right->value[i - 1] = right->value[i];\n    }\n    --right->n;\n    return true;\n  }\n  size_t removed;\n  if (left) {\n    for (size_t i = 0; i < p->n; ++i) {\n      left->key[left->n] = p->key[i];\n      left->value[left->n++] = p->value[i];\n    }\n    left->next = p->next;\n    p->used = false;\n    removed = at;\n  } else {\n    for (size_t i = 0; i < right->n; ++i) {\n      p->key[p->n] = right->key[i];\n      p->value[p->n++] = right->value[i];\n    }\n    p->next = right->next;\n    right->used = false;\n    removed = at + 1;\n  }\n  for (size_t i = removed + 1; i < t->n; ++i)\n    t->child[i - 1] = t->child[i];\n  --t->n;\n  return true;\n}\nvoid range(const BTree *t, int lo, int hi) {\n  const Leaf *p = t->child[route(t, lo)];\n  for (; p; p = p->next)\n    for (size_t i = 0; i < p->n; ++i) {\n      if (p->key[i] >= hi)\n        return;\n      if (p->key[i] >= lo)\n        printf(\"%d \", p->key[i]);\n    }\n  puts(\"\");\n}\n\nint main(void) {\n  BTree t;\n  tree_init(&t);\n  for (int key = 1; key <= 7; ++key)\n    if (!tree_put(&t, key, key * 10))\n      return 1;\n  for (size_t i = 0; i < t.n; ++i)\n    printf(\"leaf%zu min=%d count=%zu\\n\", i, t.child[i]->key[0], t.child[i]->n);\n  return 0;\n}\n",
        "expected": "leaf0 min=1 count=2\nleaf1 min=3 count=2\nleaf2 min=5 count=3",
        "walkthrough": "The leaf minima one, three, and five act as root boundaries. Equality with five routes to the third leaf.",
        "pitfall": "Mixing left-inclusive and right-inclusive separator rules can lose keys exactly at boundaries.",
        "question": "Where does a key equal to the next child’s minimum go?",
        "choices": [
          "Always to the preceding child",
          "To that next child"
        ],
        "answer": 1,
        "why": "This model uses the child’s minimum as an inclusive lower boundary.",
        "tryit": "Test keys immediately below, equal to, and immediately above every separator.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "Point lookup follows separators to one leaf, then searches its bounded key area. Ordered traversal follows leaf links.",
        "explanation": "The root routing cost in this small model is a linear scan over at most eight children; leaf search is also bounded. A full tree could binary-search larger routing pages. A successful result copies the value to the caller. Missing keys return false without exposing an invalid row pointer.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { LEAF_MAX = 4, LEAF_POOL = 8 };\ntypedef struct Leaf {\n  int key[LEAF_MAX], value[LEAF_MAX];\n  size_t n;\n  bool used;\n  struct Leaf *next;\n} Leaf;\ntypedef struct {\n  Leaf pages[LEAF_POOL];\n  Leaf *child[LEAF_POOL];\n  size_t n;\n} BTree;\nvoid tree_init(BTree *t) {\n  memset(t, 0, sizeof *t);\n  t->n = 1;\n  t->pages[0].used = true;\n  t->child[0] = &t->pages[0];\n}\nsize_t route(const BTree *t, int key) {\n  size_t i = 0;\n  while (i + 1 < t->n && t->child[i + 1]->key[0] <= key)\n    ++i;\n  return i;\n}\nbool tree_find(const BTree *t, int key, int *out) {\n  const Leaf *p = t->child[route(t, key)];\n  for (size_t i = 0; i < p->n; ++i)\n    if (p->key[i] == key) {\n      *out = p->value[i];\n      return true;\n    }\n  return false;\n}\nbool tree_put(BTree *t, int key, int value) {\n  size_t at = route(t, key);\n  Leaf *p = t->child[at];\n  int old;\n  if (tree_find(t, key, &old))\n    return false;\n  if (p->n < LEAF_MAX) {\n    size_t i = p->n++;\n    while (i && p->key[i - 1] > key) {\n      p->key[i] = p->key[i - 1];\n      p->value[i] = p->value[i - 1];\n      --i;\n    }\n    p->key[i] = key;\n    p->value[i] = value;\n    return true;\n  }\n  if (t->n == LEAF_POOL)\n    return false;\n  Leaf *right = NULL;\n  for (size_t i = 0; i < LEAF_POOL; ++i)\n    if (!t->pages[i].used) {\n      right = &t->pages[i];\n      break;\n    }\n  if (!right)\n    return false;\n  int keys[5], values[5];\n  size_t j = 0;\n  bool added = false;\n  for (size_t i = 0; i < 5; ++i) {\n    if (!added && (j == p->n || key < p->key[j])) {\n      keys[i] = key;\n      values[i] = value;\n      added = true;\n    } else {\n      keys[i] = p->key[j];\n      values[i] = p->value[j++];\n    }\n  }\n  *right = (Leaf){0};\n  right->used = true;\n  p->n = 2;\n  right->n = 3;\n  for (size_t i = 0; i < 2; ++i) {\n    p->key[i] = keys[i];\n    p->value[i] = values[i];\n  }\n  for (size_t i = 0; i < 3; ++i) {\n    right->key[i] = keys[i + 2];\n    right->value[i] = values[i + 2];\n  }\n  right->next = p->next;\n  p->next = right;\n  for (size_t i = t->n; i > at + 1; --i)\n    t->child[i] = t->child[i - 1];\n  t->child[at + 1] = right;\n  ++t->n;\n  return true;\n}\nbool tree_erase(BTree *t, int key) {\n  size_t at = route(t, key);\n  Leaf *p = t->child[at];\n  size_t pos = 0;\n  while (pos < p->n && p->key[pos] != key)\n    ++pos;\n  if (pos == p->n)\n    return false;\n  for (size_t i = pos + 1; i < p->n; ++i) {\n    p->key[i - 1] = p->key[i];\n    p->value[i - 1] = p->value[i];\n  }\n  --p->n;\n  if (t->n == 1 || p->n >= 2)\n    return true;\n  Leaf *left = at ? t->child[at - 1] : NULL,\n       *right = at + 1 < t->n ? t->child[at + 1] : NULL;\n  if (left && left->n > 2) {\n    for (size_t i = p->n; i > 0; --i) {\n      p->key[i] = p->key[i - 1];\n      p->value[i] = p->value[i - 1];\n    }\n    --left->n;\n    p->key[0] = left->key[left->n];\n    p->value[0] = left->value[left->n];\n    ++p->n;\n    return true;\n  }\n  if (right && right->n > 2) {\n    p->key[p->n] = right->key[0];\n    p->value[p->n++] = right->value[0];\n    for (size_t i = 1; i < right->n; ++i) {\n      right->key[i - 1] = right->key[i];\n      right->value[i - 1] = right->value[i];\n    }\n    --right->n;\n    return true;\n  }\n  size_t removed;\n  if (left) {\n    for (size_t i = 0; i < p->n; ++i) {\n      left->key[left->n] = p->key[i];\n      left->value[left->n++] = p->value[i];\n    }\n    left->next = p->next;\n    p->used = false;\n    removed = at;\n  } else {\n    for (size_t i = 0; i < right->n; ++i) {\n      p->key[p->n] = right->key[i];\n      p->value[p->n++] = right->value[i];\n    }\n    p->next = right->next;\n    right->used = false;\n    removed = at + 1;\n  }\n  for (size_t i = removed + 1; i < t->n; ++i)\n    t->child[i - 1] = t->child[i];\n  --t->n;\n  return true;\n}\nvoid range(const BTree *t, int lo, int hi) {\n  const Leaf *p = t->child[route(t, lo)];\n  for (; p; p = p->next)\n    for (size_t i = 0; i < p->n; ++i) {\n      if (p->key[i] >= hi)\n        return;\n      if (p->key[i] >= lo)\n        printf(\"%d \", p->key[i]);\n    }\n  puts(\"\");\n}\n\nint main(void) {\n  BTree t;\n  tree_init(&t);\n  for (int key = 1; key <= 7; ++key)\n    if (!tree_put(&t, key, key * 10))\n      return 1;\n  int value = 0;\n  bool present = tree_find(&t, 6, &value);\n  printf(\"found=%d value=%d missing=%d\\n\", present, value,\n         !tree_find(&t, 99, &value));\n  return 0;\n}\n",
        "expected": "found=1 value=60 missing=1",
        "walkthrough": "Key six is found in the final leaf with value sixty. The missing-key call leaves the output value unchanged under this implementation.",
        "pitfall": "A pointer to a leaf entry may be invalidated by a split, merge, or compaction; copied results simplify the caller’s lifetime contract.",
        "question": "Does a missing lookup return an entry pointer?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "The Boolean result must be checked before treating the output as a match.",
        "tryit": "Cross-check every lookup against a sorted-array reference after each insertion.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "A leaf split redistributes an overflow set into two valid pages and adds a routing child. Perform capacity checks before mutation.",
        "explanation": "This model combines four existing entries with the new key in a five-entry temporary array, then keeps two in the left leaf and three in a fresh leaf. It repairs next links and inserts the right child into the root’s ordered array. Root capacity and free-leaf availability are checked first, so a rejected split does not destroy existing entries.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { LEAF_MAX = 4, LEAF_POOL = 8 };\ntypedef struct Leaf {\n  int key[LEAF_MAX], value[LEAF_MAX];\n  size_t n;\n  bool used;\n  struct Leaf *next;\n} Leaf;\ntypedef struct {\n  Leaf pages[LEAF_POOL];\n  Leaf *child[LEAF_POOL];\n  size_t n;\n} BTree;\nvoid tree_init(BTree *t) {\n  memset(t, 0, sizeof *t);\n  t->n = 1;\n  t->pages[0].used = true;\n  t->child[0] = &t->pages[0];\n}\nsize_t route(const BTree *t, int key) {\n  size_t i = 0;\n  while (i + 1 < t->n && t->child[i + 1]->key[0] <= key)\n    ++i;\n  return i;\n}\nbool tree_find(const BTree *t, int key, int *out) {\n  const Leaf *p = t->child[route(t, key)];\n  for (size_t i = 0; i < p->n; ++i)\n    if (p->key[i] == key) {\n      *out = p->value[i];\n      return true;\n    }\n  return false;\n}\nbool tree_put(BTree *t, int key, int value) {\n  size_t at = route(t, key);\n  Leaf *p = t->child[at];\n  int old;\n  if (tree_find(t, key, &old))\n    return false;\n  if (p->n < LEAF_MAX) {\n    size_t i = p->n++;\n    while (i && p->key[i - 1] > key) {\n      p->key[i] = p->key[i - 1];\n      p->value[i] = p->value[i - 1];\n      --i;\n    }\n    p->key[i] = key;\n    p->value[i] = value;\n    return true;\n  }\n  if (t->n == LEAF_POOL)\n    return false;\n  Leaf *right = NULL;\n  for (size_t i = 0; i < LEAF_POOL; ++i)\n    if (!t->pages[i].used) {\n      right = &t->pages[i];\n      break;\n    }\n  if (!right)\n    return false;\n  int keys[5], values[5];\n  size_t j = 0;\n  bool added = false;\n  for (size_t i = 0; i < 5; ++i) {\n    if (!added && (j == p->n || key < p->key[j])) {\n      keys[i] = key;\n      values[i] = value;\n      added = true;\n    } else {\n      keys[i] = p->key[j];\n      values[i] = p->value[j++];\n    }\n  }\n  *right = (Leaf){0};\n  right->used = true;\n  p->n = 2;\n  right->n = 3;\n  for (size_t i = 0; i < 2; ++i) {\n    p->key[i] = keys[i];\n    p->value[i] = values[i];\n  }\n  for (size_t i = 0; i < 3; ++i) {\n    right->key[i] = keys[i + 2];\n    right->value[i] = values[i + 2];\n  }\n  right->next = p->next;\n  p->next = right;\n  for (size_t i = t->n; i > at + 1; --i)\n    t->child[i] = t->child[i - 1];\n  t->child[at + 1] = right;\n  ++t->n;\n  return true;\n}\nbool tree_erase(BTree *t, int key) {\n  size_t at = route(t, key);\n  Leaf *p = t->child[at];\n  size_t pos = 0;\n  while (pos < p->n && p->key[pos] != key)\n    ++pos;\n  if (pos == p->n)\n    return false;\n  for (size_t i = pos + 1; i < p->n; ++i) {\n    p->key[i - 1] = p->key[i];\n    p->value[i - 1] = p->value[i];\n  }\n  --p->n;\n  if (t->n == 1 || p->n >= 2)\n    return true;\n  Leaf *left = at ? t->child[at - 1] : NULL,\n       *right = at + 1 < t->n ? t->child[at + 1] : NULL;\n  if (left && left->n > 2) {\n    for (size_t i = p->n; i > 0; --i) {\n      p->key[i] = p->key[i - 1];\n      p->value[i] = p->value[i - 1];\n    }\n    --left->n;\n    p->key[0] = left->key[left->n];\n    p->value[0] = left->value[left->n];\n    ++p->n;\n    return true;\n  }\n  if (right && right->n > 2) {\n    p->key[p->n] = right->key[0];\n    p->value[p->n++] = right->value[0];\n    for (size_t i = 1; i < right->n; ++i) {\n      right->key[i - 1] = right->key[i];\n      right->value[i - 1] = right->value[i];\n    }\n    --right->n;\n    return true;\n  }\n  size_t removed;\n  if (left) {\n    for (size_t i = 0; i < p->n; ++i) {\n      left->key[left->n] = p->key[i];\n      left->value[left->n++] = p->value[i];\n    }\n    left->next = p->next;\n    p->used = false;\n    removed = at;\n  } else {\n    for (size_t i = 0; i < right->n; ++i) {\n      p->key[p->n] = right->key[i];\n      p->value[p->n++] = right->value[i];\n    }\n    p->next = right->next;\n    right->used = false;\n    removed = at + 1;\n  }\n  for (size_t i = removed + 1; i < t->n; ++i)\n    t->child[i - 1] = t->child[i];\n  --t->n;\n  return true;\n}\nvoid range(const BTree *t, int lo, int hi) {\n  const Leaf *p = t->child[route(t, lo)];\n  for (; p; p = p->next)\n    for (size_t i = 0; i < p->n; ++i) {\n      if (p->key[i] >= hi)\n        return;\n      if (p->key[i] >= lo)\n        printf(\"%d \", p->key[i]);\n    }\n  puts(\"\");\n}\n\nint main(void) {\n  BTree t;\n  tree_init(&t);\n  for (int key = 1; key <= 5; ++key)\n    if (!tree_put(&t, key, key * 10))\n      return 1;\n  printf(\"leaves=%zu left=%zu right=%zu boundary=%d\\n\", t.n, t.child[0]->n,\n         t.child[1]->n, t.child[1]->key[0]);\n  return 0;\n}\n",
        "expected": "leaves=2 left=2 right=3 boundary=3",
        "walkthrough": "The fifth insertion triggers the first split. The right leaf starts at key three and the left leaf links to it.",
        "pitfall": "A real multi-level implementation must propagate an internal-page overflow upward, including root growth.",
        "question": "What must be checked before splitting this bounded model?",
        "choices": [
          "Only whether the new key is positive",
          "Root-child capacity and a free leaf page"
        ],
        "answer": 1,
        "why": "A split needs both a new leaf and a new routing entry.",
        "tryit": "Generalize root splitting with stable page IDs and test failure preservation at every allocation boundary.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "Range lookup combines one routed start with sequential leaf traversal. Keep inclusive and exclusive endpoints explicit.",
        "explanation": "The example prints keys in [2,7). After routing to the first relevant leaf, it follows next pointers until a key reaches the upper boundary. A balanced full B+ tree gives O(log n+k) logical work for k returned keys, with page costs depending on density and cache state. Linked-leaf order is an invariant worth checking independently of point lookups.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { LEAF_MAX = 4, LEAF_POOL = 8 };\ntypedef struct Leaf {\n  int key[LEAF_MAX], value[LEAF_MAX];\n  size_t n;\n  bool used;\n  struct Leaf *next;\n} Leaf;\ntypedef struct {\n  Leaf pages[LEAF_POOL];\n  Leaf *child[LEAF_POOL];\n  size_t n;\n} BTree;\nvoid tree_init(BTree *t) {\n  memset(t, 0, sizeof *t);\n  t->n = 1;\n  t->pages[0].used = true;\n  t->child[0] = &t->pages[0];\n}\nsize_t route(const BTree *t, int key) {\n  size_t i = 0;\n  while (i + 1 < t->n && t->child[i + 1]->key[0] <= key)\n    ++i;\n  return i;\n}\nbool tree_find(const BTree *t, int key, int *out) {\n  const Leaf *p = t->child[route(t, key)];\n  for (size_t i = 0; i < p->n; ++i)\n    if (p->key[i] == key) {\n      *out = p->value[i];\n      return true;\n    }\n  return false;\n}\nbool tree_put(BTree *t, int key, int value) {\n  size_t at = route(t, key);\n  Leaf *p = t->child[at];\n  int old;\n  if (tree_find(t, key, &old))\n    return false;\n  if (p->n < LEAF_MAX) {\n    size_t i = p->n++;\n    while (i && p->key[i - 1] > key) {\n      p->key[i] = p->key[i - 1];\n      p->value[i] = p->value[i - 1];\n      --i;\n    }\n    p->key[i] = key;\n    p->value[i] = value;\n    return true;\n  }\n  if (t->n == LEAF_POOL)\n    return false;\n  Leaf *right = NULL;\n  for (size_t i = 0; i < LEAF_POOL; ++i)\n    if (!t->pages[i].used) {\n      right = &t->pages[i];\n      break;\n    }\n  if (!right)\n    return false;\n  int keys[5], values[5];\n  size_t j = 0;\n  bool added = false;\n  for (size_t i = 0; i < 5; ++i) {\n    if (!added && (j == p->n || key < p->key[j])) {\n      keys[i] = key;\n      values[i] = value;\n      added = true;\n    } else {\n      keys[i] = p->key[j];\n      values[i] = p->value[j++];\n    }\n  }\n  *right = (Leaf){0};\n  right->used = true;\n  p->n = 2;\n  right->n = 3;\n  for (size_t i = 0; i < 2; ++i) {\n    p->key[i] = keys[i];\n    p->value[i] = values[i];\n  }\n  for (size_t i = 0; i < 3; ++i) {\n    right->key[i] = keys[i + 2];\n    right->value[i] = values[i + 2];\n  }\n  right->next = p->next;\n  p->next = right;\n  for (size_t i = t->n; i > at + 1; --i)\n    t->child[i] = t->child[i - 1];\n  t->child[at + 1] = right;\n  ++t->n;\n  return true;\n}\nbool tree_erase(BTree *t, int key) {\n  size_t at = route(t, key);\n  Leaf *p = t->child[at];\n  size_t pos = 0;\n  while (pos < p->n && p->key[pos] != key)\n    ++pos;\n  if (pos == p->n)\n    return false;\n  for (size_t i = pos + 1; i < p->n; ++i) {\n    p->key[i - 1] = p->key[i];\n    p->value[i - 1] = p->value[i];\n  }\n  --p->n;\n  if (t->n == 1 || p->n >= 2)\n    return true;\n  Leaf *left = at ? t->child[at - 1] : NULL,\n       *right = at + 1 < t->n ? t->child[at + 1] : NULL;\n  if (left && left->n > 2) {\n    for (size_t i = p->n; i > 0; --i) {\n      p->key[i] = p->key[i - 1];\n      p->value[i] = p->value[i - 1];\n    }\n    --left->n;\n    p->key[0] = left->key[left->n];\n    p->value[0] = left->value[left->n];\n    ++p->n;\n    return true;\n  }\n  if (right && right->n > 2) {\n    p->key[p->n] = right->key[0];\n    p->value[p->n++] = right->value[0];\n    for (size_t i = 1; i < right->n; ++i) {\n      right->key[i - 1] = right->key[i];\n      right->value[i - 1] = right->value[i];\n    }\n    --right->n;\n    return true;\n  }\n  size_t removed;\n  if (left) {\n    for (size_t i = 0; i < p->n; ++i) {\n      left->key[left->n] = p->key[i];\n      left->value[left->n++] = p->value[i];\n    }\n    left->next = p->next;\n    p->used = false;\n    removed = at;\n  } else {\n    for (size_t i = 0; i < right->n; ++i) {\n      p->key[p->n] = right->key[i];\n      p->value[p->n++] = right->value[i];\n    }\n    p->next = right->next;\n    right->used = false;\n    removed = at + 1;\n  }\n  for (size_t i = removed + 1; i < t->n; ++i)\n    t->child[i - 1] = t->child[i];\n  --t->n;\n  return true;\n}\nvoid range(const BTree *t, int lo, int hi) {\n  const Leaf *p = t->child[route(t, lo)];\n  for (; p; p = p->next)\n    for (size_t i = 0; i < p->n; ++i) {\n      if (p->key[i] >= hi)\n        return;\n      if (p->key[i] >= lo)\n        printf(\"%d \", p->key[i]);\n    }\n  puts(\"\");\n}\n\nint main(void) {\n  BTree t;\n  tree_init(&t);\n  for (int key = 1; key <= 7; ++key)\n    if (!tree_put(&t, key, key * 10))\n      return 1;\n  range(&t, 2, 8);\n  return 0;\n}\n",
        "expected": "2 3 4 5 6 7",
        "walkthrough": "The executed fixture uses [2,8), returning six keys across all three leaves. The general contract excludes the upper bound.",
        "pitfall": "A range ending exactly at a separator must not duplicate or skip boundary keys.",
        "question": "Is the upper endpoint included?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "The API uses a half-open [lo,hi) range.",
        "tryit": "Test empty ranges, missing boundary keys, and a range spanning every split; make the endpoint in code match your prediction.",
        "input": "",
        "runtime": "browser"
      },
      "6": {
        "intro": "After deletion, a nonroot leaf below minimum occupancy must borrow from a sibling or merge. Routing and next links must remain valid.",
        "explanation": "The implementation first tries a sibling with more than two entries, transferring one entry and preserving order. Otherwise it merges adjacent leaves, releases a pool slot, shifts root children, and repairs the forward link. The sole root leaf may be empty. This two-level model has no internal underflow beyond shrinking its root child array.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { LEAF_MAX = 4, LEAF_POOL = 8 };\ntypedef struct Leaf {\n  int key[LEAF_MAX], value[LEAF_MAX];\n  size_t n;\n  bool used;\n  struct Leaf *next;\n} Leaf;\ntypedef struct {\n  Leaf pages[LEAF_POOL];\n  Leaf *child[LEAF_POOL];\n  size_t n;\n} BTree;\nvoid tree_init(BTree *t) {\n  memset(t, 0, sizeof *t);\n  t->n = 1;\n  t->pages[0].used = true;\n  t->child[0] = &t->pages[0];\n}\nsize_t route(const BTree *t, int key) {\n  size_t i = 0;\n  while (i + 1 < t->n && t->child[i + 1]->key[0] <= key)\n    ++i;\n  return i;\n}\nbool tree_find(const BTree *t, int key, int *out) {\n  const Leaf *p = t->child[route(t, key)];\n  for (size_t i = 0; i < p->n; ++i)\n    if (p->key[i] == key) {\n      *out = p->value[i];\n      return true;\n    }\n  return false;\n}\nbool tree_put(BTree *t, int key, int value) {\n  size_t at = route(t, key);\n  Leaf *p = t->child[at];\n  int old;\n  if (tree_find(t, key, &old))\n    return false;\n  if (p->n < LEAF_MAX) {\n    size_t i = p->n++;\n    while (i && p->key[i - 1] > key) {\n      p->key[i] = p->key[i - 1];\n      p->value[i] = p->value[i - 1];\n      --i;\n    }\n    p->key[i] = key;\n    p->value[i] = value;\n    return true;\n  }\n  if (t->n == LEAF_POOL)\n    return false;\n  Leaf *right = NULL;\n  for (size_t i = 0; i < LEAF_POOL; ++i)\n    if (!t->pages[i].used) {\n      right = &t->pages[i];\n      break;\n    }\n  if (!right)\n    return false;\n  int keys[5], values[5];\n  size_t j = 0;\n  bool added = false;\n  for (size_t i = 0; i < 5; ++i) {\n    if (!added && (j == p->n || key < p->key[j])) {\n      keys[i] = key;\n      values[i] = value;\n      added = true;\n    } else {\n      keys[i] = p->key[j];\n      values[i] = p->value[j++];\n    }\n  }\n  *right = (Leaf){0};\n  right->used = true;\n  p->n = 2;\n  right->n = 3;\n  for (size_t i = 0; i < 2; ++i) {\n    p->key[i] = keys[i];\n    p->value[i] = values[i];\n  }\n  for (size_t i = 0; i < 3; ++i) {\n    right->key[i] = keys[i + 2];\n    right->value[i] = values[i + 2];\n  }\n  right->next = p->next;\n  p->next = right;\n  for (size_t i = t->n; i > at + 1; --i)\n    t->child[i] = t->child[i - 1];\n  t->child[at + 1] = right;\n  ++t->n;\n  return true;\n}\nbool tree_erase(BTree *t, int key) {\n  size_t at = route(t, key);\n  Leaf *p = t->child[at];\n  size_t pos = 0;\n  while (pos < p->n && p->key[pos] != key)\n    ++pos;\n  if (pos == p->n)\n    return false;\n  for (size_t i = pos + 1; i < p->n; ++i) {\n    p->key[i - 1] = p->key[i];\n    p->value[i - 1] = p->value[i];\n  }\n  --p->n;\n  if (t->n == 1 || p->n >= 2)\n    return true;\n  Leaf *left = at ? t->child[at - 1] : NULL,\n       *right = at + 1 < t->n ? t->child[at + 1] : NULL;\n  if (left && left->n > 2) {\n    for (size_t i = p->n; i > 0; --i) {\n      p->key[i] = p->key[i - 1];\n      p->value[i] = p->value[i - 1];\n    }\n    --left->n;\n    p->key[0] = left->key[left->n];\n    p->value[0] = left->value[left->n];\n    ++p->n;\n    return true;\n  }\n  if (right && right->n > 2) {\n    p->key[p->n] = right->key[0];\n    p->value[p->n++] = right->value[0];\n    for (size_t i = 1; i < right->n; ++i) {\n      right->key[i - 1] = right->key[i];\n      right->value[i - 1] = right->value[i];\n    }\n    --right->n;\n    return true;\n  }\n  size_t removed;\n  if (left) {\n    for (size_t i = 0; i < p->n; ++i) {\n      left->key[left->n] = p->key[i];\n      left->value[left->n++] = p->value[i];\n    }\n    left->next = p->next;\n    p->used = false;\n    removed = at;\n  } else {\n    for (size_t i = 0; i < right->n; ++i) {\n      p->key[p->n] = right->key[i];\n      p->value[p->n++] = right->value[i];\n    }\n    p->next = right->next;\n    right->used = false;\n    removed = at + 1;\n  }\n  for (size_t i = removed + 1; i < t->n; ++i)\n    t->child[i - 1] = t->child[i];\n  --t->n;\n  return true;\n}\nvoid range(const BTree *t, int lo, int hi) {\n  const Leaf *p = t->child[route(t, lo)];\n  for (; p; p = p->next)\n    for (size_t i = 0; i < p->n; ++i) {\n      if (p->key[i] >= hi)\n        return;\n      if (p->key[i] >= lo)\n        printf(\"%d \", p->key[i]);\n    }\n  puts(\"\");\n}\n\nint main(void) {\n  BTree t;\n  tree_init(&t);\n  for (int key = 1; key <= 5; ++key)\n    tree_put(&t, key, key * 10);\n  tree_erase(&t, 1);\n  tree_erase(&t, 2);\n  printf(\"leaves=%zu remaining=\", t.n);\n  range(&t, 0, 99);\n  return 0;\n}\n",
        "expected": "leaves=1 remaining=3 4 5",
        "walkthrough": "The first removal borrows from the right sibling; the second forces a merge into one leaf. Ordered keys and leaf-chain traversal still agree.",
        "pitfall": "Deleting a key without repairing separators or sibling links can leave point queries passing while ranges fail.",
        "question": "When may this model keep an empty leaf?",
        "choices": [
          "For every nonroot leaf after deletion",
          "When it is the sole root leaf"
        ],
        "answer": 1,
        "why": "The root has a special occupancy exception.",
        "tryit": "Generate insert/delete sequences and check ordering, uniqueness, occupancy, reachability, and pool ownership after each step.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practicePlan": {
      "goal": "Implement an ordered index that remains valid when pages split.",
      "tasks": [
        "Build and test a bounded B+ index before encoding its pages. Preserve routing, occupancy, and leaf-link invariants.",
        "Generate insert/delete sequences and check ordering, uniqueness, occupancy, reachability, and pool ownership after each step.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "bplus-trees-6"
    }
  },
  "planning": {
    "intro": "Choose a correct access path first, then compare plans with an explicit cost model and measured logical work.",
    "outcomes": [
      "Distinguish estimates from actual row and page counters.",
      "Use selectivity and ordering requirements in plan choice.",
      "Expose an understandable EXPLAIN result."
    ],
    "topics": {
      "1": {
        "intro": "A scan reads the table’s pages; an index lookup navigates the index and then obtains matching rows. Neither access path is always cheaper.",
        "explanation": "The teaching estimate charges one unit per page, assumes a cold cache and one distinct data-page fetch per match, and adds three index levels. These assumptions intentionally simplify clustering and caching. Both paths must return identical logical rows under the same visibility rules; cost never permits an incorrect result.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  unsigned table_pages, index_levels, matches;\n} Estimate;\nunsigned index_cost(Estimate e) { return e.index_levels + e.matches; }\nconst char *choose(Estimate e) {\n  return index_cost(e) < e.table_pages ? \"index\" : \"scan\";\n}\n\nint main(void) {\n  Estimate narrow = {100, 3, 1}, wide = {100, 3, 98};\n  printf(\"narrow=%s cost=%u wide=%s cost=%u\\n\", choose(narrow),\n         index_cost(narrow), choose(wide), index_cost(wide));\n  return 0;\n}\n",
        "expected": "narrow=index cost=4 wide=scan cost=101",
        "walkthrough": "One match costs four estimated page reads through the index. Ninety-eight random matches cost 101, exceeding the hundred-page scan.",
        "pitfall": "Treating index lookup as free after O(log n) navigation ignores row fetches.",
        "question": "Can an index be slower than a scan?",
        "choices": [
          "Yes, especially for many scattered matches",
          "No, indexes always win"
        ],
        "answer": 0,
        "why": "Lookup and row-fetch costs can exceed a sequential scan.",
        "tryit": "Change cache and clustering assumptions and describe when the preferred plan changes.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "Selectivity is the fraction of input rows expected to satisfy a predicate. Estimates need statistics and a workload model.",
        "explanation": "For 1,000 rows and ten expected matches, selectivity is one percent. Real data may be skewed or correlated, so a uniform estimate can be wrong. A planner should retain estimated counts and compare them with actual execution counters; statistics refresh and histograms improve estimates without changing query semantics.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  unsigned rows = 1000, matches = 10;\n  printf(\"selectivity=%.2f expected_rows=%u\\n\", (double)matches / rows,\n         matches);\n  return 0;\n}\n",
        "expected": "selectivity=0.01 expected_rows=10",
        "walkthrough": "The fraction is 0.01, not ten percent. This fixture provides the expected match count rather than deriving it from collected statistics.",
        "pitfall": "Multiplying selectivities as if predicates were independent can badly underestimate correlated conditions.",
        "question": "What does selectivity describe?",
        "choices": [
          "The number of CPU cores",
          "The fraction of rows passing a predicate"
        ],
        "answer": 1,
        "why": "It is a cardinality estimate relative to the input size.",
        "tryit": "Build a skewed score distribution and compare uniform estimates with observed matches.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "An ordered index may satisfy filtering and ORDER BY together. Correctness still depends on matching the index’s key order and checking residual predicates.",
        "explanation": "The sorted key fixture uses a lower-bound search to start at the first key at least four, then emits ascending keys until the range’s exclusive upper bound. A limit permits stopping after enough qualifying results. A different sort direction, collation, or composite-key prefix may require a different path.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  int keys[] = {1, 2, 4, 6, 8, 10};\n  size_t lo = 0, hi = 6;\n  while (lo < hi) {\n    size_t mid = lo + (hi - lo) / 2;\n    if (keys[mid] < 4)\n      lo = mid + 1;\n    else\n      hi = mid;\n  }\n  size_t emitted = 0;\n  for (size_t i = lo; i < 6 && keys[i] < 9 && emitted < 2; ++i, ++emitted)\n    printf(\"%d \", keys[i]);\n  puts(\"\");\n  return 0;\n}\n",
        "expected": "4 6",
        "walkthrough": "The lower bound starts at four and the limit stops after six, before scanning the remaining range.",
        "pitfall": "An index ordered by ID cannot automatically satisfy ORDER BY name.",
        "question": "When may an ordered scan stop for a limit?",
        "choices": [
          "After enough qualifying rows are emitted in the requested order",
          "After merely examining that many candidates"
        ],
        "answer": 0,
        "why": "Residual predicates can reject candidates before they count toward the limit.",
        "tryit": "Add a residual predicate that rejects the first candidate and verify the limit still returns two qualifying rows.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "EXPLAIN makes a planner’s assumptions and chosen operators visible. It should distinguish estimated work from actual execution statistics.",
        "explanation": "The fixture prints a chosen access path, estimated matches, and its simplified page cost. It does not run a query. An EXPLAIN ANALYZE-like mode would execute and attach measured counters; that distinction matters for statements with side effects. Keep plan output stable enough for tests while avoiding promises about exact real-world runtime.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  unsigned table_pages, index_levels, matches;\n} Estimate;\nunsigned index_cost(Estimate e) { return e.index_levels + e.matches; }\nconst char *choose(Estimate e) {\n  return index_cost(e) < e.table_pages ? \"index\" : \"scan\";\n}\n\nint main(void) {\n  Estimate e = {100, 3, 2};\n  printf(\"PLAN %s estimated_matches=%u estimated_pages=%u\\n\", choose(e),\n         e.matches,\n         strcmp(choose(e), \"index\") == 0 ? index_cost(e) : e.table_pages);\n  return 0;\n}\n",
        "expected": "PLAN index estimated_matches=2 estimated_pages=5",
        "walkthrough": "The text exposes the two-match assumption and five-page cost calculation. No timing is inferred.",
        "pitfall": "A plan label without its important assumptions makes unexpected choices difficult to diagnose.",
        "question": "Does this EXPLAIN fixture execute the query?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "It reports the selected model; actual execution needs a separate explicit path.",
        "tryit": "Represent plans with an enum and structured fields before rendering text, then snapshot-test the renderer.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "Measured counters should describe actual work at clearly defined boundaries. Separate cache hits, backing reads, comparisons, and emitted rows.",
        "explanation": "The small scan counts every candidate comparison and each match separately. A page-aware executor can increment a backing-read counter only when the pager performs I/O, rather than on every fetch call. Use these deterministic counters to compare plans before adding noisy wall-clock timing.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  int ids[] = {1, 2, 3, 4, 5, 6, 7, 8};\n  unsigned comparisons = 0, emitted = 0;\n  for (size_t i = 0; i < 8; ++i) {\n    ++comparisons;\n    if (ids[i] >= 7)\n      ++emitted;\n  }\n  printf(\"comparisons=%u emitted=%u\\n\", comparisons, emitted);\n  return 0;\n}\n",
        "expected": "comparisons=8 emitted=2",
        "walkthrough": "The scan compares eight rows to emit two. An index can reduce comparisons while still incurring extra page navigation.",
        "pitfall": "Counting every cache fetch as a disk read obscures cache effectiveness.",
        "question": "Should emitted rows and inspected rows share one counter?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "They measure different work and may differ greatly under selective filters.",
        "tryit": "Attach counters to scan and index baselines and assert equal results before comparing work.",
        "input": "",
        "runtime": "browser"
      },
      "6": {
        "intro": "A nested-loop join pairs each outer row with candidate inner rows and emits pairs that satisfy the join predicate.",
        "explanation": "The fixture joins two people with three orders by person ID, producing one row per matching order. A plain nested loop examines O(NM) candidate pairs. An index on the inner join key can reduce search work, while duplicate matches still need to be emitted. Define whether unmatched rows are dropped or retained; this example is an inner join.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  struct Person {\n    int id;\n    const char *name;\n  } people[] = {{1, \"Ada\"}, {2, \"Grace\"}};\n  struct Order {\n    int person, total;\n  } orders[] = {{2, 50}, {1, 20}, {1, 30}};\n  unsigned pairs = 0;\n  for (size_t i = 0; i < 2; ++i)\n    for (size_t j = 0; j < 3; ++j) {\n      ++pairs;\n      if (people[i].id == orders[j].person)\n        printf(\"%s %d\\n\", people[i].name, orders[j].total);\n    }\n  printf(\"pairs=%u\\n\", pairs);\n  return 0;\n}\n",
        "expected": "Ada 20\nAda 30\nGrace 50\npairs=6",
        "walkthrough": "Ada matches two orders and Grace matches one. Six comparisons are performed regardless of the three output pairs.",
        "pitfall": "Returning only the first matching inner row changes a join into a lookup and loses duplicate matches.",
        "question": "How many candidate pairs does this baseline examine?",
        "choices": [
          "Always N plus M",
          "N times M"
        ],
        "answer": 1,
        "why": "Every outer row scans all inner rows.",
        "tryit": "Add an inner-key index and verify the same multiset of join rows, including duplicate keys.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practicePlan": {
      "goal": "Compare query plans using page reads and a simple cost model.",
      "tasks": [
        "Choose a correct access path first, then compare plans with an explicit cost model and measured logical work.",
        "Add an inner-key index and verify the same multiset of join rows, including duplicate keys.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "planning-6"
    }
  },
  "recovery": {
    "intro": "Separate transaction visibility from durable acknowledgement. Model interrupted log prefixes and preserve committed state.",
    "outcomes": [
      "Apply transaction changes atomically to a single-writer in-memory state.",
      "Explain write-ahead ordering and durable commit records.",
      "Replay committed records while ignoring an incomplete tail."
    ],
    "topics": {
      "1": {
        "intro": "Atomicity, consistency, isolation, and durability describe different obligations. Name which ones an implementation actually provides.",
        "explanation": "The copy-on-begin transaction model keeps uncommitted changes in a private working table, providing an all-or-nothing publication step for this single-threaded fixture. Table operations enforce schema consistency. It provides neither concurrent isolation nor crash durability by itself; those need synchronization and a persistence protocol. A process-local struct assignment is not a durable commit.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\ntypedef struct {\n  Table working;\n  Table *live;\n  bool active;\n} Transaction;\nbool begin(Transaction *tx, Table *live) {\n  if (tx->active)\n    return false;\n  tx->working = *live;\n  tx->live = live;\n  tx->active = true;\n  return true;\n}\nbool commit(Transaction *tx) {\n  if (!tx->active)\n    return false;\n  *tx->live = tx->working;\n  tx->active = false;\n  return true;\n}\nvoid rollback(Transaction *tx) {\n  tx->active = false;\n  tx->live = NULL;\n}\n\nint main(void) {\n  Table live = {0};\n  insert_row(&live, (Row){1, \"Ada\", 90});\n  Transaction tx = {0};\n  begin(&tx, &live);\n  update_score(&tx.working, 1, 1);\n  rollback(&tx);\n  printf(\"after_rollback=%u\\n\", (unsigned)live.rows[0].score);\n  return 0;\n}\n",
        "expected": "after_rollback=90",
        "walkthrough": "The tentative score one was never copied into live state. Rollback discards the transaction’s publication ability.",
        "pitfall": "Passing a rollback test does not establish the other ACID properties.",
        "question": "Does this memory-only rollback guarantee durability?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "Process memory can disappear without a persistent recovery protocol.",
        "tryit": "Write a guarantee table for each ACID property and identify the mechanism or missing work for each.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "A single-writer transaction model serializes mutations and simplifies conflict handling. The restriction must be enforced by the caller or service.",
        "explanation": "begin refuses to start another transaction using the same active handle, but the model has no global lock. A real multi-client service must route all writers through one owner or protect admission with synchronization. Readers also need a contract about whether they see committed state or a working copy.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\ntypedef struct {\n  Table working;\n  Table *live;\n  bool active;\n} Transaction;\nbool begin(Transaction *tx, Table *live) {\n  if (tx->active)\n    return false;\n  tx->working = *live;\n  tx->live = live;\n  tx->active = true;\n  return true;\n}\nbool commit(Transaction *tx) {\n  if (!tx->active)\n    return false;\n  *tx->live = tx->working;\n  tx->active = false;\n  return true;\n}\nvoid rollback(Transaction *tx) {\n  tx->active = false;\n  tx->live = NULL;\n}\n\nint main(void) {\n  Table live = {0};\n  Transaction tx = {0};\n  bool first = begin(&tx, &live), nested = begin(&tx, &live);\n  printf(\"first=%d nested=%d live_rows=%zu\\n\", first, nested, live.count);\n  rollback(&tx);\n  return 0;\n}\n",
        "expected": "first=1 nested=0 live_rows=0",
        "walkthrough": "The active flag protects one handle’s lifecycle. It does not prevent a second unrelated handle from writing the same live table.",
        "pitfall": "A comment saying single writer does not synchronize multiple clients.",
        "question": "What must the surrounding service enforce?",
        "choices": [
          "Only a per-thread local variable name",
          "Exclusive mutation ownership"
        ],
        "answer": 1,
        "why": "The same live state must not be concurrently mutated through independent handles.",
        "tryit": "Add an admission lock or a request queue and test two competing transaction starts.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "BEGIN establishes a working state, COMMIT publishes it under the model’s contract, and ROLLBACK discards it. Repeated or out-of-order commands need defined failures.",
        "explanation": "The fixture commits one score update and then rolls back another. In this bounded single-threaded model, readers of live state see only the committed value. A production commit must also handle log failures and durable acknowledgement; copying the table here teaches state transition semantics only.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\ntypedef struct {\n  Table working;\n  Table *live;\n  bool active;\n} Transaction;\nbool begin(Transaction *tx, Table *live) {\n  if (tx->active)\n    return false;\n  tx->working = *live;\n  tx->live = live;\n  tx->active = true;\n  return true;\n}\nbool commit(Transaction *tx) {\n  if (!tx->active)\n    return false;\n  *tx->live = tx->working;\n  tx->active = false;\n  return true;\n}\nvoid rollback(Transaction *tx) {\n  tx->active = false;\n  tx->live = NULL;\n}\n\nint main(void) {\n  Table live = {0};\n  insert_row(&live, (Row){1, \"Ada\", 90});\n  Transaction tx = {0};\n  begin(&tx, &live);\n  update_score(&tx.working, 1, 95);\n  commit(&tx);\n  begin(&tx, &live);\n  update_score(&tx.working, 1, 0);\n  rollback(&tx);\n  printf(\"committed_score=%u invalid_commit=%d\\n\", (unsigned)live.rows[0].score,\n         !commit(&tx));\n  return 0;\n}\n",
        "expected": "committed_score=95 invalid_commit=1",
        "walkthrough": "The committed 95 survives the later rollback. Committing an inactive transaction fails.",
        "pitfall": "A failed durable commit must not be reported as successful merely because the working copy is valid.",
        "question": "Which score is visible after the rollback?",
        "choices": [
          "The earlier committed 95",
          "The later tentative zero"
        ],
        "answer": 0,
        "why": "Rollback never publishes its private working table.",
        "tryit": "Define session ownership and behavior for COMMIT without BEGIN, nested BEGIN, and disconnect during a transaction.",
        "input": "",
        "runtime": "native"
      },
      "4": {
        "intro": "Write-ahead logging records enough information for recovery before acknowledging a durable commit or persisting dependent data pages.",
        "explanation": "The one-value redo log uses fixed eight-byte BEGIN, SET, and COMMIT records with transaction IDs. This native fixture flushes stdio and calls POSIX fsync on the log before treating the commit as durable. A real database also needs stable log naming, error handling, checksums, page/log ordering, and platform-specific file and directory guarantees. The example demonstrates the ordering, not a complete storage engine.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <unistd.h>\n\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nenum { BEGIN_REC = 1, SET_REC = 2, COMMIT_REC = 3, LOG_BYTES = 8 };\nvoid log_record(unsigned char *out, unsigned kind, unsigned tx,\n                uint32_t value) {\n  memset(out, 0, LOG_BYTES);\n  out[0] = (unsigned char)kind;\n  out[1] = (unsigned char)tx;\n  put32(out + 4, value);\n}\nuint32_t recover(const unsigned char *log, size_t length, uint32_t base) {\n  unsigned active = 0;\n  uint32_t pending = base;\n  for (size_t at = 0; at <= length && length - at >= LOG_BYTES;\n       at += LOG_BYTES) {\n    const unsigned char *r = log + at;\n    if (!r[1] || r[2] || r[3])\n      break;\n    if (r[0] == BEGIN_REC) {\n      if (active)\n        break;\n      active = r[1];\n      pending = base;\n    } else if (r[0] == SET_REC) {\n      if (active != r[1])\n        break;\n      pending = get32(r + 4);\n    } else if (r[0] == COMMIT_REC) {\n      if (active != r[1])\n        break;\n      base = pending;\n      active = 0;\n    } else\n      break;\n  }\n  return base;\n}\n\nint main(void) {\n  FILE *f = tmpfile();\n  if (!f)\n    return 1;\n  unsigned char bytes[24];\n  log_record(bytes, BEGIN_REC, 1, 0);\n  log_record(bytes + 8, SET_REC, 1, 42);\n  log_record(bytes + 16, COMMIT_REC, 1, 0);\n  bool ok = fwrite(bytes, 1, sizeof bytes, f) == sizeof bytes &&\n            fflush(f) == 0 && fsync(fileno(f)) == 0;\n  if (!ok) {\n    fclose(f);\n    return 1;\n  }\n  printf(\"durable_log_order_checked value=%u\\n\",\n         (unsigned)recover(bytes, sizeof bytes, 0));\n  if (fclose(f) != 0)\n    return 1;\n  return 0;\n}\n",
        "expected": "durable_log_order_checked value=42",
        "walkthrough": "Recovery can reconstruct 42 from the committed log. The success line follows the checked synchronization call. The temporary file is intentionally not a permanent database path.",
        "pitfall": "fflush alone moves bytes to the operating-system interface; it is not equivalent to a platform durable-sync operation.",
        "question": "When may a durable commit be acknowledged under this protocol?",
        "choices": [
          "Immediately after writing a private memory copy",
          "After its required log synchronization succeeds"
        ],
        "answer": 1,
        "why": "Recovery must be able to find a durable commit record before success is promised.",
        "tryit": "Use a named log under KEEP_FILES=1, inject sync failures, and add a checked data-page write only after the write-ahead condition holds.",
        "input": "",
        "runtime": "native"
      },
      "5": {
        "intro": "Recovery should apply committed transactions and ignore an incomplete final transaction. Test every interruption boundary rather than only whole-record cuts.",
        "explanation": "The bounded redo model scans complete eight-byte records, retains tentative state until a matching COMMIT, and stops at invalid structure. A short tail is ignored. SET stores the final value rather than an increment, making replay idempotent for the same log and base. This format has no checksum, so it cannot reliably detect every bit flip that still forms a valid record.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nenum { BEGIN_REC = 1, SET_REC = 2, COMMIT_REC = 3, LOG_BYTES = 8 };\nvoid log_record(unsigned char *out, unsigned kind, unsigned tx,\n                uint32_t value) {\n  memset(out, 0, LOG_BYTES);\n  out[0] = (unsigned char)kind;\n  out[1] = (unsigned char)tx;\n  put32(out + 4, value);\n}\nuint32_t recover(const unsigned char *log, size_t length, uint32_t base) {\n  unsigned active = 0;\n  uint32_t pending = base;\n  for (size_t at = 0; at <= length && length - at >= LOG_BYTES;\n       at += LOG_BYTES) {\n    const unsigned char *r = log + at;\n    if (!r[1] || r[2] || r[3])\n      break;\n    if (r[0] == BEGIN_REC) {\n      if (active)\n        break;\n      active = r[1];\n      pending = base;\n    } else if (r[0] == SET_REC) {\n      if (active != r[1])\n        break;\n      pending = get32(r + 4);\n    } else if (r[0] == COMMIT_REC) {\n      if (active != r[1])\n        break;\n      base = pending;\n      active = 0;\n    } else\n      break;\n  }\n  return base;\n}\n\nint main(void) {\n  unsigned char log[40];\n  log_record(log, BEGIN_REC, 1, 0);\n  log_record(log + 8, SET_REC, 1, 10);\n  log_record(log + 16, COMMIT_REC, 1, 0);\n  log_record(log + 24, BEGIN_REC, 2, 0);\n  log_record(log + 32, SET_REC, 2, 99);\n  printf(\"committed=%u torn=%u\\n\", (unsigned)recover(log, sizeof log, 0),\n         (unsigned)recover(log, 19, 0));\n  return 0;\n}\n",
        "expected": "committed=10 torn=0",
        "walkthrough": "The complete first transaction publishes ten. The later uncommitted 99 is ignored. Cutting the first COMMIT record at byte nineteen leaves no committed change.",
        "pitfall": "Ignoring a torn tail is not a general policy for silently skipping corruption in the middle of a log.",
        "question": "Is a SET record enough to publish a transaction?",
        "choices": [
          "No, a valid matching COMMIT is required",
          "Yes"
        ],
        "answer": 0,
        "why": "Tentative state remains separate until the commit boundary.",
        "tryit": "Replay every prefix of this log and verify values against an independently listed set of committed boundaries.",
        "input": "",
        "runtime": "native"
      },
      "6": {
        "intro": "Browser persistence APIs have their own atomicity and completion contracts. A native filesystem protocol cannot simply be assumed to transfer to browser storage.",
        "explanation": "The executable model illustrates a complete versus interrupted commit boundary. In a browser host, IndexedDB transactions or OPFS operations need an explicit integration layer, quota/error handling, and documented acknowledgement rules. localStorage lesson marks and downloadable files are useful product features but are not a write-ahead-log durability mechanism for the C program. The course’s current runner keeps program files temporary.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nenum { BEGIN_REC = 1, SET_REC = 2, COMMIT_REC = 3, LOG_BYTES = 8 };\nvoid log_record(unsigned char *out, unsigned kind, unsigned tx,\n                uint32_t value) {\n  memset(out, 0, LOG_BYTES);\n  out[0] = (unsigned char)kind;\n  out[1] = (unsigned char)tx;\n  put32(out + 4, value);\n}\nuint32_t recover(const unsigned char *log, size_t length, uint32_t base) {\n  unsigned active = 0;\n  uint32_t pending = base;\n  for (size_t at = 0; at <= length && length - at >= LOG_BYTES;\n       at += LOG_BYTES) {\n    const unsigned char *r = log + at;\n    if (!r[1] || r[2] || r[3])\n      break;\n    if (r[0] == BEGIN_REC) {\n      if (active)\n        break;\n      active = r[1];\n      pending = base;\n    } else if (r[0] == SET_REC) {\n      if (active != r[1])\n        break;\n      pending = get32(r + 4);\n    } else if (r[0] == COMMIT_REC) {\n      if (active != r[1])\n        break;\n      base = pending;\n      active = 0;\n    } else\n      break;\n  }\n  return base;\n}\n\nint main(void) {\n  unsigned char log[24];\n  log_record(log, BEGIN_REC, 1, 0);\n  log_record(log + 8, SET_REC, 1, 7);\n  log_record(log + 16, COMMIT_REC, 1, 0);\n  printf(\"before_commit=%u after_commit=%u\\n\", (unsigned)recover(log, 16, 0),\n         (unsigned)recover(log, 24, 0));\n  return 0;\n}\n",
        "expected": "before_commit=0 after_commit=7",
        "walkthrough": "The boundary model is portable C, but the host mechanism that persists and acknowledges those bytes is environment-specific.",
        "pitfall": "Do not label a successful browser download or a saved editor draft as an atomic database transaction.",
        "question": "Does localStorage progress persistence make the C filesystem durable?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "The two stores have different owners, data, and failure contracts.",
        "tryit": "Specify a browser host persistence adapter and list its transaction, quota, crash, and export guarantees before implementing it.",
        "input": "",
        "runtime": "native"
      }
    },
    "practicePlan": {
      "goal": "Recover committed changes after simulated interruptions.",
      "tasks": [
        "Separate transaction visibility from durable acknowledgement. Model interrupted log prefixes and preserve committed state.",
        "Specify a browser host persistence adapter and list its transaction, quota, crash, and export guarantees before implementing it.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "recovery-6"
    }
  },
  "ship": {
    "intro": "Turn the small database into a reproducible learning release with contract tests, failure experiments, and an explicit compatibility document.",
    "outcomes": [
      "Exercise complete query paths and generated state transitions.",
      "Test interruption boundaries and audit resource ownership.",
      "Package files and limitations with reproducible commands."
    ],
    "topics": {
      "1": {
        "intro": "End-to-end tests cross parser, validation, executor, and storage boundaries. Keep earlier unit tests to localize failures.",
        "explanation": "The fixture inserts through the implemented SQL grammar, selects by key, and rejects an invalid statement before execution. A useful suite checks output rows, status, and persistent logical state after rejected operations. Operators not yet added to the parser grammar remain separate extension exercises rather than silently supported SQL syntax.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\ntypedef enum {\n  END,\n  WORD,\n  NUMBER,\n  STRING,\n  SEMI,\n  LP,\n  RP,\n  COMMA,\n  STAR,\n  EQUAL,\n  BAD\n} Token;\ntypedef struct {\n  const char *p;\n  char text[32];\n  uint32_t number;\n} Lexer;\nToken next(Lexer *l) {\n  while (*l->p == ' ' || *l->p == '\\t' || *l->p == '\\n' || *l->p == '\\r')\n    ++l->p;\n  unsigned char ch = (unsigned char)*l->p;\n  l->text[0] = 0;\n  if (!ch)\n    return END;\n  if (ch >= '0' && ch <= '9') {\n    uint32_t n = 0;\n    do {\n      unsigned digit = (unsigned)(*l->p - '0');\n      if (n > (UINT32_MAX - digit) / 10)\n        return BAD;\n      n = n * 10 + digit;\n      ++l->p;\n    } while (*l->p >= '0' && *l->p <= '9');\n    l->number = n;\n    return NUMBER;\n  }\n  if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == '_') {\n    size_t n = 0;\n    while ((*l->p >= 'A' && *l->p <= 'Z') || (*l->p >= 'a' && *l->p <= 'z') ||\n           (*l->p >= '0' && *l->p <= '9') || *l->p == '_') {\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p++;\n    }\n    l->text[n] = 0;\n    return WORD;\n  }\n  ++l->p;\n  if (ch == '\\'') {\n    size_t n = 0;\n    for (;;) {\n      if (!*l->p)\n        return BAD;\n      if (*l->p == '\\'' && l->p[1] != '\\'') {\n        ++l->p;\n        l->text[n] = 0;\n        return STRING;\n      }\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p;\n      if (*l->p == '\\'')\n        ++l->p;\n      ++l->p;\n    }\n  }\n  switch (ch) {\n  case ';':\n    return SEMI;\n  case '(':\n    return LP;\n  case ')':\n    return RP;\n  case ',':\n    return COMMA;\n  case '*':\n    return STAR;\n  case '=':\n    return EQUAL;\n  default:\n    return BAD;\n  }\n}\nbool keyword(Lexer *l, const char *word) {\n  return next(l) == WORD && strcmp(l->text, word) == 0;\n}\ntypedef enum { INSERT_STMT, SELECT_STMT } Kind;\ntypedef struct {\n  Kind kind;\n  Row row;\n  bool filtered;\n  uint32_t key;\n} Statement;\nbool parse(const char *sql, Statement *out) {\n  Lexer l = {sql, {0}, 0};\n  Statement s = {0};\n  if (next(&l) != WORD)\n    return false;\n  if (strcmp(l.text, \"INSERT\") == 0) {\n    s.kind = INSERT_STMT;\n    if (!keyword(&l, \"INTO\") || !keyword(&l, \"people\") ||\n        !keyword(&l, \"VALUES\") || next(&l) != LP || next(&l) != NUMBER)\n      return false;\n    s.row.id = l.number;\n    if (next(&l) != COMMA || next(&l) != STRING)\n      return false;\n    memcpy(s.row.name, l.text, sizeof s.row.name);\n    if (next(&l) != COMMA || next(&l) != NUMBER)\n      return false;\n    s.row.score = l.number;\n    if (next(&l) != RP || next(&l) != SEMI || next(&l) != END)\n      return false;\n  } else if (strcmp(l.text, \"SELECT\") == 0) {\n    s.kind = SELECT_STMT;\n    if (next(&l) != STAR || !keyword(&l, \"FROM\") || !keyword(&l, \"people\"))\n      return false;\n    Token t = next(&l);\n    if (t == WORD && strcmp(l.text, \"WHERE\") == 0) {\n      if (!keyword(&l, \"id\") || next(&l) != EQUAL || next(&l) != NUMBER)\n        return false;\n      s.filtered = true;\n      s.key = l.number;\n      t = next(&l);\n    }\n    if (t != SEMI || next(&l) != END)\n      return false;\n  } else\n    return false;\n  *out = s;\n  return true;\n}\nbool validate(const Statement *s) {\n  return s->kind != INSERT_STMT || (s->row.id > 0 && s->row.name[0] != 0);\n}\nbool execute(Table *t, const Statement *s) {\n  if (!validate(s))\n    return false;\n  if (s->kind == INSERT_STMT)\n    return insert_row(t, s->row) == OK;\n  for (size_t i = 0; i < t->count; ++i)\n    if (!s->filtered || t->rows[i].id == s->key)\n      printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n             (unsigned)t->rows[i].score);\n  return true;\n}\n\nint main(void) {\n  Table t = {0};\n  Statement s = {0};\n  if (!parse(\"INSERT INTO people VALUES (7, 'Ada', 90);\", &s) ||\n      !execute(&t, &s))\n    return 1;\n  if (!parse(\"SELECT * FROM people WHERE id = 7;\", &s) || !execute(&t, &s))\n    return 1;\n  if (parse(\"DELETE nonsense\", &s) || t.count != 1)\n    return 1;\n  puts(\"SQL contract passed\");\n  return 0;\n}\n",
        "expected": "7 | Ada | 90\nSQL contract passed",
        "walkthrough": "The table result confirms execution, while the final count confirms malformed input did not mutate it.",
        "pitfall": "A parser-only test cannot establish that the executor interprets the statement correctly.",
        "question": "Which layers does an end-to-end query test cross?",
        "choices": [
          "Parsing, validation, and execution/storage",
          "Only token classification"
        ],
        "answer": 0,
        "why": "The observed result depends on the complete request path.",
        "tryit": "Add tests for each supported statement and maintain a table of intentionally unsupported syntax.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "Property tests compare many generated operation sequences with a simpler reference model. Parser fuzzing asks whether arbitrary bounded input is handled safely.",
        "explanation": "The fixture generates bounded strings with a fixed seed and passes them to the parser. It checks memory-safe completion under the selected compiler and can be rerun under sanitizers. It is not exhaustive and does not prove grammatical correctness. Preserve failing seeds and minimize inputs when a crash or inconsistent result is found.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\ntypedef enum {\n  END,\n  WORD,\n  NUMBER,\n  STRING,\n  SEMI,\n  LP,\n  RP,\n  COMMA,\n  STAR,\n  EQUAL,\n  BAD\n} Token;\ntypedef struct {\n  const char *p;\n  char text[32];\n  uint32_t number;\n} Lexer;\nToken next(Lexer *l) {\n  while (*l->p == ' ' || *l->p == '\\t' || *l->p == '\\n' || *l->p == '\\r')\n    ++l->p;\n  unsigned char ch = (unsigned char)*l->p;\n  l->text[0] = 0;\n  if (!ch)\n    return END;\n  if (ch >= '0' && ch <= '9') {\n    uint32_t n = 0;\n    do {\n      unsigned digit = (unsigned)(*l->p - '0');\n      if (n > (UINT32_MAX - digit) / 10)\n        return BAD;\n      n = n * 10 + digit;\n      ++l->p;\n    } while (*l->p >= '0' && *l->p <= '9');\n    l->number = n;\n    return NUMBER;\n  }\n  if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == '_') {\n    size_t n = 0;\n    while ((*l->p >= 'A' && *l->p <= 'Z') || (*l->p >= 'a' && *l->p <= 'z') ||\n           (*l->p >= '0' && *l->p <= '9') || *l->p == '_') {\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p++;\n    }\n    l->text[n] = 0;\n    return WORD;\n  }\n  ++l->p;\n  if (ch == '\\'') {\n    size_t n = 0;\n    for (;;) {\n      if (!*l->p)\n        return BAD;\n      if (*l->p == '\\'' && l->p[1] != '\\'') {\n        ++l->p;\n        l->text[n] = 0;\n        return STRING;\n      }\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p;\n      if (*l->p == '\\'')\n        ++l->p;\n      ++l->p;\n    }\n  }\n  switch (ch) {\n  case ';':\n    return SEMI;\n  case '(':\n    return LP;\n  case ')':\n    return RP;\n  case ',':\n    return COMMA;\n  case '*':\n    return STAR;\n  case '=':\n    return EQUAL;\n  default:\n    return BAD;\n  }\n}\nbool keyword(Lexer *l, const char *word) {\n  return next(l) == WORD && strcmp(l->text, word) == 0;\n}\ntypedef enum { INSERT_STMT, SELECT_STMT } Kind;\ntypedef struct {\n  Kind kind;\n  Row row;\n  bool filtered;\n  uint32_t key;\n} Statement;\nbool parse(const char *sql, Statement *out) {\n  Lexer l = {sql, {0}, 0};\n  Statement s = {0};\n  if (next(&l) != WORD)\n    return false;\n  if (strcmp(l.text, \"INSERT\") == 0) {\n    s.kind = INSERT_STMT;\n    if (!keyword(&l, \"INTO\") || !keyword(&l, \"people\") ||\n        !keyword(&l, \"VALUES\") || next(&l) != LP || next(&l) != NUMBER)\n      return false;\n    s.row.id = l.number;\n    if (next(&l) != COMMA || next(&l) != STRING)\n      return false;\n    memcpy(s.row.name, l.text, sizeof s.row.name);\n    if (next(&l) != COMMA || next(&l) != NUMBER)\n      return false;\n    s.row.score = l.number;\n    if (next(&l) != RP || next(&l) != SEMI || next(&l) != END)\n      return false;\n  } else if (strcmp(l.text, \"SELECT\") == 0) {\n    s.kind = SELECT_STMT;\n    if (next(&l) != STAR || !keyword(&l, \"FROM\") || !keyword(&l, \"people\"))\n      return false;\n    Token t = next(&l);\n    if (t == WORD && strcmp(l.text, \"WHERE\") == 0) {\n      if (!keyword(&l, \"id\") || next(&l) != EQUAL || next(&l) != NUMBER)\n        return false;\n      s.filtered = true;\n      s.key = l.number;\n      t = next(&l);\n    }\n    if (t != SEMI || next(&l) != END)\n      return false;\n  } else\n    return false;\n  *out = s;\n  return true;\n}\nbool validate(const Statement *s) {\n  return s->kind != INSERT_STMT || (s->row.id > 0 && s->row.name[0] != 0);\n}\n\nint main(void) {\n  uint32_t seed = 17;\n  char sql[33];\n  unsigned cases = 0;\n  for (unsigned n = 0; n < 256; ++n) {\n    for (size_t i = 0; i < 32; ++i) {\n      seed = seed * 1664525u + 1013904223u;\n      sql[i] = \"SELECT (),;'012xyz\"[(seed >> 24) % 17];\n    }\n    sql[n % 32] = 0;\n    Statement s = {0};\n    if (parse(sql, &s))\n      (void)validate(&s);\n    ++cases;\n  }\n  printf(\"fuzz_cases=%u completed\\n\", cases);\n  return 0;\n}\n",
        "expected": "fuzz_cases=256 completed",
        "walkthrough": "Every buffer is terminated before parsing. The bounded test is deterministic, so a failure can be reproduced using the same seed.",
        "pitfall": "Random input testing is a supplement to grammar-specific boundary cases, not a replacement.",
        "question": "Does a clean fuzz run prove the parser correct?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "Only finitely many generated paths were exercised.",
        "tryit": "Run with SANITIZE=1, add token-length boundaries, and retain every discovered failure as a deterministic regression case.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "Fault injection makes rare failure paths repeatable. Test exactly where the protocol permits acknowledged state to survive.",
        "explanation": "For each possible byte cut in a single transaction log, the reference expectation is zero before the full COMMIT record and 42 afterward. The loop tests every prefix from zero through 24 bytes. This is an interruption model; it does not simulate all filesystem reorderings, device failures, or checksum-valid corruption.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nenum { BEGIN_REC = 1, SET_REC = 2, COMMIT_REC = 3, LOG_BYTES = 8 };\nvoid log_record(unsigned char *out, unsigned kind, unsigned tx,\n                uint32_t value) {\n  memset(out, 0, LOG_BYTES);\n  out[0] = (unsigned char)kind;\n  out[1] = (unsigned char)tx;\n  put32(out + 4, value);\n}\nuint32_t recover(const unsigned char *log, size_t length, uint32_t base) {\n  unsigned active = 0;\n  uint32_t pending = base;\n  for (size_t at = 0; at <= length && length - at >= LOG_BYTES;\n       at += LOG_BYTES) {\n    const unsigned char *r = log + at;\n    if (!r[1] || r[2] || r[3])\n      break;\n    if (r[0] == BEGIN_REC) {\n      if (active)\n        break;\n      active = r[1];\n      pending = base;\n    } else if (r[0] == SET_REC) {\n      if (active != r[1])\n        break;\n      pending = get32(r + 4);\n    } else if (r[0] == COMMIT_REC) {\n      if (active != r[1])\n        break;\n      base = pending;\n      active = 0;\n    } else\n      break;\n  }\n  return base;\n}\n\nint main(void) {\n  unsigned char log[24];\n  log_record(log, BEGIN_REC, 1, 0);\n  log_record(log + 8, SET_REC, 1, 42);\n  log_record(log + 16, COMMIT_REC, 1, 0);\n  for (size_t cut = 0; cut <= sizeof log; ++cut) {\n    uint32_t expected = cut == sizeof log ? 42 : 0;\n    if (recover(log, cut, 0) != expected)\n      return 1;\n  }\n  puts(\"25 interruption boundaries passed\");\n  return 0;\n}\n",
        "expected": "25 interruption boundaries passed",
        "walkthrough": "The only prefix containing a complete matching COMMIT is the full 24-byte log. Every shorter prefix leaves the base unchanged.",
        "pitfall": "Killing a process at one convenient point does not cover all interruption boundaries.",
        "question": "Which prefixes may recover 42 in this fixture?",
        "choices": [
          "Only the prefix containing the full commit record",
          "Every prefix containing the SET value"
        ],
        "answer": 0,
        "why": "Uncommitted records cannot establish acknowledged transaction state.",
        "tryit": "Add two committed transactions, an incomplete third, invalid headers, and repeated replay checks.",
        "input": "",
        "runtime": "native"
      },
      "4": {
        "intro": "Benchmark across growing data while retaining correctness checks and separating setup from the measured operation.",
        "explanation": "The deterministic fixture counts absent-key scan comparisons for two sizes. A native timing harness should create data before timing, use a monotonic clock where available, repeat sufficiently, and report distributions with compiler and machine details. The current eight-row table is a teaching bound, so larger benchmark datasets require an intentionally expanded storage implementation.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  for (size_t n = 8; n <= 32; n *= 4) {\n    size_t comparisons = 0;\n    for (size_t i = 0; i < n; ++i)\n      ++comparisons;\n    printf(\"rows=%zu absent_scan_comparisons=%zu\\n\", n, comparisons);\n  }\n  return 0;\n}\n",
        "expected": "rows=8 absent_scan_comparisons=8\nrows=32 absent_scan_comparisons=32",
        "walkthrough": "The count grows by the same factor as the input. This is an abstract scan loop, not a timing claim about disk or cache performance.",
        "pitfall": "Printing from the measured inner loop can dominate the operation you intended to measure.",
        "question": "What should be excluded from a query-only timing region?",
        "choices": [
          "The actual query operation",
          "Dataset construction and result formatting"
        ],
        "answer": 1,
        "why": "Preparation and reporting answer different performance questions.",
        "tryit": "Compare cold and warm page-cache runs with verified equal results and recorded environment details.",
        "input": "",
        "runtime": "native"
      },
      "5": {
        "intro": "A resource audit assigns an owner and cleanup path to every allocation, file, lock, and borrowed pointer.",
        "explanation": "The fixture writes and reloads a table through one temporary stream and closes it on both success and failure paths. It checks close results rather than assuming earlier writes reached their destination. Sanitizers detect many executed memory errors but do not prove that all resource paths or I/O failures are handled.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\n\nint main(void) {\n  FILE *f = tmpfile();\n  if (!f)\n    return 1;\n  Table source = {0}, copy = {0};\n  insert_row(&source, (Row){1, \"Ada\", 90});\n  bool ok = save(f, &source) && fseek(f, 0, SEEK_SET) == 0 && load(f, &copy);\n  int closed = fclose(f);\n  if (!ok || closed != 0)\n    return 1;\n  printf(\"stream_closed=1 rows=%zu\\n\", copy.count);\n  return 0;\n}\n",
        "expected": "stream_closed=1 rows=1",
        "walkthrough": "The stream has one owner in main and is closed exactly once after the operation sequence. Embedded table rows need no heap cleanup.",
        "pitfall": "A successful allocation or fopen introduces an obligation even when a later operation fails.",
        "question": "Does an I/O error remove the caller’s close obligation?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "Ownership remains until the resource is released.",
        "tryit": "Enumerate every exit path in the pager, parser, and index; inject failures at each acquired resource boundary.",
        "input": "",
        "runtime": "native"
      },
      "6": {
        "intro": "Compatibility depends on documented bytes and behavior, not merely on retaining a source-code struct name.",
        "explanation": "The header version selects a decoder contract. This fixture deliberately changes the version byte and verifies rejection without replacing the output table. A migration tool should read the old format through its old validator, write a separate new file, and publish it only after successful verification. Never reinterpret an old layout as the new one because fields look similar.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\n\nint main(void) {\n  FILE *f = tmpfile();\n  if (!f)\n    return 1;\n  unsigned char header[8] = {0x54, 0x44, 0x42, 0x31, 2, 40, 0, 0};\n  if (fwrite(header, 1, 8, f) != 8 || fseek(f, 0, SEEK_SET) != 0) {\n    fclose(f);\n    return 1;\n  }\n  Table live = {0};\n  bool rejected = !load(f, &live);\n  if (fclose(f) != 0 || !rejected)\n    return 1;\n  printf(\"unknown_version_rejected=%d\\n\", rejected);\n  return 0;\n}\n",
        "expected": "unknown_version_rejected=1",
        "walkthrough": "Version two has no decoder in this format implementation. Rejection is a compatibility behavior, not a crash.",
        "pitfall": "Changing a format version without a decoder or explicit rejection policy leaves compatibility undefined.",
        "question": "What should a migration write to first?",
        "choices": [
          "The only existing file in place without recovery",
          "A separate verified new-format file"
        ],
        "answer": 1,
        "why": "The old valid state should remain available if conversion fails.",
        "tryit": "Publish a format document with offsets, ranges, validation, version policy, and independently specified sample bytes.",
        "input": "",
        "runtime": "native"
      },
      "7": {
        "intro": "A release should make its implemented behavior and boundaries easy to reproduce. Exported files need validation on import and a way to inspect their bytes.",
        "explanation": "The sample transfer tool in the persistence chapter produces a real named file, and that page provides a downloadable two-row fixture. This release check validates the same header and record contract through a fresh stream. The course examples demonstrate components and bounded models; they are not a general SQL server, arbitrary-height persistent index, or production transaction engine assembled automatically by reading the pages.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\n\nint main(void) {\n  Table source = {0}, copy = {0};\n  insert_row(&source, (Row){1, \"Ada\", 90});\n  insert_row(&source, (Row){2, \"Grace\", 80});\n  FILE *f = tmpfile();\n  if (!f)\n    return 1;\n  bool ok = save(f, &source) && fseek(f, 0, SEEK_SET) == 0 && load(f, &copy);\n  if (fclose(f) != 0 || !ok || copy.count != 2)\n    return 1;\n  puts(\"release fixture: two validated rows\");\n  return 0;\n}\n",
        "expected": "release fixture: two validated rows",
        "walkthrough": "The fixture can be decoded independently of struct layout. The named export command is make example EXAMPLE=persistence-5 KEEP_FILES=1.",
        "pitfall": "A browser demonstration must disclose whether its database state survives reload; the current C runner’s files do not.",
        "question": "What belongs with an exportable database release?",
        "choices": [
          "Format documentation, validation tests, and execution limits",
          "Only a screenshot of successful output"
        ],
        "answer": 0,
        "why": "A recipient needs to reproduce and safely interpret the artifact.",
        "tryit": "Package your assembled TinyDB, its acceptance suite, the format document, and a verified exported file; list every feature still outside your implementation.",
        "input": "",
        "runtime": "native"
      },
      "8": {
        "intro": "Use GDB to explain two data-integrity failures in a deliberately broken copy of the real TinyDB CLI, then verify the repair after reopening its database file.",
        "explanation": "A database can exit successfully and still update the wrong row or lose a survivor during deletion. The repair workshop freezes a copy of the runnable C CLI and introduces two logical defects. Each launch seeds a new three-row file, so the investigation does not touch a database you want to keep. Begin with the failing contract, inspect the selected ID and array slot, and follow the candidate table through mutation and serialization. The small example below states the neighbor-preservation contract; the separate workshop contains the full CLI to repair. Complete the <a href=\"#/chapter/files-bytes/7\">optional Part 2 GDB lab</a> first, or skip this native workshop.",
        "code": "#include <stdbool.h>\n#include <stddef.h>\n#include <stdio.h>\n\ntypedef struct { unsigned id, score; } Row;\n\nbool update_score(Row *rows, size_t count, unsigned id, unsigned score) {\n    for (size_t i = 0; i < count; ++i) {\n        if (rows[i].id == id) {\n            rows[i].score = score;\n            return true;\n        }\n    }\n    return false;\n}\n\nint main(void) {\n    Row rows[] = {{1, 90}, {2, 80}, {3, 70}};\n    if (!update_score(rows, 3, 2, 99)) return 1;\n    for (size_t i = 0; i < 3; ++i)\n        printf(\"id=%u score=%u\\n\", rows[i].id, rows[i].score);\n    return 0;\n}\n",
        "expected": "id=1 score=90\nid=2 score=99\nid=3 score=70",
        "runtime": "native",
        "input": "",
        "walkthrough": "The lookup matches ID 2 at slot 1 and writes only that slot. IDs 1 and 3 keep their scores. In the repair lab, the update regression reopens the file after changing ID 2, and the delete regressions check that first, middle, and last deletion preserve the other rows. Passing the small worked example does not validate the separate faulty CLI.",
        "pitfall": "Do not fix the shared browser CLI to complete this exercise: edit native/debugging/tinydb/main.c. A successful exit and sanitizer-clean execution cannot establish row identity or preservation. Debug only the isolated fixtures, and check persisted results as well as live memory.",
        "question": "Why does the regression reopen the database after the mutation?",
        "choices": [
          "The in-memory table alone cannot establish that the saved rows are correct",
          "Reopening proves that the program is safe under every crash"
        ],
        "answer": 0,
        "why": "Reopening checks the persistence boundary for this completed operation. It does not prove crash durability, transaction isolation, or correctness for every input.",
        "tryit": "Repair both defects in the isolated CLI copy, pass all four checks, and add missing-ID, sole-row deletion, and duplicate-rejection regressions. Record the GDB evidence for each source fix.",
        "lab": {
          "id": "tinydb",
          "title": "Optional repair workshop: a broken TinyDB",
          "workspace": "native/debugging/tinydb",
          "command": "make debug-lab LAB=tinydb",
          "steps": [
            {
              "title": "Reproduce the contracts",
              "body": "The seed is Ada/90, Grace/80, and Linus/70 with IDs 1, 2, and 3. Updating ID 2 should preserve its neighbors. Deleting any one row should preserve the remaining two. All four starter checks initially fail.",
              "command": "make debug-lab LAB=tinydb\nmake debug-check LAB=tinydb"
            },
            {
              "title": "Trace the UPDATE write",
              "body": "The guided launcher opens a fresh fixture and stops in execute. Use list execute to locate the score-assignment line; break at its current source line number and continue. Before the write, statement.id is 2, at is 1, and candidate.rows[at].id is 2. The guide in the lab files includes a watchpoint on the neighboring score.",
              "command": "make debug-gdb LAB=tinydb"
            },
            {
              "title": "Trace the DELETE count",
              "body": "Quit the first GDB session. This command starts another fresh fixture using DELETE for ID 2. Locate the count-decrement line, break there, and watch candidate.count. Explain why a copied record can still be in memory while an incorrect count omits it from the saved file.",
              "command": "make debug-gdb LAB=tinydb CASE=delete"
            },
            {
              "title": "Rebuild and reopen",
              "body": "Edit native/debugging/tinydb/main.c, then repeat the regression checks. Each check uses an independent fixture and reopens the saved database. Keep both source fixes and add cases beyond the failing examples.",
              "command": "make debug-check LAB=tinydb"
            }
          ],
          "skip": {
            "href": "#/chapter/standards-evolution/1",
            "label": "Continue to Part 7: How C has evolved"
          },
          "hint": "The correct slot returned by lookup must also select the destination of an update. Each successful deletion reduces the logical count by exactly one. After trying, inspect the separate .reference/main.c or run make debug-check LAB=tinydb REFERENCE=1."
        }
      }
    },
    "practicePlan": {
      "goal": "Ship a documented TinyDB build with tests, benchmarks, and exportable files.",
      "tasks": [
        "Turn the small database into a reproducible learning release with contract tests, failure experiments, and an explicit compatibility document.",
        "Package your assembled TinyDB, its acceptance suite, the format document, and a verified exported file; list every feature still outside your implementation.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "ship-7"
    }
  }
};
