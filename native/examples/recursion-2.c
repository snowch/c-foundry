#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void visit(unsigned n) {
  printf("enter %u\n", n);
  if (n)
    visit(n - 1);
  printf("leave %u\n", n);
}

int main(void) {
  visit(2);
  return 0;
}
