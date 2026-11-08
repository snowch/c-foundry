#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  int coins[] = {4, 3, 1}, remaining = 6, count = 0;
  for (size_t i = 0; i < 3; ++i)
    while (remaining >= coins[i]) {
      remaining -= coins[i];
      ++count;
    }
  printf("greedy=%d better=%d\n", count, 2);
  return 0;
}
