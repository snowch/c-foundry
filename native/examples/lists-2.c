#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct Node {
  int value;
  struct Node *next, *previous;
} Node;
void link_after(Node *a, Node *b) {
  b->next = a->next;
  b->previous = a;
  if (a->next)
    a->next->previous = b;
  a->next = b;
}

int main(void) {
  Node a = {1, NULL, NULL}, b = {2, NULL, NULL}, middle = {9, NULL, NULL};
  link_after(&a, &b);
  link_after(&a, &middle);
  printf("forward=%d,%d,%d backward=%d\n", a.value, a.next->value,
         a.next->next->value, b.previous->value);
  return 0;
}
