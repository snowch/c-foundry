#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  int a[] = {8, 3, 8};
  size_t found = 3;
  for (size_t i = 0; i < 3; ++i)
    if (a[i] == 8) {
      found = i;
      break;
    }
  printf("first=%zu\n", found);
  return 0;
}
