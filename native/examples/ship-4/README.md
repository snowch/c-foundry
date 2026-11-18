# Benchmarks across growing datasets

Complete native example, ready to edit and run in Codespaces or locally.

## 30.4 Benchmarks across growing datasets

Benchmark across growing data while retaining correctness checks and separating setup from the measured operation.

Also editable and runnable inline in the browser course. Run the deterministic fixture here. Sanitizers, native timing measurements, and compiler comparisons use the native toolchain below.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/ship/4). In main.c, change n <= 32 to n <= 128. Run code. Compare rows= against absent_scan_comparisons= on every line and explain the pattern. The program counts loop iterations.

### References and help

- [NIST DADS: Big O](https://xlinux.nist.gov/dads/HTML/bigOnotation.html) — Read an asymptotic bound as a growth claim, not an exact operation count.
- [SQLite documentation: query planning](https://www.sqlite.org/queryplanner.html) — Compare scans, index lookups, sorting, and cost choices; TinyDB implements a smaller model.

Native source: `native/examples/ship-4/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=ship-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

