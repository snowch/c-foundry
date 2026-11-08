# Chapter 27: B+ tree indexes

Part 6: Make the database faster and more reliable. Teaching baseline: C17.

Build and test a bounded B+ index before encoding its pages. Preserve routing, occupancy, and leaf-link invariants.

## Outcomes

- Route point lookups through separator keys.
- Split full leaves and maintain ordered sibling links.
- Restore occupancy through borrowing or merging after deletion.

## 27.1 Why databases use page-oriented trees

Page-oriented trees reduce the number of storage pages visited per lookup by giving each internal page many children.

A B+ tree stores record references in leaves and routing separators in internal pages. Its height is logarithmic in key count under occupancy assumptions, with branching tied to page size. The executable model uses four-entry leaves and one routing root; it intentionally rejects growth beyond eight leaves rather than pretending to implement arbitrary-height page storage.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { LEAF_MAX = 4, LEAF_POOL = 8 };
typedef struct Leaf {
  int key[LEAF_MAX], value[LEAF_MAX];
  size_t n;
  bool used;
  struct Leaf *next;
} Leaf;
typedef struct {
  Leaf pages[LEAF_POOL];
  Leaf *child[LEAF_POOL];
  size_t n;
} BTree;
void tree_init(BTree *t) {
  memset(t, 0, sizeof *t);
  t->n = 1;
  t->pages[0].used = true;
  t->child[0] = &t->pages[0];
}
size_t route(const BTree *t, int key) {
  size_t i = 0;
  while (i + 1 < t->n && t->child[i + 1]->key[0] <= key)
    ++i;
  return i;
}
bool tree_find(const BTree *t, int key, int *out) {
  const Leaf *p = t->child[route(t, key)];
  for (size_t i = 0; i < p->n; ++i)
    if (p->key[i] == key) {
      *out = p->value[i];
      return true;
    }
  return false;
}
bool tree_put(BTree *t, int key, int value) {
  size_t at = route(t, key);
  Leaf *p = t->child[at];
  int old;
  if (tree_find(t, key, &old))
    return false;
  if (p->n < LEAF_MAX) {
    size_t i = p->n++;
    while (i && p->key[i - 1] > key) {
      p->key[i] = p->key[i - 1];
      p->value[i] = p->value[i - 1];
      --i;
    }
    p->key[i] = key;
    p->value[i] = value;
    return true;
  }
  if (t->n == LEAF_POOL)
    return false;
  Leaf *right = NULL;
  for (size_t i = 0; i < LEAF_POOL; ++i)
    if (!t->pages[i].used) {
      right = &t->pages[i];
      break;
    }
  if (!right)
    return false;
  int keys[5], values[5];
  size_t j = 0;
  bool added = false;
  for (size_t i = 0; i < 5; ++i) {
    if (!added && (j == p->n || key < p->key[j])) {
      keys[i] = key;
      values[i] = value;
      added = true;
    } else {
      keys[i] = p->key[j];
      values[i] = p->value[j++];
    }
  }
  *right = (Leaf){0};
  right->used = true;
  p->n = 2;
  right->n = 3;
  for (size_t i = 0; i < 2; ++i) {
    p->key[i] = keys[i];
    p->value[i] = values[i];
  }
  for (size_t i = 0; i < 3; ++i) {
    right->key[i] = keys[i + 2];
    right->value[i] = values[i + 2];
  }
  right->next = p->next;
  p->next = right;
  for (size_t i = t->n; i > at + 1; --i)
    t->child[i] = t->child[i - 1];
  t->child[at + 1] = right;
  ++t->n;
  return true;
}
bool tree_erase(BTree *t, int key) {
  size_t at = route(t, key);
  Leaf *p = t->child[at];
  size_t pos = 0;
  while (pos < p->n && p->key[pos] != key)
    ++pos;
  if (pos == p->n)
    return false;
  for (size_t i = pos + 1; i < p->n; ++i) {
    p->key[i - 1] = p->key[i];
    p->value[i - 1] = p->value[i];
  }
  --p->n;
  if (t->n == 1 || p->n >= 2)
    return true;
  Leaf *left = at ? t->child[at - 1] : NULL,
       *right = at + 1 < t->n ? t->child[at + 1] : NULL;
  if (left && left->n > 2) {
    for (size_t i = p->n; i > 0; --i) {
      p->key[i] = p->key[i - 1];
      p->value[i] = p->value[i - 1];
    }
    --left->n;
    p->key[0] = left->key[left->n];
    p->value[0] = left->value[left->n];
    ++p->n;
    return true;
  }
  if (right && right->n > 2) {
    p->key[p->n] = right->key[0];
    p->value[p->n++] = right->value[0];
    for (size_t i = 1; i < right->n; ++i) {
      right->key[i - 1] = right->key[i];
      right->value[i - 1] = right->value[i];
    }
    --right->n;
    return true;
  }
  size_t removed;
  if (left) {
    for (size_t i = 0; i < p->n; ++i) {
      left->key[left->n] = p->key[i];
      left->value[left->n++] = p->value[i];
    }
    left->next = p->next;
    p->used = false;
    removed = at;
  } else {
    for (size_t i = 0; i < right->n; ++i) {
      p->key[p->n] = right->key[i];
      p->value[p->n++] = right->value[i];
    }
    p->next = right->next;
    right->used = false;
    removed = at + 1;
  }
  for (size_t i = removed + 1; i < t->n; ++i)
    t->child[i - 1] = t->child[i];
  --t->n;
  return true;
}
void range(const BTree *t, int lo, int hi) {
  const Leaf *p = t->child[route(t, lo)];
  for (; p; p = p->next)
    for (size_t i = 0; i < p->n; ++i) {
      if (p->key[i] >= hi)
        return;
      if (p->key[i] >= lo)
        printf("%d ", p->key[i]);
    }
  puts("");
}

