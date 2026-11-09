#include "portable.h"
#include <stdio.h>
#include <string.h>

#define CHECK(condition) do { if (!(condition)) { fprintf(stderr, "line %d: %s\n", __LINE__, #condition); return 1; } } while (0)
int main(void) {
    PortTable live; memset(&live, 0, sizeof live); live.count = 1;
    live.rows[0].id = 9; strcpy(live.rows[0].name, "Keep"); live.rows[0].score = UINT32_MAX;
    unsigned char bytes[PORT_BYTES], before[PORT_BYTES]; memset(bytes, 0xa5, sizeof bytes); memcpy(before, bytes, sizeof bytes);
    size_t size = 123;
    CHECK(!port_encode(&live, bytes, 47, &size)); CHECK(size == 123 && memcmp(bytes, before, sizeof bytes) == 0);
    CHECK(port_encode(&live, bytes, sizeof bytes, &size)); CHECK(size == 48);
    PortTable decoded; memset(&decoded, 0, sizeof decoded); decoded.count = 1; decoded.rows[0].id = 77;
    for (size_t n = 0; n < size; ++n) { CHECK(!port_decode(bytes, n, &decoded)); CHECK(decoded.count == 1 && decoded.rows[0].id == 77); }
    bytes[4] = 99; CHECK(!port_decode(bytes, size, &decoded)); CHECK(decoded.rows[0].id == 77); bytes[4] = 1;
    CHECK(port_decode(bytes, size, &decoded)); CHECK(decoded.rows[0].score == UINT32_MAX);
    memcpy(before, bytes, sizeof bytes);
    live.count = 2; live.rows[1] = live.rows[0]; size = 123;
    CHECK(!port_encode(&live, bytes, sizeof bytes, &size)); CHECK(size == 123 && memcmp(bytes, before, sizeof bytes) == 0);
    live.rows[1].id = 10; live.rows[1].name[0] = (char)0xc0; live.rows[1].name[1] = (char)0x80; live.rows[1].name[2] = 0;
    CHECK(!port_encode(&live, bytes, sizeof bytes, &size));
    CHECK(memcmp(bytes, before, sizeof bytes) == 0);
    CHECK(port_name("people-1.tdb")); CHECK(!port_name("../people.tdb")); CHECK(!port_name("CON.txt"));
    CHECK(!port_name("nul")); CHECK(!port_name("COM1.tdb")); CHECK(!port_name("people.")); CHECK(!port_name("a/b"));
    memset(&live, 0, sizeof live); live.count = PORT_CAPACITY;
    for (size_t i = 0; i < live.count; ++i) { live.rows[i].id = (uint32_t)(i + 1); strcpy(live.rows[i].name, "row"); }
    CHECK(port_encode(&live, bytes, sizeof bytes, &size)); CHECK(size == PORT_BYTES);
    CHECK(port_decode(bytes, size, &decoded)); CHECK(decoded.count == PORT_CAPACITY);
    puts("PASS codec rejection preserves outputs; filename and UTF-8 policies");
    return 0;
}
