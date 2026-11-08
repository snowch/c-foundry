#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  int coins[] = {1, 3, 4}, best[7];
  best[0] = 0;
  for (int x = 1; x <= 6; ++x) {
    best[x] = 99;
    for (size_t j = 0; j < 3; ++j)
      if (coins[j] <= x && best[x - coins[j]] + 1 < best[x])
        best[x] = best[x - coins[j]] + 1;
  }
  printf("optimal=%d\n", best[6]);
  return 0;
}
