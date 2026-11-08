# A portable binary record format

Complete native example, ready to edit and run in Codespaces or locally.

## 10.6 A portable binary record format

A portable record format starts with a written specification and a decoder that rejects malformed input. An exact-size record is a useful first step before the database introduces pages and variable-length values.

Our ten-byte format is: bytes 0–1 ASCII C and F, byte 2 version 1, byte 3 reserved zero, bytes 4–7 a little-endian uint32_t ID, and bytes 8–9 a little-endian uint16_t score. The API requires non-null pointers to valid objects, and eight-bit bytes. The decoder checks the length before inspecting fields and commits its output only after validation. IDs and scores may span their entire unsigned type ranges.

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

Run from the repository root:

```sh
make example EXAMPLE=files-bytes-6
```

