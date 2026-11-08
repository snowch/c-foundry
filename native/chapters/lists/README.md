# Chapter 16: Dynamic arrays and linked lists

Part 4: Build data structures in C. Teaching baseline: C17.

Choose a sequence representation by its operation costs, ownership rules, and access patterns.

## Outcomes

- Grow a vector without losing its owner on failure.
- Splice and remove linked nodes while preserving links.
- Explain iterator invalidation and locality tradeoffs.

## 16.1 Capacity growth and amortized append

A vector keeps initialized length separate from allocated capacity. Spare capacity makes most appends inexpensive.

The append helper grows through a temporary owner, checks byte-size arithmetic, and updates the public state only after successful allocation. Doubling capacity gives O(1) amortized append over a sequence, although a growth operation copies or relocates Θ(n) elements. The caller frees the final allocation exactly once.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  int *data;
  size_t length, capacity;
} Vector;
bool append(Vector *v, int x) {
  if (v->length == v->capacity) {
    size_t cap = v->capacity ? v->capacity * 2 : 2;
    if (v->capacity > SIZE_MAX / 2 || cap > SIZE_MAX / sizeof *v->data)
      return false;
    int *next = realloc(v->data, cap * sizeof *next);
    if (!next)
      return false;
    v->data = next;
    v->capacity = cap;
  }
  v->data[v->length++] = x;
  return true;
}

int main(void) {
  Vector v = {0};
  for (int i = 1; i <= 5; ++i)
    if (!append(&v, i)) {
      free(v.data);
      return 1;
    }
  printf("length=%zu capacity=%zu last=%d\n", v.length, v.capacity, v.data[4]);
  free(v.data);
  return 0;
}
```

Output:

```text
length=5 capacity=8 last=5
```

The capacities are two, four, and eight. Only the first five elements are initialized logical values.

**Watch for:** Pointers into the old allocation cannot be retained across a successful realloc.

**Check:** May code read unused capacity as initialized elements?

1. No
2. Yes

<details><summary>Answer</summary>

No. Capacity reserves storage; length defines which elements belong to the sequence.

</details>

**Try:** Add pop and reserve operations, documenting what they do on an empty vector and failed allocation.

Run from the repository root:

```sh
make example EXAMPLE=lists-1
```

## 16.2 Singly and doubly linked lists

A singly linked node names its successor; a doubly linked node also names its predecessor. The extra link supports different update costs.

The fixture uses stack-allocated nodes so link changes can be inspected without adding allocation code. link_after sets both sides of each relationship. In a doubly linked list, if x->next is y then y->previous should be x. Ownership is separate from connectivity: these borrowed nodes must not be freed by the linking helper.

### main.c

```c
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
```

Output:

```text
forward=1,9,2 backward=9
```

The new node is between a and b. Updating b.previous is essential; a forward-only walk would not reveal a stale backward link.

**Watch for:** A data structure can look correct in one traversal direction while violating another invariant.

**Check:** Which link must also change when inserting before b?

1. Only the new node’s value
2. b.previous

<details><summary>Answer</summary>

b.previous. Both neighboring relationships must agree.

</details>

**Try:** Write an invariant checker that walks forward and verifies every backward link.

Run from the repository root:

```sh
make example EXAMPLE=lists-2
```

## 16.3 Insertion, removal, and traversal

Removal changes the owner of an incoming link. A pointer-to-pointer handles removing the head and an interior node with one pattern.

Walk the address of the link that reaches the current node. On a match, replace that link with the successor before freeing the node. The helper owns the heap nodes it removes. Traversal is O(n); unlinking is O(1) once the incoming link is known. Returning immediately prevents using the freed node.

### main.c

```c
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
```

Output:

```text
1 3
```

The incoming link in node one is redirected to node three before node two is freed. Cleanup saves the successor while the current node is alive.

**Watch for:** This singly linked removal does not maintain previous links; do not reuse it as a doubly linked removal API.

**Check:** What is redirected before freeing the removed node?

1. The incoming link
2. The freed node’s value afterward

<details><summary>Answer</summary>

The incoming link. No access to the node is valid after free.

</details>

**Try:** Test removing the head, tail, only node, and a value that is absent.

Run from the repository root:

```sh
make example EXAMPLE=lists-3
```

## 16.4 Ownership and iterator invalidation

An iterator is a contract about which operations leave an access path valid. Capacity growth and node deletion have different invalidation rules.

Save a logical index rather than an element pointer when the next operation may relocate a vector. After a successful append, reacquire the pointer from the current allocation. A linked-node pointer may survive insertion elsewhere but becomes invalid when that node is freed. Neither representation permits a borrowed result to outlive its owner.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  int *data;
  size_t length, capacity;
} Vector;
bool append(Vector *v, int x) {
  if (v->length == v->capacity) {
    size_t cap = v->capacity ? v->capacity * 2 : 2;
    if (v->capacity > SIZE_MAX / 2 || cap > SIZE_MAX / sizeof *v->data)
      return false;
    int *next = realloc(v->data, cap * sizeof *next);
    if (!next)
      return false;
    v->data = next;
    v->capacity = cap;
  }
  v->data[v->length++] = x;
  return true;
}

int main(void) {
  Vector v = {0};
  if (!append(&v, 10) || !append(&v, 20)) {
    free(v.data);
    return 1;
  }
  size_t selected = 1;
  if (!append(&v, 30)) {
    free(v.data);
    return 1;
  }
  printf("reacquired=%d\n", v.data[selected]);
  free(v.data);
  return 0;
}
```

