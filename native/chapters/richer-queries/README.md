# Chapter 43: Richer queries

Part 9: Advanced TinyDB. Teaching baseline: C17.

Add query capabilities with explicit key ordering, typed parameters, and evidence that optimized execution preserves results.

## Outcomes

- Use a composite key consistently for ordering and lookup.
- Bind typed parameters rather than concatenating SQL strings.
- Compare estimated and measured work without changing query results.

## 43.1 Joins, composite indexes, and prepared statements

Composite indexes order tuples lexicographically; prepared statements separate a fixed query shape from typed parameters; joins can use the same key lookup.

The fixture supports one exact prepared query shape, deliberately not a general SQL preparer. It binds tenant and ID as unsigned values and executes a composite-key binary search. The same lookup serves an indexed join from orders to customers, preserving one output per matching order. Adding these capabilities to the earlier SQL grammar is an assembly exercise with new parser and validation tests.

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
  unsigned tenant, id;
  const char *name;
} Customer;
int compare_key(const Customer *a, unsigned tenant, unsigned id) {
  if (a->tenant != tenant)
    return (a->tenant > tenant) - (a->tenant < tenant);
  return (a->id > id) - (a->id < id);
}
const Customer *lookup_customer(const Customer *rows, size_t n, unsigned tenant,
                                unsigned id) {
  size_t lo = 0, hi = n;
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (compare_key(&rows[mid], tenant, id) < 0)
      lo = mid + 1;
    else
      hi = mid;
  }
  return lo < n && compare_key(&rows[lo], tenant, id) == 0 ? &rows[lo] : NULL;
}
typedef struct {
  bool prepared, bound;
  unsigned tenant, id;
} Prepared;
bool prepare(Prepared *p, const char *sql) {
  *p = (Prepared){0};
  if (strcmp(sql, "SELECT name FROM people WHERE tenant = ? AND id = ?;") != 0)
    return false;
  p->prepared = true;
  return true;
}
bool bind(Prepared *p, unsigned tenant, unsigned id) {
  if (!p->prepared || !tenant || !id)
    return false;
  p->tenant = tenant;
  p->id = id;
  p->bound = true;
  return true;
}
const Customer *execute_prepared(const Prepared *p, const Customer *rows,
                                 size_t n) {
  return p->prepared && p->bound ? lookup_customer(rows, n, p->tenant, p->id)
                                 : NULL;
}

int main(void) {
  Customer customers[] = {{1, 1, "Ada"}, {1, 2, "Grace"}, {2, 1, "Ken"}};
  Prepared p;
  if (!prepare(&p, "SELECT name FROM people WHERE tenant = ? AND id = ?;") ||
      !bind(&p, 1, 2))
    return 1;
  const Customer *row = execute_prepared(&p, customers, 3);
  if (!row)
    return 1;
  printf("prepared=%s\n", row->name);
  struct Order {
    unsigned tenant, person, total;
  } orders[] = {{1, 1, 20}, {1, 1, 30}, {2, 1, 40}};
  for (size_t i = 0; i < 3; ++i) {
    row = lookup_customer(customers, 3, orders[i].tenant, orders[i].person);
    if (row)
      printf("join=%s:%u\n", row->name, orders[i].total);
  }
  return 0;
}
```

Output:

```text
prepared=Grace
join=Ada:20
join=Ada:30
join=Ken:40
```

Tenant two’s ID one correctly selects Ken rather than tenant one’s Ada. Two orders for Ada produce two join rows.

**Watch for:** A composite index on (tenant,id) does not directly provide global ordering by id alone.

**Check:** Why bind values instead of appending them into SQL text?

1. To keep data separate from the prepared syntax
2. To bypass schema validation

<details><summary>Answer</summary>

To keep data separate from the prepared syntax. Typed binding retains the query structure while validating values separately.

</details>

**Try:** Generalize preparation through the real parser, add parameter types and lifetime rules, and test composite-prefix queries.

Run from the repository root:

```sh
make example EXAMPLE=richer-queries-1
```

## 43.2 Better statistics and query planning

Better statistics model the distribution that predicates actually encounter. Histograms can represent skew that a uniform estimate misses.

The fixture has seven score-one rows and one score-nine row. A ten-value uniform model estimates 0.8 matches for score one, while a per-value histogram records seven. These statistics describe this snapshot of data; updates can make them stale, and independent single-column histograms still miss correlations between columns.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  unsigned scores[] = {1, 1, 1, 1, 1, 1, 1, 9}, histogram[10] = {0}, actual = 0;
  for (size_t i = 0; i < 8; ++i)
    ++histogram[scores[i]];
  for (size_t i = 0; i < 8; ++i)
    if (scores[i] == 1)
      ++actual;
  printf("uniform=%.2f histogram=%u actual=%u\n", 8.0 / 10.0, histogram[1],
         actual);
  return 0;
}
```

