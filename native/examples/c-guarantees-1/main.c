#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  unsigned wrapped = UINT_MAX;
  wrapped += 1;
  printf("char_bits_at_least8=%d unsigned_wrap=%u\n", CHAR_BIT >= 8, wrapped);
  return 0;
}
