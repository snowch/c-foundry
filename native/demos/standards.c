#include <assert.h>
#include <limits.h>
#include <stdint.h>
#include <stdio.h>

int main(void) {
    /* Encode bytes explicitly; the file format does not depend on host endianness. */
    uint32_t value = UINT32_C(0x12345678);
    unsigned char bytes[4];
    for (unsigned int i = 0; i < 4; ++i) {
        bytes[i] = (unsigned char)(value >> (i * 8));
    }
    assert(CHAR_BIT == 8); /* A documented requirement of this particular format. */
    assert(bytes[0] == 0x78 && bytes[3] == 0x12);
    printf("C standard macro: %ld\n", (long)__STDC_VERSION__);
    printf("CHAR_BIT: %d; sizeof(int): %zu\n", CHAR_BIT, sizeof(int));
    printf("little-endian record: %02x %02x %02x %02x\n",
           (unsigned)bytes[0], (unsigned)bytes[1], (unsigned)bytes[2], (unsigned)bytes[3]);
    return 0;
}
