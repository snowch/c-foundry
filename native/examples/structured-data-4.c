#include <stdio.h>
#include <stdlib.h>

typedef struct Node { int value; struct Node *next; } Node;

int main(void) {
    Node *first = malloc(sizeof *first);
    Node *second = malloc(sizeof *second);
    if (!first || !second) { free(first); free(second); return 1; }
    *first = (Node){.value = 1, .next = second};
    *second = (Node){.value = 2, .next = NULL};
    printf("sum=%d\n", first->value + first->next->value);
    while (first) {
        Node *next = first->next;
        free(first);
        first = next;
    }
    return 0;
}
