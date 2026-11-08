# Encoding a file header and schema

Complete native example, ready to edit and run in Codespaces or locally.

## 25.1 Encoding a file header and schema

A file header identifies a format and states how to interpret the remaining bytes. Unknown versions should fail clearly.

The teaching format begins with ASCII TDB1, version byte one, record-size byte forty, a one-byte row count, and a reserved zero byte. It requires eight-bit bytes and exact-width uint32_t. The count is capped by the bounded table; a larger format would use wider lengths and checked offset calculations. Header bytes are a protocol, not the memory layout of a C header struct.

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

**Try:** Write a byte-offset format table and test bad magic, version, record width, and reserved bytes.

Run from the repository root:

```sh
make example EXAMPLE=persistence-1
```

