#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  enum { V = 4 };
  int edges[V][V] = {{0, 1, 1, 0}, {0, 0, 0, 1}, {0, 0, 0, 1}, {0, 0, 0, 0}},
      degree[V] = {0}, queue[V];
  size_t head = 0, n = 0;
  for (int u = 0; u < V; ++u)
    for (int v = 0; v < V; ++v)
      degree[v] += edges[u][v];
  for (int u = 0; u < V; ++u)
    if (degree[u] == 0)
      queue[n++] = u;
  while (head < n) {
    int u = queue[head++];
    printf("%s%d", head == 1 ? "" : " ", u);
    for (int v = 0; v < V; ++v)
      if (edges[u][v] && --degree[v] == 0)
        queue[n++] = v;
  }
  printf("\nacyclic=%d\n", n == V);
  return 0;
}
