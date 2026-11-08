#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  for (size_t n = 1; n <= 4; n *= 2)
    printf("n=%zu count=%zu upper=%zu\n", n, 3 * n + 2, 5 * n);
  return 0;
}
