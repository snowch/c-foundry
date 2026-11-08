# Chapter 25: Persistent storage

Part 5: Build TinyDB. Teaching baseline: C17.

Define bytes independently of structs, check every stream operation, and load untrusted files into a temporary validated table.

## Outcomes

- Document a versioned little-endian record format.
- Read and write bounded fixed-size pages.
- Reject truncated, corrupt, duplicate-key, and trailing input without replacing live state.

## 25.1 Encoding a file header and schema

A file header identifies a format and states how to interpret the remaining bytes. Unknown versions should fail clearly.

The teaching format begins with ASCII TDB1, version byte one, record-size byte forty, a one-byte row count, and a reserved zero byte. It requires eight-bit bytes and exact-width uint32_t. The count is capped by the bounded table; a larger format would use wider lengths and checked offset calculations. Header bytes are a protocol, not the memory layout of a C header struct.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
_Static_assert(CHAR_BIT == 8, "eight-bit format required");

int main(void) {
  unsigned char header[8] = {0x54, 0x44, 0x42, 0x31, 1, 40, 2, 0};
  printf("version=%u record_bytes=%u rows=%u reserved=%u\n", (unsigned)header[4],
         (unsigned)header[5], (unsigned)header[6], (unsigned)header[7]);
  return 0;
}
```

Output:

```text
version=1 record_bytes=40 rows=2 reserved=0
```

Every offset has a documented meaning. A loader must validate all these fields before using the row count to read records.

**Watch for:** An application must not treat an unknown version as if it were the current format.

**Check:** What should an unsupported version cause?

1. Explicit rejection or a defined migration path
2. An unchecked raw-struct read

<details><summary>Answer</summary>

Explicit rejection or a defined migration path. Different layouts need deliberate compatibility handling.

</details>

**Try:** Write a byte-offset format table and test bad magic, version, record width, and reserved bytes.

Run from the repository root:

```sh
make example EXAMPLE=persistence-1
```

## 25.2 Serializing rows without dumping raw structs

Serialization must encode field widths and byte order explicitly. Raw struct dumps expose padding and native representation assumptions.

A record contains four little-endian ID bytes, 32 name bytes with a required terminator and a nonempty name, and four little-endian score bytes. The encoder clears spare name bytes for reproducible output. The decoder checks length and validity before assigning the output row. Numeric ranges and name ownership stay consistent with the in-memory schema.

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
  Row row = {513, "Ada", 90}, copy = {0};
  unsigned char bytes[ROW_BYTES];
  if (!encode_row(bytes, &row) || !decode_row(bytes, sizeof bytes, &copy))
    return 1;
  printf("id_bytes=%u,%u,%u,%u row=%u:%s:%u\n", (unsigned)bytes[0], (unsigned)bytes[1], (unsigned)bytes[2],
         (unsigned)bytes[3], (unsigned)copy.id, copy.name, (unsigned)copy.score);
  return 0;
}
```

Output:

```text
id_bytes=1,2,0,0 row=513:Ada:90
```

The ID 513 is 1+2·256, so its first two bytes are one and two. The name is copied into owned embedded storage.

**Watch for:** A round trip alone can hide matching encoder/decoder bugs; also compare independently specified bytes.

**Check:** Does this format depend on sizeof(Row)?

1. Yes
2. No

<details><summary>Answer</summary>

No. Its forty bytes are specified by offsets, independent of struct padding.

</details>

**Try:** Add fixture-byte tests for zero, maximum score, maximum ID, and a 31-byte name.

Run from the repository root:

```sh
make example EXAMPLE=persistence-2
```

## 25.3 Reading and writing fixed-size pages

Fixed-size pages give storage a simple addressing unit. A page number maps to an offset only after range and multiplication checks.

