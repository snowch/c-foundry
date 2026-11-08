#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  unsigned table_pages, index_levels, matches;
} Estimate;
unsigned index_cost(Estimate e) { return e.index_levels + e.matches; }
const char *choose(Estimate e) {
  return index_cost(e) < e.table_pages ? "index" : "scan";
}

int main(void) {
  Estimate narrow = {100, 3, 1}, wide = {100, 3, 98};
  printf("narrow=%s cost=%u wide=%s cost=%u\n", choose(narrow),
         index_cost(narrow), choose(wide), index_cost(wide));
  return 0;
}
