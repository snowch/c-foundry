#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  int keys[] = {1, 2, 4, 6, 8, 10};
  size_t lo = 0, hi = 6;
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (keys[mid] < 4)
      lo = mid + 1;
    else
      hi = mid;
  }
  size_t emitted = 0;
  for (size_t i = lo; i < 6 && keys[i] < 9 && emitted < 2; ++i, ++emitted)
    printf("%d ", keys[i]);
  puts("");
  return 0;
}
