# Chapter 12: Searching

Part 3: Learn to reason about algorithms. Teaching baseline: C17.

Maintain explicit search intervals, handle absence and duplicates, and apply ordered search to records.

## Outcomes

- Implement linear and binary search with a precise absence result.
- Preserve a half-open interval invariant.
- Distinguish finding one match from finding a duplicate range.

## 12.1 Linear search

A linear search is a good baseline: inspect each initialized element until a match is found or the collection ends.

Return n to represent absence, avoiding an unsigned −1 convention. The caller must test the result before indexing. The first-match version works on unsorted input and uses O(1) extra space; its worst-case comparison count is Θ(n).

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
  int a[] = {8, 3, 8};
  size_t found = 3;
  for (size_t i = 0; i < 3; ++i)
    if (a[i] == 8) {
      found = i;
      break;
    }
  printf("first=%zu\n", found);
  return 0;
}
```

Output:

```text
first=0
```

Breaking after the first match preserves the API’s first-occurrence contract. The second 8 at index two is never inspected.

**Watch for:** Returning a plausible index without a distinct absence value can make an unsuccessful search look successful.

**Check:** Does linear search require sorted input?

1. No
2. Yes

<details><summary>Answer</summary>

No. It checks each candidate directly rather than discarding an ordered interval.

</details>

**Try:** Search for 99 and print missing when the returned index equals n.

Run from the repository root:

```sh
make example EXAMPLE=searching-1
```

## 12.2 Binary search and its sorted-input requirement

Binary search discards half of the remaining candidates using an ordering guarantee. Sorting is part of its contract.

Keep the candidates in [lo,hi), initially [0,n). The lower-bound helper returns the first position whose value is at least key, which may equal n. Convert that position to a membership result only after checking both the bound and equality. The interval shrinks on every iteration, with O(log n) worst-case comparisons and O(1) auxiliary space.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

size_t lower(const int *a, size_t n, int key) {
  size_t lo = 0, hi = n;
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (a[mid] < key)
      lo = mid + 1;
    else
      hi = mid;
  }
  return lo;
}
size_t upper(const int *a, size_t n, int key) {
  size_t lo = 0, hi = n;
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (a[mid] <= key)
      lo = mid + 1;
    else
      hi = mid;
  }
  return lo;
}

int main(void) {
  int a[] = {2, 4, 6, 8, 10};
  size_t i = lower(a, 5, 8);
  printf("position=%zu found=%d\n", i, i < 5 && a[i] == 8);
  return 0;
}
```

Output:

```text
position=3 found=1
```

At position three the value equals eight. The left operand of && prevents indexing when the returned position is n.

**Watch for:** Applying the same code to an unsorted array removes the argument that discarded values cannot match.

**Check:** Why can binary search discard a half?

1. The target is an integer
2. The array is sorted under the same ordering

<details><summary>Answer</summary>

The array is sorted under the same ordering. An ordering comparison constrains every element in the discarded region.

</details>

**Try:** Search for 1, 9, and 11 and explain every insertion position.

Run from the repository root:

```sh
make example EXAMPLE=searching-2
```

## 12.3 Inclusive versus half-open search intervals

Choose one interval convention and make every update agree with it. Half-open intervals represent empty input without an invalid n−1 index.

In [lo,hi), an empty interval has lo==hi. mid=lo+(hi−lo)/2 stays inside any nonempty interval and avoids adding two large endpoints. When a[mid] is too small, exclude it with lo=mid+1; otherwise keep mid as a possible lower bound with hi=mid. Never access a[hi] merely because hi is an endpoint.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

size_t lower(const int *a, size_t n, int key) {
  size_t lo = 0, hi = n;
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (a[mid] < key)
      lo = mid + 1;
    else
      hi = mid;
  }
  return lo;
}
size_t upper(const int *a, size_t n, int key) {
  size_t lo = 0, hi = n;
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (a[mid] <= key)
      lo = mid + 1;
    else
      hi = mid;
  }
  return lo;
}

