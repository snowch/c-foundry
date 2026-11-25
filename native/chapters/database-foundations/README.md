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
  Table t = {.count = 0};
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

### One row is live; the other slots are capacity

Which slots may display inspect after this insertion?

Which slots may display inspect after this insertion? Table after insert_row. 1; spare; spare; spare; spare; spare; spare; spare. count=1; capacity=8. Row 0 is ID 1, Ada, score 90.. Only rows[0..count) are stored records. Unused capacity is not seven additional database rows.

Only rows[0..count) are stored records. Unused capacity is not seven additional database rows. Illustration of the supplied example; edits do not update this picture.

**Watch for:** A struct declaration alone cannot enforce unique keys or guarantee portable serialized bytes.

**Check:** Where is ID uniqueness enforced?

1. The table insertion operation
2. The uint32_t type

<details><summary>Answer</summary>

The table insertion operation. The type limits numeric representation, not relationships between rows.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/database-foundations/1). In main.c, change Ada’s score from 90 to 95. Run code and compare the three columns in Console. Which column identifies the same row after a score change?

### References and help

- [SQLite documentation: SELECT](https://www.sqlite.org/lang_select.html) — Compare SQL clause behavior with the deliberately smaller TinyDB grammar.
- [SQLite documentation: database file format](https://www.sqlite.org/fileformat.html) — Compare explicit headers, page layouts, and encoding rules with the teaching format.

**Use the documentation (optional):** Does SQLite’s full SQL reference imply that the course’s TinyDB parser accepts every documented clause?

<details><summary>Compare your answer</summary>

No. SQLite is a comparison reference. TinyDB accepts only its explicitly implemented and tested grammar; unsupported syntax must be rejected.

</details>

Native source: `native/examples/database-foundations-1.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=database-foundations-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 21.2 Storage, indexes, and query execution

Storage owns rows, an index locates candidates, and execution decides which candidates satisfy a query. Keep those roles separable.

This initial table scan is both a correctness baseline and the fallback when no index exists. A later index can return candidate row positions, but execution must still honor the same row and predicate contract: a predicate is the test that decides whether a row qualifies. Physical row positions may change after deletion or compaction; logical IDs should remain stable.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/database-foundations/2). In main.c, swap the two insert_row calls. Run code and compare position= and id=. Which value tracks the physical array position, and which still identifies Grace?

### References and help

- [SQLite documentation: SELECT](https://www.sqlite.org/lang_select.html) — Compare SQL clause behavior with the deliberately smaller TinyDB grammar.
- [SQLite documentation: database file format](https://www.sqlite.org/fileformat.html) — Compare explicit headers, page layouts, and encoding rules with the teaching format.

Native source: `native/examples/database-foundations-2.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=database-foundations-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 21.3 Designing a deliberately small database

Limit the first database so every promised behavior can be tested. A small, explicit contract is more useful than incomplete general SQL support.

The baseline is a single in-memory table with unique positive IDs, bounded names, and deterministic insertion order. It does not yet promise persistence, transactions, concurrent access, Unicode-aware comparison, or arbitrary SQL. Later chapters supply separate components and projects for adding those capabilities to your own database while preserving its earlier behavior.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/database-foundations/3). In main.c, change the second inserted ID from 1 to 2. Run code and compare inserted=, duplicate=, and rows=. Which check tells you whether the second row was accepted?

### References and help

- [SQLite documentation: SELECT](https://www.sqlite.org/lang_select.html) — Compare SQL clause behavior with the deliberately smaller TinyDB grammar.
- [SQLite documentation: database file format](https://www.sqlite.org/fileformat.html) — Compare explicit headers, page layouts, and encoding rules with the teaching format.

Native source: `native/examples/database-foundations-3.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=database-foundations-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

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
  Table t = {.count = 0};
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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/database-foundations/4). Open Input and append a new select line after the existing commands. Run code and compare the first and second displayed rows with unknown command. What shows the command loop continued after rejecting the unrecognized command?

### References and help

- [SQLite documentation: SELECT](https://www.sqlite.org/lang_select.html) — Compare SQL clause behavior with the deliberately smaller TinyDB grammar.
- [C reference: fgets](https://en.cppreference.com/w/c/io/fgets.html) — Check the buffer-size argument, newline retention, terminator, and failure result.
- [C reference: ferror](https://en.cppreference.com/w/c/io/ferror.html) — Distinguish a stream error from ordinary end-of-file.

Native source: `native/examples/database-foundations-4.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=database-foundations-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

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
  Table t = {.count = 0};
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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/database-foundations/5). In main.c, keep the duplicate ID 1 and replace the rejected row’s name Other with Grace. Run code. Does the acceptance message still appear? Identify the checks that prove the existing Ada row remained after rejection.

### References and help

- [SQLite documentation: SELECT](https://www.sqlite.org/lang_select.html) — Compare SQL clause behavior with the deliberately smaller TinyDB grammar.
- [SQLite documentation: database file format](https://www.sqlite.org/fileformat.html) — Compare explicit headers, page layouts, and encoding rules with the teaching format.

Native source: `native/examples/database-foundations-5.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=database-foundations-5 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## Build it yourself

Define TinyDB’s first commands and test their observable behavior.

1. Extend the acceptance suite with empty selection, invalid ID, and full-capacity failure preservation.
2. Test selection from an empty table, ID zero, duplicate ID, and insertion beyond capacity.

### Check your work

- For every rejected insert, compare the row count and every existing row with a copy taken before the call.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=database-foundations-5
```

Chapter workspace command: `make chapter CHAPTER=database-foundations`.

Generated from dist/part5.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/database-foundations
