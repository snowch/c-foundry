#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void show(const int *a, size_t n) {
  for (size_t i = 0; i < n; ++i)
    printf("%s%d", i ? " " : "", a[i]);
  puts("");
}
size_t insertion(int *a, size_t n) {
  size_t moves = 0;
  for (size_t i = 1; i < n; ++i) {
    int x = a[i];
    size_t j = i;
    while (j && a[j - 1] > x) {
      a[j] = a[j - 1];
      --j;
      ++moves;
    }
    a[j] = x;
  }
  return moves;
}
void selection(int *a, size_t n) {
  for (size_t i = 0; i < n; ++i) {
    size_t least = i;
    for (size_t j = i + 1; j < n; ++j)
      if (a[j] < a[least])
        least = j;
    int t = a[i];
    a[i] = a[least];
    a[least] = t;
  }
}
int compare_int(const void *x, const void *y) {
  int a = *(const int *)x, b = *(const int *)y;
  return (a > b) - (a < b);
}
void merge_sort(int *a, int *tmp, size_t n) {
  if (n < 2)
    return;
  size_t m = n / 2;
  merge_sort(a, tmp, m);
  merge_sort(a + m, tmp + m, n - m);
  size_t i = 0, j = m, k = 0;
  while (i < m && j < n)
    tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];
  while (i < m)
    tmp[k++] = a[i++];
  while (j < n)
    tmp[k++] = a[j++];
  for (k = 0; k < n; ++k)
    a[k] = tmp[k];
}

int main(void) {
  int a[] = {5, 1, 4, 1, 3}, tmp[5];
  merge_sort(a, tmp, 5);
  show(a, 5);
  return 0;
}
