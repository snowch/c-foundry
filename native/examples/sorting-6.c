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
  int sorted[] = {1, 2, 3, 4}, reverse[] = {4, 3, 2, 1};
  printf("sorted shifts=%zu reverse shifts=%zu\n", insertion(sorted, 4),
         insertion(reverse, 4));
  return 0;
}
