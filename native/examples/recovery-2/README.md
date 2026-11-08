# A single-writer transaction model

Complete native example, ready to edit and run in Codespaces or locally.

## 29.2 A single-writer transaction model

A single-writer transaction model serializes mutations and simplifies conflict handling. The restriction must be enforced by the caller or service.

begin refuses to start another transaction using the same active handle, but the model has no global lock. A real multi-client service must route all writers through one owner or protect admission with synchronization. Readers also need a contract about whether they see committed state or a working copy.

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
  Transaction tx = {0};
  bool first = begin(&tx, &live), nested = begin(&tx, &live);
  printf("first=%d nested=%d live_rows=%zu\n", first, nested, live.count);
  rollback(&tx);
  return 0;
}
```

Output:

```text
first=1 nested=0 live_rows=0
```

The active flag protects one handle’s lifecycle. It does not prevent a second unrelated handle from writing the same live table.

**Watch for:** A comment saying single writer does not synchronize multiple clients.

**Check:** What must the surrounding service enforce?

1. Only a per-thread local variable name
2. Exclusive mutation ownership

<details><summary>Answer</summary>

Exclusive mutation ownership. The same live state must not be concurrently mutated through independent handles.

</details>

**Try:** Add an admission lock or a request queue and test two competing transaction starts.

Run from the repository root:

```sh
make example EXAMPLE=recovery-2
```

