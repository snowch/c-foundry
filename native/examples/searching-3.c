#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

size_t lower(const int *a, size_t n, int key) {
  size_t lo = 0, hi = n;
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (a[mid] < key)
      lo = mid + 1;
    else
      hi = mid;
  }
  return lo;
}
size_t upper(const int *a, size_t n, int key) {
  size_t lo = 0, hi = n;
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (a[mid] <= key)
      lo = mid + 1;
    else
      hi = mid;
  }
  return lo;
}

int main(void) {
  printf("empty=%zu\n", lower(NULL, 0, 7));
  int a[] = {7};
  printf("before=%zu after=%zu\n", lower(a, 1, 6), lower(a, 1, 8));
  return 0;
}
