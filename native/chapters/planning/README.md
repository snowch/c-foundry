# Chapter 28: Choosing an execution plan

Part 6: Make the database faster and more reliable. Teaching baseline: C17.

Choose a correct access path first, then compare plans with an explicit cost model and measured logical work.

## Outcomes

- Distinguish estimates from actual row and page counters.
- Use selectivity and ordering requirements in plan choice.
- Expose an understandable EXPLAIN result.

## 28.1 Table scans versus index lookups

A scan reads the table’s pages; an index lookup navigates the index and then obtains matching rows. Neither access path is always cheaper.

The teaching estimate charges one unit per page, assumes a cold cache and one distinct data-page fetch per match, and adds three index levels. These assumptions intentionally simplify clustering and caching. Both paths must return identical logical rows under the same visibility rules; cost never permits an incorrect result.

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
  unsigned table_pages, index_levels, matches;
} Estimate;
unsigned index_cost(Estimate e) { return e.index_levels + e.matches; }
const char *choose(Estimate e) {
  return index_cost(e) < e.table_pages ? "index" : "scan";
}

int main(void) {
  Estimate narrow = {100, 3, 1}, wide = {100, 3, 98};
  printf("narrow=%s cost=%u wide=%s cost=%u\n", choose(narrow),
         index_cost(narrow), choose(wide), index_cost(wide));
  return 0;
}
```

Output:

```text
narrow=index cost=4 wide=scan cost=101
```

One match costs four estimated page reads through the index. Ninety-eight random matches cost 101, exceeding the hundred-page scan.

**Watch for:** Treating index lookup as free after O(log n) navigation ignores row fetches.

**Check:** Can an index be slower than a scan?

1. Yes, especially for many scattered matches
2. No, indexes always win

<details><summary>Answer</summary>

Yes, especially for many scattered matches. Lookup and row-fetch costs can exceed a sequential scan.

</details>

**Try:** Change cache and clustering assumptions and describe when the preferred plan changes.

Run from the repository root:

```sh
make example EXAMPLE=planning-1
```

## 28.2 Simple cost estimates and selectivity

Selectivity is the fraction of input rows expected to satisfy a predicate. Estimates need statistics and a workload model.

For 1,000 rows and ten expected matches, selectivity is one percent. Real data may be skewed or correlated, so a uniform estimate can be wrong. A planner should retain estimated counts and compare them with actual execution counters; statistics refresh and histograms improve estimates without changing query semantics.

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
  unsigned rows = 1000, matches = 10;
  printf("selectivity=%.2f expected_rows=%u\n", (double)matches / rows,
         matches);
  return 0;
}
```

Output:

```text
selectivity=0.01 expected_rows=10
```

The fraction is 0.01, not ten percent. This fixture provides the expected match count rather than deriving it from collected statistics.

**Watch for:** Multiplying selectivities as if predicates were independent can badly underestimate correlated conditions.

**Check:** What does selectivity describe?

1. The number of CPU cores
2. The fraction of rows passing a predicate

<details><summary>Answer</summary>

The fraction of rows passing a predicate. It is a cardinality estimate relative to the input size.

</details>

**Try:** Build a skewed score distribution and compare uniform estimates with observed matches.

Run from the repository root:

```sh
make example EXAMPLE=planning-2
```

## 28.3 Index-assisted filtering and ordering

An ordered index may satisfy filtering and ORDER BY together. Correctness still depends on matching the index’s key order and checking residual predicates.

The sorted key fixture uses a lower-bound search to start at the first key at least four, then emits ascending keys until the range’s exclusive upper bound. A limit permits stopping after enough qualifying results. A different sort direction, collation, or composite-key prefix may require a different path.

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
  int keys[] = {1, 2, 4, 6, 8, 10};
  size_t lo = 0, hi = 6;
  while (lo < hi) {
    size_t mid = lo + (hi - lo) / 2;
    if (keys[mid] < 4)
      lo = mid + 1;
    else
      hi = mid;
  }
  size_t emitted = 0;
  for (size_t i = lo; i < 6 && keys[i] < 9 && emitted < 2; ++i, ++emitted)
    printf("%d ", keys[i]);
  puts("");
  return 0;
}
```

Output:

```text
4 6
```

The lower bound starts at four and the limit stops after six, before scanning the remaining range.

**Watch for:** An index ordered by ID cannot automatically satisfy ORDER BY name.

**Check:** When may an ordered scan stop for a limit?

1. After enough qualifying rows are emitted in the requested order
2. After merely examining that many candidates

<details><summary>Answer</summary>

After enough qualifying rows are emitted in the requested order. Residual predicates can reject candidates before they count toward the limit.

</details>

**Try:** Add a residual predicate that rejects the first candidate and verify the limit still returns two qualifying rows.

Run from the repository root:

```sh
make example EXAMPLE=planning-3
```

## 28.4 Implementing EXPLAIN

EXPLAIN makes a planner’s assumptions and chosen operators visible. It should distinguish estimated work from actual execution statistics.

The fixture prints a chosen access path, estimated matches, and its simplified page cost. It does not run a query. An EXPLAIN ANALYZE-like mode would execute and attach measured counters; that distinction matters for statements with side effects. Keep plan output stable enough for tests while avoiding promises about exact real-world runtime.

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
  unsigned table_pages, index_levels, matches;
} Estimate;
unsigned index_cost(Estimate e) { return e.index_levels + e.matches; }
const char *choose(Estimate e) {
  return index_cost(e) < e.table_pages ? "index" : "scan";
}

int main(void) {
  Estimate e = {100, 3, 2};
  printf("PLAN %s estimated_matches=%u estimated_pages=%u\n", choose(e),
         e.matches,
         strcmp(choose(e), "index") == 0 ? index_cost(e) : e.table_pages);
  return 0;
}
```

