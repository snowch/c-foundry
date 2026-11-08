# Chapter 30: Final project: ship your database

Part 6: Make the database faster and more reliable. Teaching baseline: C17.

Turn the small database into a reproducible learning release with contract tests, failure experiments, and an explicit compatibility document.

## Outcomes

- Exercise complete query paths and generated state transitions.
- Test interruption boundaries and audit resource ownership.
- Package files and limitations with reproducible commands.

## 30.1 End-to-end SQL tests

End-to-end tests cross parser, validation, executor, and storage boundaries. Keep earlier unit tests to localize failures.

The fixture inserts through the implemented SQL grammar, selects by key, and rejects an invalid statement before execution. A useful suite checks output rows, status, and persistent logical state after rejected operations. Operators not yet added to the parser grammar remain separate extension exercises rather than silently supported SQL syntax.

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
  Statement s = {0};
  if (!parse("INSERT INTO people VALUES (7, 'Ada', 90);", &s) ||
      !execute(&t, &s))
    return 1;
  if (!parse("SELECT * FROM people WHERE id = 7;", &s) || !execute(&t, &s))
    return 1;
  if (parse("DELETE nonsense", &s) || t.count != 1)
    return 1;
  puts("SQL contract passed");
  return 0;
}
```

Output:

```text
7 | Ada | 90
SQL contract passed
```

The table result confirms execution, while the final count confirms malformed input did not mutate it.

**Watch for:** A parser-only test cannot establish that the executor interprets the statement correctly.

**Check:** Which layers does an end-to-end query test cross?

1. Parsing, validation, and execution/storage
2. Only token classification

<details><summary>Answer</summary>

Parsing, validation, and execution/storage. The observed result depends on the complete request path.

</details>

**Try:** Add tests for each supported statement and maintain a table of intentionally unsupported syntax.

Run from the repository root:

```sh
make example EXAMPLE=ship-1
```

## 30.2 Property tests and fuzzing the parser

Property tests compare many generated operation sequences with a simpler reference model. Parser fuzzing asks whether arbitrary bounded input is handled safely.

The fixture generates bounded strings with a fixed seed and passes them to the parser. It checks memory-safe completion under the selected compiler and can be rerun under sanitizers. It is not exhaustive and does not prove grammatical correctness. Preserve failing seeds and minimize inputs when a crash or inconsistent result is found.

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

int main(void) {
  uint32_t seed = 17;
  char sql[33];
  unsigned cases = 0;
  for (unsigned n = 0; n < 256; ++n) {
    for (size_t i = 0; i < 32; ++i) {
      seed = seed * 1664525u + 1013904223u;
      sql[i] = "SELECT (),;'012xyz"[(seed >> 24) % 17];
    }
    sql[n % 32] = 0;
    Statement s = {0};
    if (parse(sql, &s))
      (void)validate(&s);
    ++cases;
  }
  printf("fuzz_cases=%u completed\n", cases);
  return 0;
}
```

Output:

```text
fuzz_cases=256 completed
```

Every buffer is terminated before parsing. The bounded test is deterministic, so a failure can be reproduced using the same seed.

**Watch for:** Random input testing is a supplement to grammar-specific boundary cases, not a replacement.

**Check:** Does a clean fuzz run prove the parser correct?

1. Yes
2. No

<details><summary>Answer</summary>

No. Only finitely many generated paths were exercised.

</details>

**Try:** Run with SANITIZE=1, add token-length boundaries, and retain every discovered failure as a deterministic regression case.

Run from the repository root:

```sh
make example EXAMPLE=ship-2
```

## 30.3 Fault injection and recovery tests

Fault injection makes rare failure paths repeatable. Test exactly where the protocol permits acknowledged state to survive.

