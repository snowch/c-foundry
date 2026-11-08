# Chapter 23: Tokenizing and parsing commands

Part 5: Build TinyDB. Teaching baseline: C17.

Recognize a deliberately small SQL grammar and keep syntax, schema validation, and execution separate.

## Outcomes

- Tokenize bounded identifiers, numbers, and quoted strings.
- Construct a typed statement only after complete syntax validation.
- Reject trailing input and distinguish syntax from value errors.

## 23.1 Tokens, keywords, identifiers, and literals

Tokenization converts characters into categories such as keywords, identifiers, literals, and punctuation. It does not execute commands.

The lexer recognizes bounded ASCII words, checked unsigned 32-bit integers, quoted strings, and the punctuation needed by this grammar. It returns BAD for invalid or oversized tokens. Keywords are case-sensitive in this teaching dialect; changing that policy requires deliberate normalization rather than silently accepting some mixed-case forms.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

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

int main(void) {
  Lexer l = {"SELECT * FROM people;", {0}, 0};
  Token token;
  unsigned words = 0, punctuation = 0;
  while ((token = next(&l)) != END) {
    if (token == BAD)
      return 1;
    if (token == WORD)
      ++words;
    else
      ++punctuation;
  }
  printf("words=%u punctuation=%u\n", words, punctuation);
  return 0;
}
```

Output:

```text
words=3 punctuation=2
```

SELECT, FROM, and people are words. The star and semicolon are punctuation. No table access occurs during lexing.

**Watch for:** Treating a keyword-looking substring inside a quoted string as syntax corrupts valid data.

**Check:** Does tokenization insert a row?

1. No
2. Yes

<details><summary>Answer</summary>

No. Lexing identifies categories and values; execution is a later stage.

</details>

**Try:** Print each token category and source offset, then test invalid characters and an overflowing numeric literal.

Run from the repository root:

```sh
make example EXAMPLE=parsing-1
```

## 23.2 Whitespace, quoted strings, and malformed input

Quoted strings can contain whitespace and escaped quotes. A lexer must distinguish a closing quote from a quote represented as data.

Inside a single-quoted string, this lexer interprets two adjacent quotes as one data quote. It rejects an unterminated string or a decoded value exceeding 31 bytes. Whitespace outside tokens is ignored; whitespace inside a quoted string is preserved. These are ASCII byte-oriented rules, not Unicode normalization.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

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

int main(void) {
  Lexer l = {"  'Ada Lovelace'  'O''Brien'", {0}, 0};
  if (next(&l) != STRING)
    return 1;
  puts(l.text);
  if (next(&l) != STRING)
    return 1;
  puts(l.text);
  Lexer bad = {"'unfinished", {0}, 0};
  printf("unterminated=%d\n", next(&bad) == BAD);
  return 0;
}
```

Output:

```text
Ada Lovelace
O'Brien
unterminated=1
```

The doubled quote contributes one character to O'Brien. The malformed second fixture reaches the end before a closing quote.

**Watch for:** A fixed-size token buffer needs a decoded-length check before every write, including escaped data.

**Check:** Is a doubled quote inside this literal a token boundary?

1. Yes, it ends the statement
2. No, it represents one quote character

<details><summary>Answer</summary>

No, it represents one quote character. The lexer’s string state handles doubled quotes before looking for token boundaries.

</details>

**Try:** Test an empty string, 31-byte and 32-byte strings, and whitespace around every punctuation token.

Run from the repository root:

```sh
make example EXAMPLE=parsing-2
```

## 23.3 A small SQL grammar

A grammar specifies complete legal sequences, not just recognizable prefixes. Start with two statements you can test thoroughly.

