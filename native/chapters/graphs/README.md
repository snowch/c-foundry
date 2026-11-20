# Chapter 20: Graphs

Part 4: Build data structures in C. Teaching baseline: C17.

Choose a graph representation, track discovery state, and match the route algorithm to the edge-weight contract.

## Outcomes

- Traverse without enqueuing the same vertex repeatedly.
- Detect components, cycles, and ordering constraints.
- Apply Dijkstra only to nonnegative weights.

## 20.1 Adjacency matrices and adjacency lists

A graph representation determines which operations are cheap and how much memory is reserved.

Let V count vertices (nodes) and E count edges (connections). A V×V adjacency matrix reserves Θ(V²) entries and tests one edge in O(1). An adjacency list uses Θ(V+E) storage and scans actual neighbors. This matrix fixture uses zero for absent edges, so it cannot represent a zero-weight edge; a more general format needs a separate presence flag or sentinel.

### One graph can have several routes to a vertex

Traversal tracks visited vertices so shared destinations are handled deliberately.

The directed edges are A to B, A to C, B to D, and C to D. Breadth-first search from A reaches level zero A, level one B and C, then level two D. D has two incoming routes but is not two different vertices. The graph is acyclic, so A before B and C before D is also a valid dependency order.

Edges point from each level to the next. B and C have no ordering edge between them.

### main.c

```c
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
```

Output:

```text
vertices=4 undirected_edges=3 matrix_cells=16
```

Each undirected edge appears twice in the symmetric matrix. Six stored adjacency entries describe three undirected edges.

**Watch for:** Dividing by two assumes symmetry and no special self-loop counting; it is not a generic directed-edge count.

**Check:** Which representation is usually smaller for a sparse graph?

1. An adjacency list
2. A full adjacency matrix

<details><summary>Answer</summary>

An adjacency list. It stores actual edges rather than every possible pair.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/graphs/1). In main.c, change edges[0][3] and edges[3][0] from 0 to 1 in the initializer. Run code. Compare vertices=, undirected_edges=, and matrix_cells=. Why does one new undirected edge use two entries but no extra cells?

### References and help

- [NIST DADS: graphs](https://xlinux.nist.gov/dads/HTML/graph.html) — Identify vertices, edges, and directed versus undirected representations.

**Use the documentation (optional):** Does an adjacency matrix use space proportional to the number of edges or to all possible vertex pairs?

<details><summary>Compare your answer</summary>

A full matrix has a position for every vertex pair, using quadratic space in the vertex count. A sparse adjacency list can instead use space proportional to vertices plus edges.

</details>

Native source: `native/examples/graphs-1.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=graphs-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 20.2 Breadth-first and depth-first search

Breadth-first search (BFS) explores by edge distance using a queue. Depth-first search (DFS) follows one path at a time using recursion or a stack.

Mark a vertex discovered when adding it to the queue, not when removing it, so multiple incoming edges cannot enqueue it repeatedly. The queue then needs at most V entries. With adjacency lists, traversal is O(V+E); this matrix implementation scans V possible neighbors per visited vertex and is O(V²).

### One graph can have several routes to a vertex

Traversal tracks visited vertices so shared destinations are handled deliberately.

The directed edges are A to B, A to C, B to D, and C to D. Breadth-first search from A reaches level zero A, level one B and C, then level two D. D has two incoming routes but is not two different vertices. The graph is acyclic, so A before B and C before D is also a valid dependency order.

Edges point from each level to the next. B and C have no ordering edge between them.

### main.c

```c
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
  bfs(edges, 0);
  return 0;
}
```

Output:

```text
0 1 2 3
```

Vertices one and two are discovered from zero before three is discovered from two. Neighbor index order fixes the deterministic tie order.

**Watch for:** BFS minimizes edge count on unweighted graphs, not total cost on arbitrary weighted graphs.

**Check:** When should this BFS mark a vertex seen?

1. Only after all its neighbors are processed
2. When it is enqueued

<details><summary>Answer</summary>

When it is enqueued. Early marking prevents duplicate pending copies.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/graphs/2). In main.c, call bfs(edges, 3) instead of bfs(edges, 0). Run code. Which vertex is printed first, and how does the queue order put vertices nearer to 3 ahead of more distant ones?

### References and help

- [NIST DADS: graphs](https://xlinux.nist.gov/dads/HTML/graph.html) — Identify vertices, edges, and directed versus undirected representations.

Native source: `native/examples/graphs-2.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=graphs-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 20.3 Connected components and cycle detection

