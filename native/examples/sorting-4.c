#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  struct Item {
    int key;
    char tag;
  } a[] = {{2, 'A'}, {1, 'B'}, {2, 'C'}};
  for (size_t i = 1; i < 3; ++i) {
    struct Item x = a[i];
    size_t j = i;
    while (j && a[j - 1].key > x.key) {
      a[j] = a[j - 1];
      --j;
    }
    a[j] = x;
  }
  for (size_t i = 0; i < 3; ++i)
    printf("%d%c%s", a[i].key, a[i].tag, i == 2 ? "\n" : " ");
  return 0;
}