int main(void) {
  BTree t;
  tree_init(&t);
  for (int key = 1; key <= 7; ++key)
    if (!tree_put(&t, key, key * 10))
      return 1;
  printf("root_children=%zu leaf_capacity=%d\n", t.n, LEAF_MAX);
  return 0;
}
```

Output:

```text
root_children=3 leaf_capacity=4
```

Seven ascending inserts trigger two splits and leave three root children. Small capacities make structure changes visible.

**Watch for:** This in-memory pointer model is not a serialized index; disk pages need stable page IDs and checked encoding.

**Check:** Why does a large fanout help storage lookup?

1. It reduces the number of page levels visited
2. It eliminates all comparisons

<details><summary>Answer</summary>

It reduces the number of page levels visited. Many routing choices fit within each fetched page.

</details>

**Try:** Calculate leaf and child capacities for a real page format including headers, key widths, and row references.

Run from the repository root:

```sh
make example EXAMPLE=bplus-trees-1
```

## 27.2 Leaf pages and internal pages

Internal separators guide searches while leaf records carry the indexed data. Keep the equality routing convention consistent.

This root chooses the rightmost child whose first key is no greater than the search key. Separators are derived from child minima after updates rather than stored separately. That makes separator maintenance observable without an extra cached array, but reading empty nonroot leaves would be invalid; deletion repairs underflow before returning.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { LEAF_MAX = 4, LEAF_POOL = 8 };
typedef struct Leaf {
  int key[LEAF_MAX], value[LEAF_MAX];
  size_t n;
  bool used;
  struct Leaf *next;
} Leaf;
typedef struct {
  Leaf pages[LEAF_POOL];
  Leaf *child[LEAF_POOL];
  size_t n;
} BTree;
void tree_init(BTree *t) {
  memset(t, 0, sizeof *t);
  t->n = 1;
  t->pages[0].used = true;
  t->child[0] = &t->pages[0];
}
size_t route(const BTree *t, int key) {
  size_t i = 0;
  while (i + 1 < t->n && t->child[i + 1]->key[0] <= key)
    ++i;
  return i;
}
bool tree_find(const BTree *t, int key, int *out) {
  const Leaf *p = t->child[route(t, key)];
  for (size_t i = 0; i < p->n; ++i)
    if (p->key[i] == key) {
      *out = p->value[i];
      return true;
    }
  return false;
}
bool tree_put(BTree *t, int key, int value) {
  size_t at = route(t, key);
  Leaf *p = t->child[at];
  int old;
  if (tree_find(t, key, &old))
    return false;
  if (p->n < LEAF_MAX) {
    size_t i = p->n++;
    while (i && p->key[i - 1] > key) {
      p->key[i] = p->key[i - 1];
      p->value[i] = p->value[i - 1];
      --i;
    }
    p->key[i] = key;
    p->value[i] = value;
    return true;
  }
  if (t->n == LEAF_POOL)
    return false;
  Leaf *right = NULL;
  for (size_t i = 0; i < LEAF_POOL; ++i)
    if (!t->pages[i].used) {
      right = &t->pages[i];
      break;
    }
  if (!right)
    return false;
  int keys[5], values[5];
  size_t j = 0;
  bool added = false;
  for (size_t i = 0; i < 5; ++i) {
    if (!added && (j == p->n || key < p->key[j])) {
      keys[i] = key;
      values[i] = value;
      added = true;
    } else {
      keys[i] = p->key[j];
      values[i] = p->value[j++];
    }
  }
  *right = (Leaf){0};
  right->used = true;
  p->n = 2;
  right->n = 3;
  for (size_t i = 0; i < 2; ++i) {
    p->key[i] = keys[i];
    p->value[i] = values[i];
  }
  for (size_t i = 0; i < 3; ++i) {
    right->key[i] = keys[i + 2];
    right->value[i] = values[i + 2];
  }
  right->next = p->next;
  p->next = right;
  for (size_t i = t->n; i > at + 1; --i)
    t->child[i] = t->child[i - 1];
  t->child[at + 1] = right;
  ++t->n;
  return true;
}
bool tree_erase(BTree *t, int key) {
  size_t at = route(t, key);
  Leaf *p = t->child[at];
  size_t pos = 0;
  while (pos < p->n && p->key[pos] != key)
    ++pos;
  if (pos == p->n)
    return false;
  for (size_t i = pos + 1; i < p->n; ++i) {
    p->key[i - 1] = p->key[i];
    p->value[i - 1] = p->value[i];
  }
  --p->n;
  if (t->n == 1 || p->n >= 2)
    return true;
  Leaf *left = at ? t->child[at - 1] : NULL,
       *right = at + 1 < t->n ? t->child[at + 1] : NULL;
  if (left && left->n > 2) {
    for (size_t i = p->n; i > 0; --i) {
      p->key[i] = p->key[i - 1];
      p->value[i] = p->value[i - 1];
    }
    --left->n;
    p->key[0] = left->key[left->n];
    p->value[0] = left->value[left->n];
    ++p->n;
    return true;
  }
  if (right && right->n > 2) {
    p->key[p->n] = right->key[0];
    p->value[p->n++] = right->value[0];
    for (size_t i = 1; i < right->n; ++i) {
      right->key[i - 1] = right->key[i];
      right->value[i - 1] = right->value[i];
    }
    --right->n;
    return true;
  }
  size_t removed;
  if (left) {
    for (size_t i = 0; i < p->n; ++i) {
      left->key[left->n] = p->key[i];
      left->value[left->n++] = p->value[i];
    }
    left->next = p->next;
    p->used = false;
    removed = at;
  } else {
    for (size_t i = 0; i < right->n; ++i) {
      p->key[p->n] = right->key[i];
      p->value[p->n++] = right->value[i];
    }
    p->next = right->next;
    right->used = false;
    removed = at + 1;
  }
  for (size_t i = removed + 1; i < t->n; ++i)
    t->child[i - 1] = t->child[i];
  --t->n;
  return true;
}
void range(const BTree *t, int lo, int hi) {
  const Leaf *p = t->child[route(t, lo)];
  for (; p; p = p->next)
    for (size_t i = 0; i < p->n; ++i) {
      if (p->key[i] >= hi)
        return;
      if (p->key[i] >= lo)
        printf("%d ", p->key[i]);
    }
  puts("");
}

int main(void) {
  BTree t;
  tree_init(&t);
  for (int key = 1; key <= 7; ++key)
    if (!tree_put(&t, key, key * 10))
      return 1;
  for (size_t i = 0; i < t.n; ++i)
    printf("leaf%zu min=%d count=%zu\n", i, t.child[i]->key[0], t.child[i]->n);
  return 0;
}
```

