# Joins, composite indexes, and prepared statements

Complete native example, ready to edit and run in Codespaces or locally.

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

