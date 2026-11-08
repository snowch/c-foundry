#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { V = 4, INF = 10000 };
void bfs(const int edges[V][V], int start) {
  bool seen[V] = {0};
  int queue[V];
  size_t head = 0, count = 0;
  seen[start] = true;
  queue[count++] = start;
  while (head < count) {
    int u = queue[head++];
    printf("%d ", u);
    for (int v = 0; v < V; ++v)
      if (edges[u][v] && !seen[v]) {
        seen[v] = true;
        queue[count++] = v;
      }
  }
  puts("");
}
void dfs(const int edges[V][V], int u, bool *seen) {
  seen[u] = true;
  for (int v = 0; v < V; ++v)
    if (edges[u][v] && !seen[v])
      dfs(edges, v, seen);
}
void distances(const int edges[V][V], int start, int *dist) {
  bool done[V] = {0};
  for (int i = 0; i < V; ++i)
    dist[i] = INF;
  dist[start] = 0;
  for (int step = 0; step < V; ++step) {
    int u = -1;
    for (int i = 0; i < V; ++i)
      if (!done[i] && (u < 0 || dist[i] < dist[u]))
        u = i;
    if (u < 0 || dist[u] == INF)
      break;
    done[u] = true;
    for (int v = 0; v < V; ++v)
      if (edges[u][v] > 0 && dist[u] + edges[u][v] < dist[v])
        dist[v] = dist[u] + edges[u][v];
  }
}

int main(void) {
  const int edges[V][V] = {
      {0, 1, 1, 0}, {1, 0, 0, 0}, {1, 0, 0, 1}, {0, 0, 1, 0}};
  size_t directed_entries = 0;
  for (int u = 0; u < V; ++u)
    for (int v = 0; v < V; ++v)
      if (edges[u][v])
        ++directed_entries;
  printf("vertices=%d undirected_edges=%zu matrix_cells=%d\n", V,
         directed_entries / 2, V * V);
  return 0;
}
