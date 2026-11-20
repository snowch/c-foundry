# Chapter 13: Sorting

Part 3: Learn to reason about algorithms. Teaching baseline: C17.

Compare algorithms by their invariants, movement, stability, and sensitivity to input order.

## Outcomes

- Maintain sorted regions without losing values.
- Compare O(n²), O(n log n), and pivot-dependent behavior.
- Use callbacks and auxiliary storage safely.

## 13.1 Selection sort and insertion sort

Selection sort chooses the smallest remaining element. Insertion sort places the next element into an already sorted prefix.

Before insertion iteration i, a[0..i) is sorted and contains the original prefix values. Shift larger values right, then fill the resulting gap. Using > rather than ≥ preserves equal-element order. Selection sort always scans the remaining suffix; insertion sort can exploit already sorted input. Both have quadratic worst-case time and constant auxiliary storage.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void show(const int *a, size_t n) {
  for (size_t i = 0; i < n; ++i)
    printf("%s%d", i ? " " : "", a[i]);
  puts("");
}
size_t insertion(int *a, size_t n) {
  size_t moves = 0;
  for (size_t i = 1; i < n; ++i) {
    int x = a[i];
    size_t j = i;
    while (j && a[j - 1] > x) {
      a[j] = a[j - 1];
      --j;
      ++moves;
    }
    a[j] = x;
  }
  return moves;
}
void selection(int *a, size_t n) {
  for (size_t i = 0; i < n; ++i) {
    size_t least = i;
    for (size_t j = i + 1; j < n; ++j)
      if (a[j] < a[least])
        least = j;
    int t = a[i];
    a[i] = a[least];
    a[least] = t;
  }
}
int compare_int(const void *x, const void *y) {
  int a = *(const int *)x, b = *(const int *)y;
  return (a > b) - (a < b);
}

int main(void) {
  int a[] = {4, 1, 3, 2}, b[] = {4, 1, 3, 2};
  selection(a, 4);
  insertion(b, 4);
  show(a, 4);
  show(b, 4);
  return 0;
}
```

Output:

```text
1 2 3 4
1 2 3 4
```

The two methods produce the same ordered multiset through different operations. A matching result alone does not establish the algorithm or its cost.

**Watch for:** Shifting without saving the insertion value first destroys information.

**Check:** Which region is sorted before insertion iteration i?

1. a[0..i)
2. a[i..n)

<details><summary>Answer</summary>

a[0..i). The next value at i has not yet been inserted.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/sorting/1). In main.c, set a to {1, 2, 3, 4} and b to {4, 3, 2, 1}. Run code and compare the two output rows. Does the identical final ordering establish that both algorithms made the same number of moves?

### References and help

- [NIST DADS: sorting](https://xlinux.nist.gov/dads/HTML/sort.html) — Compare ordering, stability, and algorithm families with the course models.

Native source: `native/examples/sorting-1.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=sorting-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 13.2 Merge sort

Merge sort sorts two halves and combines them by consuming their smallest remaining values.

During merging, the output prefix is sorted and contains exactly the consumed inputs. Selecting the left element on equality makes this merge stable. Each level handles O(n) values and there are O(log n) levels, giving Θ(n log n) time. This implementation borrows an n-element temporary array and uses O(log n) call-stack depth.

### Merge consumes the smaller next value

Two sorted inputs can be combined into one sorted output.

The left input is 2, 7 and the right input is 3, 9. Compare their current first unconsumed values. Take 2, then 3, then 7, then the remaining 9. The output prefix stays sorted. On equality, choosing the left input first preserves relative order in a stable merge.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void show(const int *a, size_t n) {
  for (size_t i = 0; i < n; ++i)
    printf("%s%d", i ? " " : "", a[i]);
  puts("");
}
size_t insertion(int *a, size_t n) {
  size_t moves = 0;
  for (size_t i = 1; i < n; ++i) {
    int x = a[i];
    size_t j = i;
    while (j && a[j - 1] > x) {
      a[j] = a[j - 1];
      --j;
      ++moves;
    }
    a[j] = x;
  }
  return moves;
}
void selection(int *a, size_t n) {
  for (size_t i = 0; i < n; ++i) {
    size_t least = i;
    for (size_t j = i + 1; j < n; ++j)
      if (a[j] < a[least])
        least = j;
    int t = a[i];
    a[i] = a[least];
    a[least] = t;
  }
}
int compare_int(const void *x, const void *y) {
  int a = *(const int *)x, b = *(const int *)y;
  return (a > b) - (a < b);
}
void merge_sort(int *a, int *tmp, size_t n) {
  if (n < 2)
    return;
  size_t m = n / 2;
  merge_sort(a, tmp, m);
  merge_sort(a + m, tmp + m, n - m);
  size_t i = 0, j = m, k = 0;
  while (i < m && j < n)
    tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];
  while (i < m)
    tmp[k++] = a[i++];
  while (j < n)
    tmp[k++] = a[j++];
  for (k = 0; k < n; ++k)
    a[k] = tmp[k];
}

