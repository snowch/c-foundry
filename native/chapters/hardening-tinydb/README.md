# Chapter 34: TinyDB portability audit

Part 7: Writing portable C. Teaching baseline: C17.

Turn a portability claim into a contract and testable evidence. Audit the real TinyDB CLI, then build a small codec-and-file slice whose database bytes can be exchanged across supported hosts.

## Outcomes

- Record language, integer, encoding, filename, file-mode, and resource assumptions.
- Keep portable encode/decode logic independent of filesystem operations.
- Verify exact bytes and rejection preservation using independent fixtures.
- Build the same audited target with GCC, Clang, and MSVC across Linux, macOS, and Windows.
- Distinguish file compatibility from atomic replacement, crash durability, locking, and concurrent-writer support.

## 34.1 Auditing assumptions about types and memory

An assumption audit checks where input sizes, arithmetic ranges, alignment, and lifetimes cross API boundaries.

For an array allocation, validate count≤SIZE_MAX/element_size before multiplication. Also define a zero-element policy and who owns the result. The fixture rejects an impossible int-array size without attempting memory exhaustion. Similar checks belong in page offsets, slot lengths, result buffers, and log record counts. Include sizeof(long), size_t and printf formats, char signedness, execution character set, eight-bit-byte requirements, optional exact-width types, and alignment in the audit. Record each as guaranteed by C17, required of supported targets, validated at an input boundary, or delegated to a host adapter. A compiler accepting the source does not discharge the remaining assumptions.

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

The fixture writes a header with an unsupported version and confirms rejection. A compatibility suite should include known valid older fixtures, unsupported future versions, reserved-bit violations, and size mismatches. A migration must preserve a verified old file until the new file is safely published under the target platform’s rules. The audit target also requires canonical zero padding and valid UTF-8 names. Its eight-row limit is explicit; the CLI supports 128, so files outside the shared subset are rejected rather than silently truncated. Exact fixture bytes catch a shared encoder/decoder mistake that a round trip alone misses.

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

## 34.4 Sanitizers and portability checks

Sanitizers observe executed behavior and catch selected invalid operations. Combine them with strict builds, input validation, and independent expectations.

The fixture passes a deliberately short record to the decoder and verifies that it is rejected before bytes are accessed or output is assigned. Run with SANITIZE=1 to add AddressSanitizer and UndefinedBehaviorSanitizer in native builds. ThreadSanitizer is a separate tool for shared-memory concurrency and may depend on runtime/kernel support. A clean sanitizer run does not prove encoding compatibility, correct row identity, filesystem case behavior, or safe replacement of an existing file. Keep exact-byte, invalid-input, and failure-preservation assertions in the portability suite. The audit adapter deliberately creates new files exclusively; it does not claim portable atomic replacement.

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

## 34.5 Audit and exchange TinyDB files across platforms

Finish with a concrete audit: publish the supported assumptions, compile a portable codec and file adapter separately, and verify database files produced by other hosts.

The native/portability target implements a bounded TDB1 codec with no FILE, path, locale, or operating-system calls in its core. Its separate ISO C adapter uses binary streams and exclusive creation of a new, restricted ASCII basename. The format requires uint32_t, eight-bit bytes, and UTF-8 row names; the target also explicitly requires an ASCII-compatible execution character set. The suite validates a known fixture, every truncated prefix, malformed headers, duplicate IDs, invalid names, and unchanged outputs on codec rejection. Each OS reads the same binary fixture and exports artifacts that all other matrix hosts must validate and copy byte-for-byte.

### main.c

```c
#include "portable.h"
#include <stdio.h>
#include <string.h>

int main(void) {
    PortTable table; memset(&table, 0, sizeof table);
    table.count = 2; table.rows[0].id = 1; table.rows[0].score = 90;
    table.rows[1].id = 2; table.rows[1].score = 80;
    strcpy(table.rows[0].name, "Ada"); strcpy(table.rows[1].name, "Grace");
    unsigned char bytes[PORT_BYTES]; size_t size = 0;
    if (!port_encode(&table, bytes, sizeof bytes, &size) || !port_write_new("audit-output.tdb", bytes, size)) return 1;
    printf("rows=%zu bytes=%zu\n", table.count, size);
    return 0;
}
```

### portable.h

