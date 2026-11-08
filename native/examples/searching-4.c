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
  int a[] = {1, 3, 3, 3, 8};
  size_t lo = lower(a, 5, 3), hi = upper(a, 5, 3);
  printf("range=[%zu,%zu) count=%zu\n", lo, hi, hi - lo);
  return 0;
}