Output:

```text
PLAN index estimated_matches=2 estimated_pages=5
```

The text exposes the two-match assumption and five-page cost calculation. No timing is inferred.

**Watch for:** A plan label without its important assumptions makes unexpected choices difficult to diagnose.

**Check:** Does this EXPLAIN fixture execute the query?

1. Yes
2. No

<details><summary>Answer</summary>

No. It reports the selected model; actual execution needs a separate explicit path.

</details>

**Try:** Represent plans with an enum and structured fields before rendering text, then snapshot-test the renderer.

Run from the repository root:

```sh
make example EXAMPLE=planning-4
```

## 28.5 Measuring page reads and comparisons

Measured counters should describe actual work at clearly defined boundaries. Separate cache hits, backing reads, comparisons, and emitted rows.

The small scan counts every candidate comparison and each match separately. A page-aware executor can increment a backing-read counter only when the pager performs I/O, rather than on every fetch call. Use these deterministic counters to compare plans before adding noisy wall-clock timing.

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
  int ids[] = {1, 2, 3, 4, 5, 6, 7, 8};
  unsigned comparisons = 0, emitted = 0;
  for (size_t i = 0; i < 8; ++i) {
    ++comparisons;
    if (ids[i] >= 7)
      ++emitted;
  }
  printf("comparisons=%u emitted=%u\n", comparisons, emitted);
  return 0;
}
```

Output:

```text
comparisons=8 emitted=2
```

The scan compares eight rows to emit two. An index can reduce comparisons while still incurring extra page navigation.

**Watch for:** Counting every cache fetch as a disk read obscures cache effectiveness.

**Check:** Should emitted rows and inspected rows share one counter?

1. No
2. Yes

<details><summary>Answer</summary>

No. They measure different work and may differ greatly under selective filters.

</details>

**Try:** Attach counters to scan and index baselines and assert equal results before comparing work.

Run from the repository root:

```sh
make example EXAMPLE=planning-5
```

## 28.6 Optional: nested-loop joins

A nested-loop join pairs each outer row with candidate inner rows and emits pairs that satisfy the join predicate.

The fixture joins two people with three orders by person ID, producing one row per matching order. A plain nested loop examines O(NM) candidate pairs. An index on the inner join key can reduce search work, while duplicate matches still need to be emitted. Define whether unmatched rows are dropped or retained; this example is an inner join.

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
  struct Person {
    int id;
    const char *name;
  } people[] = {{1, "Ada"}, {2, "Grace"}};
  struct Order {
    int person, total;
  } orders[] = {{2, 50}, {1, 20}, {1, 30}};
  unsigned pairs = 0;
  for (size_t i = 0; i < 2; ++i)
    for (size_t j = 0; j < 3; ++j) {
      ++pairs;
      if (people[i].id == orders[j].person)
        printf("%s %d\n", people[i].name, orders[j].total);
    }
  printf("pairs=%u\n", pairs);
  return 0;
}
```

Output:

```text
Ada 20
Ada 30
Grace 50
pairs=6
```

Ada matches two orders and Grace matches one. Six comparisons are performed regardless of the three output pairs.

**Watch for:** Returning only the first matching inner row changes a join into a lookup and loses duplicate matches.

**Check:** How many candidate pairs does this baseline examine?

1. Always N plus M
2. N times M

<details><summary>Answer</summary>

N times M. Every outer row scans all inner rows.

</details>

**Try:** Add an inner-key index and verify the same multiset of join rows, including duplicate keys.

Run from the repository root:

```sh
make example EXAMPLE=planning-6
```

## Build it yourself

Compare query plans using page reads and a simple cost model.

1. Choose a correct access path first, then compare plans with an explicit cost model and measured logical work.
2. Add an inner-key index and verify the same multiset of join rows, including duplicate keys.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=planning-6
```

Chapter workspace command: `make chapter CHAPTER=planning`.

Generated from dist/part6.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/planning