```c
#ifndef CF_PORTABLE_H
#define CF_PORTABLE_H
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#if !defined(UINT32_MAX) || CHAR_BIT != 8
#error "TDB1 requires uint32_t and eight-bit bytes"
#endif

_Static_assert('A' == 0x41 && 'a' == 0x61 && '0' == 0x30, "This target requires ASCII-compatible execution characters");

enum { PORT_CAPACITY = 8, PORT_BYTES = 8 + PORT_CAPACITY * 40 };
typedef struct { uint32_t id; char name[32]; uint32_t score; } PortRow;
typedef struct { PortRow rows[PORT_CAPACITY]; size_t count; } PortTable;
/* Decode commits only on success. Encode preserves output and length on failure.
 * Pointers designate live, suitably sized, nonoverlapping objects. */
bool port_decode(const unsigned char *bytes, size_t size, PortTable *out);
bool port_encode(const PortTable *table, unsigned char *bytes, size_t capacity, size_t *size);
/* Host boundary: restricted ASCII basename, binary streams, exclusive new file.
 * No overwrite, replacement, locking, fsync, or crash-durability promise. */
bool port_name(const char *name);
bool port_read(const char *name, unsigned char *bytes, size_t capacity, size_t *size);
bool port_write_new(const char *name, const unsigned char *bytes, size_t size);
#endif
```

### codec.c

```c
/* Portable core: no filesystem, process, locale, or native-layout dependency. */
#include "portable.h"
#include <string.h>

static uint32_t get32(const unsigned char *bytes) {
    uint32_t value = 0;
    for (unsigned i = 0; i < 4; ++i) value |= (uint32_t)bytes[i] << (8 * i);
    return value;
}
static void put32(unsigned char *bytes, uint32_t value) {
    for (unsigned i = 0; i < 4; ++i) bytes[i] = (unsigned char)(value >> (8 * i));
}
static bool name_ok(const char name[32]) {
    const unsigned char *p = (const unsigned char *)name;
    const char *end = memchr(name, 0, 32);
    if (!end || end == name) return false;
    size_t n = (size_t)(end - name);
    for (size_t i = n; i < 32; ++i) if (p[i] != 0) return false;
    for (size_t i = 0; i < n;) {
        unsigned char ch = p[i];
        if (ch < 32 || ch == 127) return false;
        if (ch < 128) { ++i; continue; }
        size_t width = ch >= 0xc2 && ch <= 0xdf ? 2 : ch >= 0xe0 && ch <= 0xef ? 3 : ch >= 0xf0 && ch <= 0xf4 ? 4 : 0;
        if (!width || width > n - i) return false;
        for (size_t j = 1; j < width; ++j) if ((p[i+j] & 0xc0) != 0x80) return false;
        if ((ch == 0xe0 && p[i+1] < 0xa0) || (ch == 0xed && p[i+1] >= 0xa0) ||
            (ch == 0xf0 && p[i+1] < 0x90) || (ch == 0xf4 && p[i+1] >= 0x90)) return false;
        i += width;
    }
    return true;
}
static bool table_ok(const PortTable *table) {
    if (table->count > PORT_CAPACITY) return false;
    for (size_t i = 0; i < table->count; ++i) {
        if (!table->rows[i].id || !name_ok(table->rows[i].name)) return false;
        for (size_t j = 0; j < i; ++j) if (table->rows[j].id == table->rows[i].id) return false;
    }
    return true;
}
bool port_encode(const PortTable *table, unsigned char *bytes, size_t capacity, size_t *size) {
    if (!table_ok(table)) return false;
    size_t n = 8 + table->count * 40;
    if (capacity < n) return false;
    unsigned char next[PORT_BYTES] = {0x54, 0x44, 0x42, 0x31, 1, 40, 0, 0};
    next[6] = (unsigned char)table->count;
    for (size_t i = 0; i < table->count; ++i) {
        unsigned char *row = next + 8 + i * 40;
        put32(row, table->rows[i].id);
        memcpy(row + 4, table->rows[i].name, 32);
        put32(row + 36, table->rows[i].score);
    }
    memcpy(bytes, next, n); *size = n;
    return true;
}
bool port_decode(const unsigned char *bytes, size_t size, PortTable *out) {
    static const unsigned char magic[] = {0x54, 0x44, 0x42, 0x31};
    if (size < 8 || memcmp(bytes, magic, 4) != 0 || bytes[4] != 1 || bytes[5] != 40 ||
        bytes[6] > PORT_CAPACITY || bytes[7] != 0 || size != 8 + (size_t)bytes[6] * 40) return false;
    PortTable next; memset(&next, 0, sizeof next); next.count = bytes[6];
    for (size_t i = 0; i < next.count; ++i) {
        const unsigned char *row = bytes + 8 + i * 40;
        next.rows[i].id = get32(row);
        memcpy(next.rows[i].name, row + 4, 32);
        next.rows[i].score = get32(row + 36);
    }
    if (!table_ok(&next)) return false;
    *out = next; return true;
}
```

