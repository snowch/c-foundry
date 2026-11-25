# Chapter 19: Trees, heaps, and ordered data

Part 4: Build data structures in C. Teaching baseline: C17.

Separate search-order invariants from shape and priority invariants. Keep both data and height metadata consistent.

## Outcomes

- Traverse a tree and preserve BST ordering.
- Restore balance with rotations.
- Use a heap to select the next priority.

## 19.1 Binary trees and traversals

Traversal order describes when a parent is visited relative to its children. It does not require a particular memory layout.

Inorder visits left subtree, node, and right subtree. For a binary search tree (BST) with distinct keys, this produces ascending order. A plain binary tree without the ordering invariant does not promise sorted output. Traversal visits each node once and uses stack depth proportional to tree height.

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
  int key;
  struct Node *left, *right;
  int height;
} Node;
void inorder(const Node *n) {
  if (!n)
    return;
  inorder(n->left);
  printf("%d ", n->key);
  inorder(n->right);
}
const Node *find(const Node *n, int key) {
  while (n && n->key != key)
    n = key < n->key ? n->left : n->right;
  return n;
}
int height(const Node *n) { return n ? n->height : 0; }
int maximum(int a, int b) { return a > b ? a : b; }
void refresh(Node *n) {
  n->height = 1 + maximum(height(n->left), height(n->right));
}
Node *rotate_right(Node *root) {
  Node *next = root->left;
  root->left = next->right;
  next->right = root;
  refresh(root);
  refresh(next);
  return next;
}
Node *rotate_left(Node *root) {
  Node *next = root->right;
  root->right = next->left;
  next->left = root;
  refresh(root);
  refresh(next);
  return next;
}
Node *avl_insert(Node *root, Node *item) {
  if (!root)
    return item;
  if (item->key < root->key)
    root->left = avl_insert(root->left, item);
  else if (item->key > root->key)
    root->right = avl_insert(root->right, item);
  else
    return root;
  refresh(root);
  int balance = height(root->left) - height(root->right);
  if (balance > 1) {
    if (item->key > root->left->key)
      root->left = rotate_left(root->left);
    return rotate_right(root);
  }
  if (balance < -1) {
    if (item->key < root->right->key)
      root->right = rotate_right(root->right);
    return rotate_left(root);
  }
  return root;
}

int main(void) {
  Node a = {1, NULL, NULL, 1}, b = {3, NULL, NULL, 1}, root = {2, &a, &b, 2};
  inorder(&root);
  puts("");
  return 0;
}
```

Output:

```text
1 2 3
```

The recursive calls print the left leaf, root, and right leaf. Child pointers borrow stack nodes that remain alive until traversal ends.

**Watch for:** Tree traversal must not assume that every non-null pointer belongs to a validated acyclic tree.

**Check:** When is inorder output sorted?

1. When the BST ordering invariant holds
2. For every binary tree

<details><summary>Answer</summary>

When the BST ordering invariant holds. The left and right subtree key constraints establish the sorted concatenation.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/trees-heaps/1). In main.c, change the root key from 2 to 7 while leaving both children fixed. Run code. Where does 7 appear in the inorder sequence, and why does traversal alone leave an arbitrary tree’s keys unsorted?

### References and help

- [NIST DADS: binary search trees](https://xlinux.nist.gov/dads/HTML/binarySearchTree.html) — Identify the ordering invariant and how tree shape affects height.

Native source: `native/examples/trees-heaps-1.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=trees-heaps-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 19.2 Binary search trees

A binary search tree routes comparisons through its shape. Every left-subtree key is smaller and every right-subtree key is larger under this unique-key policy.

Search moves to one child after each comparison, using O(h) time for height h. The missing result is NULL and must be checked before dereferencing. Deleting a two-child node typically replaces its key with a successor or predecessor and then removes that replacement node while preserving ordering and ownership.

### A search tree routes by ordered keys

For this tree, smaller keys go left and larger keys go right.

The root key is 20. Its left child has key 8 and its right child has key 32. Searching for 8 follows the less-than branch; searching for 32 follows the greater-than branch. This shows the ordering property, not a guarantee of balanced height.

