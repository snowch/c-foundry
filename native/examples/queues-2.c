#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { QCAP = 4 };
typedef struct {
  int data[QCAP];
  size_t head, count;
} Queue;
bool push(Queue *q, int x) {
  if (q->count == QCAP)
    return false;
  q->data[(q->head + q->count) % QCAP] = x;
  ++q->count;
  return true;
}
bool pop(Queue *q, int *out) {
  if (!q->count)
    return false;
  *out = q->data[q->head];
  q->head = (q->head + 1) % QCAP;
  --q->count;
  return true;
}

int main(void) {
  Queue q = {0};
  int x;
  push(&q, 1);
  push(&q, 2);
  pop(&q, &x);
  push(&q, 3);
  push(&q, 4);
  push(&q, 5);
  while (pop(&q, &x))
    printf("%d ", x);
  puts("");
  return 0;
}
