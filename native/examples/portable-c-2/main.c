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
