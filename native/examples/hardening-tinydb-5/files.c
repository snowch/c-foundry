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
