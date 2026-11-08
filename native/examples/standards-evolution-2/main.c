#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
#if defined(__GNUC__) && defined(__SIZEOF_INT128__)
  __extension__ typedef unsigned __int128 Wide;
  printf("wide_at_least64=%d\n", sizeof(Wide) * CHAR_BIT >= 64);
#else
  printf("wide_at_least64=%d\n", sizeof(uint64_t) * CHAR_BIT >= 64);
#endif
  return 0;
}
