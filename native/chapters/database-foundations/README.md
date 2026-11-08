# Chapter 21: A database from first principles

Part 5: Build TinyDB. Teaching baseline: C17.

Define a deliberately small database contract before implementing storage or SQL syntax.

## Outcomes

- Separate logical rows, storage, indexes, and execution.
- Specify commands and observable failures.
- Use acceptance tests as a development boundary.

## 21.1 Records, tables, schemas, and keys

A schema names the fields and constrains their values. A key identifies a row under a uniqueness rule.

Our teaching table has a positive 32-bit ID, a bounded terminated name, and a nonnegative 32-bit score. The struct is an in-memory representation, not a disk format. The ID uniqueness rule belongs to the table interface rather than to C’s type system. Define these choices before adding indexes or parsing syntax.

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
  Table t = {0};
  if (insert_row(&t, (Row){1, "Ada", 90}) != OK)
    return 1;
  display(&t);
  return 0;
}
```

Output:

```text
1 | Ada | 90
```

Insertion validates the row and copies it into the table. Embedded name storage makes this particular row copy independent of its source object.

**Watch for:** A struct declaration alone cannot enforce unique keys or guarantee portable serialized bytes.

**Check:** Where is ID uniqueness enforced?

1. The table insertion operation
2. The uint32_t type

<details><summary>Answer</summary>

The table insertion operation. The type limits numeric representation, not relationships between rows.

</details>

**Try:** Write the schema contract, including name length, empty names, key zero, and duplicate behavior.

Run from the repository root:

```sh
make example EXAMPLE=database-foundations-1
```

## 21.2 Storage, indexes, and query execution

Storage owns rows, an index locates candidates, and execution decides which candidates satisfy a query. Keep those roles separable.

This initial table scan is both a correctness baseline and the fallback when no index exists. A later index can return candidate row positions, but execution must still honor the same row and predicate contract. Physical row positions may change after deletion or compaction; logical IDs should remain stable.

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
  Table t = {0};
  insert_row(&t, (Row){1, "Ada", 90});
  insert_row(&t, (Row){2, "Grace", 80});
  int i = find_row(&t, 2);
  printf("position=%d id=%u\n", i, (unsigned)t.rows[i].id);
  return 0;
}
```

Output:

```text
position=1 id=2
```

The logical ID two is stored at physical position one. These numbers are intentionally different.

**Watch for:** Treating array positions as permanent row IDs breaks references when rows move.

**Check:** Which identifier should survive physical relocation?

1. The current array position
2. The logical row ID

<details><summary>Answer</summary>

The logical row ID. Identity belongs to the schema contract rather than the current layout.

</details>

**Try:** Delete the first row and confirm that ID two remains the same even though its position changes.

Run from the repository root:

```sh
make example EXAMPLE=database-foundations-2
```

## 21.3 Designing a deliberately small database

Limit the first database so every promised behavior can be tested. A small, explicit contract is more useful than incomplete general SQL support.

