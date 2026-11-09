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
