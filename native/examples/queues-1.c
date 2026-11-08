#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  int stack[3], out;
  size_t count = 0;
  stack[count++] = 10;
  stack[count++] = 20;
  out = stack[--count];
  printf("popped=%d remaining=%zu\n", out, count);
  return 0;
}
