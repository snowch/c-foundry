#include <errno.h>
#include <inttypes.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

bool parse_id(const char *text, size_t n, uint32_t *out) {
    if (!n || n > 32) return false;
    for (size_t i = 0; i < n; ++i) if (text[i] < '0' || text[i] > '9') return false;
    char buffer[33]; memcpy(buffer, text, n); buffer[n] = 0;
    errno = 0; char *end;
    uintmax_t value = strtoumax(buffer, &end, 10);
    if (errno == ERANGE || end != buffer + n || value > UINT32_MAX) return false;
    *out = (uint32_t)value; return true;
}
int main(void) {
    uint32_t value = 7;
    int maximum = parse_id("4294967295", 10, &value);
    printf("maximum=%d value=%" PRIu32 "\n", maximum, value);
    value = 7;
    int rejected = !parse_id("4294967296", 10, &value);
    printf("overflow_rejected=%d retained=%" PRIu32 " sign_rejected=%d\n", rejected, value, !parse_id("-1", 2, &value));
    return 0;
}
