# Chapter 15: Problem-solving strategies

Part 3: Learn to reason about algorithms. Teaching baseline: C17.

Choose between enumeration, greedy choices, and dynamic programming by examining state and counterexamples.

## Outcomes

- Prune backtracking without discarding valid solutions.
- Disprove a greedy rule with a concrete input.
- Choose states and evaluation order for dynamic programs.

## 15.1 Brute force and backtracking

Brute force makes the candidate space explicit. Backtracking adds choices incrementally and abandons a branch when it cannot lead to a valid solution.

For a small subset-sum instance, each position has include and exclude choices. The nonnegative-data contract permits pruning when a partial sum exceeds the target. Without memoization this explores up to 2ⁿ subsets. The base case decides whether the complete choice reaches the target, and every call advances the index.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

bool subset(const int *a, size_t n, size_t i, int remaining) {
  if (remaining == 0)
    return true;
  if (i == n || remaining < 0)
    return false;
  return subset(a, n, i + 1, remaining - a[i]) ||
         subset(a, n, i + 1, remaining);
}

int main(void) {
  int a[] = {2, 4, 7};
  printf("target6=%d target5=%d\n", subset(a, 3, 0, 6), subset(a, 3, 0, 5));
  return 0;
}
```

Output:

```text
target6=1 target5=0
```

Including 2 and 4 reaches six. No subset of these values reaches five. Both branches progress to the next input position.

**Watch for:** Pruning on a negative remainder is invalid if later values may be negative.

**Check:** Why is this pruning valid here?

1. All input values are nonnegative
2. Recursion always permits pruning

<details><summary>Answer</summary>

All input values are nonnegative. The remaining sum cannot be increased by including another nonnegative value.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/strategies/1). In main.c, replace the first target 6 in the subset call with 11 and rename target6= to target11=. Run code. Which two elements make 11, and what does the unchanged target5= result tell you?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [NIST DADS: backtracking](https://xlinux.nist.gov/dads/HTML/backtrack.html) (online) — Identify the choices explored, rejected partial candidates, and restoration of state.

Native source: `native/examples/strategies-1.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=strategies-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 15.2 Greedy choices and counterexamples

A greedy rule makes a locally attractive choice without reconsidering it. A plausible rule needs a proof, not just several successful examples.

For coins 1, 3, and 4, repeatedly taking the largest available coin uses 4+1+1 for amount six, while 3+3 uses only two coins. A single counterexample disproves optimality for this coin system. Some coin systems admit a correct greedy rule, but that is a separate theorem with explicit assumptions.

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
  int coins[] = {4, 3, 1}, remaining = 6, count = 0;
  for (size_t i = 0; i < 3; ++i)
    while (remaining >= coins[i]) {
      remaining -= coins[i];
      ++count;
    }
  printf("greedy=%d better=%d\n", count, 2);
  return 0;
}
```

Output:

```text
greedy=3 better=2
```

The program executes the greedy choice; the displayed better solution is the concrete witness 3+3 described in the text.

**Watch for:** A fast local choice can produce a suboptimal global solution.

**Check:** What does one valid counterexample establish?

1. No greedy algorithm can ever work
2. The greedy rule is not always optimal

<details><summary>Answer</summary>

The greedy rule is not always optimal. It refutes this rule under the stated domain, not all greedy methods.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/strategies/2). In main.c, change remaining from 6 to 7 and keep the second printf argument 2. Run code and inspect greedy=. Construct a two-coin solution for 7. The example supplies the comparison count better=2 as a literal.

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [NIST DADS: greedy algorithms](https://xlinux.nist.gov/dads/HTML/greedyalgo.html) (online) — Distinguish a locally attractive choice from a proof of global correctness.

Native source: `native/examples/strategies-2.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=strategies-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 15.3 Memoization and dynamic programming

Dynamic programming reuses solutions to overlapping subproblems. Memoization computes states on demand; bottom-up evaluation computes them in a dependency order.

Let best[x] be the minimum number of coins needed for amount x, with best[0]=0. For each coin c≤x, try best[x−c]+1. The fixed bounded table and positive denominations make dependencies point to smaller states. With A amounts and C denominations, this version uses O(AC) time and O(A) space.

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
  int coins[] = {1, 3, 4}, best[7];
  best[0] = 0;
  for (int x = 1; x <= 6; ++x) {
    best[x] = 99;
    for (size_t j = 0; j < 3; ++j)
      if (coins[j] <= x && best[x - coins[j]] + 1 < best[x])
        best[x] = best[x - coins[j]] + 1;
  }
  printf("optimal=%d\n", best[6]);
  return 0;
}
```

Output:

```text
optimal=2
```

At amount six, the transition from best[3] through coin three produces two. Smaller states are initialized before use.

### Three earlier answers feed best[6]

Which last coin gives the fewest coins for amount 6?

With coin values 1, 3, and 4, best[a] means the minimum number of coins for amount a. For amount 6, choosing last coin 1 gives best[5] plus 1, or 3 coins. Last coin 3 gives best[3] plus 1, or 2 coins. Last coin 4 gives best[2] plus 1, or 3 coins. The minimum is 2 coins, achieved by 3 plus 3.

Coin values are positive and reusable in this example. The numbers on the arrows’ endpoints count coins, not time or currency units.

**Watch for:** An unreachable sentinel must not overflow when incremented; use a checked sentinel or guard the transition.

**Check:** Why may best[x] use best[x-c]?

1. x-c is an already solved smaller state
2. All table cells initially contain valid answers

<details><summary>Answer</summary>

x-c is an already solved smaller state. Positive coin values and increasing x establish the dependency order.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/strategies/3). In main.c, replace 1 with 2 in coins, then change best[6] to best[5] in printf. Run code. Why can 5 be represented with the new coins even without a coin of value 1?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [NIST DADS: dynamic programming](https://xlinux.nist.gov/dads/HTML/dynamicprog.html) (online) — Check how overlapping subproblems and stored results change the work.

**Use the documentation (optional):** What does memoization retain, and how can it change repeated recursive work?

<details><summary>Compare your answer</summary>

It retains results for previously solved states. Reusing those results avoids recomputing overlapping subproblems; the state definition and dependency structure still determine correctness and space use.

</details>

Native source: `native/examples/strategies-3.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=strategies-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 15.4 One-dimensional and two-dimensional state

