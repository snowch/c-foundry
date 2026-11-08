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

int main(void) {
  int a[] = {INT_MAX, -7, 0, INT_MIN};
  qsort(a, 4, sizeof a[0], compare_int);
  printf("ordered=%d extremes=%d\n",
         a[0] <= a[1] && a[1] <= a[2] && a[2] <= a[3],
         a[0] == INT_MIN && a[3] == INT_MAX);
  return 0;
}
