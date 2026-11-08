#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  int *data;
  size_t length, capacity;
} Vector;
bool append(Vector *v, int x) {
  if (v->length == v->capacity) {
    size_t cap = v->capacity ? v->capacity * 2 : 2;
    if (v->capacity > SIZE_MAX / 2 || cap > SIZE_MAX / sizeof *v->data)
      return false;
    int *next = realloc(v->data, cap * sizeof *next);
    if (!next)
      return false;
    v->data = next;
    v->capacity = cap;
  }
  v->data[v->length++] = x;
  return true;
}

int main(void) {
  Vector v = {0};
  for (int i = 1; i <= 5; ++i)
    if (!append(&v, i)) {
      free(v.data);
      return 1;
    }
  printf("length=%zu capacity=%zu last=%d\n", v.length, v.capacity, v.data[4]);
  free(v.data);
  return 0;
}