int main(void) {
  printf("empty=%zu\n", lower(NULL, 0, 7));
  int a[] = {7};
  printf("before=%zu after=%zu\n", lower(a, 1, 6), lower(a, 1, 8));
  return 0;
}
```

Output:

```text
empty=0
before=0 after=1
```

The empty call never enters the loop or reads NULL. A one-element array has insertion positions zero and one.

**Watch for:** Mixing hi=n with an inclusive lo≤hi condition can read one past the array.

**Check:** What represents an empty half-open interval?

1. lo == hi
2. lo == hi + 1

<details><summary>Answer</summary>

lo == hi. The number of candidate positions is hi−lo.

</details>

**Try:** Trace lo, hi, and mid for a missing key in a two-element array.

Run from the repository root:

```sh
make example EXAMPLE=searching-3
```

## 12.4 Lower bounds, upper bounds, and duplicate values

Finding any matching element does not locate every duplicate. Use two boundary searches to describe the full matching range.

lower returns the first value ≥key; upper returns the first value >key. Their difference counts matches, and [lower,upper) is the duplicate range. Both searches use the same sorted input but differ in which equality case moves the left boundary. A missing key produces equal boundaries.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

size_t lower(const int *a, size_t n, int key) {
  size_t lo = 0, hi = n;
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (a[mid] < key)
      lo = mid + 1;
    else
      hi = mid;
  }
  return lo;
}
size_t upper(const int *a, size_t n, int key) {
  size_t lo = 0, hi = n;
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (a[mid] <= key)
      lo = mid + 1;
    else
      hi = mid;
  }
  return lo;
}

int main(void) {
  int a[] = {1, 3, 3, 3, 8};
  size_t lo = lower(a, 5, 3), hi = upper(a, 5, 3);
  printf("range=[%zu,%zu) count=%zu\n", lo, hi, hi - lo);
  return 0;
}
```

Output:

```text
range=[1,4) count=3
```

The three matching elements occupy indices one, two, and three. The upper endpoint four is not another matching element.

**Watch for:** A binary search that stops at the first equality cannot promise the first duplicate.

**Check:** How many values match in [lo,hi)?

1. hi - lo + 1
2. hi - lo

<details><summary>Answer</summary>

hi - lo. The endpoint hi is excluded.

</details>

**Try:** Test a value below all elements, above all elements, and an array containing only duplicates.

Run from the repository root:

```sh
make example EXAMPLE=searching-4
```

## 12.5 Searching a sorted record collection

Searching records uses an ordering key while returning a record or an explicit missing result. Keep the key order consistent with updates.

The table is sorted by ID, not by name. The search returns a position into caller-owned rows; its caller verifies equality before reading the record. Insertions must maintain the ID order or rebuild the index. A pointer into a growable table may be invalidated by relocation, so define how long a result may be retained.

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
  int id;
  const char *name;
} Row;
size_t find_id(const Row *rows, size_t n, int id) {
  size_t lo = 0, hi = n;
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (rows[mid].id < id)
      lo = mid + 1;
    else
      hi = mid;
  }
  return lo;
}

int main(void) {
  Row rows[] = {{2, "Ada"}, {5, "Grace"}, {9, "Linus"}};
  size_t i = find_id(rows, 3, 5);
  if (i < 3 && rows[i].id == 5)
    printf("%d %s\n", rows[i].id, rows[i].name);
  return 0;
}
```

Output:

```text
5 Grace
```

The key search selects index one and equality confirms the row before printing. The string is borrowed from a literal with static lifetime.

**Watch for:** Searching by one field in a table ordered by another field does not satisfy binary search’s precondition.

**Check:** Which order does this lookup require?

1. Ascending ID order
2. Alphabetical name order

<details><summary>Answer</summary>

Ascending ID order. Every comparison is against rows[mid].id.

</details>

**Try:** Insert an ID between 2 and 5 while preserving order, then implement find-or-missing cases.

Run from the repository root:

```sh
make example EXAMPLE=searching-5
```

## Chapter practice

Edit `native/exercises/search.c`, then run:

```sh
make exercise EXERCISE=search
```

## Build it yourself

Find records while maintaining a shrinking search interval.

1. Maintain explicit search intervals, handle absence and duplicates, and apply ordered search to records.
2. Insert an ID between 2 and 5 while preserving order, then implement find-or-missing cases.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=searching-5
```

Chapter workspace command: `make chapter CHAPTER=searching`.

Generated from dist/part3.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/searching