A plain binary search tree can become a chain; the ordering rule alone does not bound its height.

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
  int key;
  struct Node *left, *right;
  int height;
} Node;
void inorder(const Node *n) {
  if (!n)
    return;
  inorder(n->left);
  printf("%d ", n->key);
  inorder(n->right);
}
const Node *find(const Node *n, int key) {
  while (n && n->key != key)
    n = key < n->key ? n->left : n->right;
  return n;
}
int height(const Node *n) { return n ? n->height : 0; }
int maximum(int a, int b) { return a > b ? a : b; }
void refresh(Node *n) {
  n->height = 1 + maximum(height(n->left), height(n->right));
}
Node *rotate_right(Node *root) {
  Node *next = root->left;
  root->left = next->right;
  next->right = root;
  refresh(root);
  refresh(next);
  return next;
}
Node *rotate_left(Node *root) {
  Node *next = root->right;
  root->right = next->left;
  next->left = root;
  refresh(root);
  refresh(next);
  return next;
}
Node *avl_insert(Node *root, Node *item) {
  if (!root)
    return item;
  if (item->key < root->key)
    root->left = avl_insert(root->left, item);
  else if (item->key > root->key)
    root->right = avl_insert(root->right, item);
  else
    return root;
  refresh(root);
  int balance = height(root->left) - height(root->right);
  if (balance > 1) {
    if (item->key > root->left->key)
      root->left = rotate_left(root->left);
    return rotate_right(root);
  }
  if (balance < -1) {
    if (item->key < root->right->key)
      root->right = rotate_right(root->right);
    return rotate_left(root);
  }
  return root;
}

int main(void) {
  Node a = {1, NULL, NULL, 1}, b = {3, NULL, NULL, 1}, root = {2, &a, &b, 2};
  printf("three=%d missing=%d\n", find(&root, 3) != NULL,
         find(&root, 7) == NULL);
  return 0;
}
```

Output:

```text
three=1 missing=1
```

The lookup follows one right edge for three. Seven follows the right child and then reaches NULL.

**Watch for:** A BST is not automatically balanced, so its height need not be logarithmic.

**Check:** What determines this lookup’s path length?

1. Only the key’s numeric magnitude
2. Tree height

<details><summary>Answer</summary>

Tree height. Each step follows one level of the tree.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/trees-heaps/2). In main.c, change find(&root, 7) to find(&root, 2) in the missing= expression. Run code. How does the boolean change when the root itself matches?

### References and help

- [NIST DADS: binary search trees](https://xlinux.nist.gov/dads/HTML/binarySearchTree.html) — Identify the ordering invariant and how tree shape affects height.

Native source: `native/examples/trees-heaps-2.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=trees-heaps-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 19.3 Why balancing matters

Insertion order can turn an ordinary BST into a chain. Balancing prevents the search path from growing linearly with the number of keys.

The fixture compares a three-node right chain with a balanced three-node tree. Both satisfy BST ordering and have the same inorder sequence, but maximum path lengths differ. For n sorted insertions into a naive BST, the final height is n; an AVL tree keeps each node’s child heights within one level of each other, giving O(log n) height.

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
  int key;
  struct Node *left, *right;
  int height;
} Node;
void inorder(const Node *n) {
  if (!n)
    return;
  inorder(n->left);
  printf("%d ", n->key);
  inorder(n->right);
}
const Node *find(const Node *n, int key) {
  while (n && n->key != key)
    n = key < n->key ? n->left : n->right;
  return n;
}
int height(const Node *n) { return n ? n->height : 0; }
int maximum(int a, int b) { return a > b ? a : b; }
void refresh(Node *n) {
  n->height = 1 + maximum(height(n->left), height(n->right));
}
Node *rotate_right(Node *root) {
  Node *next = root->left;
  root->left = next->right;
  next->right = root;
  refresh(root);
  refresh(next);
  return next;
}
Node *rotate_left(Node *root) {
  Node *next = root->right;
  root->right = next->left;
  next->left = root;
  refresh(root);
  refresh(next);
  return next;
}
Node *avl_insert(Node *root, Node *item) {
  if (!root)
    return item;
  if (item->key < root->key)
    root->left = avl_insert(root->left, item);
  else if (item->key > root->key)
    root->right = avl_insert(root->right, item);
  else
    return root;
  refresh(root);
  int balance = height(root->left) - height(root->right);
  if (balance > 1) {
    if (item->key > root->left->key)
      root->left = rotate_left(root->left);
    return rotate_right(root);
  }
  if (balance < -1) {
    if (item->key < root->right->key)
      root->right = rotate_right(root->right);
    return rotate_left(root);
  }
  return root;
}

