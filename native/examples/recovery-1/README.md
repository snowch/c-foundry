# Atomicity, consistency, isolation, and durability

Complete native example, ready to edit and run in Codespaces or locally.

## 29.1 Atomicity, consistency, isolation, and durability

Atomicity, consistency, isolation, and durability describe different obligations. Name which ones an implementation actually provides.

The copy-on-begin transaction model keeps uncommitted changes in a private working table, providing an all-or-nothing publication step for this single-threaded fixture. Table operations enforce schema consistency. It provides neither concurrent isolation nor crash durability by itself; those need synchronization and a persistence protocol. A process-local struct assignment is not a durable commit.

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
  Table working;
  Table *live;
  bool active;
} Transaction;
bool begin(Transaction *tx, Table *live) {
  if (tx->active)
    return false;
  tx->working = *live;
  tx->live = live;
  tx->active = true;
  return true;
}
bool commit(Transaction *tx) {
  if (!tx->active)
    return false;
  *tx->live = tx->working;
  tx->active = false;
  return true;
}
void rollback(Transaction *tx) {
  tx->active = false;
  tx->live = NULL;
}

int main(void) {
  Table live = {0};
  insert_row(&live, (Row){1, "Ada", 90});
  Transaction tx = {0};
  begin(&tx, &live);
  update_score(&tx.working, 1, 1);
  rollback(&tx);
  printf("after_rollback=%u\n", (unsigned)live.rows[0].score);
  return 0;
}
```

Output:

```text
after_rollback=90
```

The tentative score one was never copied into live state. Rollback discards the transaction’s publication ability.

**Watch for:** Passing a rollback test does not establish the other ACID properties.

**Check:** Does this memory-only rollback guarantee durability?

1. No
2. Yes

<details><summary>Answer</summary>

No. Process memory can disappear without a persistent recovery protocol.

</details>

**Try:** Write a guarantee table for each ACID property and identify the mechanism or missing work for each.

Run from the repository root:

```sh
make example EXAMPLE=recovery-1
```