A disconnected graph needs a traversal from every still-unseen vertex. A cycle detector also needs to distinguish a parent edge from a new back edge.

The fixture counts undirected connected components with repeated DFS. An undirected cycle detector can track the traversal parent and report an edge to another already discovered vertex. Directed cycle detection needs a different rule, such as gray active-stack vertices; simply seeing any previously visited vertex is insufficient.

### main.c

```c
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
      {0, 1, 0, 0}, {1, 0, 0, 0}, {0, 0, 0, 1}, {0, 0, 1, 0}};
  bool seen[V] = {0};
  unsigned components = 0;
  for (int u = 0; u < V; ++u)
    if (!seen[u]) {
      ++components;
      dfs(edges, u, seen);
    }
  printf("components=%u\n", components);
  return 0;
}
```

Output:

```text
components=2
```

A traversal from zero reaches one, and a separate traversal from two reaches three. An isolated vertex would form a component of size one.

**Watch for:** The edge back to a DFS node’s parent is expected in an undirected graph and is not by itself a cycle.

**Check:** What starts a new component?

1. An unseen vertex after earlier traversals finish
2. Every edge between two seen vertices

<details><summary>Answer</summary>

An unseen vertex after earlier traversals finish. A completed traversal already reached every vertex in its component.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/graphs/3). In main.c, join the two components by setting entries [1][2] and [2][1] to 1 in edges. Run code and compare components=. Which previously separate searches now meet?

### References and help

- [NIST DADS: graphs](https://xlinux.nist.gov/dads/HTML/graph.html) — Identify vertices, edges, and directed versus undirected representations.

Native source: `native/examples/graphs-3.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=graphs-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 20.4 Topological sorting

A topological order places every prerequisite before its dependents. It exists only for a directed acyclic graph.

Kahn’s algorithm repeatedly removes a vertex with zero indegree (no remaining incoming edges) and decrements its outgoing neighbors. If fewer than V vertices are emitted, a cycle prevents completion. The fixed array queue is safe because each vertex enters only when its indegree becomes zero, once. Different available zero-indegree choices can produce different valid orders.

### One graph can have several routes to a vertex

Traversal tracks visited vertices so shared destinations are handled deliberately.

The directed edges are A to B, A to C, B to D, and C to D. Breadth-first search from A reaches level zero A, level one B and C, then level two D. D has two incoming routes but is not two different vertices. The graph is acyclic, so A before B and C before D is also a valid dependency order.

Edges point from each level to the next. B and C have no ordering edge between them.

### main.c

```c
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
```

Output:

```text
0 1 2 3
acyclic=1
```

Zero enables one and two, which together enable three. All four vertices are emitted.

**Watch for:** Returning a partial ordering as a full solution hides cycles.

**Check:** What indicates a cycle in this algorithm?

1. Two vertices are initially available
2. Fewer than V emitted vertices

<details><summary>Answer</summary>

Fewer than V emitted vertices. A cycle retains positive indegrees after removable vertices are exhausted.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/graphs/4). In main.c, put a 1 at column zero of the fourth matrix row to add edge 3 to 0. Run code and read acyclic=. Why is no full order possible once that edge closes the cycle?

### References and help

- [NIST DADS: graphs](https://xlinux.nist.gov/dads/HTML/graph.html) — Identify vertices, edges, and directed versus undirected representations.

Native source: `native/examples/graphs-4.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=graphs-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 20.5 Dijkstra’s shortest-path algorithm

Dijkstra finalizes the nearest unsettled vertex under a nonnegative-weight assumption. Negative edges invalidate that argument.

The matrix implementation scans for the next minimum, giving O(V²) time. Distances start at a sentinel larger than every possible path in this bounded fixture. Relaxation replaces a distance only when a shorter path is found. A general implementation must represent unreachable separately or check addition before combining path cost and weight.

### main.c

```c
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
      {0, 1, 5, 0}, {0, 0, 2, 7}, {0, 0, 0, 1}, {0, 0, 0, 0}};
  int dist[V];
  distances(edges, 0, dist);
  printf("distances=%d,%d,%d,%d\n", dist[0], dist[1], dist[2], dist[3]);
  return 0;
}
```

Output:

```text
distances=0,1,3,4
```

The best path to two goes through one, and the best path to three goes through two, totaling four.

**Watch for:** This representation excludes zero-weight edges; supporting them requires changing the edge-presence representation.

**Check:** Can this algorithm safely accept arbitrary negative weights?

1. No
2. Yes

<details><summary>Answer</summary>

No. A settled distance may later decrease through a negative edge, breaking the proof.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/graphs/5). In main.c, raise the 1 at edges[0][1] to 6 and run. Inspect distances=. Why does the shortest path to vertex 2 now use the direct edge of cost 5?

