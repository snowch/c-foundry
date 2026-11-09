# Audit and exchange TinyDB files across platforms

Complete native example, ready to edit and run in Codespaces or locally.

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

