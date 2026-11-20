# Endianness and explicit serialization

Complete Linux example, ready to edit and run in the browser terminal.

## 10.3 Endianness and explicit serialization

Serialization defines a byte representation independently of an object’s in-memory layout. Pick a byte order and widths explicitly, and make the decoder validate the format before constructing values.

Also editable and runnable inline in the browser course. Run here, or use Browser Linux for a full GCC build.

This format requires eight-bit bytes and a uint32_t. Encoding extracts the low-order byte first, defining little-endian order regardless of the host’s native order. Decoding casts each byte to uint32_t before shifting so the shift is performed in an appropriate unsigned type. A production decoder must also verify the available length before indexing its input.

### A file format chooses its byte order

The same unsigned value can be encoded independently of host layout.

Encoding the value 513 as an unsigned four-byte little-endian field produces bytes 01, 02, 00, 00 in hexadecimal at offsets 0, 1, 2, and 3. The least significant byte is first. A decoder reconstructs 1 plus 2 times 256, giving 513; it does not copy a raw host struct.

Illustrative uint32_t field in a format requiring 8-bit bytes. This is not the complete row or file header.

### main.c

```c
#include <stdio.h>
#include <stdint.h>
#include <limits.h>

int main(void) {
    if (CHAR_BIT != 8) return 1;
    uint32_t value = UINT32_C(0x12345678);
    unsigned char bytes[4];
    for (unsigned i = 0; i < 4; i++) bytes[i] = (unsigned char)(value >> (8 * i));
    uint32_t decoded = (uint32_t)bytes[0] | ((uint32_t)bytes[1] << 8) |
                       ((uint32_t)bytes[2] << 16) | ((uint32_t)bytes[3] << 24);
    printf("%02x %02x %02x %02x\nround trip=%d\n",
           (unsigned)bytes[0], (unsigned)bytes[1],
           (unsigned)bytes[2], (unsigned)bytes[3], decoded == value);
    return 0;
}
```

Output:

```text
78 56 34 12
round trip=1
```

The hexadecimal value becomes four specified bytes, then the decoder reconstructs the original value from them. A machine with another host byte order would use the same extraction rules. There is no unaligned cast from a byte buffer to a uint32_t pointer.

**Watch for:** Writing a raw struct bakes in padding and representation assumptions. Casting the input buffer to an integer pointer can also violate alignment or aliasing rules.

**Check:** What establishes the file’s byte order here?

1. The explicit extraction and reconstruction rules
2. The host’s native layout

<details><summary>Answer</summary>

The explicit extraction and reconstruction rules. The representation is specified by the algorithm rather than a raw memory dump.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/files-bytes/3). In main.c, replace 0x12345678 with 0x00000102. Choose Run code and compare the four printed bytes and round trip=. Which byte appears first, and what does the check say about decoding?

### References and help

- [C reference: input/output](https://en.cppreference.com/w/c/io.html) — Compare stream modes, positioning, error indicators, and formatted I/O.
- [C reference: fixed-width integers](https://en.cppreference.com/w/c/types/integer.html) — Check when exact-width types exist and which format macros match them.

Native source: `native/examples/files-bytes-3/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=files-bytes-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

