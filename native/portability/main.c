#include "portable.h"
#include <stdio.h>
#include <string.h>

int main(int argc, char **argv) {
    unsigned char bytes[PORT_BYTES]; size_t size = 0;
    PortTable table; memset(&table, 0, sizeof table);
    if (argc == 3 && strcmp(argv[1], "emit") == 0) {
        table.count = 2;
        table.rows[0].id = 1; strcpy(table.rows[0].name, "Ada"); table.rows[0].score = 90;
        table.rows[1].id = 2; strcpy(table.rows[1].name, "Grace"); table.rows[1].score = 80;
        if (!port_encode(&table, bytes, sizeof bytes, &size) || !port_write_new(argv[2], bytes, size)) return 3;
    } else if ((argc == 3 && strcmp(argv[1], "check") == 0) || (argc == 4 && strcmp(argv[1], "copy") == 0)) {
        if (!port_read(argv[2], bytes, sizeof bytes, &size) || !port_decode(bytes, size, &table)) return 2;
        if (argc == 4 && (!port_encode(&table, bytes, sizeof bytes, &size) || !port_write_new(argv[3], bytes, size))) return 3;
    } else {
        fputs("Usage: audit-db emit NAME | check NAME | copy INPUT OUTPUT\n", stderr); return 2;
    }
    printf("rows=%zu bytes=%zu\n", table.count, size);
    return 0;
}