int main(void) {
  Node last = {3, NULL, NULL, 1}, middle = {2, NULL, &last, 2},
       chain = {1, NULL, &middle, 3};
  Node left = {1, NULL, NULL, 1}, right = {3, NULL, NULL, 1},
       balanced = {2, &left, &right, 2};
  printf("chain_height=%d balanced_height=%d\n", height(&chain),
         height(&balanced));
  return 0;
}
```

Output:

```text
chain_height=3 balanced_height=2
```

The stored heights include the root level. Balanced shape reduces the longest route without changing key order.

### The same keys can have different heights

How many node levels must a root-to-leaf path cross?

The chain has root 1, right child 2, and right grandchild 3: height 3. The balanced tree has root 2, left child 1, and right child 3: height 2. Both have inorder traversal 1, 2, 3. In this program height counts node levels, and an empty tree has height zero.

These are the two shapes constructed by the starter. Height bounds a search path; this picture does not measure runtime.

**Watch for:** Testing only inorder output verifies order but does not verify balance or correct height metadata.

**Check:** Can two correct BSTs have different lookup costs?

1. Yes, their shapes may differ
2. No, ordering fixes the shape

<details><summary>Answer</summary>

Yes, their shapes may differ. Ordering constrains key placement relative to ancestors, not one unique structure.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/trees-heaps/3). In main.c, add printf("subchain_height=%d\n", height(&middle)); before return. Run code and compare subchain_height= with chain_height= and balanced_height=. What does height count, and can the same height describe different shapes?

### References and help

- [NIST DADS: binary search trees](https://xlinux.nist.gov/dads/HTML/binarySearchTree.html) — Identify the ordering invariant and how tree shape affects height.

**Use the documentation (optional):** What happens to search cost when a binary search tree degenerates into a chain?

<details><summary>Compare your answer</summary>

Its height can become linear in the number of nodes, and a search may visit that many nodes. The ordering invariant alone does not guarantee logarithmic height.

</details>

Native source: `native/examples/trees-heaps-3.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=trees-heaps-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 19.4 Rotations and a balanced-tree implementation

A rotation changes local shape while preserving the inorder sequence. An AVL insertion chooses rotations from height differences.

The implementation recursively inserts a borrowed fresh node, refreshes heights on the return path, and handles single or double rotations when the child-height difference exceeds one. Duplicate keys retain the existing node; ownership of a rejected node remains with the caller. This fixture uses an array of nodes rather than allocating them.

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
  int key;
  struct Node *left, *right;
  int height;
} Node;
void inorder(const Node *n) {
  if (!n)
    return;
  inorder(n->left);
  printf("%d ", n->key);
  inorder(n->right);
}
const Node *find(const Node *n, int key) {
  while (n && n->key != key)
    n = key < n->key ? n->left : n->right;
  return n;
}
int height(const Node *n) { return n ? n->height : 0; }
int maximum(int a, int b) { return a > b ? a : b; }
void refresh(Node *n) {
  n->height = 1 + maximum(height(n->left), height(n->right));
}
Node *rotate_right(Node *root) {
  Node *next = root->left;
  root->left = next->right;
  next->right = root;
  refresh(root);
  refresh(next);
  return next;
}
Node *rotate_left(Node *root) {
  Node *next = root->right;
  root->right = next->left;
  next->left = root;
  refresh(root);
  refresh(next);
  return next;
}
Node *avl_insert(Node *root, Node *item) {
  if (!root)
    return item;
  if (item->key < root->key)
    root->left = avl_insert(root->left, item);
  else if (item->key > root->key)
    root->right = avl_insert(root->right, item);
  else
    return root;
  refresh(root);
  int balance = height(root->left) - height(root->right);
  if (balance > 1) {
    if (item->key > root->left->key)
      root->left = rotate_left(root->left);
    return rotate_right(root);
  }
  if (balance < -1) {
    if (item->key < root->right->key)
      root->right = rotate_right(root->right);
    return rotate_left(root);
  }
  return root;
}

