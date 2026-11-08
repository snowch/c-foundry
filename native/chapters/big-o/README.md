# Chapter 11: Correctness and Big O

Part 3: Learn to reason about algorithms. Teaching baseline: C17.

Count work on concrete inputs, prove what a loop preserves, and then describe growth. Separate a bound on a function from a stopwatch measurement.

## Outcomes

- Define input size and the operation being counted.
- State a growth bound with its case and assumptions.
- Use an invariant and a decreasing measure to justify correctness.

## 11.1 Input size and counting work

A count is meaningful only after choosing an input size and a unit of work. Start with comparisons in a linear search.

Here n is the number of initialized array elements, not their byte size. Each inspected element contributes one comparison with the target. Searching for an absent value examines the entire array. Instrument that operation directly; do not infer comparison counts from elapsed time, which also includes compilation, scheduling, and unrelated work.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

size_t scan(const int *a, size_t n, int target) {
  size_t comparisons = 0;
  for (size_t i = 0; i < n; ++i) {
    ++comparisons;
    if (a[i] == target)
      break;
  }
  return comparisons;
}

int main(void) {
  int a[] = {2, 4, 6, 8};
  printf("comparisons=%zu\n", scan(a, 4, 7));
  return 0;
}
```

Output:

```text
comparisons=4
```

The target 7 is absent. The loop tests all four elements, so the counter reaches 4. No read occurs at index 4.

**Watch for:** A loop may do several different operations per iteration. State which one you count.

**Check:** What is n in this example?

1. The four initialized elements
2. The number of bytes in the executable

<details><summary>Answer</summary>

The four initialized elements. The search problem grows with the number of candidate elements.

</details>

**Try:** Add four larger values, keep the target absent, and predict the count before running.

Run from the repository root:

```sh
make example EXAMPLE=big-o-1
```

## 11.2 O, Θ, and Ω notation

Big O bounds growth from above; Ω bounds it from below; Θ gives both bounds up to constant factors beyond a threshold.

For the count f(n)=3n+2, all n≥1 satisfy 3n≤f(n)≤5n, so f is Θ(n). It is also O(n²), but that upper bound is less informative. Big O is not a synonym for worst case: first choose the function, such as the worst-case comparison count, then bound that function.

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
  for (size_t n = 1; n <= 4; n *= 2)
    printf("n=%zu count=%zu upper=%zu\n", n, 3 * n + 2, 5 * n);
  return 0;
}
```

Output:

```text
n=1 count=5 upper=5
n=2 count=8 upper=10
n=4 count=14 upper=20
```

The printed values illustrate the inequality; the algebra proves it for every n≥1. A finite sample alone cannot establish an asymptotic statement.

**Watch for:** O(n) does not mean exactly n operations or a fixed number of milliseconds.

**Check:** Which is the tight growth class of 3n+2?

1. Θ(n²)
2. Θ(n)

<details><summary>Answer</summary>

Θ(n). Both a constant-times-n upper and lower bound exist.

</details>

**Try:** Check the inequality for n=8, then write down why it holds for every n≥1.

Run from the repository root:

```sh
make example EXAMPLE=big-o-2
```

## 11.3 Constant, logarithmic, linear, linearithmic, and quadratic growth

Compare how common growth functions respond when the input doubles. Logarithms describe repeated halving, not a particular machine instruction.

The example uses powers of two so repeated integer halving counts log₂ n exactly. A nested all-pairs loop performs n² visits; a linearithmic merge-sort bound combines log₂ n levels with O(n) work per level. These expressions are growth models with different units, not measured execution times.

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
  for (size_t n = 4; n <= 8; n *= 2) {
    size_t levels = 0;
    for (size_t m = n; m > 1; m /= 2)
      ++levels;
    printf("n=%zu constant=1 log=%zu linear=%zu nlog=%zu square=%zu\n", n,
           levels, n, n * levels, n * n);
  }
  return 0;
}
```

Output:

```text
n=4 constant=1 log=2 linear=4 nlog=8 square=16
n=8 constant=1 log=3 linear=8 nlog=24 square=64
```

Doubling n adds one halving level, doubles the linear count, and quadruples the square. The n log n value grows by a factor of three in this small example.

**Watch for:** A logarithmic algorithm still needs its preconditions; binary search needs sorted, indexable data.

**Check:** What happens to n² when n doubles?

1. It becomes four times as large
2. It becomes twice as large

<details><summary>Answer</summary>

It becomes four times as large. (2n)² equals 4n².

</details>

**Try:** Extend the table to 16 and compare the ratios rather than the absolute numbers.

Run from the repository root:

```sh
make example EXAMPLE=big-o-3
```

## 11.4 Best, average, and worst cases

The same algorithm can do different amounts of work for different inputs of the same size. Name the case before quoting a bound.

Linear search finds the first element with one comparison, the last with n, and an absent target with n. Under a uniform distribution over present positions, its average count is (n+1)/2. That distribution is an assumption; real query workloads need not be uniform.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

size_t scan(const int *a, size_t n, int target) {
  size_t comparisons = 0;
  for (size_t i = 0; i < n; ++i) {
    ++comparisons;
    if (a[i] == target)
      break;
  }
  return comparisons;
}

int main(void) {
  int a[] = {2, 4, 6, 8};
  printf("first=%zu last=%zu absent=%zu\n", scan(a, 4, 2), scan(a, 4, 8),
         scan(a, 4, 7));
  return 0;
}
```