Output:

```text
uniform=0.80 histogram=7 actual=7
```

The histogram matches this known dataset’s count. Its accuracy does not eliminate the need to measure execution or refresh after changes.

**Watch for:** Collecting statistics may have its own cost and locking or snapshot requirements.

**Check:** Why is the uniform estimate poor here?

1. All tables always have ten equally likely values
2. The values are heavily skewed

<details><summary>Answer</summary>

The values are heavily skewed. The distribution assumption disagrees with the stored data.

</details>

**Try:** Collect a bounded histogram from a consistent snapshot and compare planner decisions before and after a skewed update workload.

Run from the repository root:

```sh
make example EXAMPLE=richer-queries-2
```

## 43.3 Explaining and measuring execution choices

An optimized plan must first return the same logical result. Instrument matching units when comparing its work with a baseline.

The fixture joins three lookup keys against eight ordered IDs. The nested baseline compares every pair; the indexed path counts ordering comparisons plus its final equality checks. Its result count agrees with the baseline. These are comparison counts, not page reads or elapsed time; the index’s construction and maintenance costs are separate.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  int ids[] = {1, 2, 3, 4, 5, 6, 7, 8}, keys[] = {2, 4, 8};
  unsigned nested = 0, indexed = 0, a = 0, b = 0;
  for (size_t k = 0; k < 3; ++k) {
    for (size_t i = 0; i < 8; ++i) {
      ++nested;
      if (ids[i] == keys[k])
        ++a;
    }
    size_t lo = 0, hi = 8;
    while (lo < hi) {
      ++indexed;
      size_t mid = lo + (hi - lo) / 2;
      if (ids[mid] < keys[k])
        lo = mid + 1;
      else
        hi = mid;
    }
    if (lo < 8) {
      ++indexed;
      if (ids[lo] == keys[k])
        ++b;
    }
  }
  if (a != b)
    return 1;
  printf("nested=%u indexed=%u results=%u\n", nested, indexed, b);
  return 0;
}
```

Output:

```text
nested=24 indexed=13 results=3
```

Thirteen counted comparisons replace twenty-four in this fixture. Smaller or differently ordered workloads may have different tradeoffs.

**Watch for:** Mixing comparator calls in one plan with only successful matches in another produces an invalid comparison.

**Check:** What must match before comparing performance?

1. The query’s logical results
2. The chosen operator names

<details><summary>Answer</summary>

The query’s logical results. A faster plan that drops or duplicates rows is incorrect.

</details>

**Try:** Compare complete result multisets including duplicates, then add index-build cost and page-cache counters.

Run from the repository root:

```sh
make example EXAMPLE=richer-queries-3
```

## Build it yourself

Compare richer query plans using correctness tests and measured work.

1. Add query capabilities with explicit key ordering, typed parameters, and evidence that optimized execution preserves results.
2. Compare complete result multisets including duplicates, then add index-build cost and page-cache counters.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=richer-queries-3
```

Chapter workspace command: `make chapter CHAPTER=richer-queries`.

Generated from dist/part9.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/richer-queries
