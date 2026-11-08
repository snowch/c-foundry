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