For each possible byte cut in a single transaction log, the reference expectation is zero before the full COMMIT record and 42 afterward. The loop tests every prefix from zero through 24 bytes. This is an interruption model; it does not simulate all filesystem reorderings, device failures, or checksum-valid corruption.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };
void put32(unsigned char *out, uint32_t value) {
  for (unsigned i = 0; i < 4; ++i)
    out[i] = (unsigned char)(value >> (8 * i));
}
uint32_t get32(const unsigned char *in) {
  uint32_t value = 0;
  for (unsigned i = 0; i < 4; ++i)
    value |= (uint32_t)in[i] << (8 * i);
  return value;
}
enum { BEGIN_REC = 1, SET_REC = 2, COMMIT_REC = 3, LOG_BYTES = 8 };
void log_record(unsigned char *out, unsigned kind, unsigned tx,
                uint32_t value) {
  memset(out, 0, LOG_BYTES);
  out[0] = (unsigned char)kind;
  out[1] = (unsigned char)tx;
  put32(out + 4, value);
}
uint32_t recover(const unsigned char *log, size_t length, uint32_t base) {
  unsigned active = 0;
  uint32_t pending = base;
  for (size_t at = 0; at <= length && length - at >= LOG_BYTES;
       at += LOG_BYTES) {
    const unsigned char *r = log + at;
    if (!r[1] || r[2] || r[3])
      break;
    if (r[0] == BEGIN_REC) {
      if (active)
        break;
      active = r[1];
      pending = base;
    } else if (r[0] == SET_REC) {
      if (active != r[1])
        break;
      pending = get32(r + 4);
    } else if (r[0] == COMMIT_REC) {
      if (active != r[1])
        break;
      base = pending;
      active = 0;
    } else
      break;
  }
  return base;
}

int main(void) {
  unsigned char log[24];
  log_record(log, BEGIN_REC, 1, 0);
  log_record(log + 8, SET_REC, 1, 42);
  log_record(log + 16, COMMIT_REC, 1, 0);
  for (size_t cut = 0; cut <= sizeof log; ++cut) {
    uint32_t expected = cut == sizeof log ? 42 : 0;
    if (recover(log, cut, 0) != expected)
      return 1;
  }
  puts("25 interruption boundaries passed");
  return 0;
}
```

Output:

```text
25 interruption boundaries passed
```

The only prefix containing a complete matching COMMIT is the full 24-byte log. Every shorter prefix leaves the base unchanged.

**Watch for:** Killing a process at one convenient point does not cover all interruption boundaries.

**Check:** Which prefixes may recover 42 in this fixture?

1. Only the prefix containing the full commit record
2. Every prefix containing the SET value

<details><summary>Answer</summary>

Only the prefix containing the full commit record. Uncommitted records cannot establish acknowledged transaction state.

</details>

**Try:** Add two committed transactions, an incomplete third, invalid headers, and repeated replay checks.

Run from the repository root:

```sh
make example EXAMPLE=ship-3
```

## 30.4 Benchmarks across growing datasets

Benchmark across growing data while retaining correctness checks and separating setup from the measured operation.

The deterministic fixture counts absent-key scan comparisons for two sizes. A native timing harness should create data before timing, use a monotonic clock where available, repeat sufficiently, and report distributions with compiler and machine details. The current eight-row table is a teaching bound, so larger benchmark datasets require an intentionally expanded storage implementation.

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
  for (size_t n = 8; n <= 32; n *= 4) {
    size_t comparisons = 0;
    for (size_t i = 0; i < n; ++i)
      ++comparisons;
    printf("rows=%zu absent_scan_comparisons=%zu\n", n, comparisons);
  }
  return 0;
}
```

Output:

```text
rows=8 absent_scan_comparisons=8
rows=32 absent_scan_comparisons=32
```

The count grows by the same factor as the input. This is an abstract scan loop, not a timing claim about disk or cache performance.

**Watch for:** Printing from the measured inner loop can dominate the operation you intended to measure.

**Check:** What should be excluded from a query-only timing region?

1. The actual query operation
2. Dataset construction and result formatting

<details><summary>Answer</summary>

Dataset construction and result formatting. Preparation and reporting answer different performance questions.

</details>

