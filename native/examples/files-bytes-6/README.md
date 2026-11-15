# A portable binary record format

Complete native example, ready to edit and run in Codespaces or locally.

## 10.6 A portable binary record format

A portable record format starts with a written specification and a decoder that rejects malformed input. An exact-size record is a useful first step before the database introduces pages and variable-length values.

Also editable and runnable inline in the browser course. Files created by this example last for this run only. Use the command workspace or a native build to keep program files.

Our ten-byte format is: bytes 0–1 ASCII C and F, byte 2 version 1, byte 3 reserved zero, bytes 4–7 a little-endian uint32_t ID, and bytes 8–9 a little-endian uint16_t score. The API requires non-null pointers to valid objects, and eight-bit bytes. The decoder checks the length before inspecting fields and commits its output only after validation. IDs and scores may span their entire unsigned type ranges.

### A file format chooses its byte order

The same unsigned value can be encoded independently of host layout.

Encoding the value 513 as an unsigned four-byte little-endian field produces bytes 01, 02, 00, 00 in hexadecimal at offsets 0, 1, 2, and 3. The least significant byte is first. A decoder reconstructs 1 plus 2 times 256, giving 513; it does not copy a raw host struct.

Illustrative uint32_t field in a format requiring 8-bit bytes. This is not the complete row or file header.

### main.c

```c
#include <stdio.h>
#include <stdint.h>
#include <inttypes.h>
#include <stdbool.h>
#include <limits.h>

typedef struct { uint32_t id; uint16_t score; } Record;

void encode(unsigned char out[10], Record row) {
    out[0] = 0x43; out[1] = 0x46; out[2] = 1; out[3] = 0;
    for (unsigned i = 0; i < 4; i++) out[4 + i] = (unsigned char)(row.id >> (i * 8));
    out[8] = (unsigned char)row.score;
    out[9] = (unsigned char)(row.score >> 8);
}

bool decode(const unsigned char *bytes, size_t length, Record *out) {
    if (length != 10 || bytes[0] != 0x43 || bytes[1] != 0x46 ||
        bytes[2] != 1 || bytes[3] != 0) return false;
    Record row = {0, 0};
    for (unsigned i = 0; i < 4; i++) row.id |= (uint32_t)bytes[4 + i] << (i * 8);
    row.score = (uint16_t)((uint16_t)bytes[8] | ((uint16_t)bytes[9] << 8));
    *out = row;
    return true;
}

int main(void) {
    if (CHAR_BIT != 8) return 1;
    Record original = {513, 90}, restored;
    unsigned char bytes[10];
    encode(bytes, original);
    if (!decode(bytes, sizeof bytes, &restored)) return 1;
    printf("id=%" PRIu32 " score=%" PRIu16 "\n", restored.id, restored.score);
    bytes[2] = 2;
    printf("bad version=%d\n", !decode(bytes, sizeof bytes, &restored));
    return 0;
}
```

Output:

```text
id=513 score=90
bad version=1
```

The first round trip restores the two fields without copying struct padding. Changing the version byte makes decoding fail. The chapter project moves the encoder and decoder behind a header and tests exact bytes, truncation, unknown versions, and an actual temporary-file round trip.

**Watch for:** Do not silently accept a format version you cannot interpret. Also, a round trip alone can miss a shared mistake in encoder and decoder, so test against independently specified byte fixtures.

**Check:** Why test a known byte fixture as well as a round trip?

1. Encoder and decoder could share the same mistake
2. Round trips never exercise decoding

<details><summary>Answer</summary>

Encoder and decoder could share the same mistake. A fixed independently defined representation catches errors that two mutually consistent functions can hide.

</details>

**Try:** Implement the native binary-record project and explain every byte in its test fixture.

### References and help

- [C reference: input/output](https://en.cppreference.com/w/c/io.html) — Compare stream modes, positioning, error indicators, and formatted I/O.
- [C reference: fixed-width integers](https://en.cppreference.com/w/c/types/integer.html) — Check when exact-width types exist and which format macros match them.

Run from the repository root:

```sh
make example EXAMPLE=files-bytes-6
```

