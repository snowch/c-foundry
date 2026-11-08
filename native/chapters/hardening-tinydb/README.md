# Chapter 34: Hardening TinyDB

Part 7: C standards and portable systems programming. Teaching baseline: C17.

Audit the teaching database against its declared targets and build evidence for bounds, format, and resource guarantees.

## Outcomes

- Replace hidden size and representation assumptions with checked contracts.
- Test format-version rejection and state preservation.
- Run strict multi-compiler and sanitizer checks.

## 34.1 Auditing assumptions about types and memory

An assumption audit checks where input sizes, arithmetic ranges, alignment, and lifetimes cross API boundaries.

For an array allocation, validate count≤SIZE_MAX/element_size before multiplication. Also define a zero-element policy and who owns the result. The fixture rejects an impossible int-array size without attempting memory exhaustion. Similar checks belong in page offsets, slot lengths, result buffers, and log record counts.

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
  size_t count = SIZE_MAX;
  bool rejected = count > SIZE_MAX / sizeof(int);
  printf("oversize_rejected=%d\n", rejected);
  return 0;
}
```

Output:

```text
oversize_rejected=1
```

On the supported targets sizeof(int)>1, so the requested count cannot fit a byte size. The operating system is not asked to perform a huge allocation.

**Watch for:** A NULL check after an already overflowing multiplication does not repair the requested size.

**Check:** When must multiplication overflow be checked?

1. Before multiplying
2. Only after malloc fails

<details><summary>Answer</summary>

Before multiplying. An overflowed size may request a small allocation and later cause an out-of-bounds write.

</details>

**Try:** Audit every size calculation in the pager, index, parser, and vector with a stated maximum.

Run from the repository root:

```sh
make example EXAMPLE=hardening-tinydb-1
```

## 34.2 Versioning the database format

Version checks are part of the decoder’s public contract. Unknown formats must not partially replace existing data.

The fixture writes a header with an unsupported version and confirms rejection. A compatibility suite should include known valid older fixtures, unsupported future versions, reserved-bit violations, and size mismatches. A migration must preserve a verified old file until the new file is safely published under the target platform’s rules.

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
  unsigned char header[8] = {0x54, 0x44, 0x42, 0x31, 99, 40, 0, 0};
  if (fwrite(header, 1, 8, f) != 8 || fseek(f, 0, SEEK_SET)) {
    fclose(f);
    return 1;
  }
  Table live = {0};
  insert_row(&live, (Row){9, "Keep", 0});
  bool rejected = !load(f, &live);
  if (fclose(f) != 0)
    return 1;
  printf("rejected=%d retained=%u\n", rejected, (unsigned)live.rows[0].id);
  return 0;
}
```

Output:

```text
rejected=1 retained=9
```

The decoder leaves the existing key nine untouched. A version number is checked before row-count-driven reads.

**Watch for:** A new writer should not overwrite the only old-format file before migration success is established.

**Check:** What is the live-state result after unknown-version rejection?

1. A partially decoded replacement
2. The previous state remains

<details><summary>Answer</summary>

The previous state remains. The loader commits its temporary state only after full validation.

</details>

**Try:** Add version fixtures to your release suite and document the intended upgrade and downgrade policy.

Run from the repository root:

```sh
make example EXAMPLE=hardening-tinydb-2
```

## 34.3 Multiple compilers and warning settings

Compilers provide complementary diagnostics. Keep the same language baseline and fixtures when comparing their builds.

The example exercises a bounded decoded record with explicit byte assembly and a typed output. Run it with CC=gcc and CC=clang, both with strict warnings. Agreement is useful evidence, not proof of freedom from undefined behavior: both compilers can compile the same invalid source without a diagnostic when the language does not require one.

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

**Try:** Run make example EXAMPLE=hardening-tinydb-3 CC=clang and compare diagnostics with the GCC command.

Run from the repository root:

```sh
make example EXAMPLE=hardening-tinydb-3
```

## 34.4 Sanitizers and portability checks

Sanitizers observe executed behavior and catch selected invalid operations. Combine them with strict builds, input validation, and independent expectations.

The fixture passes a deliberately short record to the decoder and verifies that it is rejected before bytes are accessed or output is assigned. Run with SANITIZE=1 to add AddressSanitizer and UndefinedBehaviorSanitizer in native builds. ThreadSanitizer is a separate tool for shared-memory concurrency and may depend on runtime/kernel support.

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
  unsigned char bytes[3] = {0};
  Row out = {9, "Keep", 1};
  bool rejected = !decode_row(bytes, sizeof bytes, &out);
  printf("short_rejected=%d output_preserved=%d\n", rejected,
         out.id == 9 && strcmp(out.name, "Keep") == 0);
  return 0;
}
```

Output:

```text
short_rejected=1 output_preserved=1
```

Length rejection occurs before get32 reads an ID. The original output object remains valid and unchanged.

**Watch for:** A clean sanitizer run does not explore unexecuted paths or establish crash durability.

**Check:** What does a clean sanitizer run establish?

1. All possible inputs are correct
2. No selected violation was detected on exercised paths

<details><summary>Answer</summary>

No selected violation was detected on exercised paths. The scope is the actual instrumentation and executions.

</details>

**Try:** Run this example with SANITIZE=1, then add short inputs at every length below the full record size.

Run from the repository root:

```sh
make example EXAMPLE=hardening-tinydb-4
```

## Build it yourself

Run the TinyDB baseline under stricter compiler and sanitizer checks.

1. Audit the teaching database against its declared targets and build evidence for bounds, format, and resource guarantees.
2. Run this example with SANITIZE=1, then add short inputs at every length below the full record size.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=hardening-tinydb-4
```

Chapter workspace command: `make chapter CHAPTER=hardening-tinydb`.

Generated from dist/part7.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/hardening-tinydb
