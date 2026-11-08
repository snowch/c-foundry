#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  int weight[] = {2, 3, 4}, value[] = {3, 4, 5}, best[6] = {0};
  for (size_t i = 0; i < 3; ++i)
    for (int w = 5; w >= weight[i]; --w)
      if (best[w - weight[i]] + value[i] > best[w])
        best[w] = best[w - weight[i]] + value[i];
  printf("capacity5=%d\n", best[5]);
  return 0;
}
