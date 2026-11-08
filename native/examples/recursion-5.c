#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct Node {
  const char *name;
  const struct Node *children;
  size_t count;
} Node;
void walk(const Node *node, unsigned depth) {
  for (unsigned i = 0; i < depth; ++i)
    printf("  ");
  puts(node->name);
  for (size_t i = 0; i < node->count; ++i)
    walk(&node->children[i], depth + 1);
}

int main(void) {
  Node files[] = {{"main.c", NULL, 0}, {"db.c", NULL, 0}};
  Node root = {"src", files, 2};
  walk(&root, 0);
  return 0;
}
