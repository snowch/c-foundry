#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  for (size_t n = 4; n <= 8; n *= 2) {
    size_t levels = 0;
    for (size_t m = n; m > 1; m /= 2)
      ++levels;
    printf("n=%zu constant=1 log=%zu linear=%zu nlog=%zu square=%zu\n", n,
           levels, n, n * levels, n * n);
  }
  return 0;
}
