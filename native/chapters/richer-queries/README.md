# Chapter 43: Richer queries

Part 9: Advanced TinyDB. Teaching baseline: C17.

Add query capabilities with explicit key ordering, typed parameters, and evidence that optimized execution preserves results.

## Outcomes

- Use a composite key consistently for ordering and lookup.
- Bind typed parameters rather than concatenating SQL strings.
- Compare estimated and measured work without changing query results.

## 43.1 Joins, composite indexes, and prepared statements

Composite indexes compare the first tuple field, then the second to break a tie; prepared statements separate a fixed query shape from typed parameters; joins can use the same key lookup.

Also editable and runnable inline in the browser course.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/richer-queries/1). In main.c, change bind(&p, 1, 2) to bind(&p, 2, 1). Run code and compare prepared= with all join= lines. Which row changes when the known query’s two bound values change?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [SQLite C interface: prepared statements](https://www.sqlite.org/c3ref/prepare.html) (online) — Read preparation and statement lifecycle contracts; these are design comparisons, not TinyDB APIs.
- [SQLite documentation: query planning](https://www.sqlite.org/queryplanner.html) (online) — Compare scans, index lookups, sorting, and cost choices; TinyDB implements a smaller model.

**Use the documentation (optional):** Does preparing a statement automatically mean every value is a safe parameter, or that the program can ignore its lifecycle?

<details><summary>Compare your answer</summary>

No. Read the API’s prepare, bind, step, reset, and finalize contracts. Preparation, parameter binding, and resource ownership are distinct responsibilities.

</details>

Native source: `native/examples/richer-queries-1/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=richer-queries-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 43.2 Better statistics and query planning

Better statistics model the distribution that predicates actually encounter. Histograms can represent skew that a uniform estimate misses.

Also editable and runnable inline in the browser course.

The histogram counts each stored score instead of assuming ten possible score values are equally frequent. The figure compares both estimates with the actual row counts. These statistics describe this snapshot of data; updates can make them stale, and independent single-column histograms still miss correlations between columns.

### Data frequency changes the match estimate

The same eight rows support very different estimates under uniform and observed frequencies.

There are eight score rows: seven have score one and one has score nine. A uniform model over ten possible score values predicts eight divided by ten, or zero point eight matches for either queried value. A histogram counted from the same rows predicts seven matches for score one and one match for score nine, equal to the actual counts in this fixture. The row total is eight in both cases.

The histogram is built from this fixed data. Later updates can make it stale, and single-column counts do not capture correlations between fields.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/richer-queries/2). In main.c, replace two of the seven 1s in scores with 9s and run. Compare uniform=, histogram=, and actual=. Which estimate can reflect the changed frequency of 1?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [SQLite documentation: query planning](https://www.sqlite.org/queryplanner.html) (online) — Compare scans, index lookups, sorting, and cost choices; TinyDB implements a smaller model.
- [SQLite C interface: prepared statements](https://www.sqlite.org/c3ref/prepare.html) (online) — Read preparation and statement lifecycle contracts; these are design comparisons, not TinyDB APIs.

Native source: `native/examples/richer-queries-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=richer-queries-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 43.3 Explaining and measuring execution choices

An optimized plan must first return the same logical result. Instrument matching units when comparing its work with a baseline.

Also editable and runnable inline in the browser course.

The fixture joins three lookup keys against eight ordered IDs. The nested baseline compares every pair; the indexed path counts ordering comparisons plus its final equality checks. Its result count agrees with the baseline. Equal counts alone do not establish equal result rows; the chapter project checks those rows including duplicates. These are comparison counts, not page reads or elapsed time; the index’s construction and maintenance costs are separate.

### A query passes through distinct responsibilities

Parsing syntax is different from validating and executing it.

A SQL source string is tokenized and parsed into a statement representation. Validation checks supported operations and schema rules. Planning chooses a strategy such as a scan or index lookup. Execution performs that strategy and produces rows or an error. These boxes name responsibilities; small implementations can combine some stages.

A conceptual pipeline, not evidence that every SQL feature or optimizer transformation is implemented.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/richer-queries/3). In main.c, replace the last query key 8 with 9 and run. Compare nested=, indexed=, and results=. What correctness evidence comes before interpreting the modeled comparison counts?

**Extend the example:** An index also has a build cost. A larger experiment can separately count comparisons to build the index and answer queries on the same dataset.

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [SQLite documentation: EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html) (online) — Compare a plan explanation with measured execution work.
- [SQLite documentation: query planning](https://www.sqlite.org/queryplanner.html) (online) — Compare scans, index lookups, sorting, and cost choices; TinyDB implements a smaller model.

Native source: `native/examples/richer-queries-3/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=richer-queries-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## Build it yourself

Compare richer query plans using correctness tests and measured work.

1. Compare complete result multisets including duplicates, then add index-build cost and page-cache counters.
2. Run baseline and indexed joins on duplicate keys, missing keys, and keys from different tenants.

### Check your work

- Compare complete result pairs including duplicates before comparing query work; count index construction separately.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=richer-queries-3
```

Chapter workspace command: `make chapter CHAPTER=richer-queries`.

Generated from dist/part9.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/richer-queries
