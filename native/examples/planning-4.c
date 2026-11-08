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
  Estimate e = {100, 3, 2};
  printf("PLAN %s estimated_matches=%u estimated_pages=%u\n", choose(e),
         e.matches,
         strcmp(choose(e), "index") == 0 ? index_cost(e) : e.table_pages);
  return 0;
}