Output:

```text
first=1 last=4 absent=4
```

All three arrays have size four. Only target placement changes, producing counts 1, 4, and 4. The best-case count is Θ(1); the worst case is Θ(n).

**Watch for:** A successful benchmark on first-position hits does not measure the worst case.

**Check:** Does average-case analysis require an input distribution?

1. No
2. Yes

<details><summary>Answer</summary>

Yes. An expectation is defined relative to probabilities over inputs.

</details>

**Try:** Count all four successful target positions and calculate their mean.

Run from the repository root:

```sh
make example EXAMPLE=big-o-4
```

## 11.5 Time, auxiliary space, and amortized analysis

Time and auxiliary space answer different questions. Amortized analysis bounds the total cost of an operation sequence without assuming random inputs.

An array that doubles capacity copies 1+2+4+… elements across growth boundaries. Up to N appends, the total copies are less than 2N, so copying contributes O(1) amortized work per append although an individual resize costs Θ(n). The buffer uses O(n) capacity; temporary realloc implementation details are outside this counting model.

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
  size_t cap = 0, moves = 0;
  for (size_t length = 0; length < 8; ++length) {
    if (length == cap) {
      moves += length;
      cap = cap ? cap * 2 : 1;
    }
  }
  printf("appends=8 copied=%zu capacity=%zu\n", moves, cap);
  return 0;
}
```

Output:

```text
appends=8 copied=7 capacity=8
```

Growing from capacities 1 to 2, 4, and 8 copies 1+2+4=7 elements in this abstract model. No allocation is attempted here; the example isolates the accounting argument.

**Watch for:** Amortized O(1) is neither worst-case O(1) for each append nor an average over random inputs.

**Check:** Can one append still cost Θ(n)?

1. Yes, when it grows the buffer
2. No, amortized means every call is constant

<details><summary>Answer</summary>

Yes, when it grows the buffer. The total sequence bound permits occasional expensive operations.

</details>

**Try:** Continue to nine appends and predict the new total copying cost.

Run from the repository root:

```sh
make example EXAMPLE=big-o-5
```

## 11.6 Loop invariants and correctness arguments

A loop invariant states what is true at a chosen point in every iteration. Prove initialization, preservation, and the result at termination.

Before iteration i, sum equals the sum of a[0..i), and 0≤i≤n. It holds initially with an empty prefix. Adding a[i] and incrementing i preserves it. The measure n−i decreases, so the loop terminates; at i=n, the invariant gives the required total. Values are small here so the int sum is representable.

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
  int a[] = {3, 1, 4}, sum = 0;
  for (size_t i = 0; i < 3; ++i) {
    printf("before i=%zu sum=%d\n", i, sum);
    sum += a[i];
  }
  printf("total=%d\n", sum);
  return 0;
}
```

Output:

```text
before i=0 sum=0
before i=1 sum=3
before i=2 sum=4
total=8
```

Each line shows the invariant before the write. The final sum 8 follows from including exactly the three initialized elements.

**Watch for:** A statement that holds only after the loop is a postcondition, not enough to explain preservation.

**Check:** What does sum represent before iteration i?

1. The entire array
2. The prefix a[0..i)

<details><summary>Answer</summary>

The prefix a[0..i). The next unread element is a[i], so it cannot already be included.

</details>

**Try:** Add an assertion for the invariant using a separately computed prefix in this small example.

Run from the repository root:

```sh
make example EXAMPLE=big-o-6
```

## 11.7 Predict growth before measuring it

Make a falsifiable prediction before collecting measurements. Use a workload that matches the case you are analyzing.

For an absent key, doubling a linear-search array from four to eight elements should double comparisons. Count those inspections first; time a much larger repeated workload only after checking correctness. Keep setup, output, and compiler startup outside the measured region, and retain raw observations rather than claiming a universal hardware-independent speedup.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

size_t scan(const int *a, size_t n, int target) {
  size_t comparisons = 0;
  for (size_t i = 0; i < n; ++i) {
    ++comparisons;
    if (a[i] == target)
      break;
  }
  return comparisons;
}

int main(void) {
  int a[] = {1, 2, 3, 4, 5, 6, 7, 8};
  size_t small = scan(a, 4, 99), large = scan(a, 8, 99);
  printf("small=%zu large=%zu ratio=%zu\n", small, large, large / small);
  return 0;
}
```

Output:

```text
small=4 large=8 ratio=2
```

The model predicts 4 and 8 comparisons, and the instrumented implementation confirms it for these inputs. This is a check of the implementation against the model, not a proof from two data points.

**Watch for:** Benchmarking a different target distribution changes the question being answered.

**Check:** Which should come before timing?

1. Correctness checks and a stated workload
2. Choosing the fastest-looking result

<details><summary>Answer</summary>

Correctness checks and a stated workload. A fast incorrect program is not an implementation of the required algorithm.

</details>

**Try:** Use the Big O explorer, then compare absent-key linear and binary search counts on powers of two.

Run from the repository root:

```sh
make example EXAMPLE=big-o-7
```

## Build it yourself

Compare counted search operations, then explain how doubling the input changes the work.

1. Count work on concrete inputs, prove what a loop preserves, and then describe growth. Separate a bound on a function from a stopwatch measurement.
2. Use the Big O explorer, then compare absent-key linear and binary search counts on powers of two.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=big-o-7
```

Chapter workspace command: `make chapter CHAPTER=big-o`.

Generated from dist/part3.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/big-o
