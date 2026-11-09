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
