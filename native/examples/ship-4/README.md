# Benchmarks across growing datasets

Complete native example, ready to edit and run in Codespaces or locally.

## 30.4 Benchmarks across growing datasets

Benchmark across growing data while retaining correctness checks and separating setup from the measured operation.

The deterministic fixture counts absent-key scan comparisons for two sizes. A native timing harness should create data before timing, use a monotonic clock where available, repeat sufficiently, and report distributions with compiler and machine details. The current eight-row table is a teaching bound, so larger benchmark datasets require an intentionally expanded storage implementation.

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
  for (size_t n = 8; n <= 32; n *= 4) {
    size_t comparisons = 0;
    for (size_t i = 0; i < n; ++i)
      ++comparisons;
    printf("rows=%zu absent_scan_comparisons=%zu\n", n, comparisons);
  }
  return 0;
}
```

Output:

```text
rows=8 absent_scan_comparisons=8
rows=32 absent_scan_comparisons=32
```

The count grows by the same factor as the input. This is an abstract scan loop, not a timing claim about disk or cache performance.

**Watch for:** Printing from the measured inner loop can dominate the operation you intended to measure.

**Check:** What should be excluded from a query-only timing region?

1. The actual query operation
2. Dataset construction and result formatting

<details><summary>Answer</summary>

Dataset construction and result formatting. Preparation and reporting answer different performance questions.

</details>

**Try:** Compare cold and warm page-cache runs with verified equal results and recorded environment details.

Run from the repository root:

```sh
make example EXAMPLE=ship-4
```