int main(void) {
  int a[] = {5, 1, 4, 1, 3}, tmp[5];
  merge_sort(a, tmp, 5);
  show(a, 5);
  return 0;
}
```

Output:

```text
1 1 3 4 5
```

Both duplicates survive. Each recursive subproblem has fewer elements and the n<2 base case ends recursion.

**Watch for:** Do not allocate an n-element temporary array at every recursive level when one reusable buffer suffices.

**Check:** What extra array space does this merge sort use?

1. O(1)
2. O(n)

<details><summary>Answer</summary>

O(n). The merge buffer has one slot per input element.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/sorting/2). In main.c, change the first 5 in a to a second 4. Run code. Count the repeated 1 and 4 values in Console and compare with the input. What additional tags would let you inspect stability?

### References and help

- [NIST DADS: sorting](https://xlinux.nist.gov/dads/HTML/sort.html) — Compare ordering, stability, and algorithm families with the course models.

Native source: `native/examples/sorting-2.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=sorting-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 13.3 Quicksort and pivot selection

A partition places one pivot in its final position and divides the remaining values into smaller subproblems.

The example uses the last value as pivot, keeping values smaller than it before boundary. After partitioning, the pivot is excluded from both recursive calls. Balanced partitions give O(n log n) work; persistently one-sided partitions give Θ(n²) work and Θ(n) stack depth. Randomization can improve expected behavior but does not eliminate the worst case.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void show(const int *a, size_t n) {
  for (size_t i = 0; i < n; ++i)
    printf("%s%d", i ? " " : "", a[i]);
  puts("");
}
size_t insertion(int *a, size_t n) {
  size_t moves = 0;
  for (size_t i = 1; i < n; ++i) {
    int x = a[i];
    size_t j = i;
    while (j && a[j - 1] > x) {
      a[j] = a[j - 1];
      --j;
      ++moves;
    }
    a[j] = x;
  }
  return moves;
}
void selection(int *a, size_t n) {
  for (size_t i = 0; i < n; ++i) {
    size_t least = i;
    for (size_t j = i + 1; j < n; ++j)
      if (a[j] < a[least])
        least = j;
    int t = a[i];
    a[i] = a[least];
    a[least] = t;
  }
}
int compare_int(const void *x, const void *y) {
  int a = *(const int *)x, b = *(const int *)y;
  return (a > b) - (a < b);
}
void quick(int *a, size_t n) {
  if (n < 2)
    return;
  int pivot = a[n - 1];
  size_t boundary = 0;
  for (size_t j = 0; j + 1 < n; ++j)
    if (a[j] < pivot) {
      int t = a[j];
      a[j] = a[boundary];
      a[boundary++] = t;
    }
  a[n - 1] = a[boundary];
  a[boundary] = pivot;
  quick(a, boundary);
  quick(a + boundary + 1, n - boundary - 1);
}

int main(void) {
  int a[] = {5, 2, 4, 1, 3};
  quick(a, 5);
  show(a, 5);
  return 0;
}
```

Output:

```text
1 2 3 4 5
```

The first pivot is 3. Its partition leaves two values on each side; later calls sort those regions.

**Watch for:** This simple partition degenerates on many equal keys. Three-way partitioning is one useful improvement.

**Check:** Does choosing the final element guarantee balanced partitions?

1. No
2. Yes

<details><summary>Answer</summary>

No. Sorted input repeatedly selects an extreme pivot in this version.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/sorting/3). In main.c, change a to {5, 5, 5, 1, 1}. Run code and compare the sorted sequence with this input. Why is sorting all equal-key entries still required even when the partition cannot separate them by value?

### References and help

- [NIST DADS: sorting](https://xlinux.nist.gov/dads/HTML/sort.html) — Compare ordering, stability, and algorithm families with the course models.

Native source: `native/examples/sorting-3.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=sorting-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 13.4 Stability, in-place algorithms, and memory costs

