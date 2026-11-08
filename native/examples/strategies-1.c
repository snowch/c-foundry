#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

bool subset(const int *a, size_t n, size_t i, int remaining) {
  if (remaining == 0)
    return true;
  if (i == n || remaining < 0)
    return false;
  return subset(a, n, i + 1, remaining - a[i]) ||
         subset(a, n, i + 1, remaining);
}

int main(void) {
  int a[] = {2, 4, 7};
  printf("target6=%d target5=%d\n", subset(a, 3, 0, 6), subset(a, 3, 0, 5));
  return 0;
}