**Try:** Compare cold and warm page-cache runs with verified equal results and recorded environment details.

Run from the repository root:

```sh
make example EXAMPLE=ship-4
```

## 30.5 Memory and resource audits

A resource audit assigns an owner and cleanup path to every allocation, file, lock, and borrowed pointer.

The fixture writes and reloads a table through one temporary stream and closes it on both success and failure paths. It checks close results rather than assuming earlier writes reached their destination. Sanitizers detect many executed memory errors but do not prove that all resource paths or I/O failures are handled.

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
enum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };
void put32(unsigned char *out, uint32_t value) {
  for (unsigned i = 0; i < 4; ++i)
    out[i] = (unsigned char)(value >> (8 * i));
}
uint32_t get32(const unsigned char *in) {
  uint32_t value = 0;
  for (unsigned i = 0; i < 4; ++i)
    value |= (uint32_t)in[i] << (8 * i);
  return value;
}
bool encode_row(unsigned char *out, const Row *row) {
  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])
    return false;
  memset(out, 0, ROW_BYTES);
  put32(out, row->id);
  memcpy(out + 4, row->name, strlen(row->name));
  put32(out + 36, row->score);
  return true;
}
bool decode_row(const unsigned char *in, size_t n, Row *out) {
  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)
    return false;
  Row row = {0};
  row.id = get32(in);
  memcpy(row.name, in + 4, 32);
  row.score = get32(in + 36);
  *out = row;
  return true;
}
bool save(FILE *f, const Table *table) {
  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,
                                        1,    ROW_BYTES, 0,    0};
  if (table->count > TABLE_CAP)
    return false;
  header[6] = (unsigned char)table->count;
  if (fwrite(header, 1, sizeof header, f) != sizeof header)
    return false;
  for (size_t i = 0; i < table->count; ++i) {
    unsigned char bytes[ROW_BYTES];
    if (!encode_row(bytes, &table->rows[i]) ||
        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)
      return false;
  }
  return fflush(f) == 0;
}
bool load(FILE *f, Table *out) {
  unsigned char header[HEADER_BYTES];
  if (fread(header, 1, sizeof header, f) != sizeof header)
    return false;
  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||
      header[6] > TABLE_CAP || header[7] != 0)
    return false;
  Table table = {0};
  for (unsigned i = 0; i < header[6]; ++i) {
    unsigned char bytes[ROW_BYTES];
    Row row;
    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||
        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)
      return false;
  }
  if (fgetc(f) != EOF || ferror(f))
    return false;
  *out = table;
  return true;
}

