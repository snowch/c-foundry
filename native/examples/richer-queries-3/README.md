# Explaining and measuring execution choices

Complete native example, ready to edit and run in Codespaces or locally.

## 43.3 Explaining and measuring execution choices

An optimized plan must first return the same logical result. Instrument matching units when comparing its work with a baseline.

The fixture joins three lookup keys against eight ordered IDs. The nested baseline compares every pair; the indexed path counts ordering comparisons plus its final equality checks. Its result count agrees with the baseline. These are comparison counts, not page reads or elapsed time; the index’s construction and maintenance costs are separate.

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
  int ids[] = {1, 2, 3, 4, 5, 6, 7, 8}, keys[] = {2, 4, 8};
  unsigned nested = 0, indexed = 0, a = 0, b = 0;
  for (size_t k = 0; k < 3; ++k) {
    for (size_t i = 0; i < 8; ++i) {
      ++nested;
      if (ids[i] == keys[k])
        ++a;
    }
    size_t lo = 0, hi = 8;
    while (lo < hi) {
      ++indexed;
      size_t mid = lo + (hi - lo) / 2;
      if (ids[mid] < keys[k])
        lo = mid + 1;
      else
        hi = mid;
    }
    if (lo < 8) {
      ++indexed;
      if (ids[lo] == keys[k])
        ++b;
    }
  }
  if (a != b)
    return 1;
  printf("nested=%u indexed=%u results=%u\n", nested, indexed, b);
  return 0;
}
```

Output:

```text
nested=24 indexed=13 results=3
```

Thirteen counted comparisons replace twenty-four in this fixture. Smaller or differently ordered workloads may have different tradeoffs.

**Watch for:** Mixing comparator calls in one plan with only successful matches in another produces an invalid comparison.

**Check:** What must match before comparing performance?

1. The query’s logical results
2. The chosen operator names

<details><summary>Answer</summary>

The query’s logical results. A faster plan that drops or duplicates rows is incorrect.

</details>

**Try:** Compare complete result multisets including duplicates, then add index-build cost and page-cache counters.

Run from the repository root:

```sh
make example EXAMPLE=richer-queries-3
```

