# Chapter 22: Rows and in-memory tables

Part 5: Build TinyDB. Teaching baseline: C17.

Implement row lifecycle operations while keeping key uniqueness and initialized-count invariants true.

## Outcomes

- Insert, find, update, and delete through an explicit status API.
- Preserve state after rejected operations.
- Check a table’s invariants after operation sequences.

## 22.1 Representing rows with structs

A table’s initialized count is not its reserved capacity. Only rows below count belong to the logical table.

Table t={0} initializes an empty table. Row assignment copies embedded arrays as part of the struct, while pointer fields would require a separate ownership policy. The fixed array avoids allocation during table operations but imposes a deliberate capacity limit. The name field must contain a terminator within its 32 bytes.

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

int main(void) {
  Table t = {.count = 0};
  Row source = {7, "Ada", 95};
  insert_row(&t, source);
  source.name[0] = 'X';
  printf("count=%zu stored=%s source=%s\n", t.count, t.rows[0].name,
         source.name);
  return 0;
}
```

Output:

```text
count=1 stored=Ada source=Xda
```

Changing the source name after insertion does not affect the stored row because the embedded bytes were copied.

### The stored row has its own embedded name array

Why does changing source.name leave the stored name unchanged?

Why does changing source.name leave the stored name unchanged? After source.name[0] = X. Source Row. 7 | Xda | 95. source. separate struct; Stored Row · count=1. 7 | Ada | 95. t.rows[0]. struct assignment copied fields. The fixed Table has capacity 8. Struct assignment copies embedded arrays; pointer members would need a separate ownership policy.

The fixed Table has capacity 8. Struct assignment copies embedded arrays; pointer members would need a separate ownership policy. Illustration of the supplied example; edits do not update this picture.

**Watch for:** Replacing the array with char * would make the same assignment share a target rather than clone it.

**Check:** Does this row assignment copy the embedded name array?

1. Yes
2. No

<details><summary>Answer</summary>

Yes. A compatible struct assignment copies its array members as part of the struct value.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/tables/1). In main.c, change source.name[0] = 'X'; to source.name[0] = 'E';. Run code and compare stored= and source=. Which value demonstrates that insert_row copied the name array into the table?

### References and help

- [C reference: structures](https://en.cppreference.com/w/c/language/struct.html) — Find member access, layout constraints, and padding rules.
- [SQLite documentation: SELECT](https://www.sqlite.org/lang_select.html) — Compare SQL clause behavior with the deliberately smaller TinyDB grammar.

**Use the documentation (optional):** Does a C struct declaration serialize a portable database row by itself?

<details><summary>Compare your answer</summary>

No. It describes a C object layout that can include padding and target-specific representation. A portable stored row needs explicit field widths and byte encoding.

</details>

Native source: `native/examples/tables-1.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=tables-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 22.2 Inserting and selecting records

Insertion and selection form the minimal useful table interface. Return an explicit missing result before accessing row storage.

find_row performs a linear scan and returns −1 for absence. Its signed result is tested before conversion to an array index. Full-table selection preserves insertion order in this baseline. Both lookup and a full selection take O(n) worst-case time; selection necessarily visits every emitted row.

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