Stable means equal keys retain their relative order. In-place describes auxiliary storage; these are independent properties.

Sort records by key while keeping a distinguishing tag. The strict comparison in insertion sort moves only larger keys, preserving equal-key order. A common selection-sort swap can reverse equal records even when the final keys are sorted. Always specify whether stack storage is included when describing an algorithm as in-place.

### Merge consumes the smaller next value

Two sorted inputs can be combined into one sorted output.

The left input is 2, 7 and the right input is 3, 9. Compare their current first unconsumed values. Take 2, then 3, then 7, then the remaining 9. The output prefix stays sorted. On equality, choosing the left input first preserves relative order in a stable merge.

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
  struct Item {
    int key;
    char tag;
  } a[] = {{2, 'A'}, {1, 'B'}, {2, 'C'}};
  for (size_t i = 1; i < 3; ++i) {
    struct Item x = a[i];
    size_t j = i;
    while (j && a[j - 1].key > x.key) {
      a[j] = a[j - 1];
      --j;
    }
    a[j] = x;
  }
  for (size_t i = 0; i < 3; ++i)
    printf("%d%c%s", a[i].key, a[i].tag, i == 2 ? "\n" : " ");
  return 0;
}
```

Output:

```text
1B 2A 2C
```

The equal-key records A and C remain in their original order. The tag makes stability observable.

**Watch for:** Sorted keys alone cannot reveal whether a sort is stable.

**Check:** What must remain ordered for a stable sort?

1. Every record’s original array index
2. The original order among equal keys

<details><summary>Answer</summary>

The original order among equal keys. Different keys must move; equal-key relative order is the preserved relation.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/sorting/4). In main.c, change a[j - 1].key > x.key to a[j - 1].key >= x.key. Run code and compare the positions of 2A and 2C. Did the keys become unordered, or did equal-key order change?

### References and help

- [NIST DADS: sorting](https://xlinux.nist.gov/dads/HTML/sort.html) — Compare ordering, stability, and algorithm families with the course models.

Native source: `native/examples/sorting-4.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=sorting-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 13.5 Using qsort safely

qsort accepts an ordering callback and an element size; neither is inferred from the array at runtime.

The callback receives pointers to elements and returns a negative, zero, or positive value. Subtracting two arbitrary ints can overflow, so compare relationally. The standard does not promise stability or a particular algorithm for qsort. Pass sizeof a[0] and the actual initialized element count.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void show(const int *a, size_t n) {
  for (size_t i = 0; i < n; ++i)
    printf("%s%d", i ? " " : "", a[i]);
  puts("");
}
size_t insertion(int *a, size_t n) {
  size_t moves = 0;
  for (size_t i = 1; i < n; ++i) {
    int x = a[i];
    size_t j = i;
    while (j && a[j - 1] > x) {
      a[j] = a[j - 1];
      --j;
      ++moves;
    }
    a[j] = x;
  }
  return moves;
}
void selection(int *a, size_t n) {
  for (size_t i = 0; i < n; ++i) {
    size_t least = i;
    for (size_t j = i + 1; j < n; ++j)
      if (a[j] < a[least])
        least = j;
    int t = a[i];
    a[i] = a[least];
    a[least] = t;
  }
}
int compare_int(const void *x, const void *y) {
  int a = *(const int *)x, b = *(const int *)y;
  return (a > b) - (a < b);
}