The pager uses 128-byte pages and permits writing an existing page or appending exactly the next page. Reads reject IDs outside the known count. fseek positions the update stream before switching between reads and writes. These checks establish logical addressing; successful buffered I/O alone does not promise crash durability.

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
  page[7] = 42;
  bool ok = write_page(&p, 0, page) && read_page(&p, 0, copy);
  if (!ok) {
    fclose(f);
    return 1;
  }
  printf("pages=%zu byte7=%u missing=%d\n", p.pages, copy[7],
         !read_page(&p, 1, copy));
  if (fclose(f) != 0)
    return 1;
  return 0;
}
```

Output:

```text
pages=1 byte7=42 missing=1
```

The first write establishes page zero. Reading page one fails before accessing a nonexistent page.

**Watch for:** An unchecked page_id×page_size can overflow before fseek receives the offset.

**Check:** Which page may be appended?

1. Exactly the current page count
2. Any arbitrary unbounded page ID

<details><summary>Answer</summary>

Exactly the current page count. This pager rejects gaps and tracks contiguous initialized pages.

</details>

**Try:** Write two pages with distinct markers, close and reopen a named file, and verify offsets from its checked length.

Run from the repository root:

```sh
make example EXAMPLE=persistence-3
```

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

## 25.5 Browser-backed files, import, and export

A browser compiler’s virtual files are temporary unless explicitly transferred to persistent browser storage or exported to the user.

This native transfer tool writes people.tdb and loads it back through the validated decoder. Use KEEP_FILES=1 with the repository runner to retain the named artifact under .build/files/persistence-5, then download it through the Codespaces file explorer. The browser page also supplies a matching sample file. Browser drafts and localStorage lesson marks are not database-file persistence, and a saved browser blob does not imply transaction durability.

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

int main(int argc, char **argv) {
  Table source = {0}, copy = {0};
  insert_row(&source, (Row){1, "Ada", 90});
  insert_row(&source, (Row){2, "Grace", 80});
  if (argc == 3 && strcmp(argv[1], "import") == 0) {
    FILE *in = fopen(argv[2], "rb");
    if (!in)
      return 1;
    bool ok = load(in, &copy);
    if (fclose(in) != 0 || !ok)
      return 1;
    display(&copy);
    return 0;
  }
  if (argc != 1)
    return 1;
  FILE *out = fopen("people.tdb", "wb");
  if (!out)
    return 1;
  bool written = save(out, &source);
  if (fclose(out) != 0 || !written)
    return 1;
  FILE *in = fopen("people.tdb", "rb");
  if (!in)
    return 1;
  bool read = load(in, &copy);
  if (fclose(in) != 0 || !read)
    return 1;
  printf("exported=1 imported=1 rows=%zu\n", copy.count);
  return 0;
}
```

Output:

```text
exported=1 imported=1 rows=2
```

The default run exports and reimports two rows. The optional import argument loads an external file and prints its validated contents; no raw struct casts are used.

**Watch for:** Do not claim that the page’s current Wasm runner automatically persists its filesystem across executions.

**Check:** Does compiling in a browser automatically persist program files?

1. No
2. Yes

<details><summary>Answer</summary>

No. The runtime resets its virtual filesystem; a host transfer/storage step is separate.

</details>

**Try:** Retain and download people.tdb. Compile this source in Codespaces, then run the executable with import and the downloaded file path.

Run from the repository root:

```sh
make example EXAMPLE=persistence-5 KEEP_FILES=1
```

## 25.6 Testing truncated and corrupt input

Untrusted files must be validated completely before replacing a live table. Truncated input is a normal error case, not an invitation to read partial objects.

load constructs a temporary table, validates the header, reads exact record lengths, checks decoded rows and duplicate IDs, and rejects trailing bytes. Only after reaching a clean end does it assign the output table. This fixed-size approach bounds memory use. A production format should also document checksums, limits, and evolution rules; checksums detect accidental corruption, not malicious authenticity.

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
  unsigned char bad[] = {0x54, 0x44, 0x42, 0x31, 1, 40, 1, 0, 7};
  if (fwrite(bad, 1, sizeof bad, f) != sizeof bad ||
      fseek(f, 0, SEEK_SET) != 0) {
    fclose(f);
    return 1;
  }
  Table live = {0};
  insert_row(&live, (Row){9, "Keep", 1});
  bool loaded = load(f, &live);
  printf("rejected=%d retained=%s count=%zu\n", !loaded, live.rows[0].name,
         live.count);
  if (fclose(f) != 0)
    return 1;
  return 0;
}
```

Output:

```text
rejected=1 retained=Keep count=1
```

The header declares one forty-byte row but provides only one byte. Loading fails and the previously live Keep row remains unchanged.

**Watch for:** Assigning decoded rows directly into the live table before validating the entire file makes rejection destructive.

**Check:** When is live state replaced?

1. Immediately after reading the magic bytes
2. Only after complete validation succeeds

<details><summary>Answer</summary>

Only after complete validation succeeds. Later records or trailing input may still invalidate the file.

</details>

**Try:** Test every truncation offset, a duplicate ID, an unterminated name field, and one extra trailing byte.

Run from the repository root:

```sh
make example EXAMPLE=persistence-6
```

## Build it yourself

Persist rows through a pager and reject corrupt database input.

1. Define bytes independently of structs, check every stream operation, and load untrusted files into a temporary validated table.
2. Test every truncation offset, a duplicate ID, an unterminated name field, and one extra trailing byte.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=persistence-6
```

Chapter workspace command: `make chapter CHAPTER=persistence`.

Generated from dist/part5.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/persistence