### References and help

- [NIST DADS: graphs](https://xlinux.nist.gov/dads/HTML/graph.html) — Identify vertices, edges, and directed versus undirected representations.

Native source: `native/examples/graphs-5.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=graphs-5 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 20.6 Route finding with a priority queue

A heap can replace the linear minimum scan. A simple implementation inserts a new candidate whenever a shorter route is found.

The lazy-duplicate approach leaves older candidates in the heap and skips them when their stored distance differs from the current best. This avoids a decrease-key API but needs enough queue capacity or dynamic growth. With adjacency lists, the usual bound is O((V+E) log(V+E)); this teaching fixture still scans matrix rows, so it does not achieve the sparse-graph bound.

### A min-heap orders parents before children

Sibling positions do not imply a fully sorted sequence.

A three-element min-heap has root priority 2, left child priority 8, and right child priority 5. The root is no larger than either child. The siblings need not be ordered relative to one another. Removing the minimum requires repairing the heap after moving another element into the root.

This is a priority-queue property, not the binary-search-tree ordering property.

### main.c

```c
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
```

Output:

```text
cost=4 reverse_path=3,2,1,0
```

The predecessor chain reconstructs three←two←one←zero. Stale distance-five and distance-eight candidates are harmless because the current-best comparison skips them.

**Watch for:** Silently dropping a candidate on queue overflow can produce incorrect routes; propagate failure.

**Check:** What makes an older pending entry stale?

1. Its vertex number is larger than the start
2. Its distance differs from the current best distance

<details><summary>Answer</summary>

Its distance differs from the current best distance. A newer relaxation established a better candidate for that vertex.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/graphs/6). In main.c, raise the 1 at edges[0][1] to 6 and run. Compare cost= and reverse_path=. Which earlier predecessor drops out of the reconstructed route?

**Extend the example:** An adjacency list is a separate implementation. Track each vertex’s neighbours and compare shortest-path cost and reachability with the supplied matrix version before counting work.

### References and help

- [NIST DADS: graphs](https://xlinux.nist.gov/dads/HTML/graph.html) — Identify vertices, edges, and directed versus undirected representations.

Native source: `native/examples/graphs-6.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=graphs-6 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## Build it yourself

Find routes in a graph and explain the cost of its representation.

1. Replace matrix rows with adjacency lists and benchmark only after verifying route costs against the simpler implementation.
2. Test an unreachable vertex, two routes to one vertex, and a rejected negative weight; compare matrix and list results.

### Check your work

- Compare reachability and complete route costs before counting edge visits or timing either representation.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=graphs-6
```

Chapter workspace command: `make chapter CHAPTER=graphs`.

Generated from dist/part4.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/graphs