int main(void) {
  Node nodes[] = {{3, NULL, NULL, 1}, {1, NULL, NULL, 1}, {2, NULL, NULL, 1}};
  Node *root = NULL;
  for (size_t i = 0; i < 3; ++i)
    root = avl_insert(root, &nodes[i]);
  printf("root=%d height=%d order=", root->key, root->height);
  inorder(root);
  puts("");
  return 0;
}
```

Output:

```text
root=2 height=2 order=1 2 3
```

Inserting two creates a left-right imbalance at three. The two rotations promote two while preserving the inorder sequence.

### Rotations change links while preserving key order

How does inserting 2 rebalance the keys 3, 1, 2?

Immediately after linking the third key, root 3 has left child 1, whose right child is 2. This left-right shape is unbalanced. A left rotation at 1 followed by a right rotation at 3 gives root 2 with left child 1 and right child 3. Inorder traversal remains 1, 2, 3; the resulting height is 2 after height metadata is refreshed.

Rotate left at node 1, then right at node 3. The links change; inorder order stays 1, 2, 3. The first tree is an intermediate insertion state.

**Watch for:** Fixing pointers but leaving stale heights can cause later insertions to choose incorrect rotations.

**Check:** What must a rotation preserve?

1. Every node’s original parent
2. The inorder key sequence

<details><summary>Answer</summary>

The inorder key sequence. Reparenting is the mechanism; ordering is the preserved invariant.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/trees-heaps/4). In main.c, change nodes’ key order from 3, 1, 2 to 1, 2, 3, retaining the other fields. Run code. Compare root=, height=, and order=. Can different insertion orders produce the same final tree?

### References and help

- [NIST DADS: binary search trees](https://xlinux.nist.gov/dads/HTML/binarySearchTree.html) — Identify the ordering invariant and how tree shape affects height.

Native source: `native/examples/trees-heaps-4.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=trees-heaps-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 19.5 Binary heaps and priority queues

A min-heap promises that each parent is no greater than its children. It does not keep the entire array sorted.

Store a complete binary tree in an array. Parent and child indices follow from the shape, while push sifts upward and pop repairs downward after replacing the root. Both cost O(log n); reading the minimum is O(1). The bounded implementation rejects overflow and underflow, and callers check those results.

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

typedef struct {
  int data[16];
  size_t n;
} Heap;
bool heap_push(Heap *h, int x) {
  if (h->n == 16)
    return false;
  size_t i = h->n++;
  while (i && h->data[(i - 1) / 2] > x) {
    h->data[i] = h->data[(i - 1) / 2];
    i = (i - 1) / 2;
  }
  h->data[i] = x;
  return true;
}
bool heap_pop(Heap *h, int *out) {
  if (!h->n)
    return false;
  *out = h->data[0];
  int x = h->data[--h->n];
  if (!h->n)
    return true;
  size_t i = 0;
  while (i * 2 + 1 < h->n) {
    size_t child = i * 2 + 1;
    if (child + 1 < h->n && h->data[child + 1] < h->data[child])
      ++child;
    if (h->data[child] >= x)
      break;
    h->data[i] = h->data[child];
    i = child;
  }
  h->data[i] = x;
  return true;
}

