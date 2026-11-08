#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  size_t cap = 0, moves = 0;
  for (size_t length = 0; length < 8; ++length) {
    if (length == cap) {
      moves += length;
      cap = cap ? cap * 2 : 1;
    }
  }
  printf("appends=8 copied=%zu capacity=%zu\n", moves, cap);
  return 0;
}
