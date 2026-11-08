#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

unsigned factorial(unsigned n) { return n < 2 ? 1 : n * factorial(n - 1); }
unsigned factorial_loop(unsigned n) {
  unsigned result = 1;
  for (unsigned i = 2; i <= n; ++i)
    result *= i;
  return result;
}

int main(void) {
  printf("recursive=%u iterative=%u\n", factorial(6), factorial_loop(6));
  return 0;
}
