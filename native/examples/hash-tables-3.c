#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  unsigned keys[] = {1, 9, 17};
  for (size_t i = 0; i < 3; ++i)
    printf("key=%u old=%u new=%u\n", keys[i], keys[i] % 8, keys[i] % 16);
  return 0;
}