Output:

```text
leaf0 min=1 count=2
leaf1 min=3 count=2
leaf2 min=5 count=3
```

The leaf minima one, three, and five act as root boundaries. Equality with five routes to the third leaf.

**Watch for:** Mixing left-inclusive and right-inclusive separator rules can lose keys exactly at boundaries.

**Check:** Where does a key equal to the next child’s minimum go?

1. Always to the preceding child
2. To that next child

<details><summary>Answer</summary>

To that next child. This model uses the child’s minimum as an inclusive lower boundary.

</details>

**Try:** Test keys immediately below, equal to, and immediately above every separator.

Run from the repository root:

```sh
make example EXAMPLE=bplus-trees-2
```

## 27.3 Searching and ordered traversal

Point lookup follows separators to one leaf, then searches its bounded key area. Ordered traversal follows leaf links.

The root routing cost in this small model is a linear scan over at most eight children; leaf search is also bounded. A full tree could binary-search larger routing pages. A successful result copies the value to the caller. Missing keys return false without exposing an invalid row pointer.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { LEAF_MAX = 4, LEAF_POOL = 8 };
typedef struct Leaf {
  int key[LEAF_MAX], value[LEAF_MAX];
  size_t n;
  bool used;
  struct Leaf *next;
} Leaf;
typedef struct {
  Leaf pages[LEAF_POOL];
  Leaf *child[LEAF_POOL];
  size_t n;
} BTree;
void tree_init(BTree *t) {
  memset(t, 0, sizeof *t);
  t->n = 1;
  t->pages[0].used = true;
  t->child[0] = &t->pages[0];
}
size_t route(const BTree *t, int key) {
  size_t i = 0;
  while (i + 1 < t->n && t->child[i + 1]->key[0] <= key)
    ++i;
  return i;
}
bool tree_find(const BTree *t, int key, int *out) {
  const Leaf *p = t->child[route(t, key)];
  for (size_t i = 0; i < p->n; ++i)
    if (p->key[i] == key) {
      *out = p->value[i];
      return true;
    }
  return false;
}
bool tree_put(BTree *t, int key, int value) {
  size_t at = route(t, key);
  Leaf *p = t->child[at];
  int old;
  if (tree_find(t, key, &old))
    return false;
  if (p->n < LEAF_MAX) {
    size_t i = p->n++;
    while (i && p->key[i - 1] > key) {
      p->key[i] = p->key[i - 1];
      p->value[i] = p->value[i - 1];
      --i;
    }
    p->key[i] = key;
    p->value[i] = value;
    return true;
  }
  if (t->n == LEAF_POOL)
    return false;
  Leaf *right = NULL;
  for (size_t i = 0; i < LEAF_POOL; ++i)
    if (!t->pages[i].used) {
      right = &t->pages[i];
      break;
    }
  if (!right)
    return false;
  int keys[5], values[5];
  size_t j = 0;
  bool added = false;
  for (size_t i = 0; i < 5; ++i) {
    if (!added && (j == p->n || key < p->key[j])) {
      keys[i] = key;
      values[i] = value;
      added = true;
    } else {
      keys[i] = p->key[j];
      values[i] = p->value[j++];
    }
  }
  *right = (Leaf){0};
  right->used = true;
  p->n = 2;
  right->n = 3;
  for (size_t i = 0; i < 2; ++i) {
    p->key[i] = keys[i];
    p->value[i] = values[i];
  }
  for (size_t i = 0; i < 3; ++i) {
    right->key[i] = keys[i + 2];
    right->value[i] = values[i + 2];
  }
  right->next = p->next;
  p->next = right;
  for (size_t i = t->n; i > at + 1; --i)
    t->child[i] = t->child[i - 1];
  t->child[at + 1] = right;
  ++t->n;
  return true;
}
bool tree_erase(BTree *t, int key) {
  size_t at = route(t, key);
  Leaf *p = t->child[at];
  size_t pos = 0;
  while (pos < p->n && p->key[pos] != key)
    ++pos;
  if (pos == p->n)
    return false;
  for (size_t i = pos + 1; i < p->n; ++i) {
    p->key[i - 1] = p->key[i];
    p->value[i - 1] = p->value[i];
  }
  --p->n;
  if (t->n == 1 || p->n >= 2)
    return true;
  Leaf *left = at ? t->child[at - 1] : NULL,
       *right = at + 1 < t->n ? t->child[at + 1] : NULL;
  if (left && left->n > 2) {
    for (size_t i = p->n; i > 0; --i) {
      p->key[i] = p->key[i - 1];
      p->value[i] = p->value[i - 1];
    }
    --left->n;
    p->key[0] = left->key[left->n];
    p->value[0] = left->value[left->n];
    ++p->n;
    return true;
  }
  if (right && right->n > 2) {
    p->key[p->n] = right->key[0];
    p->value[p->n++] = right->value[0];
    for (size_t i = 1; i < right->n; ++i) {
      right->key[i - 1] = right->key[i];
      right->value[i - 1] = right->value[i];
    }
    --right->n;
    return true;
  }
  size_t removed;
  if (left) {
    for (size_t i = 0; i < p->n; ++i) {
      left->key[left->n] = p->key[i];
      left->value[left->n++] = p->value[i];
    }
    left->next = p->next;
    p->used = false;
    removed = at;
  } else {
    for (size_t i = 0; i < right->n; ++i) {
      p->key[p->n] = right->key[i];
      p->value[p->n++] = right->value[i];
    }
    p->next = right->next;
    right->used = false;
    removed = at + 1;
  }
  for (size_t i = removed + 1; i < t->n; ++i)
    t->child[i - 1] = t->child[i];
  --t->n;
  return true;
}
void range(const BTree *t, int lo, int hi) {
  const Leaf *p = t->child[route(t, lo)];
  for (; p; p = p->next)
    for (size_t i = 0; i < p->n; ++i) {
      if (p->key[i] >= hi)
        return;
      if (p->key[i] >= lo)
        printf("%d ", p->key[i]);
    }
  puts("");
}