A state must retain every fact needed by future choices. Different questions can need different dimensions even when their input looks similar.

For obstacle-free grid paths moving right or down, ways[r][c] depends on the cell above and the cell to the left. Boundary cells have one path. A full table uses O(RC) space; retaining just one row uses O(C) because the overwritten entry still represents the previous row until updated. Use bounded sizes or checked arithmetic to avoid path-count overflow.

### Two predecessor cells feed one result

For the unchanged 3×3 grid, the last cell receives three paths from each predecessor.

In a three-by-three grid indexed from zero, ways[1][2] is three and is immediately above ways[2][2]. ways[2][1] is three and is immediately to its left. Their arrows converge on ways[2][2], whose value is six. A final down move comes from the upper cell; a final right move comes from the left cell. These two last-move cases are distinct.

Only right and down moves are allowed; the original grid has no obstacles. Blocking a cell changes these counts.

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
  unsigned ways[3][3];
  for (size_t r = 0; r < 3; ++r)
    for (size_t col = 0; col < 3; ++col)
      ways[r][col] =
          (r == 0 || col == 0) ? 1 : ways[r - 1][col] + ways[r][col - 1];
  for (size_t r = 0; r < 3; ++r)
    printf("%u %u %u\n", ways[r][0], ways[r][1], ways[r][2]);
  return 0;
}
```

Output:

```text
1 1 1
1 2 3
1 3 6
```

The printed bottom-right 6 counts paths whose last move is either down from above or right from the left. The figure connects those two predecessor cells.

**Watch for:** Reducing space without preserving dependency order can accidentally reuse the current row instead of the previous row.

**Check:** Which earlier cells determine an interior cell?

1. Every cell in the grid
2. The cell above and the cell to the left

<details><summary>Answer</summary>

The cell above and the cell to the left. Every valid final move enters from one of those two predecessors.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/strategies/4). In main.c, place (r == 1 && col == 1) ? 0 : before the existing conditional expression assigned to ways[r][col]. Run code and compare its center and lower-right values. Which paths stop contributing when the center is blocked?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [NIST DADS: dynamic programming](https://xlinux.nist.gov/dads/HTML/dynamicprog.html) (online) — Check how overlapping subproblems and stored results change the work.
- [C reference: free](https://en.cppreference.com/w/c/memory/free.html) (online) — Check valid pointer arguments and access after deallocation.

Native source: `native/examples/strategies-4.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=strategies-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 15.5 Coin change, grid paths, and knapsack

For 0/1 knapsack, each item may be used at most once. Update order determines whether an item is accidentally reused.

Let best[w] be the best value attainable within capacity w. For each item, visit capacities downward so best[w−weight] still refers to the solution before this item. Updating upward would solve an unbounded-use variant instead. With N items and integer capacity W, the table takes O(NW) time: this is pseudo-polynomial in numeric capacity, not polynomial in its bit length.

### Update direction controls item reuse

One item of weight two and value three can contribute at most once in the 0/1 problem.

Consider only the first item, with weight two and value three; every best cell initially holds zero. Descending capacities visit four before two: best[4] reads the old best[2] of zero and becomes three, then best[2] becomes three. Ascending capacities visit two first: best[2] becomes three, then best[4] reads that changed cell and becomes six. Six counts the same item twice, so it belongs to an unbounded-use variant.

This isolates the first item of the fixture. Capacities count weight units; best values count value units. Upward updates solve a different, reusable-item problem.

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
  int weight[] = {2, 3, 4}, value[] = {3, 4, 5}, best[6] = {0};
  for (size_t i = 0; i < 3; ++i)
    for (int w = 5; w >= weight[i]; --w)
      if (best[w - weight[i]] + value[i] > best[w])
        best[w] = best[w - weight[i]] + value[i];
  printf("capacity5=%d\n", best[5]);
  return 0;
}
```

Output:

```text
capacity5=7
```

Choosing weights two and three gives value seven. Each item contributes at most once because capacities descend.

**Watch for:** A one-dimensional table can silently change the problem if its iteration order changes.

**Check:** Why iterate capacities downward?

1. To avoid reusing the current item
2. To make every knapsack instance greedy

<details><summary>Answer</summary>

To avoid reusing the current item. The source state must exclude the current item for 0/1 semantics.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/strategies/5). In main.c, replace the final item value 5 with 9. Run code and compare capacity5=. Which item can now beat the combination of weights 2 and 3, even though it leaves unused capacity?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [NIST DADS: dynamic programming](https://xlinux.nist.gov/dads/HTML/dynamicprog.html) (online) — Check how overlapping subproblems and stored results change the work.

Native source: `native/examples/strategies-5.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=strategies-5 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## Build it yourself

Choose and justify a strategy for a small optimization problem.

1. Record predecessor choices to reconstruct the selected items, then verify the total weight and value.
2. Test capacity zero, an item too heavy to fit, and an item that would win only if reused.

### Check your work

- Check the selected item IDs, total weight, and total value against enumeration on small instances.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=strategies-5
```

Chapter workspace command: `make chapter CHAPTER=strategies`.

Generated from dist/part3.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/strategies
