# Better statistics and query planning

Complete Linux example, ready to edit and run in the browser terminal.

## 43.2 Better statistics and query planning

Better statistics model the distribution that predicates actually encounter. Histograms can represent skew that a uniform estimate misses.

Also editable and runnable inline in the browser course.

The histogram counts each stored score instead of assuming ten possible score values are equally frequent. The figure compares both estimates with the actual row counts. These statistics describe this snapshot of data; updates can make them stale, and independent single-column histograms still miss correlations between columns.

### Data frequency changes the match estimate

The same eight rows support very different estimates under uniform and observed frequencies.

There are eight score rows: seven have score one and one has score nine. A uniform model over ten possible score values predicts eight divided by ten, or zero point eight matches for either queried value. A histogram counted from the same rows predicts seven matches for score one and one match for score nine, equal to the actual counts in this fixture. The row total is eight in both cases.

The histogram is built from this fixed data. Later updates can make it stale, and single-column counts do not capture correlations between fields.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/richer-queries/2). In main.c, replace two of the seven 1s in scores with 9s and run. Compare uniform=, histogram=, and actual=. Which estimate can reflect the changed frequency of 1?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [SQLite documentation: query planning](https://www.sqlite.org/queryplanner.html) (online) — Compare scans, index lookups, sorting, and cost choices; TinyDB implements a smaller model.
- [SQLite C interface: prepared statements](https://www.sqlite.org/c3ref/prepare.html) (online) — Read preparation and statement lifecycle contracts; these are design comparisons, not TinyDB APIs.

Native source: `native/examples/richer-queries-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=richer-queries-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