int main(void) {
  BTree t;
  tree_init(&t);
  for (int key = 1; key <= 7; ++key)
    if (!tree_put(&t, key, key * 10))
      return 1;
  int value = 0;
  bool present = tree_find(&t, 6, &value);
  printf("found=%d value=%d missing=%d\n", present, value,
         !tree_find(&t, 99, &value));
  return 0;
}
```

Output:

```text
found=1 value=60 missing=1
```

Key six is found in the final leaf with value sixty. The missing-key call leaves the output value unchanged under this implementation.

**Watch for:** A pointer to a leaf entry may be invalidated by a split, merge, or compaction; copied results simplify the caller’s lifetime contract.

**Check:** Does a missing lookup return an entry pointer?

1. No
2. Yes

<details><summary>Answer</summary>

No. The Boolean result must be checked before treating the output as a match.

</details>

**Try:** Cross-check every lookup against a sorted-array reference after each insertion.

Run from the repository root:

```sh
make example EXAMPLE=bplus-trees-3
```

## 27.4 Inserting keys and splitting pages

A leaf split redistributes an overflow set into two valid pages and adds a routing child. Perform capacity checks before mutation.

This model combines four existing entries with the new key in a five-entry temporary array, then keeps two in the left leaf and three in a fresh leaf. It repairs next links and inserts the right child into the root’s ordered array. Root capacity and free-leaf availability are checked first, so a rejected split does not destroy existing entries.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { LEAF_MAX = 4, LEAF_POOL = 8 };
typedef struct Leaf {
  int key[LEAF_MAX], value[LEAF_MAX];
  size_t n;
  bool used;
  struct Leaf *next;
} Leaf;
typedef struct {
  Leaf pages[LEAF_POOL];
  Leaf *child[LEAF_POOL];
  size_t n;
} BTree;
void tree_init(BTree *t) {
  memset(t, 0, sizeof *t);
  t->n = 1;
  t->pages[0].used = true;
  t->child[0] = &t->pages[0];
}
size_t route(const BTree *t, int key) {
  size_t i = 0;
  while (i + 1 < t->n && t->child[i + 1]->key[0] <= key)
    ++i;
  return i;
}
bool tree_find(const BTree *t, int key, int *out) {
  const Leaf *p = t->child[route(t, key)];
  for (size_t i = 0; i < p->n; ++i)
    if (p->key[i] == key) {
      *out = p->value[i];
      return true;
    }
  return false;
}
bool tree_put(BTree *t, int key, int value) {
  size_t at = route(t, key);
  Leaf *p = t->child[at];
  int old;
  if (tree_find(t, key, &old))
    return false;
  if (p->n < LEAF_MAX) {
    size_t i = p->n++;
    while (i && p->key[i - 1] > key) {
      p->key[i] = p->key[i - 1];
      p->value[i] = p->value[i - 1];
      --i;
    }
    p->key[i] = key;
    p->value[i] = value;
    return true;
  }
  if (t->n == LEAF_POOL)
    return false;
  Leaf *right = NULL;
  for (size_t i = 0; i < LEAF_POOL; ++i)
    if (!t->pages[i].used) {
      right = &t->pages[i];
      break;
    }
  if (!right)
    return false;
  int keys[5], values[5];
  size_t j = 0;
  bool added = false;
  for (size_t i = 0; i < 5; ++i) {
    if (!added && (j == p->n || key < p->key[j])) {
      keys[i] = key;
      values[i] = value;
      added = true;
    } else {
      keys[i] = p->key[j];
      values[i] = p->value[j++];
    }
  }
  *right = (Leaf){0};
  right->used = true;
  p->n = 2;
  right->n = 3;
  for (size_t i = 0; i < 2; ++i) {
    p->key[i] = keys[i];
    p->value[i] = values[i];
  }
  for (size_t i = 0; i < 3; ++i) {
    right->key[i] = keys[i + 2];
    right->value[i] = values[i + 2];
  }
  right->next = p->next;
  p->next = right;
  for (size_t i = t->n; i > at + 1; --i)
    t->child[i] = t->child[i - 1];
  t->child[at + 1] = right;
  ++t->n;
  return true;
}
bool tree_erase(BTree *t, int key) {
  size_t at = route(t, key);
  Leaf *p = t->child[at];
  size_t pos = 0;
  while (pos < p->n && p->key[pos] != key)
    ++pos;
  if (pos == p->n)
    return false;
  for (size_t i = pos + 1; i < p->n; ++i) {
    p->key[i - 1] = p->key[i];
    p->value[i - 1] = p->value[i];
  }
  --p->n;
  if (t->n == 1 || p->n >= 2)
    return true;
  Leaf *left = at ? t->child[at - 1] : NULL,
       *right = at + 1 < t->n ? t->child[at + 1] : NULL;
  if (left && left->n > 2) {
    for (size_t i = p->n; i > 0; --i) {
      p->key[i] = p->key[i - 1];
      p->value[i] = p->value[i - 1];
    }
    --left->n;
    p->key[0] = left->key[left->n];
    p->value[0] = left->value[left->n];
    ++p->n;
    return true;
  }
  if (right && right->n > 2) {
    p->key[p->n] = right->key[0];
    p->value[p->n++] = right->value[0];
    for (size_t i = 1; i < right->n; ++i) {
      right->key[i - 1] = right->key[i];
      right->value[i - 1] = right->value[i];
    }
    --right->n;
    return true;
  }
  size_t removed;
  if (left) {
    for (size_t i = 0; i < p->n; ++i) {
      left->key[left->n] = p->key[i];
      left->value[left->n++] = p->value[i];
    }
    left->next = p->next;
    p->used = false;
    removed = at;
  } else {
    for (size_t i = 0; i < right->n; ++i) {
      p->key[p->n] = right->key[i];
      p->value[p->n++] = right->value[i];
    }
    p->next = right->next;
    right->used = false;
    removed = at + 1;
  }
  for (size_t i = removed + 1; i < t->n; ++i)
    t->child[i - 1] = t->child[i];
  --t->n;
  return true;
}
void range(const BTree *t, int lo, int hi) {
  const Leaf *p = t->child[route(t, lo)];
  for (; p; p = p->next)
    for (size_t i = 0; i < p->n; ++i) {
      if (p->key[i] >= hi)
        return;
      if (p->key[i] >= lo)
        printf("%d ", p->key[i]);
    }
  puts("");
}

int main(void) {
  BTree t;
  tree_init(&t);
  for (int key = 1; key <= 5; ++key)
    if (!tree_put(&t, key, key * 10))
      return 1;
  printf("leaves=%zu left=%zu right=%zu boundary=%d\n", t.n, t.child[0]->n,
         t.child[1]->n, t.child[1]->key[0]);
  return 0;
}
```

