# BEGIN, COMMIT, and ROLLBACK

Complete Linux example, ready to edit and run in the browser terminal.

## 29.3 BEGIN, COMMIT, and ROLLBACK

BEGIN establishes a working state, COMMIT publishes it under the model’s contract, and ROLLBACK discards it. Repeated or out-of-order commands need defined failures.

Also editable and runnable inline in the browser course. This is a bounded, single-threaded model. Run and change it here; use a native build for the full system and its host-specific guarantees.

The fixture commits one score update and then rolls back another. In this bounded single-threaded model, readers of live state see only the committed value. A production commit must also handle log failures and durable acknowledgement; copying the table here teaches state transition semantics only.

### A private working copy can commit or roll back

Uncommitted edits do not replace the live table in this model.

The live table starts with a score of 10. Begin copies it into a private working table. Editing changes the working score to 42 while live remains 10. Commit publishes the working table, making live 42. Rollback discards the working changes and leaves live 10.

An in-process, single-writer model. Publication alone provides neither crash durability nor concurrent isolation.

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
  Table live = {.count = 0};
  insert_row(&live, (Row){1, "Ada", 90});
  Transaction tx = {.active = false};
  begin(&tx, &live);
  update_score(&tx.working, 1, 95);
  commit(&tx);
  begin(&tx, &live);
  update_score(&tx.working, 1, 0);
  rollback(&tx);
  printf("committed_score=%u invalid_commit=%d\n", (unsigned)live.rows[0].score,
         !commit(&tx));
  return 0;
}
```

Output:

```text
committed_score=95 invalid_commit=1
```

The committed 95 survives the later rollback. Committing an inactive transaction fails.

**Watch for:** A failed durable commit must not be reported as successful merely because the working copy is valid.

**Check:** Which score is visible after the rollback?

1. The earlier committed 95
2. The later tentative zero

<details><summary>Answer</summary>

The earlier committed 95. Rollback never publishes its private working table.

</details>

**Try:** Define session ownership and behavior for COMMIT without BEGIN, nested BEGIN, and disconnect during a transaction.

### References and help

- [SQLite documentation: transactions](https://www.sqlite.org/lang_transaction.html) — Compare BEGIN, COMMIT, and ROLLBACK with the deliberately smaller transaction model.
- [SQLite documentation: atomic commit](https://www.sqlite.org/atomiccommit.html) — Read the failure assumptions and ordering required for a durable commit protocol.

Run from the repository root:

```sh
make example EXAMPLE=recovery-3
```

