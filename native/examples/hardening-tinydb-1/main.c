#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  size_t count = SIZE_MAX;
  bool rejected = count > SIZE_MAX / sizeof(int);
  printf("oversize_rejected=%d\n", rejected);
  return 0;
}
