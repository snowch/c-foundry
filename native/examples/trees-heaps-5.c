#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  int data[16];
  size_t n;
} Heap;
bool heap_push(Heap *h, int x) {
  if (h->n == 16)
    return false;
  size_t i = h->n++;
  while (i && h->data[(i - 1) / 2] > x) {
    h->data[i] = h->data[(i - 1) / 2];
    i = (i - 1) / 2;
  }
  h->data[i] = x;
  return true;
}
bool heap_pop(Heap *h, int *out) {
  if (!h->n)
    return false;
  *out = h->data[0];
  int x = h->data[--h->n];
  if (!h->n)
    return true;
  size_t i = 0;
  while (i * 2 + 1 < h->n) {
    size_t child = i * 2 + 1;
    if (child + 1 < h->n && h->data[child + 1] < h->data[child])
      ++child;
    if (h->data[child] >= x)
      break;
    h->data[i] = h->data[child];
    i = child;
  }
  h->data[i] = x;
  return true;
}

int main(void) {
  Heap h = {0};
  if (!heap_push(&h, 7) || !heap_push(&h, 2) || !heap_push(&h, 5))
    return 1;
  int x;
  while (heap_pop(&h, &x))
    printf("%d ", x);
  puts("");
  return 0;
}