Output:

```text
leaves=2 left=2 right=3 boundary=3
```

The fifth insertion triggers the first split. The right leaf starts at key three and the left leaf links to it.

**Watch for:** A real multi-level implementation must propagate an internal-page overflow upward, including root growth.

**Check:** What must be checked before splitting this bounded model?

1. Only whether the new key is positive
2. Root-child capacity and a free leaf page

<details><summary>Answer</summary>

Root-child capacity and a free leaf page. A split needs both a new leaf and a new routing entry.

</details>

**Try:** Generalize root splitting with stable page IDs and test failure preservation at every allocation boundary.

Run from the repository root:

```sh
make example EXAMPLE=bplus-trees-4
```

## 27.5 Range queries and linked leaves

Range lookup combines one routed start with sequential leaf traversal. Keep inclusive and exclusive endpoints explicit.

The example prints keys in [2,7). After routing to the first relevant leaf, it follows next pointers until a key reaches the upper boundary. A balanced full B+ tree gives O(log n+k) logical work for k returned keys, with page costs depending on density and cache state. Linked-leaf order is an invariant worth checking independently of point lookups.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { LEAF_MAX = 4, LEAF_POOL = 8 };
typedef struct Leaf {
  int key[LEAF_MAX], value[LEAF_MAX];
  size_t n;
  bool used;
  struct Leaf *next;
} Leaf;
typedef struct {
  Leaf pages[LEAF_POOL];
  Leaf *child[LEAF_POOL];
  size_t n;
} BTree;
void tree_init(BTree *t) {
  memset(t, 0, sizeof *t);
  t->n = 1;
  t->pages[0].used = true;
  t->child[0] = &t->pages[0];
}
size_t route(const BTree *t, int key) {
  size_t i = 0;
  while (i + 1 < t->n && t->child[i + 1]->key[0] <= key)
    ++i;
  return i;
}
bool tree_find(const BTree *t, int key, int *out) {
  const Leaf *p = t->child[route(t, key)];
  for (size_t i = 0; i < p->n; ++i)
    if (p->key[i] == key) {
      *out = p->value[i];
      return true;
    }
  return false;
}
bool tree_put(BTree *t, int key, int value) {
  size_t at = route(t, key);
  Leaf *p = t->child[at];
  int old;
  if (tree_find(t, key, &old))
    return false;
  if (p->n < LEAF_MAX) {
    size_t i = p->n++;
    while (i && p->key[i - 1] > key) {
      p->key[i] = p->key[i - 1];
      p->value[i] = p->value[i - 1];
      --i;
    }
    p->key[i] = key;
    p->value[i] = value;
    return true;
  }
  if (t->n == LEAF_POOL)
    return false;
  Leaf *right = NULL;
  for (size_t i = 0; i < LEAF_POOL; ++i)
    if (!t->pages[i].used) {
      right = &t->pages[i];
      break;
    }
  if (!right)
    return false;
  int keys[5], values[5];
  size_t j = 0;
  bool added = false;
  for (size_t i = 0; i < 5; ++i) {
    if (!added && (j == p->n || key < p->key[j])) {
      keys[i] = key;
      values[i] = value;
      added = true;
    } else {
      keys[i] = p->key[j];
      values[i] = p->value[j++];
    }
  }
  *right = (Leaf){0};
  right->used = true;
  p->n = 2;
  right->n = 3;
  for (size_t i = 0; i < 2; ++i) {
    p->key[i] = keys[i];
    p->value[i] = values[i];
  }
  for (size_t i = 0; i < 3; ++i) {
    right->key[i] = keys[i + 2];
    right->value[i] = values[i + 2];
  }
  right->next = p->next;
  p->next = right;
  for (size_t i = t->n; i > at + 1; --i)
    t->child[i] = t->child[i - 1];
  t->child[at + 1] = right;
  ++t->n;
  return true;
}
bool tree_erase(BTree *t, int key) {
  size_t at = route(t, key);
  Leaf *p = t->child[at];
  size_t pos = 0;
  while (pos < p->n && p->key[pos] != key)
    ++pos;
  if (pos == p->n)
    return false;
  for (size_t i = pos + 1; i < p->n; ++i) {
    p->key[i - 1] = p->key[i];
    p->value[i - 1] = p->value[i];
  }
  --p->n;
  if (t->n == 1 || p->n >= 2)
    return true;
  Leaf *left = at ? t->child[at - 1] : NULL,
       *right = at + 1 < t->n ? t->child[at + 1] : NULL;
  if (left && left->n > 2) {
    for (size_t i = p->n; i > 0; --i) {
      p->key[i] = p->key[i - 1];
      p->value[i] = p->value[i - 1];
    }
    --left->n;
    p->key[0] = left->key[left->n];
    p->value[0] = left->value[left->n];
    ++p->n;
    return true;
  }
  if (right && right->n > 2) {
    p->key[p->n] = right->key[0];
    p->value[p->n++] = right->value[0];
    for (size_t i = 1; i < right->n; ++i) {
      right->key[i - 1] = right->key[i];
      right->value[i - 1] = right->value[i];
    }
    --right->n;
    return true;
  }
  size_t removed;
  if (left) {
    for (size_t i = 0; i < p->n; ++i) {
      left->key[left->n] = p->key[i];
      left->value[left->n++] = p->value[i];
    }
    left->next = p->next;
    p->used = false;
    removed = at;
  } else {
    for (size_t i = 0; i < right->n; ++i) {
      p->key[p->n] = right->key[i];
      p->value[p->n++] = right->value[i];
    }
    p->next = right->next;
    right->used = false;
    removed = at + 1;
  }
  for (size_t i = removed + 1; i < t->n; ++i)
    t->child[i - 1] = t->child[i];
  --t->n;
  return true;
}
void range(const BTree *t, int lo, int hi) {
  const Leaf *p = t->child[route(t, lo)];
  for (; p; p = p->next)
    for (size_t i = 0; i < p->n; ++i) {
      if (p->key[i] >= hi)
        return;
      if (p->key[i] >= lo)
        printf("%d ", p->key[i]);
    }
  puts("");
}