int main(void) {
  FILE *f = tmpfile();
  if (!f)
    return 1;
  Table source = {0}, copy = {0};
  insert_row(&source, (Row){1, "Ada", 90});
  bool ok = save(f, &source) && fseek(f, 0, SEEK_SET) == 0 && load(f, &copy);
  int closed = fclose(f);
  if (!ok || closed != 0)
    return 1;
  printf("stream_closed=1 rows=%zu\n", copy.count);
  return 0;
}
```

Output:

```text
stream_closed=1 rows=1
```

The stream has one owner in main and is closed exactly once after the operation sequence. Embedded table rows need no heap cleanup.

**Watch for:** A successful allocation or fopen introduces an obligation even when a later operation fails.

**Check:** Does an I/O error remove the caller’s close obligation?

1. No
2. Yes

<details><summary>Answer</summary>

No. Ownership remains until the resource is released.

</details>

**Try:** Enumerate every exit path in the pager, parser, and index; inject failures at each acquired resource boundary.

Run from the repository root:

```sh
make example EXAMPLE=ship-5
```

## 30.6 File-format documentation and compatibility

Compatibility depends on documented bytes and behavior, not merely on retaining a source-code struct name.

The header version selects a decoder contract. This fixture deliberately changes the version byte and verifies rejection without replacing the output table. A migration tool should read the old format through its old validator, write a separate new file, and publish it only after successful verification. Never reinterpret an old layout as the new one because fields look similar.

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
enum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };
void put32(unsigned char *out, uint32_t value) {
  for (unsigned i = 0; i < 4; ++i)
    out[i] = (unsigned char)(value >> (8 * i));
}
uint32_t get32(const unsigned char *in) {
  uint32_t value = 0;
  for (unsigned i = 0; i < 4; ++i)
    value |= (uint32_t)in[i] << (8 * i);
  return value;
}
bool encode_row(unsigned char *out, const Row *row) {
  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])
    return false;
  memset(out, 0, ROW_BYTES);
  put32(out, row->id);
  memcpy(out + 4, row->name, strlen(row->name));
  put32(out + 36, row->score);
  return true;
}
bool decode_row(const unsigned char *in, size_t n, Row *out) {
  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)
    return false;
  Row row = {0};
  row.id = get32(in);
  memcpy(row.name, in + 4, 32);
  row.score = get32(in + 36);
  *out = row;
  return true;
}
bool save(FILE *f, const Table *table) {
  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,
                                        1,    ROW_BYTES, 0,    0};
  if (table->count > TABLE_CAP)
    return false;
  header[6] = (unsigned char)table->count;
  if (fwrite(header, 1, sizeof header, f) != sizeof header)
    return false;
  for (size_t i = 0; i < table->count; ++i) {
    unsigned char bytes[ROW_BYTES];
    if (!encode_row(bytes, &table->rows[i]) ||
        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)
      return false;
  }
  return fflush(f) == 0;
}
bool load(FILE *f, Table *out) {
  unsigned char header[HEADER_BYTES];
  if (fread(header, 1, sizeof header, f) != sizeof header)
    return false;
  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||
      header[6] > TABLE_CAP || header[7] != 0)
    return false;
  Table table = {0};
  for (unsigned i = 0; i < header[6]; ++i) {
    unsigned char bytes[ROW_BYTES];
    Row row;
    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||
        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)
      return false;
  }
  if (fgetc(f) != EOF || ferror(f))
    return false;
  *out = table;
  return true;
}

int main(void) {
  FILE *f = tmpfile();
  if (!f)
    return 1;
  unsigned char header[8] = {0x54, 0x44, 0x42, 0x31, 2, 40, 0, 0};
  if (fwrite(header, 1, 8, f) != 8 || fseek(f, 0, SEEK_SET) != 0) {
    fclose(f);
    return 1;
  }
  Table live = {0};
  bool rejected = !load(f, &live);
  if (fclose(f) != 0 || !rejected)
    return 1;
  printf("unknown_version_rejected=%d\n", rejected);
  return 0;
}
```

Output:

```text
unknown_version_rejected=1
```

Version two has no decoder in this format implementation. Rejection is a compatibility behavior, not a crash.

**Watch for:** Changing a format version without a decoder or explicit rejection policy leaves compatibility undefined.

**Check:** What should a migration write to first?

1. The only existing file in place without recovery
2. A separate verified new-format file

<details><summary>Answer</summary>

A separate verified new-format file. The old valid state should remain available if conversion fails.

</details>

**Try:** Publish a format document with offsets, ranges, validation, version policy, and independently specified sample bytes.

Run from the repository root:

```sh
make example EXAMPLE=ship-6
```

## 30.7 Exportable database files and a browser demonstration

A release should make its implemented behavior and boundaries easy to reproduce. Exported files need validation on import and a way to inspect their bytes.

