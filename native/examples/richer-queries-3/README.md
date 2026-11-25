# Explaining and measuring execution choices

Complete Linux example, ready to edit and run in the browser terminal.

## 43.3 Explaining and measuring execution choices

An optimized plan must first return the same logical result. Instrument matching units when comparing its work with a baseline.

Also editable and runnable inline in the browser course.

The fixture joins three lookup keys against eight ordered IDs. The nested baseline compares every pair; the indexed path counts ordering comparisons plus its final equality checks. Its result count agrees with the baseline. Equal counts alone do not establish equal result rows; the chapter project checks those rows including duplicates. These are comparison counts, not page reads or elapsed time; the index’s construction and maintenance costs are separate.

### A query passes through distinct responsibilities

Parsing syntax is different from validating and executing it.

A SQL source string is tokenized and parsed into a statement representation. Validation checks supported operations and schema rules. Planning chooses a strategy such as a scan or index lookup. Execution performs that strategy and produces rows or an error. These boxes name responsibilities; small implementations can combine some stages.

A conceptual pipeline, not evidence that every SQL feature or optimizer transformation is implemented.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/richer-queries/3). In main.c, replace the last query key 8 with 9 and run. Compare nested=, indexed=, and results=. What correctness evidence comes before interpreting the modeled comparison counts?

**Extend the example:** An index also has a build cost. A larger experiment can separately count comparisons to build the index and answer queries on the same dataset.

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [SQLite documentation: EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html) (online) — Compare a plan explanation with measured execution work.
- [SQLite documentation: query planning](https://www.sqlite.org/queryplanner.html) (online) — Compare scans, index lookups, sorting, and cost choices; TinyDB implements a smaller model.

Native source: `native/examples/richer-queries-3/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=richer-queries-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