int main(void) {
  Table t = {.count = 0};
  insert_row(&t, (Row){2, "Grace", 80});
  insert_row(&t, (Row){1, "Ada", 90});
  display(&t);
  printf("missing=%d\n", find_row(&t, 99) < 0);
  return 0;
}
```

Output:

```text
2 | Grace | 80
1 | Ada | 90
missing=1
```

Storage order is the order of successful insertion, not sorted ID order. Binary search would therefore be invalid on this array.

### Insertion order and live row count

Why does display print Grace before Ada?

Why does display print Grace before Ada? Slot; Inserted record; Included by display?. rows[0]; 2 | Grace | 80; Yes; rows[1]; 1 | Ada | 90; Yes; rows[2..7]; spare capacity; No. . . count=2 and capacity=8. This bounded table preserves insertion order; the ID lookup is a scan. The separate missing=1 result refers to find_row(t,99).

count=2 and capacity=8. This bounded table preserves insertion order; the ID lookup is a scan. The separate missing=1 result refers to find_row(t,99). Illustration of the supplied example; edits do not update this picture.

**Watch for:** Do not cast −1 to size_t and use it as an index.

**Check:** Is this table sorted by ID?

1. Yes
2. No

<details><summary>Answer</summary>

No. The insertion operation appends rather than maintaining sorted order.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/tables/2). In main.c, change the key 99 in find_row(&t, 99) to 1. Run code and compare missing= with the starter. Which displayed record made that predicate false?

### References and help

- [C reference: structures](https://en.cppreference.com/w/c/language/struct.html) — Find member access, layout constraints, and padding rules.
- [SQLite documentation: SELECT](https://www.sqlite.org/lang_select.html) — Compare SQL clause behavior with the deliberately smaller TinyDB grammar.

Native source: `native/examples/tables-2.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=tables-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 22.3 Duplicate IDs and capacity limits

A failed insertion must leave existing rows intact. Define which error wins when more than one condition applies.

This API checks row validity, then duplicate identity, then capacity. Therefore a duplicate in a full table reports DUPLICATE. That priority is observable behavior and belongs in tests. Appending occurs only after every check has passed, so count and existing records stay unchanged on rejection.

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

int main(void) {
  Table t = {.count = 0};
  for (unsigned i = 1; i <= TABLE_CAP; ++i)
    if (insert_row(&t, (Row){i, "row", 0}) != OK)
      return 1;
  Status duplicate = insert_row(&t, (Row){1, "other", 0});
  Status extra = insert_row(&t, (Row){99, "extra", 0});
  printf("duplicate=%d full=%d count=%zu\n",
         duplicate == DUPLICATE, extra == FULL, t.count);
  return 0;
}
```

Output:

```text
duplicate=1 full=1 count=8
```

The duplicate and new ninth key produce distinct failures. Neither increases the initialized count.

### Rejected inserts leave the full table unchanged

Why do both attempts fail while count stays 8?

Why do both attempts fail while count stays 8? Table already contains IDs 1..8; count=capacity=8. Insert ID 1 again. DUPLICATE. The duplicate check runs before the capacity check.; Insert new ID 99. FULL. The ID is new, but no slot remains.. Both rejected operations retain the existing eight rows. A failure status is not an extra row or an increment of count.

Both rejected operations retain the existing eight rows. A failure status is not an extra row or an increment of count. Illustration of the supplied example; edits do not update this picture.

**Watch for:** An API can be inconsistent even if it never crashes: error priority and state preservation need tests too.

**Check:** What is returned for a duplicate ID in a full table?

1. DUPLICATE under this documented policy
2. An insertion that overwrites the first row

<details><summary>Answer</summary>

DUPLICATE under this documented policy. Duplicate checking precedes the capacity check.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/tables/3). In main.c, change TABLE_CAP to TABLE_CAP - 1 in the fill loop’s upper bound. Run code and compare duplicate=, full=, and count=. Which of the two following insertions can now claim the free slot?

### References and help

- [C reference: structures](https://en.cppreference.com/w/c/language/struct.html) — Find member access, layout constraints, and padding rules.
- [SQLite documentation: SELECT](https://www.sqlite.org/lang_select.html) — Compare SQL clause behavior with the deliberately smaller TinyDB grammar.

Native source: `native/examples/tables-3.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=tables-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 22.4 Updating and deleting rows

Update changes selected fields of an existing logical row; deletion removes membership and repairs the physical layout.

The score update keeps the ID and name unchanged. Deletion shifts later rows left to preserve baseline selection order, taking O(n) time. Any borrowed row address at or after the deleted position may now refer to a different logical row. A missing update or delete returns MISSING without changing the table.

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

