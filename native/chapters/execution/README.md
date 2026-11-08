# Chapter 24: Query execution

Part 5: Build TinyDB. Teaching baseline: C17.

Execute typed, validated statements and build query operators with explicit input and output contracts.

## Outcomes

- Scan and filter only initialized rows.
- Separate projection and ordering from storage mutation.
- Evaluate aggregates with defined empty-input behavior.

## 24.1 Table scans

A scan supplies every initialized row to the next operator. Keep its bounds independent of unused capacity.

A scan’s basic invariant is that every emitted row came from a valid index below count and no earlier index is emitted again. It is Θ(n) in table size and requires O(1) cursor state. The initial table’s insertion-order behavior is explicit; SQL without ORDER BY should not generally promise a stable presentation order.

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
  insert_row(&t, (Row){3, "Ken", 90});
  display(&t);
  return 0;
}
```

Output:

```text
1 | Ada | 90
2 | Grace | 80
3 | Ken | 90
```

All three initialized rows are emitted once. The remaining five capacity slots are not rows.

**Watch for:** Using capacity instead of count exposes storage that does not belong to the logical table.

**Check:** What bounds the scan?

1. The initialized row count
2. The maximum table capacity

<details><summary>Answer</summary>

The initialized row count. Unused capacity is reserved storage, not query input.

</details>

**Try:** Implement a cursor with next and exhausted results, including an empty table.

Run from the repository root:

```sh
make example EXAMPLE=execution-1
```

## 24.2 Filtering with WHERE

Filtering retains rows whose predicate evaluates true. A rejected row still contributes to scan work.

The fixture selects scores at least ninety. Two rows pass, but all three are examined. A later index may reduce candidates; it must preserve the same predicate result. This simple numeric predicate has no SQL NULL semantics, coercion rules, or three-valued logic, and the schema deliberately omits nullable fields.

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
  insert_row(&t, (Row){3, "Ken", 90});
  size_t examined = 0, matched = 0;
  for (size_t i = 0; i < t.count; ++i) {
    ++examined;
    if (t.rows[i].score >= 90) {
      ++matched;
      printf("%s\n", t.rows[i].name);
    }
  }
  printf("examined=%zu matched=%zu\n", examined, matched);
  return 0;
}
```

Output:

```text
Ada
Ken
examined=3 matched=2
```

Filtering changes output size without making this full scan sublinear. The counters distinguish those two quantities.

**Watch for:** Reporting only matching-row count as query work hides rejected-row comparisons.

**Check:** Does returning two rows mean only two were examined?

1. Yes
2. No

<details><summary>Answer</summary>

No. This operator must inspect the predicate for every scanned row.

</details>

**Try:** Add equality and range predicates and compare result sets with a simple reference loop.

Run from the repository root:

```sh
make example EXAMPLE=execution-2
```

## 24.3 Selecting columns

Projection selects fields for output. It need not mutate stored records or copy every field.

The output operator prints ID and name while leaving score in storage. A typed projection representation can choose fields explicitly, rather than interpreting column strings repeatedly during row iteration. SELECT of duplicate column combinations still preserves duplicate rows unless a DISTINCT capability is deliberately added.

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
  insert_row(&t, (Row){3, "Ken", 90});
  for (size_t i = 0; i < t.count; ++i)
    printf("%u | %s\n", (unsigned)t.rows[i].id, t.rows[i].name);
  return 0;
}
```

Output:

```text
1 | Ada
2 | Grace
3 | Ken
```

The score values remain stored but are not part of the output shape. Projection and filtering answer different questions.

**Watch for:** Do not erase unselected fields from the table while formatting a query result.

**Check:** Does projection delete stored columns?

1. No
2. Yes

<details><summary>Answer</summary>

No. It controls the result representation, not the underlying row schema.

</details>

**Try:** Represent the selected columns as an enum array and reject unknown or repeated columns according to a stated policy.

Run from the repository root:

```sh
make example EXAMPLE=execution-3
```

## 24.4 Ordering and limiting results

Ordering before limiting is different from limiting before ordering. Specify a deterministic tie-break where reproducible output is required.

Copy the initialized rows into a result buffer, sort by score then ID, and return the first two. The table itself retains its storage order. This full-sort approach needs O(n) result storage; more advanced top-k or index-order plans can reduce work under additional assumptions. The C qsort interface does not guarantee stability.

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
int by_score(const void *pa, const void *pb) {
  const Row *a = pa, *b = pb;
  if (a->score != b->score)
    return (a->score > b->score) - (a->score < b->score);
  return (a->id > b->id) - (a->id < b->id);
}

int main(void) {
  Table t = {0};
  insert_row(&t, (Row){1, "Ada", 90});
  insert_row(&t, (Row){2, "Grace", 80});
  insert_row(&t, (Row){3, "Ken", 90});
  Row result[TABLE_CAP];
  memcpy(result, t.rows, t.count * sizeof result[0]);
  qsort(result, t.count, sizeof result[0], by_score);
  for (size_t i = 0; i < 2 && i < t.count; ++i)
    printf("%s %u\n", result[i].name, (unsigned)result[i].score);
  return 0;
}
```

