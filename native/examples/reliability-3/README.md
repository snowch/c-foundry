# Fault injection, fuzzing, and recovery testing

Complete Linux example, ready to edit and run in the browser terminal.

## 44.3 Fault injection, fuzzing, and recovery testing

A release suite should combine targeted regressions, generated input, and failure-boundary tests while stating what remains untested.

Also editable and runnable inline in the browser course.

This fixture checks all 25 prefixes of a transaction log, every too-short row length, and 256 deterministic bounded parser inputs. It preserves the distinction between format validation, recovery semantics, and parser robustness. Add concurrency schedule tests in Browser Linux. ThreadSanitizer is optional external tooling; no finite run proves all schedules, all storage reorderings, or production reliability.

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
  Table table = {.count = 0};
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
  unsigned char log[24];
  log_record(log, BEGIN_REC, 1, 0);
  log_record(log + 8, SET_REC, 1, 42);
  log_record(log + 16, COMMIT_REC, 1, 0);
  for (size_t cut = 0; cut <= 24; ++cut)
    if (recover(log, cut, 0) != (cut == 24 ? 42u : 0u))
      return 1;
  unsigned char record[ROW_BYTES] = {0};
  for (size_t n = 0; n < ROW_BYTES; ++n) {
    Row out = {9, "Keep", 0};
    if (decode_row(record, n, &out) || out.id != 9)
      return 1;
  }
  uint32_t seed = 23;
  char input[17];
  const char alphabet[] = "SELECT 0123(),;xyz";
  for (unsigned trial = 0; trial < 256; ++trial) {
    for (size_t i = 0; i < 16; ++i) {
      seed = seed * 1664525u + 1013904223u;
      input[i] = alphabet[(seed >> 24) % (sizeof alphabet - 1)];
    }
    input[trial % 16] = 0;
    Statement s = {0};
    if (parse(input, &s))
      (void)validate(&s);
  }
  puts("recovery_prefixes=25 parser_cases=256 short_records=40");
  return 0;
}
```

Output:

```text
recovery_prefixes=25 parser_cases=256 short_records=40
```

The pass line follows independent boundary expectations and decoder output-preservation checks. The fixed seeds make the generated corpus reproducible.

**Watch for:** A green suite is evidence under stated limits, not a reason to omit format, isolation, resource, or host-guarantee documentation.

**Check:** What should happen to a newly discovered failing input?

1. Minimize it and retain it as a deterministic regression
2. Discard it after one successful retry

<details><summary>Answer</summary>

Minimize it and retain it as a deterministic regression. A preserved fixture prevents the same defect from quietly returning.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/reliability/3). In main.c, change the SET_REC value and the matching complete-prefix expected value from 42 to 17. Run code and compare recovery_prefixes=, parser_cases=, and short_records=. Which prefix checks the changed committed payload while the other fixtures remain independent?

**Extend the example:** In Browser Linux, make check-examples CC=clang repeats the fixtures with a second compiler. Use these results to design and document your project’s release suite. Sanitizer builds are optional external tooling and are not required by this browser course.

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [SQLite documentation: integrity checks](https://www.sqlite.org/pragma.html#pragma_integrity_check) (online) — Compare structural checks with the invariants tested in the teaching database.
- [SQLite documentation: atomic commit](https://www.sqlite.org/atomiccommit.html) (online) — Read the failure assumptions and ordering required for a durable commit protocol.

**Use the documentation (optional):** What does a structural integrity check add beyond comparing one SELECT result?

<details><summary>Compare your answer</summary>

It can check reachability, ordering, ownership, page relationships, and other representation invariants. Passing it still covers only its documented scope and the inspected state.

</details>

Native source: `native/examples/reliability-3/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=reliability-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