int main(void) {
  Heap h = {0};
  if (!heap_push(&h, 7) || !heap_push(&h, 2) || !heap_push(&h, 5))
    return 1;
  int x;
  while (heap_pop(&h, &x))
    printf("%d ", x);
  puts("");
  return 0;
}
```

Output:

```text
2 5 7
```

Repeated removal yields sorted priorities even though an arbitrary heap array position need not be globally ordered.

**Watch for:** Binary-searching a heap array assumes an ordering it does not provide.

**Check:** Which element is guaranteed minimal?

1. The root
2. Every leftmost array prefix

<details><summary>Answer</summary>

The root. Only the ancestor-to-descendant ordering invariant is required.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/trees-heaps/5). In main.c, replace heap_push(&h, 5) with heap_push(&h, 2). Run code. Does each of the two equal priorities appear in the removal sequence?

### References and help

- [NIST DADS: binary heaps](https://xlinux.nist.gov/dads/HTML/binaryheap.html) — Read the heap-order and complete-tree properties used by a priority queue.

Native source: `native/examples/trees-heaps-5.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=trees-heaps-5 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 19.6 A task scheduler

A priority scheduler orders pending work by a documented priority key. To run equal-priority tasks in arrival order, include their insertion sequence as a tie-break.

This small scheduler encodes priority and insertion sequence into one bounded integer key, allowing the existing min-heap to break ties FIFO. The encoding is valid only for the stated fixture’s small values; a general scheduler should compare a struct with checked sequence handling. Scheduling priority does not imply that a task is safe to interrupt or run concurrently.

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

typedef struct {
  int data[16];
  size_t n;
} Heap;
bool heap_push(Heap *h, int x) {
  if (h->n == 16)
    return false;
  size_t i = h->n++;
  while (i && h->data[(i - 1) / 2] > x) {
    h->data[i] = h->data[(i - 1) / 2];
    i = (i - 1) / 2;
  }
  h->data[i] = x;
  return true;
}
bool heap_pop(Heap *h, int *out) {
  if (!h->n)
    return false;
  *out = h->data[0];
  int x = h->data[--h->n];
  if (!h->n)
    return true;
  size_t i = 0;
  while (i * 2 + 1 < h->n) {
    size_t child = i * 2 + 1;
    if (child + 1 < h->n && h->data[child + 1] < h->data[child])
      ++child;
    if (h->data[child] >= x)
      break;
    h->data[i] = h->data[child];
    i = child;
  }
  h->data[i] = x;
  return true;
}

int main(void) {
  Heap h = {0};
  heap_push(&h, 20);
  heap_push(&h, 11);
  heap_push(&h, 12);
  int x;
  while (heap_pop(&h, &x))
    printf("priority=%d sequence=%d\n", x / 10, x % 10);
  return 0;
}
```

Output:

```text
priority=1 sequence=1
priority=1 sequence=2
priority=2 sequence=0
```

The two priority-one tasks leave in sequence order, then priority two. The numeric encoding is a teaching shortcut, not an unbounded identifier format.

**Watch for:** Without aging or another fairness policy, continually arriving high-priority tasks can starve low-priority work.

**Check:** Does a heap alone guarantee scheduler fairness?

1. Yes
2. No

<details><summary>Answer</summary>

No. It implements the ordering rule, which may permit starvation.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/trees-heaps/6). In main.c, insert heap_push(&h, 10); before the removal loop. Run code. Compare priority= and sequence= for tasks with priority 1. How does the encoded sequence break the tie?

### References and help

- [NIST DADS: binary heaps](https://xlinux.nist.gov/dads/HTML/binaryheap.html) — Read the heap-order and complete-tree properties used by a priority queue.

Native source: `native/examples/trees-heaps-6.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=trees-heaps-6 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## Build it yourself

Schedule tasks with a priority queue and investigate tree balance.

1. Replace encoded integers with a Task struct and comparator, then add an explicit fairness policy.
2. Give two tasks equal priority, insert them in a known order, then add higher-priority tasks before each removal.

### Check your work

- Check your documented tie-break and fairness policy; verify heap order after every push and pop.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=trees-heaps-6
```

Chapter workspace command: `make chapter CHAPTER=trees-heaps`.

Generated from dist/part4.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/trees-heaps
