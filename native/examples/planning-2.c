#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  unsigned rows = 1000, matches = 10;
  printf("selectivity=%.2f expected_rows=%u\n", (double)matches / rows,
         matches);
  return 0;
}
