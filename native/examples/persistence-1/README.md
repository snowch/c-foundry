# Encoding a file header and schema

Complete Linux example, ready to edit and run in the browser terminal.

## 25.1 Encoding a file header and schema

A file header identifies a format and states how to interpret the remaining bytes. Unknown versions should fail clearly.

Also editable and runnable inline in the browser course. Run and change the format example here. The same source also builds with a native C17 toolchain.

The teaching format begins with ASCII TDB1, version byte one, record-size byte forty, a one-byte row count, and a reserved zero byte. It requires eight-bit bytes and exact-width uint32_t. The count is capped by the bounded table; a larger format would use wider lengths and checked offset calculations. Header bytes are a protocol, not the memory layout of a C header struct.

### A header tells a decoder how to read the following bytes

The course format uses an explicit eight-byte header before the rows.

The example header has magic TDB1 at offsets 0 through 3, version 1 at offset 4, row width 40 at offset 5, row count 2 at offset 6, and reserved zero at offset 7. Two forty-byte rows follow the eight-byte header, giving an eighty-eight-byte example file. A decoder validates the header before loading rows.

This is the course’s small TDB1 format with 8-bit bytes, not a raw C struct. Boxes are not proportional to field widths.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/persistence/1). In main.c, change header[6] from 2 to 3 in the initializer. Run code and compare version=, record_bytes=, and rows=. This header task changes the advertised count. What further check would a complete file reader need before accepting that count?

### References and help

- [SQLite documentation: database file format](https://www.sqlite.org/fileformat.html) — Compare explicit headers, page layouts, and encoding rules with the teaching format.
- [C reference: input/output](https://en.cppreference.com/w/c/io.html) — Compare stream modes, positioning, error indicators, and formatted I/O.

Native source: `native/examples/persistence-1/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=persistence-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

