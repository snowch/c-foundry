# Chapter 14: Recursion and divide and conquer

Part 3: Learn to reason about algorithms. Teaching baseline: C17.

Make recursive subproblems smaller, track each call’s state, and compare explicit and implicit stacks.

## Outcomes

- Identify a base case and a decreasing measure.
- Account for recursive auxiliary space.
- Traverse a directory-like tree without assuming parent data disappears.

## 14.1 Base cases and recursive progress

A recursive function needs both a terminating base case and progress toward it on every recursive path.

Factorial on the small domain 0..10 uses 0!=1 and n!=n·(n−1)!. The argument decreases until it is less than two. The domain restriction matters: machine integers are finite, so this is not an implementation for arbitrarily large mathematical factorials.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

unsigned factorial(unsigned n) { return n < 2 ? 1 : n * factorial(n - 1); }
unsigned factorial_loop(unsigned n) {
  unsigned result = 1;
  for (unsigned i = 2; i <= n; ++i)
    result *= i;
  return result;
}

int main(void) {
  printf("zero=%u five=%u\n", factorial(0), factorial(5));
  return 0;
}
```

Output:

```text
zero=1 five=120
```

Zero returns at the base case. Five multiplies 5·4·3·2·1 while calls return.

**Watch for:** A base case that cannot be reached from a valid input does not guarantee termination.

**Check:** What decreases in this recursion?

1. The unsigned argument for n≥2
2. The size of the result

<details><summary>Answer</summary>

The unsigned argument for n≥2. Each recursive call receives n−1 only when n is at least two.

</details>

**Try:** Add a checked public wrapper that rejects values above the documented domain.

Run from the repository root:

```sh
make example EXAMPLE=recursion-1
```

## 14.2 Drawing the call stack

Each recursive call has its own parameters and local state. Trace entry and return to distinguish the active call from its caller.

The countdown prints before and after its recursive call. Its local n remains unchanged while the child runs. At the base case, the function returns without making another call. Stack depth grows linearly with the initial n; a huge input can exhaust implementation resources even when the recurrence terminates mathematically.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void visit(unsigned n) {
  printf("enter %u\n", n);
  if (n)
    visit(n - 1);
  printf("leave %u\n", n);
}

int main(void) {
  visit(2);
  return 0;
}
```

Output:

```text
enter 2
enter 1
enter 0
leave 0
leave 1
leave 2
```

Returns unwind in the reverse order of calls, because each caller resumes after its child completes.

**Watch for:** The trace describes logical call nesting, not a portable memory-address layout of the native stack.

**Check:** Which call returns first?

1. The initial call with n=2
2. The base-case call with n=0

<details><summary>Answer</summary>

The base-case call with n=0. The caller waits for the child’s result.

</details>

**Try:** Draw one box per active call and mark the point where the maximum number of boxes is live.

Run from the repository root:

```sh
make example EXAMPLE=recursion-2
```

## 14.3 Recursive versus iterative implementations

An iterative formulation can remove recursive call overhead and stack growth when the problem permits a compact accumulator.

Both factorial implementations compute the same small-domain result. The loop keeps one accumulator and counter, using O(1) auxiliary space; the direct recursive version has O(n) active call depth. Tail-call optimization is not a C language guarantee, so do not use it as a correctness or space-safety assumption.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

unsigned factorial(unsigned n) { return n < 2 ? 1 : n * factorial(n - 1); }
unsigned factorial_loop(unsigned n) {
  unsigned result = 1;
  for (unsigned i = 2; i <= n; ++i)
    result *= i;
  return result;
}

int main(void) {
  printf("recursive=%u iterative=%u\n", factorial(6), factorial_loop(6));
  return 0;
}
```

Output:

```text
recursive=720 iterative=720
```

Equality of results is checked for one fixture; test the entire documented small domain before replacing the implementation.

**Watch for:** Changing control structure does not remove overflow from an unchecked arithmetic formula.

**Check:** Does C require tail-call elimination?

1. No
2. Yes

<details><summary>Answer</summary>

No. An implementation may preserve a call frame for each recursive call.

</details>

**Try:** Compare both versions for every input from zero through ten and add overflow checks before multiplication.

Run from the repository root:

```sh
make example EXAMPLE=recursion-3
```

## 14.4 Recursion trees and simple recurrences

A recursion tree exposes how many subproblems exist at each depth and how much nonrecursive work each node performs.

A balanced split into two half-sized problems with constant leaf cost and linear combine cost satisfies T(n)=2T(n/2)+Θ(n). Every level contributes Θ(n) work, and the tree has Θ(log n) levels. Count leaves separately from the total number of nodes; for the example’s power-of-two input, there are n leaves and 2n−1 nodes.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void count_tree(unsigned n, unsigned *nodes, unsigned *leaves) {
  ++*nodes;
  if (n < 2) {
    ++*leaves;
    return;
  }
  count_tree(n / 2, nodes, leaves);
  count_tree(n - n / 2, nodes, leaves);
}

int main(void) {
  unsigned nodes = 0, leaves = 0;
  count_tree(8, &nodes, &leaves);
  printf("nodes=%u leaves=%u\n", nodes, leaves);
  return 0;
}
```

Output:

```text
nodes=15 leaves=8
```

This program counts the split tree only. A merge-sort combine step adds linear work at each internal node, producing the extra logarithmic factor.

**Watch for:** Two recursive calls do not by themselves imply exponential work; their argument sizes matter.

**Check:** What detail distinguishes merge sort from two calls on n−1?

1. Both use two function calls
2. The subproblem sizes shrink by about half

<details><summary>Answer</summary>

The subproblem sizes shrink by about half. A recurrence must describe sizes and nonrecursive work, not just call count.

</details>

**Try:** Repeat with n=7, draw the uneven leaves, and explain why the asymptotic merge-sort bound is unchanged.

Run from the repository root:

```sh
make example EXAMPLE=recursion-4
```

## 14.5 Recursive directory-like tree traversal

A tree traversal visits each node and recursively processes its children. Directory-like structure can be modeled without requiring filesystem access.

Nodes borrow immutable names and child arrays. Preorder visits the parent before its descendants. For a tree with V nodes, traversal takes Θ(V) visits and O(h) active stack depth, where h is its height. A general graph needs a visited policy to avoid revisiting nodes or following cycles forever.

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
```

Output:

```text
src
  main.c
  db.c
```

The root prints first and each leaf prints one indentation level deeper. No host directory is opened.

**Watch for:** Deep or cyclic external structures need depth limits and validation; a trusted small tree does not demonstrate those protections.

**Check:** What controls the active recursion depth?

1. The tree’s height
2. Only the number of siblings

<details><summary>Answer</summary>

The tree’s height. Calls remain active along the current root-to-node path.

</details>

**Try:** Add a nested directory and then implement the traversal with an explicit bounded stack.

Run from the repository root:

```sh
make example EXAMPLE=recursion-5
```

## Build it yourself

Traverse a tree and account for the recursive call stack.

1. Make recursive subproblems smaller, track each call’s state, and compare explicit and implicit stacks.
2. Add a nested directory and then implement the traversal with an explicit bounded stack.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=recursion-5
```

Chapter workspace command: `make chapter CHAPTER=recursion`.

Generated from dist/part3.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/recursion
