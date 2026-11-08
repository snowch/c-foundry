#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  int ids[] = {1, 2, 3, 4, 5, 6, 7, 8};
  unsigned comparisons = 0, emitted = 0;
  for (size_t i = 0; i < 8; ++i) {
    ++comparisons;
    if (ids[i] >= 7)
      ++emitted;
  }
  printf("comparisons=%u emitted=%u\n", comparisons, emitted);
  return 0;
}
