#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  int ids[] = {1, 2, 3, 4, 5, 6, 7, 8}, keys[] = {2, 4, 8};
  unsigned nested = 0, indexed = 0, a = 0, b = 0;
  for (size_t k = 0; k < 3; ++k) {
    for (size_t i = 0; i < 8; ++i) {
      ++nested;
      if (ids[i] == keys[k])
        ++a;
    }
    size_t lo = 0, hi = 8;
    while (lo < hi) {
      ++indexed;
      size_t mid = lo + (hi - lo) / 2;
      if (ids[mid] < keys[k])
        lo = mid + 1;
      else
        hi = mid;
    }
    if (lo < 8) {
      ++indexed;
      if (ids[lo] == keys[k])
        ++b;
    }
  }
  if (a != b)
    return 1;
  printf("nested=%u indexed=%u results=%u\n", nested, indexed, b);
  return 0;
}