Output:

```text
Grace 80
Ada 90
```

Grace sorts before both ninety-score rows. The ID tie-break puts Ada before Ken. Taking the first two original rows first would be a different query.

**Watch for:** A limit does not generally permit stopping before sorting unless the input already satisfies the requested order or a correct top-k method is used.

**Check:** Which happens first for ORDER BY score LIMIT 2?

1. Choose any two rows, then sort them
2. Establish score order, then choose two rows

<details><summary>Answer</summary>

Establish score order, then choose two rows. The limit applies to the ordered result.

</details>

**Try:** Implement top-k with a heap and compare it against this full-sort baseline.

Run from the repository root:

```sh
make example EXAMPLE=execution-4
```

## 24.5 Simple aggregation

Aggregation summarizes a set of rows. Define empty-set behavior and arithmetic representation before implementing it.

COUNT is zero on an empty input. This example uses a 64-bit sum for a table with at most eight unsigned 32-bit scores, so the sum is representable. An average is computed only when count is nonzero; a general SQL engine might return NULL for empty AVG and SUM. Our explicit empty policy is not an accidental divide-by-zero workaround.

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
  insert_row(&t, (Row){3, "Ken", 90});
  uint64_t sum = 0;
  for (size_t i = 0; i < t.count; ++i)
    sum += t.rows[i].score;
  printf("count=%zu sum=%llu average=%.2f\n", t.count, (unsigned long long)sum,
         t.count ? (double)sum / t.count : 0.0);
  return 0;
}
```

Output:

```text
count=3 sum=260 average=86.67
```

The average is 260 divided by three, formatted to two decimal places. The widening occurs in the accumulator rather than after an overflowing narrow sum.

**Watch for:** Widening a result after arithmetic does not repair an overflow that already occurred in the original type.

**Check:** When is division for average permitted?

1. When the input count is nonzero
2. For every possible table state

<details><summary>Answer</summary>

When the input count is nonzero. Empty input requires a separate result policy.

</details>

**Try:** Add min and max with explicit no-value results for empty input and test maximum score values.

Run from the repository root:

```sh
make example EXAMPLE=execution-5
```

## 24.6 Separating parsing, validation, and execution

A clean query path parses syntax, validates meaning, and only then executes. This makes failure preservation testable.

The parser returns a typed temporary statement. Validation enforces schema constraints before execute can mutate the table. SELECT uses a scan or filtered scan, while INSERT delegates uniqueness and capacity to the table API. The fixture exercises the complete implemented SQL subset; ordering and aggregation examples are operators to extend into its grammar, not syntax already accepted by this parser.

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
typedef enum {
  END,
  WORD,
  NUMBER,
  STRING,
  SEMI,
  LP,
  RP,
  COMMA,
  STAR,
  EQUAL,
  BAD
} Token;
typedef struct {
  const char *p;
  char text[32];
  uint32_t number;
} Lexer;
Token next(Lexer *l) {
  while (*l->p == ' ' || *l->p == '\t' || *l->p == '\n' || *l->p == '\r')
    ++l->p;
  unsigned char ch = (unsigned char)*l->p;
  l->text[0] = 0;
  if (!ch)
    return END;
  if (ch >= '0' && ch <= '9') {
    uint32_t n = 0;
    do {
      unsigned digit = (unsigned)(*l->p - '0');
      if (n > (UINT32_MAX - digit) / 10)
        return BAD;
      n = n * 10 + digit;
      ++l->p;
    } while (*l->p >= '0' && *l->p <= '9');
    l->number = n;
    return NUMBER;
  }
  if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == '_') {
    size_t n = 0;
    while ((*l->p >= 'A' && *l->p <= 'Z') || (*l->p >= 'a' && *l->p <= 'z') ||
           (*l->p >= '0' && *l->p <= '9') || *l->p == '_') {
      if (n + 1 == sizeof l->text)
        return BAD;
      l->text[n++] = *l->p++;
    }
    l->text[n] = 0;
    return WORD;
  }
  ++l->p;
  if (ch == '\'') {
    size_t n = 0;
    for (;;) {
      if (!*l->p)
        return BAD;
      if (*l->p == '\'' && l->p[1] != '\'') {
        ++l->p;
        l->text[n] = 0;
        return STRING;
      }
      if (n + 1 == sizeof l->text)
        return BAD;
      l->text[n++] = *l->p;
      if (*l->p == '\'')
        ++l->p;
      ++l->p;
    }
  }
  switch (ch) {
  case ';':
    return SEMI;
  case '(':
    return LP;
  case ')':
    return RP;
  case ',':
    return COMMA;
  case '*':
    return STAR;
  case '=':
    return EQUAL;
  default:
    return BAD;
  }
}
bool keyword(Lexer *l, const char *word) {
  return next(l) == WORD && strcmp(l->text, word) == 0;
}
typedef enum { INSERT_STMT, SELECT_STMT } Kind;
typedef struct {
  Kind kind;
  Row row;
  bool filtered;
  uint32_t key;
} Statement;
bool parse(const char *sql, Statement *out) {
  Lexer l = {sql, {0}, 0};
  Statement s = {0};
  if (next(&l) != WORD)
    return false;
  if (strcmp(l.text, "INSERT") == 0) {
    s.kind = INSERT_STMT;
    if (!keyword(&l, "INTO") || !keyword(&l, "people") ||
        !keyword(&l, "VALUES") || next(&l) != LP || next(&l) != NUMBER)
      return false;
    s.row.id = l.number;
    if (next(&l) != COMMA || next(&l) != STRING)
      return false;
    memcpy(s.row.name, l.text, sizeof s.row.name);
    if (next(&l) != COMMA || next(&l) != NUMBER)
      return false;
    s.row.score = l.number;
    if (next(&l) != RP || next(&l) != SEMI || next(&l) != END)
      return false;
  } else if (strcmp(l.text, "SELECT") == 0) {
    s.kind = SELECT_STMT;
    if (next(&l) != STAR || !keyword(&l, "FROM") || !keyword(&l, "people"))
      return false;
    Token t = next(&l);
    if (t == WORD && strcmp(l.text, "WHERE") == 0) {
      if (!keyword(&l, "id") || next(&l) != EQUAL || next(&l) != NUMBER)
        return false;
      s.filtered = true;
      s.key = l.number;
      t = next(&l);
    }
    if (t != SEMI || next(&l) != END)
      return false;
  } else
    return false;
  *out = s;
  return true;
}
bool validate(const Statement *s) {
  return s->kind != INSERT_STMT || (s->row.id > 0 && s->row.name[0] != 0);
}
bool execute(Table *t, const Statement *s) {
  if (!validate(s))
    return false;
  if (s->kind == INSERT_STMT)
    return insert_row(t, s->row) == OK;
  for (size_t i = 0; i < t->count; ++i)
    if (!s->filtered || t->rows[i].id == s->key)
      printf("%u | %s | %u\n", (unsigned)t->rows[i].id, t->rows[i].name,
             (unsigned)t->rows[i].score);
  return true;
}

int main(void) {
  Table t = {0};
  const char *sql[] = {"INSERT INTO people VALUES (1, 'Ada', 90);",
                       "SELECT * FROM people WHERE id = 1;"};
  for (size_t i = 0; i < 2; ++i) {
    Statement s = {0};
    if (!parse(sql[i], &s) || !validate(&s) || !execute(&t, &s))
      return 1;
  }
  printf("rows=%zu\n", t.count);
  return 0;
}
```

Output:

```text
1 | Ada | 90
rows=1
```

The first statement inserts and the second retrieves by logical key. Every stage can be tested independently as well as through this end-to-end path.

**Watch for:** Do not describe ORDER BY or SUM as accepted SQL until their grammar, validation, and executor paths are implemented together.

**Check:** Which stage is allowed to mutate the table?

1. Tokenization as soon as INSERT is seen
2. Execution after successful parsing and validation

<details><summary>Answer</summary>

Execution after successful parsing and validation. Malformed or invalid statements must leave stored state untouched.

</details>

**Try:** Extend the grammar with one earlier operator, add end-to-end tests, and preserve all existing rejection behavior.

Run from the repository root:

```sh
make example EXAMPLE=execution-6
```

## Build it yourself

Execute validated statements over an in-memory table.

1. Execute typed, validated statements and build query operators with explicit input and output contracts.
2. Extend the grammar with one earlier operator, add end-to-end tests, and preserve all existing rejection behavior.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=execution-6
```

Chapter workspace command: `make chapter CHAPTER=execution`.

Generated from dist/part5.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/execution