The sample transfer tool in the persistence chapter produces a real named file, and that page provides a downloadable two-row fixture. This release check validates the same header and record contract through a fresh stream. The course examples demonstrate components and bounded models; they are not a general SQL server, arbitrary-height persistent index, or production transaction engine assembled automatically by reading the pages.

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
enum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };
void put32(unsigned char *out, uint32_t value) {
  for (unsigned i = 0; i < 4; ++i)
    out[i] = (unsigned char)(value >> (8 * i));
}
uint32_t get32(const unsigned char *in) {
  uint32_t value = 0;
  for (unsigned i = 0; i < 4; ++i)
    value |= (uint32_t)in[i] << (8 * i);
  return value;
}
bool encode_row(unsigned char *out, const Row *row) {
  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])
    return false;
  memset(out, 0, ROW_BYTES);
  put32(out, row->id);
  memcpy(out + 4, row->name, strlen(row->name));
  put32(out + 36, row->score);
  return true;
}
bool decode_row(const unsigned char *in, size_t n, Row *out) {
  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)
    return false;
  Row row = {0};
  row.id = get32(in);
  memcpy(row.name, in + 4, 32);
  row.score = get32(in + 36);
  *out = row;
  return true;
}
bool save(FILE *f, const Table *table) {
  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,
                                        1,    ROW_BYTES, 0,    0};
  if (table->count > TABLE_CAP)
    return false;
  header[6] = (unsigned char)table->count;
  if (fwrite(header, 1, sizeof header, f) != sizeof header)
    return false;
  for (size_t i = 0; i < table->count; ++i) {
    unsigned char bytes[ROW_BYTES];
    if (!encode_row(bytes, &table->rows[i]) ||
        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)
      return false;
  }
  return fflush(f) == 0;
}
bool load(FILE *f, Table *out) {
  unsigned char header[HEADER_BYTES];
  if (fread(header, 1, sizeof header, f) != sizeof header)
    return false;
  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||
      header[6] > TABLE_CAP || header[7] != 0)
    return false;
  Table table = {0};
  for (unsigned i = 0; i < header[6]; ++i) {
    unsigned char bytes[ROW_BYTES];
    Row row;
    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||
        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)
      return false;
  }
  if (fgetc(f) != EOF || ferror(f))
    return false;
  *out = table;
  return true;
}

int main(void) {
  Table source = {0}, copy = {0};
  insert_row(&source, (Row){1, "Ada", 90});
  insert_row(&source, (Row){2, "Grace", 80});
  FILE *f = tmpfile();
  if (!f)
    return 1;
  bool ok = save(f, &source) && fseek(f, 0, SEEK_SET) == 0 && load(f, &copy);
  if (fclose(f) != 0 || !ok || copy.count != 2)
    return 1;
  puts("release fixture: two validated rows");
  return 0;
}
```

Output:

```text
release fixture: two validated rows
```

The fixture can be decoded independently of struct layout. The named export command is make example EXAMPLE=persistence-5 KEEP_FILES=1.

**Watch for:** A browser demonstration must disclose whether its database state survives reload; the current C runner’s files do not.

**Check:** What belongs with an exportable database release?

1. Format documentation, validation tests, and execution limits
2. Only a screenshot of successful output

<details><summary>Answer</summary>

Format documentation, validation tests, and execution limits. A recipient needs to reproduce and safely interpret the artifact.

</details>

**Try:** Package your assembled TinyDB, its acceptance suite, the format document, and a verified exported file; list every feature still outside your implementation.

Run from the repository root:

```sh
make example EXAMPLE=ship-7
```

## 30.8 Optional workshop: Repair a broken TinyDB with GDB

Use GDB to explain two data-integrity failures in a deliberately broken copy of the real TinyDB CLI, then verify the repair after reopening its database file.

A database can exit successfully and still update the wrong row or lose a survivor during deletion. The repair workshop freezes a copy of the runnable C CLI and introduces two logical defects. Each launch seeds a new three-row file, so the investigation does not touch a database you want to keep. Begin with the failing contract, inspect the selected ID and array slot, and follow the candidate table through mutation and serialization. The small example below states the neighbor-preservation contract; the separate workshop contains the full CLI to repair. Complete the <a href="#/chapter/files-bytes/7">optional Part 2 GDB lab</a> first, or skip this native workshop.

## Optional repair workshop: a broken TinyDB (optional)

Run in Codespaces or local Linux with GDB; the browser CLI does not provide GDB. Starter checks initially fail on purpose. Guide and editable source: `native/debugging/tinydb`.

```sh
make debug-lab LAB=tinydb
```

### Reproduce the contracts

The seed is Ada/90, Grace/80, and Linus/70 with IDs 1, 2, and 3. Updating ID 2 should preserve its neighbors. Deleting any one row should preserve the remaining two. All four starter checks initially fail.

```text
make debug-lab LAB=tinydb
make debug-check LAB=tinydb
```

### Trace the UPDATE write

The guided launcher opens a fresh fixture and stops in execute. Use list execute to locate the score-assignment line; break at its current source line number and continue. Before the write, statement.id is 2, at is 1, and candidate.rows[at].id is 2. The guide in the lab files includes a watchpoint on the neighboring score.

```text
make debug-gdb LAB=tinydb
```

### Trace the DELETE count

Quit the first GDB session. This command starts another fresh fixture using DELETE for ID 2. Locate the count-decrement line, break there, and watch candidate.count. Explain why a copied record can still be in memory while an incorrect count omits it from the saved file.

```text
make debug-gdb LAB=tinydb CASE=delete
```

### Rebuild and reopen

Edit native/debugging/tinydb/main.c, then repeat the regression checks. Each check uses an independent fixture and reopens the saved database. Keep both source fixes and add cases beyond the failing examples.

```text
make debug-check LAB=tinydb
```

<details><summary>Hint and separate reference</summary>

The correct slot returned by lookup must also select the destination of an update. Each successful deletion reduces the logical count by exactly one. After trying, inspect the separate .reference/main.c or run make debug-check LAB=tinydb REFERENCE=1.

</details>

### main.c

```c
#include <stdbool.h>
#include <stddef.h>
#include <stdio.h>