Output:

```text
reacquired=20
```

The index still identifies the same logical element because this operation appends rather than inserting before it. The pointer is acquired only after possible growth.

**Watch for:** An index can also become stale after insertion or deletion changes logical positions.

**Check:** Why is an index useful across this append?

1. Indices survive every possible edit
2. It does not contain an address into the old allocation

<details><summary>Answer</summary>

It does not contain an address into the old allocation. The guarantee is specific to append preserving earlier positions.

</details>

**Try:** Document invalidation for append, insert, erase, and clear in both a vector and a list.

Run from the repository root:

```sh
make example EXAMPLE=lists-4
```

## 16.5 Locality, memory overhead, and operation costs

Asymptotic operation counts do not capture every practical cost. Contiguous storage often improves cache locality while nodes carry pointer and allocator overhead.

A vector provides constant-time indexed access; locating the ith linked node requires following i links. Both full traversals are Θ(n), but pointer chasing and scattered allocations can change hardware behavior. The example counts logical link steps, not cache misses or timings. Avoid claiming a universal speed ratio from this model.

### main.c

```c
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
```

Output:

```text
value=6 link_steps=2 indexed=6
```

Two successor traversals locate the third node. The indexed expression reaches its array element directly. These nodes happen to be contiguous; a general heap list need not be.

**Watch for:** The sample’s contiguous node array must not be presented as evidence about scattered heap allocation performance.

**Check:** Which operation is O(1) for a vector but O(n) for a list?

1. Access by arbitrary index
2. Visiting every value

<details><summary>Answer</summary>

Access by arbitrary index. A list must follow links to find an index.

</details>

**Try:** Choose a representation for mostly indexed reads and for frequent splices with known neighboring nodes; justify both choices.

Run from the repository root:

```sh
make example EXAMPLE=lists-5
```

## Build it yourself

Implement list operations and compare them with a dynamic array.

1. Choose a sequence representation by its operation costs, ownership rules, and access patterns.
2. Choose a representation for mostly indexed reads and for frequent splices with known neighboring nodes; justify both choices.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=lists-5
```

Chapter workspace command: `make chapter CHAPTER=lists`.

Generated from dist/part4.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/lists
