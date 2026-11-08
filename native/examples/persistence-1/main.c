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