int main(void) {
  int a[] = {INT_MAX, -7, 0, INT_MIN};
  qsort(a, 4, sizeof a[0], compare_int);
  printf("ordered=%d extremes=%d\n",
         a[0] <= a[1] && a[1] <= a[2] && a[2] <= a[3],
         a[0] == INT_MIN && a[3] == INT_MAX);
  return 0;
}
```

Output:

```text
ordered=1 extremes=1
```

The test checks ordering and both extreme values without assuming that int is exactly 32 bits.

**Watch for:** Casting an incompatible callback type does not make the function call valid.

**Check:** Why avoid returning a-b for arbitrary int keys?

1. Signed subtraction can overflow
2. qsort requires a Boolean return value

<details><summary>Answer</summary>

Signed subtraction can overflow. Only the sign is needed, and relational comparisons avoid the overflow.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/sorting/5). In main.c, change -7 to INT_MIN in a. Run code and compare ordered= and extremes=. Which comparisons show that the comparator also handles a duplicate extreme value?

### References and help

- [C reference: qsort](https://en.cppreference.com/w/c/algorithm/qsort.html) — Check comparator results, element widths, and the absence of a stability guarantee.
- [NIST DADS: sorting](https://xlinux.nist.gov/dads/HTML/sort.html) — Compare ordering, stability, and algorithm families with the course models.

**Use the documentation (optional):** What signs must a qsort comparator return, and does qsort promise stable ordering of equal elements?

<details><summary>Compare your answer</summary>

Return a negative value, zero, or a positive value for less than, equivalent, or greater than. qsort does not promise stability. Avoid subtraction that can overflow in a comparator.

</details>

Native source: `native/examples/sorting-5.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=sorting-5 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 13.6 Comparisons, moves, and input order

Comparisons and moves can respond differently to the same input. Instrument both when choosing an algorithm for a workload.

For insertion sort, sorted input causes no shifts; reversed distinct input causes n(n−1)/2 shifts. An assignment that writes the saved key back is not counted as a shift here. State that convention, keep output outside timing, and verify that every run preserves the multiset.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void show(const int *a, size_t n) {
  for (size_t i = 0; i < n; ++i)
    printf("%s%d", i ? " " : "", a[i]);
  puts("");
}
size_t insertion(int *a, size_t n) {
  size_t moves = 0;
  for (size_t i = 1; i < n; ++i) {
    int x = a[i];
    size_t j = i;
    while (j && a[j - 1] > x) {
      a[j] = a[j - 1];
      --j;
      ++moves;
    }
    a[j] = x;
  }
  return moves;
}
void selection(int *a, size_t n) {
  for (size_t i = 0; i < n; ++i) {
    size_t least = i;
    for (size_t j = i + 1; j < n; ++j)
      if (a[j] < a[least])
        least = j;
    int t = a[i];
    a[i] = a[least];
    a[least] = t;
  }
}
int compare_int(const void *x, const void *y) {
  int a = *(const int *)x, b = *(const int *)y;
  return (a > b) - (a < b);
}

int main(void) {
  int sorted[] = {1, 2, 3, 4}, reverse[] = {4, 3, 2, 1};
  printf("sorted shifts=%zu reverse shifts=%zu\n", insertion(sorted, 4),
         insertion(reverse, 4));
  return 0;
}
```

Output:

```text
sorted shifts=0 reverse shifts=6
```

The reversed input shifts 1+2+3 values. This illustrates an input-sensitive cost while keeping n fixed.

**Watch for:** A count labeled moves is ambiguous unless you define whether final placement and swaps count once or multiple times.

**Check:** What is being counted here?

1. Every executed C statement
2. Rightward shifts of existing elements

<details><summary>Answer</summary>

Rightward shifts of existing elements. The counter changes only inside the shift loop.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/sorting/6). In main.c, replace reverse[] = {4, 3, 2, 1} with reverse[] = {1, 3, 2, 4}. Run code. Compare reverse shifts= with the starter. Which out-of-order pair requires a move now?

### References and help

- [NIST DADS: sorting](https://xlinux.nist.gov/dads/HTML/sort.html) — Compare ordering, stability, and algorithm families with the course models.

Native source: `native/examples/sorting-6.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=sorting-6 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## Chapter practice

Edit `native/exercises/sort.c`, then run:

```sh
make exercise EXERCISE=sort
```

## Build it yourself

Implement and compare sorting algorithms on different input orders.

1. Compare algorithms by their invariants, movement, stability, and sensitivity to input order.
2. Build a comparison table for insertion and merge sort on four input orders, retaining correctness checks.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=sorting-6
```

Chapter workspace command: `make chapter CHAPTER=sorting`.

Generated from dist/part3.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/sorting
