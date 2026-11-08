#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  int id;
  const char *name;
} Row;
size_t find_id(const Row *rows, size_t n, int id) {
  size_t lo = 0, hi = n;
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (rows[mid].id < id)
      lo = mid + 1;
    else
      hi = mid;
  }
  return lo;
}

int main(void) {
  Row rows[] = {{2, "Ada"}, {5, "Grace"}, {9, "Linus"}};
  size_t i = find_id(rows, 3, 5);
  if (i < 3 && rows[i].id == 5)
    printf("%d %s\n", rows[i].id, rows[i].name);
  return 0;
}
