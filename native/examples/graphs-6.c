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
typedef struct {
  int vertex, distance;
} Pending;
typedef struct {
  Pending a[32];
  size_t n;
} MinQueue;
bool offer(MinQueue *q, Pending x) {
  if (q->n == 32)
    return false;
  size_t i = q->n++;
  while (i && q->a[(i - 1) / 2].distance > x.distance) {
    q->a[i] = q->a[(i - 1) / 2];
    i = (i - 1) / 2;
  }
  q->a[i] = x;
  return true;
}
Pending take(MinQueue *q) {
  Pending result = q->a[0], x = q->a[--q->n];
  if (!q->n)
    return result;
  size_t i = 0;
  while (i * 2 + 1 < q->n) {
    size_t child = i * 2 + 1;
    if (child + 1 < q->n && q->a[child + 1].distance < q->a[child].distance)
      ++child;
    if (q->a[child].distance >= x.distance)
      break;
    q->a[i] = q->a[child];
    i = child;
  }
  q->a[i] = x;
  return result;
}

int main(void) {
  const int edges[V][V] = {
      {0, 1, 5, 0}, {0, 0, 2, 7}, {0, 0, 0, 1}, {0, 0, 0, 0}};
  int dist[V] = {0, INF, INF, INF}, parent[V] = {-1, -1, -1, -1};
  MinQueue q = {0};
  if (!offer(&q, (Pending){0, 0}))
    return 1;
  while (q.n) {
    Pending x = take(&q);
    if (x.distance != dist[x.vertex])
      continue;
    for (int v = 0; v < V; ++v)
      if (edges[x.vertex][v] > 0 && x.distance + edges[x.vertex][v] < dist[v]) {
        dist[v] = x.distance + edges[x.vertex][v];
        parent[v] = x.vertex;
        if (!offer(&q, (Pending){v, dist[v]}))
          return 1;
      }
  }
  printf("cost=%d reverse_path=3", dist[3]);
  for (int v = parent[3]; v >= 0; v = parent[v])
    printf(",%d", v);
  puts("");
  return 0;
}