int main(void) {
  BTree t;
  tree_init(&t);
  for (int key = 1; key <= 7; ++key)
    if (!tree_put(&t, key, key * 10))
      return 1;
  range(&t, 2, 8);
  return 0;
}
```

Output:

```text
2 3 4 5 6 7
```

The executed fixture uses [2,8), returning six keys across all three leaves. The general contract excludes the upper bound.

**Watch for:** A range ending exactly at a separator must not duplicate or skip boundary keys.

**Check:** Is the upper endpoint included?

1. No
2. Yes

<details><summary>Answer</summary>

No. The API uses a half-open [lo,hi) range.

</details>

**Try:** Test empty ranges, missing boundary keys, and a range spanning every split; make the endpoint in code match your prediction.

Run from the repository root:

```sh
make example EXAMPLE=bplus-trees-5
```

## 27.6 Deletion, redistribution, and merging

After deletion, a nonroot leaf below minimum occupancy must borrow from a sibling or merge. Routing and next links must remain valid.

The implementation first tries a sibling with more than two entries, transferring one entry and preserving order. Otherwise it merges adjacent leaves, releases a pool slot, shifts root children, and repairs the forward link. The sole root leaf may be empty. This two-level model has no internal underflow beyond shrinking its root child array.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { LEAF_MAX = 4, LEAF_POOL = 8 };
typedef struct Leaf {
  int key[LEAF_MAX], value[LEAF_MAX];
  size_t n;
  bool used;
  struct Leaf *next;
} Leaf;
typedef struct {
  Leaf pages[LEAF_POOL];
  Leaf *child[LEAF_POOL];
  size_t n;
} BTree;
void tree_init(BTree *t) {
  memset(t, 0, sizeof *t);
  t->n = 1;
  t->pages[0].used = true;
  t->child[0] = &t->pages[0];
}
size_t route(const BTree *t, int key) {
  size_t i = 0;
  while (i + 1 < t->n && t->child[i + 1]->key[0] <= key)
    ++i;
  return i;
}
bool tree_find(const BTree *t, int key, int *out) {
  const Leaf *p = t->child[route(t, key)];
  for (size_t i = 0; i < p->n; ++i)
    if (p->key[i] == key) {
      *out = p->value[i];
      return true;
    }
  return false;
}
bool tree_put(BTree *t, int key, int value) {
  size_t at = route(t, key);
  Leaf *p = t->child[at];
  int old;
  if (tree_find(t, key, &old))
    return false;
  if (p->n < LEAF_MAX) {
    size_t i = p->n++;
    while (i && p->key[i - 1] > key) {
      p->key[i] = p->key[i - 1];
      p->value[i] = p->value[i - 1];
      --i;
    }
    p->key[i] = key;
    p->value[i] = value;
    return true;
  }
  if (t->n == LEAF_POOL)
    return false;
  Leaf *right = NULL;
  for (size_t i = 0; i < LEAF_POOL; ++i)
    if (!t->pages[i].used) {
      right = &t->pages[i];
      break;
    }
  if (!right)
    return false;
  int keys[5], values[5];
  size_t j = 0;
  bool added = false;
  for (size_t i = 0; i < 5; ++i) {
    if (!added && (j == p->n || key < p->key[j])) {
      keys[i] = key;
      values[i] = value;
      added = true;
    } else {
      keys[i] = p->key[j];
      values[i] = p->value[j++];
    }
  }
  *right = (Leaf){0};
  right->used = true;
  p->n = 2;
  right->n = 3;
  for (size_t i = 0; i < 2; ++i) {
    p->key[i] = keys[i];
    p->value[i] = values[i];
  }
  for (size_t i = 0; i < 3; ++i) {
    right->key[i] = keys[i + 2];
    right->value[i] = values[i + 2];
  }
  right->next = p->next;
  p->next = right;
  for (size_t i = t->n; i > at + 1; --i)
    t->child[i] = t->child[i - 1];
  t->child[at + 1] = right;
  ++t->n;
  return true;
}
bool tree_erase(BTree *t, int key) {
  size_t at = route(t, key);
  Leaf *p = t->child[at];
  size_t pos = 0;
  while (pos < p->n && p->key[pos] != key)
    ++pos;
  if (pos == p->n)
    return false;
  for (size_t i = pos + 1; i < p->n; ++i) {
    p->key[i - 1] = p->key[i];
    p->value[i - 1] = p->value[i];
  }
  --p->n;
  if (t->n == 1 || p->n >= 2)
    return true;
  Leaf *left = at ? t->child[at - 1] : NULL,
       *right = at + 1 < t->n ? t->child[at + 1] : NULL;
  if (left && left->n > 2) {
    for (size_t i = p->n; i > 0; --i) {
      p->key[i] = p->key[i - 1];
      p->value[i] = p->value[i - 1];
    }
    --left->n;
    p->key[0] = left->key[left->n];
    p->value[0] = left->value[left->n];
    ++p->n;
    return true;
  }
  if (right && right->n > 2) {
    p->key[p->n] = right->key[0];
    p->value[p->n++] = right->value[0];
    for (size_t i = 1; i < right->n; ++i) {
      right->key[i - 1] = right->key[i];
      right->value[i - 1] = right->value[i];
    }
    --right->n;
    return true;
  }
  size_t removed;
  if (left) {
    for (size_t i = 0; i < p->n; ++i) {
      left->key[left->n] = p->key[i];
      left->value[left->n++] = p->value[i];
    }
    left->next = p->next;
    p->used = false;
    removed = at;
  } else {
    for (size_t i = 0; i < right->n; ++i) {
      p->key[p->n] = right->key[i];
      p->value[p->n++] = right->value[i];
    }
    p->next = right->next;
    right->used = false;
    removed = at + 1;
  }
  for (size_t i = removed + 1; i < t->n; ++i)
    t->child[i - 1] = t->child[i];
  --t->n;
  return true;
}
void range(const BTree *t, int lo, int hi) {
  const Leaf *p = t->child[route(t, lo)];
  for (; p; p = p->next)
    for (size_t i = 0; i < p->n; ++i) {
      if (p->key[i] >= hi)
        return;
      if (p->key[i] >= lo)
        printf("%d ", p->key[i]);
    }
  puts("");
}

int main(void) {
  BTree t;
  tree_init(&t);
  for (int key = 1; key <= 5; ++key)
    tree_put(&t, key, key * 10);
  tree_erase(&t, 1);
  tree_erase(&t, 2);
  printf("leaves=%zu remaining=", t.n);
  range(&t, 0, 99);
  return 0;
}
```

Output:

```text
leaves=1 remaining=3 4 5
```

The first removal borrows from the right sibling; the second forces a merge into one leaf. Ordered keys and leaf-chain traversal still agree.

**Watch for:** Deleting a key without repairing separators or sibling links can leave point queries passing while ranges fail.

**Check:** When may this model keep an empty leaf?

1. For every nonroot leaf after deletion
2. When it is the sole root leaf

<details><summary>Answer</summary>

When it is the sole root leaf. The root has a special occupancy exception.

</details>

**Try:** Generate insert/delete sequences and check ordering, uniqueness, occupancy, reachability, and pool ownership after each step.

Run from the repository root:

```sh
make example EXAMPLE=bplus-trees-6
```

## Build it yourself

Implement an ordered index that remains valid when pages split.

1. Build and test a bounded B+ index before encoding its pages. Preserve routing, occupancy, and leaf-link invariants.
2. Generate insert/delete sequences and check ordering, uniqueness, occupancy, reachability, and pool ownership after each step.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=bplus-trees-6
```

Chapter workspace command: `make chapter CHAPTER=bplus-trees`.

Generated from dist/part6.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/bplus-trees
