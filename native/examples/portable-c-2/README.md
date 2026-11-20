# Fixed-width types, endianness, and binary compatibility

Complete Linux example, ready to edit and run in the browser terminal.

## 33.2 Fixed-width types, endianness, and binary compatibility

Fixed-width types simplify an external protocol only when their availability and byte-size requirements are stated. Endianness still needs explicit encoding.

Also editable and runnable inline in the browser course. This probe runs with the inline browser’s fixed C17 toolchain. Use Browser Linux for GCC/Clang comparisons and supported language modes. Optional external sanitizer tooling is described separately.

The byte codec extracts and assembles little-endian uint32_t values instead of writing native objects. Exact-width types are optional on some C implementations; this course’s supported targets provide uint32_t and eight-bit bytes. Schema and format compatibility also depend on string encoding, version rules, and validation, not only on integer width. State these requirements at the format boundary with compile-time checks. sizeof a struct includes padding, and sizeof(long), pointer width, alignment, and host byte order are not a portable file specification. Use fixed numeric magic bytes rather than assuming the execution character set defines an external encoding.

### A file format chooses its byte order

The same unsigned value can be encoded independently of host layout.

Encoding the value 513 as an unsigned four-byte little-endian field produces bytes 01, 02, 00, 00 in hexadecimal at offsets 0, 1, 2, and 3. The least significant byte is first. A decoder reconstructs 1 plus 2 times 256, giving 513; it does not copy a raw host struct.

Illustrative uint32_t field in a format requiring 8-bit bytes. This is not the complete row or file header.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

_Static_assert(CHAR_BIT == 8, "This file format uses octets");

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

int main(void) {
  unsigned char bytes[4];
  put32(bytes, UINT32_C(0x01020304));
  printf("bytes=%u,%u,%u,%u value_ok=%d\n", (unsigned)bytes[0], (unsigned)bytes[1], (unsigned)bytes[2],
         (unsigned)bytes[3], get32(bytes) == UINT32_C(0x01020304));
  return 0;
}
```

Output:

```text
bytes=4,3,2,1 value_ok=1
```

The byte order is identical on little- and big-endian supported hosts because the encoder defines it.

**Watch for:** Using uint32_t inside a raw dumped struct does not remove padding or byte-order assumptions.

**Check:** Does a fixed-width field alone make raw structs portable files?

1. Yes
2. No

<details><summary>Answer</summary>

No. Layout, padding, byte order, and other representation choices remain.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/portable-c/2). In main.c, change both 0x01020304 constants to 0x11223344. Run code and inspect bytes= and value_ok=. Which byte comes first in the specified format?

### References and help

- [C reference: input/output](https://en.cppreference.com/w/c/io.html) — Compare stream modes, positioning, error indicators, and formatted I/O.
- [C reference: fixed-width integers](https://en.cppreference.com/w/c/types/integer.html) — Check when exact-width types exist and which format macros match them.

Native source: `native/examples/portable-c-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=portable-c-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

