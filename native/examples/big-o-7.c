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
  int a[] = {1, 2, 3, 4, 5, 6, 7, 8};
  size_t small = scan(a, 4, 99), large = scan(a, 8, 99);
  printf("small=%zu large=%zu ratio=%zu\n", small, large, large / small);
  return 0;
}
