#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void count_tree(unsigned n, unsigned *nodes, unsigned *leaves) {
  ++*nodes;
  if (n < 2) {
    ++*leaves;
    return;
  }
  count_tree(n / 2, nodes, leaves);
  count_tree(n - n / 2, nodes, leaves);
}

int main(void) {
  unsigned nodes = 0, leaves = 0;
  count_tree(8, &nodes, &leaves);
  printf("nodes=%u leaves=%u\n", nodes, leaves);
  return 0;
}