int main(void) {
  Table t = {.count = 0};
  insert_row(&t, (Row){1, "Ada", 90});
  insert_row(&t, (Row){2, "Grace", 80});
  update_score(&t, 2, 99);
  delete_row(&t, 1);
  display(&t);
  printf("missing=%d\n", delete_row(&t, 1) == MISSING);
  return 0;
}
```

Output:

```text
2 | Grace | 99
missing=1
```

Grace moves to position zero after deleting Ada, but her ID remains two and her updated score remains 99.

**Watch for:** Swap-with-last deletion can be faster but changes row order; it needs a different public ordering contract.

**Check:** Does a saved array position remain a stable row identity after deletion?

1. Yes
2. No

<details><summary>Answer</summary>

No. Shifting changes the position-to-row mapping.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/tables/4). In main.c, change the first delete_row(&t, 1) to delete_row(&t, 2) and leave the second call unchanged. Run code and compare the displayed row and missing=. When does the later delete actually find ID 1?

### References and help

- [C reference: structures](https://en.cppreference.com/w/c/language/struct.html) — Find member access, layout constraints, and padding rules.
- [SQLite documentation: SELECT](https://www.sqlite.org/lang_select.html) — Compare SQL clause behavior with the deliberately smaller TinyDB grammar.

Native source: `native/examples/tables-4.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=tables-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 22.5 A working in-memory database

A working in-memory database needs consistent behavior across sequences, not just isolated successful calls.

The fixture combines insertion, duplicate rejection, update, and deletion, then checks the surviving row by logical key. These checks are a starting point for state-machine testing: maintain an independent simple reference collection and compare results after generated operations. Persistence and concurrent access are still separate capabilities.

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

int main(void) {
  Table t = {.count = 0};
  if (insert_row(&t, (Row){1, "Ada", 90}) != OK ||
      insert_row(&t, (Row){2, "Grace", 80}) != OK)
    return 1;
  if (update_score(&t, 2, 88) != OK || delete_row(&t, 1) != OK)
    return 1;
  int i = find_row(&t, 2);
  if (t.count != 1 || i < 0 || t.rows[i].score != 88)
    return 1;
  display(&t);
  puts("table contract passed");
  return 0;
}
```

Output:

```text
2 | Grace | 88
table contract passed
```

The final state contains exactly the updated surviving row. Checking by ID prevents the test from relying unnecessarily on an intermediate array position.

**Watch for:** Passing this sequence does not establish every possible operation ordering or memory-safety property.

**Check:** What should a generated operation test compare?

1. Public results and logical state against a reference
2. Only whether the process prints a pass line

<details><summary>Answer</summary>

Public results and logical state against a reference. An independent model can detect errors that the implementation’s own assumptions would miss.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/tables/5). In main.c, change the update value 88 and the expected value in t.rows[i].score != 88 to 95. Run code and compare Grace’s printed score and table contract passed. Which equality protects against passing a check with an incorrect value?

### References and help

- [C reference: structures](https://en.cppreference.com/w/c/language/struct.html) — Find member access, layout constraints, and padding rules.
- [SQLite documentation: SELECT](https://www.sqlite.org/lang_select.html) — Compare SQL clause behavior with the deliberately smaller TinyDB grammar.

Native source: `native/examples/tables-5.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=tables-5 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## Chapter practice

Edit `native/exercises/query.c`, then run:

```sh
make exercise EXERCISE=query
```

## Build it yourself

Insert records, reject duplicates, and find rows by ID.

1. Generate bounded insert/update/delete sequences and check invariants after every operation.
2. Run bounded insert, update, and delete sequences against a simple independent reference table.

### Check your work

- After each operation, check status, row count, unique IDs, and complete surviving row values.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=tables-5
```

Chapter workspace command: `make chapter CHAPTER=tables`.

Generated from dist/part5.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/tables