typedef struct { unsigned id, score; } Row;

bool update_score(Row *rows, size_t count, unsigned id, unsigned score) {
    for (size_t i = 0; i < count; ++i) {
        if (rows[i].id == id) {
            rows[i].score = score;
            return true;
        }
    }
    return false;
}

int main(void) {
    Row rows[] = {{1, 90}, {2, 80}, {3, 70}};
    if (!update_score(rows, 3, 2, 99)) return 1;
    for (size_t i = 0; i < 3; ++i)
        printf("id=%u score=%u\n", rows[i].id, rows[i].score);
    return 0;
}
```

Output:

```text
id=1 score=90
id=2 score=99
id=3 score=70
```

The lookup matches ID 2 at slot 1 and writes only that slot. IDs 1 and 3 keep their scores. In the repair lab, the update regression reopens the file after changing ID 2, and the delete regressions check that first, middle, and last deletion preserve the other rows. Passing the small worked example does not validate the separate faulty CLI.

**Watch for:** Do not fix the shared browser CLI to complete this exercise: edit native/debugging/tinydb/main.c. A successful exit and sanitizer-clean execution cannot establish row identity or preservation. Debug only the isolated fixtures, and check persisted results as well as live memory.

**Check:** Why does the regression reopen the database after the mutation?

1. The in-memory table alone cannot establish that the saved rows are correct
2. Reopening proves that the program is safe under every crash

<details><summary>Answer</summary>

The in-memory table alone cannot establish that the saved rows are correct. Reopening checks the persistence boundary for this completed operation. It does not prove crash durability, transaction isolation, or correctness for every input.

</details>

**Try:** Repair both defects in the isolated CLI copy, pass all four checks, and add missing-ID, sole-row deletion, and duplicate-rejection regressions. Record the GDB evidence for each source fix.

Run from the repository root:

```sh
make example EXAMPLE=ship-8
```

## Build it yourself

Ship a documented TinyDB build with tests, benchmarks, and exportable files.

1. Turn the small database into a reproducible learning release with contract tests, failure experiments, and an explicit compatibility document.
2. Package your assembled TinyDB, its acceptance suite, the format document, and a verified exported file; list every feature still outside your implementation.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=ship-7
```

Chapter workspace command: `make chapter CHAPTER=ship`.

Generated from dist/part6.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/ship
