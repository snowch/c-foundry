#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  unsigned ways[3][3];
  for (size_t r = 0; r < 3; ++r)
    for (size_t col = 0; col < 3; ++col)
      ways[r][col] =
          (r == 0 || col == 0) ? 1 : ways[r - 1][col] + ways[r][col - 1];
  for (size_t r = 0; r < 3; ++r)
    printf("%u %u %u\n", ways[r][0], ways[r][1], ways[r][2]);
  return 0;
}
