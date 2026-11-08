#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  int a[] = {3, 1, 4}, sum = 0;
  for (size_t i = 0; i < 3; ++i) {
    printf("before i=%zu sum=%d\n", i, sum);
    sum += a[i];
  }
  printf("total=%d\n", sum);
  return 0;
}
