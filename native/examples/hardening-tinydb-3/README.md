# Multiple compilers and warning settings

Complete native example, ready to edit and run in Codespaces or locally.

## 34.3 Multiple compilers and warning settings

Compilers provide complementary diagnostics. Keep the same language baseline and fixtures when comparing their builds.

The example exercises a bounded decoded record with explicit byte assembly and a typed output. Run it with CC=gcc and CC=clang, both with strict warnings. Agreement is useful evidence, not proof of freedom from undefined behavior: both compilers can compile the same invalid source without a diagnostic when the language does not require one. The new portability workflow uses Linux GCC and Clang, macOS Clang, and Windows MSVC in C17 mode. Each host consumes and produces the same known database bytes, and a second job on every host reads artifacts from all producers. This checks the audited slice, not every POSIX, threaded, or Linux-specific example in the course.

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
  unsigned char bytes[ROW_BYTES];
  Row source = {7, "Ada", 90}, copy = {0};
  if (!encode_row(bytes, &source) || !decode_row(bytes, sizeof bytes, &copy) ||
      copy.id != 7 || strcmp(copy.name, "Ada"))
    return 1;
  puts("strict compiler fixture passed");
  return 0;
}
```

Output:

```text
strict compiler fixture passed
```

The repository commands compile with C17, warnings, and warnings-as-errors, then check the documented output.

**Watch for:** Suppressing a warning globally just to make a second compiler pass may hide a real contract problem.

**Check:** Does agreement between two compilers prove valid C?

1. No
2. Yes

<details><summary>Answer</summary>

No. Undiagnosed undefined behavior remains possible.

</details>

**Try:** Run python3 tools/check_portability.py --compiler gcc, inspect all four Actions matrix entries, and distinguish compiler diagnostics from operating-system coverage.

Run from the repository root:

```sh
make example EXAMPLE=hardening-tinydb-3
```

