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
bool remove_value(Node **head, int x) {
  for (Node **link = head; *link; link = &(*link)->next)
    if ((*link)->value == x) {
      Node *old = *link;
      *link = old->next;
      free(old);
      return true;
    }
  return false;
}

int main(void) {
  Node *head = NULL;
  for (int x = 3; x >= 1; --x) {
    Node *n = malloc(sizeof *n);
    if (!n) {
      while (head) {
        Node *next = head->next;
        free(head);
        head = next;
      }
      return 1;
    }
    *n = (Node){x, head, NULL};
    head = n;
  }
  remove_value(&head, 2);
  for (Node *n = head; n; n = n->next)
    printf("%d ", n->value);
  puts("");
  while (head) {
    Node *next = head->next;
    free(head);
    head = next;
  }
  return 0;
}