The baseline is a single in-memory table with unique positive IDs, bounded names, and deterministic insertion order. It does not yet promise persistence, transactions, concurrent access, Unicode-aware comparison, or arbitrary SQL. Each later chapter adds a named capability while preserving the earlier behavior.

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
  Table t = {0};
  Status first = insert_row(&t, (Row){1, "Ada", 90}),
         again = insert_row(&t, (Row){1, "Other", 0});
  printf("inserted=%d duplicate=%d rows=%zu\n", first == OK, again == DUPLICATE,
         t.count);
  return 0;
}
```

Output:

```text
inserted=1 duplicate=1 rows=1
```

The second call is rejected and the original table count remains one. Rejection is observable rather than a silent overwrite.

**Watch for:** Implementing a feature’s happy path without its error contract does not complete the feature.

**Check:** What happens to the first row after a duplicate insertion?

1. It remains unchanged
2. It is silently replaced

<details><summary>Answer</summary>

It remains unchanged. The initial insertion contract rejects duplicate IDs.

</details>

**Try:** Write acceptance cases for missing rows, invalid rows, a full table, and an empty selection.

Run from the repository root:

```sh
make example EXAMPLE=database-foundations-3
```

## 21.4 Building a command loop

A command loop separates input acquisition from command behavior. Keep each input line bounded and report unknown commands.

This first loop recognizes only insert-demo and select, deliberately postponing tokenization. fgets retains a newline when it fits; remove that line ending before comparison. If a line does not fit, reject and drain it so its tail cannot become a second command. EOF ends the loop normally; ferror distinguishes a read failure.

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
void command(Table *t, const char *line) {
  if (strcmp(line, "insert-demo") == 0) {
    puts(insert_row(t, (Row){1, "Ada", 90}) == OK ? "inserted" : "rejected");
  } else if (strcmp(line, "select") == 0)
    display(t);
  else
    puts("unknown command");
}

int main(void) {
  Table t = {0};
  char line[64];
  while (fgets(line, sizeof line, stdin)) {
    if (!strchr(line, '\n') && !feof(stdin)) {
      int c;
      while ((c = getchar()) != '\n' && c != EOF) {
      }
      puts("line too long");
      continue;
    }
    line[strcspn(line, "\r\n")] = 0;
    command(&t, line);
  }
  if (ferror(stdin))
    return 1;
  return 0;
}
```

Input: `insert-demo
select
wat`

Output:

```text
inserted
1 | Ada | 90
unknown command
```

The supplied input runs an insert, selection, and unknown command. The table survives across commands within this process.

**Watch for:** The browser’s input is supplied before execution; this is a batch command loop, not an interactive terminal prompt.

**Check:** Why drain a line that exceeds the buffer?

1. To make the table persistent
2. To prevent its tail being treated as a new command

<details><summary>Answer</summary>

To prevent its tail being treated as a new command. Input framing must remain aligned after rejecting a long command.

</details>

**Try:** Add a quit command and test an overlong line followed by a valid command.

Run from the repository root:

```sh
make example EXAMPLE=database-foundations-4
```

## 21.5 Defining behavior and writing acceptance tests

Acceptance tests describe externally observable behavior rather than the internal representation used to achieve it.

The fixture checks successful insertion, duplicate rejection, and retained original contents. A test harness should fail with a nonzero exit status even in release builds, so required operations belong outside assert. This is the first contract suite; later storage and concurrency work must preserve it while adding their own cases.

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
  Table t = {0};
  if (insert_row(&t, (Row){1, "Ada", 90}) != OK)
    return 1;
  if (insert_row(&t, (Row){1, "Other", 0}) != DUPLICATE || t.count != 1 ||
      strcmp(t.rows[0].name, "Ada") != 0)
    return 1;
  puts("acceptance: insert duplicate preserve passed");
  return 0;
}
```

Output:

```text
acceptance: insert duplicate preserve passed
```

The pass line is reached only after all checks succeed. Changing the representation is permitted if these externally specified results remain true.

**Watch for:** Putting insertion itself inside assert can remove required behavior when NDEBUG is defined.

**Check:** Should a representation refactor change the acceptance contract?

1. No, unless the public behavior is intentionally revised
2. Yes, tests should mirror every implementation detail

<details><summary>Answer</summary>

No, unless the public behavior is intentionally revised. Contracts allow implementation changes while retaining observable guarantees.

</details>

**Try:** Extend the acceptance suite with empty selection, invalid ID, and full-capacity failure preservation.

Run from the repository root:

```sh
make example EXAMPLE=database-foundations-5
```

## Build it yourself

Define TinyDB’s first commands and test their observable behavior.

1. Define a deliberately small database contract before implementing storage or SQL syntax.
2. Extend the acceptance suite with empty selection, invalid ID, and full-capacity failure preservation.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=database-foundations-5
```

Chapter workspace command: `make chapter CHAPTER=database-foundations`.

Generated from dist/part5.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/database-foundations