The subset is INSERT INTO people VALUES (number, string, number); and SELECT * FROM people optionally followed by WHERE id = number. Both require a semicolon and end of input. The parser builds a temporary statement and assigns it to the output only after success, preserving output state after rejection.

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
  Statement s = {0};
  bool good = parse("INSERT INTO people VALUES (1, 'Ada', 90);", &s);
  printf("valid=%d missing_semicolon=%d trailing=%d\n", good,
         !parse("SELECT * FROM people", &s),
         !parse("SELECT * FROM people; garbage", &s));
  return 0;
}
```

Output:

```text
valid=1 missing_semicolon=1 trailing=1
```

The valid insert matches the complete production. The other strings fail because the required terminator or end-of-input contract is violated.

**Watch for:** Accepting a valid prefix while ignoring trailing tokens can hide malformed or unintended commands.

**Check:** What follows the semicolon in this grammar?

1. End of input
2. Any ignored characters

<details><summary>Answer</summary>

End of input. A single-statement parser must consume the entire statement.

</details>

**Try:** Write the grammar in a small notation, then generate one malformed example for each required punctuation token.

Run from the repository root:

```sh
make example EXAMPLE=parsing-3
```

## 23.4 Building a statement representation

A statement representation should retain semantic values rather than pointers into a lexer’s reused token buffer.

The parser copies the insert’s bounded name into the statement and stores numeric values in typed fields. A SELECT records whether it has a key predicate and the key itself. It does not store raw SQL fragments for execution to reinterpret. This tagged representation lets validation and execution dispatch on Kind.

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
  Statement s = {0};
  if (!parse("SELECT * FROM people WHERE id = 7;", &s))
    return 1;
  printf("select=%d filtered=%d id=%u\n", s.kind == SELECT_STMT, s.filtered,
         (unsigned)s.key);
  return 0;
}
```

Output:

```text
select=1 filtered=1 id=7
```

The filtered flag distinguishes an explicit key predicate from an unfiltered scan; zero-initialized spare fields are not used as a substitute for that flag.

**Watch for:** Keeping l.text pointers in the statement would make earlier tokens change when the lexer reads the next token.

**Check:** Why copy the string into the statement?

1. String literals always need malloc
2. The lexer’s token buffer is reused

<details><summary>Answer</summary>

The lexer’s token buffer is reused. The statement needs stable data after subsequent token reads.

</details>

**Try:** Add an UPDATE production and a distinct statement variant without changing SELECT field meanings.

Run from the repository root:

```sh
make example EXAMPLE=parsing-4
```

## 23.5 Clear syntax and validation errors

Syntax errors and invalid values are different failures. Report them before mutating the table.

A row ID of zero is syntactically a number but violates the schema. A missing closing parenthesis is a syntax error and should not reach validation. The example’s Boolean stages keep the distinction explicit; a user-facing parser can additionally retain the failing source offset and expected token to produce a precise diagnostic.

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
  Statement s = {0};
  bool syntax = parse("INSERT INTO people VALUES (0, 'Ada', 90);", &s);
  printf("parsed=%d value_rejected=%d\n", syntax, syntax && !validate(&s));
  printf("syntax_rejected=%d\n",
         !parse("INSERT INTO people VALUES (1, 'Ada', 90;", &s));
  return 0;
}
```

Output:

```text
parsed=1 value_rejected=1
syntax_rejected=1
```

The zero-ID statement reaches validation and is rejected there. The missing-parenthesis statement never produces a valid new statement.

**Watch for:** Do not partially insert a row while still parsing later fields; a later syntax failure must leave the table unchanged.

**Check:** Where should zero-ID rejection occur?

1. Schema validation
2. Character tokenization

<details><summary>Answer</summary>

Schema validation. Zero is a valid numeric token but an invalid key under this schema.

</details>

**Try:** Return a structured error with stage, source offset, and expected token, then test that rejection preserves table state.

Run from the repository root:

```sh
make example EXAMPLE=parsing-5
```

## Build it yourself

Parse a small SQL subset and explain malformed statements.

1. Recognize a deliberately small SQL grammar and keep syntax, schema validation, and execution separate.
2. Return a structured error with stage, source offset, and expected token, then test that rejection preserves table state.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=parsing-5
```

Chapter workspace command: `make chapter CHAPTER=parsing`.

Generated from dist/part5.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/parsing
