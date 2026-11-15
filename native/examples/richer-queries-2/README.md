# Better statistics and query planning

Complete native example, ready to edit and run in Codespaces or locally.

## 43.2 Better statistics and query planning

Better statistics model the distribution that predicates actually encounter. Histograms can represent skew that a uniform estimate misses.

Also editable and runnable inline in the browser course. This is a bounded, single-threaded model. Run and change it here; use a native build for the full system and its host-specific guarantees.

The fixture has seven score-one rows and one score-nine row. A ten-value uniform model estimates 0.8 matches for score one, while a per-value histogram records seven. These statistics describe this snapshot of data; updates can make them stale, and independent single-column histograms still miss correlations between columns.

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
  unsigned scores[] = {1, 1, 1, 1, 1, 1, 1, 9}, histogram[10] = {0}, actual = 0;
  for (size_t i = 0; i < 8; ++i)
    ++histogram[scores[i]];
  for (size_t i = 0; i < 8; ++i)
    if (scores[i] == 1)
      ++actual;
  printf("uniform=%.2f histogram=%u actual=%u\n", 8.0 / 10.0, histogram[1],
         actual);
  return 0;
}
```

Output:

```text
uniform=0.80 histogram=7 actual=7
```

The histogram matches this known dataset’s count. Its accuracy does not eliminate the need to measure execution or refresh after changes.

**Watch for:** Collecting statistics may have its own cost and locking or snapshot requirements.

**Check:** Why is the uniform estimate poor here?

1. All tables always have ten equally likely values
2. The values are heavily skewed

<details><summary>Answer</summary>

The values are heavily skewed. The distribution assumption disagrees with the stored data.

</details>

**Try:** Collect a bounded histogram from a consistent snapshot and compare planner decisions before and after a skewed update workload.

### References and help

- [SQLite documentation: query planning](https://www.sqlite.org/queryplanner.html) — Compare scans, index lookups, sorting, and cost choices; TinyDB implements a smaller model.
- [SQLite C interface: prepared statements](https://www.sqlite.org/c3ref/prepare.html) — Read preparation and statement lifecycle contracts; these are design comparisons, not TinyDB APIs.

Run from the repository root:

```sh
make example EXAMPLE=richer-queries-2
```

