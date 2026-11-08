#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

size_t scan(const int *a, size_t n, int target) {
  size_t comparisons = 0;
  for (size_t i = 0; i < n; ++i) {
    ++comparisons;
    if (a[i] == target)
      break;
  }
  return comparisons;
}

int main(void) {
  int a[] = {2, 4, 6, 8};
  printf("comparisons=%zu\n", scan(a, 4, 7));
  return 0;
}
