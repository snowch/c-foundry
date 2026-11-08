# Building a pager abstraction

Complete native example, ready to edit and run in Codespaces or locally.

## 25.4 Building a pager abstraction

A pager centralizes page addressing and I/O errors so higher layers do not duplicate those checks. Its lifecycle includes stream ownership.

The Pager borrows an already opened FILE; its caller is responsible for closing it. write_page may fail and higher layers must stop rather than treating the page as committed. This minimal layer tracks initialized page count but has no cache, dirty flags, transaction log, or durable commit protocol. Later chapters add those capabilities behind explicit contracts.

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
typedef struct {
  FILE *file;
  size_t pages;
} Pager;
bool write_page(Pager *p, size_t id, const unsigned char *bytes) {
  if (id > p->pages || id > (size_t)LONG_MAX / PAGE_BYTES)
    return false;
  if (fseek(p->file, (long)(id * PAGE_BYTES), SEEK_SET) != 0 ||
      fwrite(bytes, 1, PAGE_BYTES, p->file) != PAGE_BYTES)
    return false;
  if (id == p->pages)
    ++p->pages;
  return true;
}
bool read_page(Pager *p, size_t id, unsigned char *out) {
  if (id >= p->pages || id > (size_t)LONG_MAX / PAGE_BYTES)
    return false;
  return fseek(p->file, (long)(id * PAGE_BYTES), SEEK_SET) == 0 &&
         fread(out, 1, PAGE_BYTES, p->file) == PAGE_BYTES;
}

int main(void) {
  FILE *f = tmpfile();
  if (!f)
    return 1;
  Pager p = {f, 0};
  unsigned char page[PAGE_BYTES] = {0}, copy[PAGE_BYTES];
  bool gap = write_page(&p, 2, page);
  page[0] = 9;
  bool ok = write_page(&p, 0, page) && read_page(&p, 0, copy);
  printf("gap_rejected=%d valid=%d marker=%u\n", !gap, ok, ok ? copy[0] : 0);
  if (fclose(f) != 0 || !ok)
    return 1;
  return 0;
}
```

Output:

```text
gap_rejected=1 valid=1 marker=9
```

The rejected gap write leaves the page count zero, allowing the valid page-zero append afterward.

**Watch for:** A boolean page write is not a transaction commit; naming it commit would imply guarantees it lacks.

**Check:** Who closes the stream in this pager API?

1. Every read_page call
2. The caller that owns it

<details><summary>Answer</summary>

The caller that owns it. The pager borrows the FILE rather than taking ownership.

</details>

**Try:** Add open/close functions with explicit ownership and tests for partial-page files and I/O failures.

Run from the repository root:

```sh
make example EXAMPLE=persistence-4
```

