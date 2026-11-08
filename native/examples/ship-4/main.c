#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  for (size_t n = 8; n <= 32; n *= 4) {
    size_t comparisons = 0;
    for (size_t i = 0; i < n; ++i)
      ++comparisons;
    printf("rows=%zu absent_scan_comparisons=%zu\n", n, comparisons);
  }
  return 0;
}