### files.c

```c
/* ISO C file adapter. The restricted filename policy is deliberately narrower
 * than any supported OS. Relative ASCII basenames avoid a claim of Unicode
 * path portability through narrow fopen APIs. */
#include "portable.h"
#include <stdio.h>
#include <string.h>

bool port_name(const char *name) {
    size_t n = strlen(name);
    if (!n || n > 64 || name[0] == '.' || name[n-1] == '.') return false;
    char stem[65]; size_t used = 0;
    for (size_t i = 0; i < n; ++i) {
        unsigned char c = (unsigned char)name[i];
        if (!((c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a) ||
              (c >= 0x30 && c <= 0x39) || c == 0x2d || c == 0x2e || c == 0x5f)) return false;
        if (used == i && c != 0x2e) stem[used++] = (char)(c >= 0x61 && c <= 0x7a ? c - 32 : c);
    }
    stem[used] = 0;
    if (strcmp(stem, "CON") == 0 || strcmp(stem, "PRN") == 0 || strcmp(stem, "AUX") == 0 || strcmp(stem, "NUL") == 0) return false;
    if (used == 4 && (memcmp(stem, "COM", 3) == 0 || memcmp(stem, "LPT", 3) == 0) && stem[3] >= '1' && stem[3] <= '9') return false;
    return true;
}
bool port_read(const char *name, unsigned char *bytes, size_t capacity, size_t *size) {
    if (!port_name(name)) return false;
    FILE *file = fopen(name, "rb");
    if (!file) return false;
    size_t n = fread(bytes, 1, capacity, file);
    bool ok = !ferror(file) && fgetc(file) == EOF && !ferror(file);
    if (fclose(file) != 0) ok = false;
    if (ok) *size = n;
    return ok;
}
bool port_write_new(const char *name, const unsigned char *bytes, size_t size) {
    if (!port_name(name)) return false;
    FILE *file = fopen(name, "wbx");
    if (!file) return false;
    bool ok = fwrite(bytes, 1, size, file) == size;
    if (fflush(file) != 0) ok = false;
    if (fclose(file) != 0) ok = false;
    if (!ok) (void)remove(name);
    return ok;
}
```

Output:

```text
rows=2 bytes=88
```

The worked example exports the two-row Ada/Grace fixture into a new file. Run make check-portability for the independent oracle and API checks, including control-valued bytes that would reveal text-mode translation. The complete audit guide lists concrete gaps in the larger CLI: rename replacement differs between POSIX and Windows, narrow fopen is not a universal Unicode path API, and neither fflush nor a successful rename alone is a cross-platform crash-durability contract.

**Watch for:** This is an audited portability slice, not a claim that all course components or the complete database run unchanged on every host. The C17 exclusive-create adapter refuses existing destinations; it never implements replacement by deleting the old file first.

**Check:** Which result establishes the strongest file-compatibility evidence here?

1. Only a same-process encode/decode round trip
2. Every tested host validates and copies files from all producers against an independent byte fixture

<details><summary>Answer</summary>

Every tested host validates and copies files from all producers against an independent byte fixture. Independent fixtures catch shared codec mistakes, and cross-host artifact exchange exercises differences that a same-host round trip cannot reveal.

</details>

**Try:** Run the audit, extend its assumptions table, and design a separately tested replacement interface for your target OS. Add failure injection before claiming stronger publication guarantees.

Run from the repository root:

```sh
make example EXAMPLE=hardening-tinydb-5
```

## Build it yourself

Audit TinyDB assumptions, separate its codec from file access, and exchange validated database files across Linux, macOS, and Windows.

1. Complete the assumptions and platform-dependency table in native/portability/README.md for your assembled database.
2. Keep the codec and parsers independent of FILE, paths, processes, signals, and locks.
3. Run the same fixture suite across Linux, macOS, and Windows, and inspect the exchanged artifacts.
4. Design and test host-specific replacement/durability adapters before integrating them into the full CLI.

### Check your work

- Use make check-portability locally or python tools/check_portability.py --compiler cl from an MSVC developer terminal.
- Verify exact binary bytes, every truncated prefix, duplicate IDs, invalid UTF-8, rejection preservation, and existing-destination refusal.
- Distinguish tested targets and the audited eight-row subset from unsupported formats, Unicode path handling, power-loss durability, and concurrent access.

Audit command (checks the documented portable target, not every extension):

```sh
make check-portability
```

Chapter workspace command: `make chapter CHAPTER=hardening-tinydb`.

Generated from dist/part7.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/hardening-tinydb
