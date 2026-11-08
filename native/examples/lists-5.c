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
  Node nodes[] = {{4, NULL, NULL}, {5, NULL, NULL}, {6, NULL, NULL}};
  nodes[0].next = &nodes[1];
  nodes[1].next = &nodes[2];
  Node *n = nodes;
  size_t steps = 0;
  while (steps < 2) {
    n = n->next;
    ++steps;
  }
  printf("value=%d link_steps=%zu indexed=%d\n", n->value, steps,
         nodes[2].value);
  return 0;
}
