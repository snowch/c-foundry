window.PART_THREE = {
  "big-o": {
    "intro": "Count work on concrete inputs, prove what a loop preserves, and then describe growth. Separate a bound on a function from a stopwatch measurement.",
    "outcomes": [
      "Define input size and the operation being counted.",
      "State a growth bound with its case and assumptions.",
      "Use an invariant and a decreasing measure to justify correctness."
    ],
    "topics": {
      "1": {
        "intro": "A count is meaningful only after choosing an input size and a unit of work. Start with comparisons in a linear search.",
        "explanation": "Here n is the number of initialized array elements, not their byte size. Each inspected element contributes one comparison with the target. Searching for an absent value examines the entire array. Instrument that operation directly; do not infer comparison counts from elapsed time, which also includes compilation, scheduling, and unrelated work.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nsize_t scan(const int *a, size_t n, int target) {\n  size_t comparisons = 0;\n  for (size_t i = 0; i < n; ++i) {\n    ++comparisons;\n    if (a[i] == target)\n      break;\n  }\n  return comparisons;\n}\n\nint main(void) {\n  int a[] = {2, 4, 6, 8};\n  printf(\"comparisons=%zu\\n\", scan(a, 4, 7));\n  return 0;\n}\n",
        "expected": "comparisons=4",
        "walkthrough": "The target 7 is absent. The loop tests all four elements, so the counter reaches 4. No read occurs at index 4.",
        "pitfall": "A loop may do several different operations per iteration. State which one you count.",
        "question": "What is n in this example?",
        "choices": [
          "The four initialized elements",
          "The number of bytes in the executable"
        ],
        "answer": 0,
        "why": "The search problem grows with the number of candidate elements.",
        "tryit": "Add four larger values, keep the target absent, and predict the count before running.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "Big O bounds growth from above; Ω bounds it from below; Θ gives both bounds up to constant factors beyond a threshold.",
        "explanation": "For the count f(n)=3n+2, all n≥1 satisfy 3n≤f(n)≤5n, so f is Θ(n). It is also O(n²), but that upper bound is less informative. Big O is not a synonym for worst case: first choose the function, such as the worst-case comparison count, then bound that function.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  for (size_t n = 1; n <= 4; n *= 2)\n    printf(\"n=%zu count=%zu upper=%zu\\n\", n, 3 * n + 2, 5 * n);\n  return 0;\n}\n",
        "expected": "n=1 count=5 upper=5\nn=2 count=8 upper=10\nn=4 count=14 upper=20",
        "walkthrough": "The printed values illustrate the inequality; the algebra proves it for every n≥1. A finite sample alone cannot establish an asymptotic statement.",
        "pitfall": "O(n) does not mean exactly n operations or a fixed number of milliseconds.",
        "question": "Which is the tight growth class of 3n+2?",
        "choices": [
          "Θ(n²)",
          "Θ(n)"
        ],
        "answer": 1,
        "why": "Both a constant-times-n upper and lower bound exist.",
        "tryit": "Check the inequality for n=8, then write down why it holds for every n≥1.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "Compare how common growth functions respond when the input doubles. Logarithms describe repeated halving, not a particular machine instruction.",
        "explanation": "The example uses powers of two so repeated integer halving counts log₂ n exactly. A nested all-pairs loop performs n² visits; a linearithmic merge-sort bound combines log₂ n levels with O(n) work per level. These expressions are growth models with different units, not measured execution times.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  for (size_t n = 4; n <= 8; n *= 2) {\n    size_t levels = 0;\n    for (size_t m = n; m > 1; m /= 2)\n      ++levels;\n    printf(\"n=%zu constant=1 log=%zu linear=%zu nlog=%zu square=%zu\\n\", n,\n           levels, n, n * levels, n * n);\n  }\n  return 0;\n}\n",
        "expected": "n=4 constant=1 log=2 linear=4 nlog=8 square=16\nn=8 constant=1 log=3 linear=8 nlog=24 square=64",
        "walkthrough": "Doubling n adds one halving level, doubles the linear count, and quadruples the square. The n log n value grows by a factor of three in this small example.",
        "pitfall": "A logarithmic algorithm still needs its preconditions; binary search needs sorted, indexable data.",
        "question": "What happens to n² when n doubles?",
        "choices": [
          "It becomes four times as large",
          "It becomes twice as large"
        ],
        "answer": 0,
        "why": "(2n)² equals 4n².",
        "tryit": "Extend the table to 16 and compare the ratios rather than the absolute numbers.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "The same algorithm can do different amounts of work for different inputs of the same size. Name the case before quoting a bound.",
        "explanation": "Linear search finds the first element with one comparison, the last with n, and an absent target with n. Under a uniform distribution over present positions, its average count is (n+1)/2. That distribution is an assumption; real query workloads need not be uniform.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nsize_t scan(const int *a, size_t n, int target) {\n  size_t comparisons = 0;\n  for (size_t i = 0; i < n; ++i) {\n    ++comparisons;\n    if (a[i] == target)\n      break;\n  }\n  return comparisons;\n}\n\nint main(void) {\n  int a[] = {2, 4, 6, 8};\n  printf(\"first=%zu last=%zu absent=%zu\\n\", scan(a, 4, 2), scan(a, 4, 8),\n         scan(a, 4, 7));\n  return 0;\n}\n",
        "expected": "first=1 last=4 absent=4",
        "walkthrough": "All three arrays have size four. Only target placement changes, producing counts 1, 4, and 4. The best-case count is Θ(1); the worst case is Θ(n).",
        "pitfall": "A successful benchmark on first-position hits does not measure the worst case.",
        "question": "Does average-case analysis require an input distribution?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 1,
        "why": "An expectation is defined relative to probabilities over inputs.",
        "tryit": "Count all four successful target positions and calculate their mean.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "Time and auxiliary space answer different questions. Amortized analysis bounds the total cost of an operation sequence without assuming random inputs.",
        "explanation": "An array that doubles capacity copies 1+2+4+… elements across growth boundaries. Up to N appends, the total copies are less than 2N, so copying contributes O(1) amortized work per append although an individual resize costs Θ(n). The buffer uses O(n) capacity; temporary realloc implementation details are outside this counting model.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  size_t cap = 0, moves = 0;\n  for (size_t length = 0; length < 8; ++length) {\n    if (length == cap) {\n      moves += length;\n      cap = cap ? cap * 2 : 1;\n    }\n  }\n  printf(\"appends=8 copied=%zu capacity=%zu\\n\", moves, cap);\n  return 0;\n}\n",
        "expected": "appends=8 copied=7 capacity=8",
        "walkthrough": "Growing from capacities 1 to 2, 4, and 8 copies 1+2+4=7 elements in this abstract model. No allocation is attempted here; the example isolates the accounting argument.",
        "pitfall": "Amortized O(1) is neither worst-case O(1) for each append nor an average over random inputs.",
        "question": "Can one append still cost Θ(n)?",
        "choices": [
          "Yes, when it grows the buffer",
          "No, amortized means every call is constant"
        ],
        "answer": 0,
        "why": "The total sequence bound permits occasional expensive operations.",
        "tryit": "Continue to nine appends and predict the new total copying cost.",
        "input": "",
        "runtime": "browser"
      },
      "6": {
        "intro": "A loop invariant states what is true at a chosen point in every iteration. Prove initialization, preservation, and the result at termination.",
        "explanation": "Before iteration i, sum equals the sum of a[0..i), and 0≤i≤n. It holds initially with an empty prefix. Adding a[i] and incrementing i preserves it. The measure n−i decreases, so the loop terminates; at i=n, the invariant gives the required total. Values are small here so the int sum is representable.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  int a[] = {3, 1, 4}, sum = 0;\n  for (size_t i = 0; i < 3; ++i) {\n    printf(\"before i=%zu sum=%d\\n\", i, sum);\n    sum += a[i];\n  }\n  printf(\"total=%d\\n\", sum);\n  return 0;\n}\n",
        "expected": "before i=0 sum=0\nbefore i=1 sum=3\nbefore i=2 sum=4\ntotal=8",
        "walkthrough": "Each line shows the invariant before the write. The final sum 8 follows from including exactly the three initialized elements.",
        "pitfall": "A statement that holds only after the loop is a postcondition, not enough to explain preservation.",
        "question": "What does sum represent before iteration i?",
        "choices": [
          "The entire array",
          "The prefix a[0..i)"
        ],
        "answer": 1,
        "why": "The next unread element is a[i], so it cannot already be included.",
        "tryit": "Add an assertion for the invariant using a separately computed prefix in this small example.",
        "input": "",
        "runtime": "browser"
      },
      "7": {
        "intro": "Make a falsifiable prediction before collecting measurements. Use a workload that matches the case you are analyzing.",
        "explanation": "For an absent key, doubling a linear-search array from four to eight elements should double comparisons. Count those inspections first; time a much larger repeated workload only after checking correctness. Keep setup, output, and compiler startup outside the measured region, and retain raw observations rather than claiming a universal hardware-independent speedup.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nsize_t scan(const int *a, size_t n, int target) {\n  size_t comparisons = 0;\n  for (size_t i = 0; i < n; ++i) {\n    ++comparisons;\n    if (a[i] == target)\n      break;\n  }\n  return comparisons;\n}\n\nint main(void) {\n  int a[] = {1, 2, 3, 4, 5, 6, 7, 8};\n  size_t small = scan(a, 4, 99), large = scan(a, 8, 99);\n  printf(\"small=%zu large=%zu ratio=%zu\\n\", small, large, large / small);\n  return 0;\n}\n",
        "expected": "small=4 large=8 ratio=2",
        "walkthrough": "The model predicts 4 and 8 comparisons, and the instrumented implementation confirms it for these inputs. This is a check of the implementation against the model, not a proof from two data points.",
        "pitfall": "Benchmarking a different target distribution changes the question being answered.",
        "question": "Which should come before timing?",
        "choices": [
          "Correctness checks and a stated workload",
          "Choosing the fastest-looking result"
        ],
        "answer": 0,
        "why": "A fast incorrect program is not an implementation of the required algorithm.",
        "tryit": "Use the Big O explorer, then compare absent-key linear and binary search counts on powers of two.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practicePlan": {
      "goal": "Compare counted search operations, then explain how doubling the input changes the work.",
      "tasks": [
        "Count work on concrete inputs, prove what a loop preserves, and then describe growth. Separate a bound on a function from a stopwatch measurement.",
        "Use the Big O explorer, then compare absent-key linear and binary search counts on powers of two.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "big-o-7"
    }
  },
  "searching": {
    "intro": "Maintain explicit search intervals, handle absence and duplicates, and apply ordered search to records.",
    "outcomes": [
      "Implement linear and binary search with a precise absence result.",
      "Preserve a half-open interval invariant.",
      "Distinguish finding one match from finding a duplicate range."
    ],
    "topics": {
      "1": {
        "intro": "A linear search is a good baseline: inspect each initialized element until a match is found or the collection ends.",
        "explanation": "Return n to represent absence, avoiding an unsigned −1 convention. The caller must test the result before indexing. The first-match version works on unsorted input and uses O(1) extra space; its worst-case comparison count is Θ(n).",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  int a[] = {8, 3, 8};\n  size_t found = 3;\n  for (size_t i = 0; i < 3; ++i)\n    if (a[i] == 8) {\n      found = i;\n      break;\n    }\n  printf(\"first=%zu\\n\", found);\n  return 0;\n}\n",
        "expected": "first=0",
        "walkthrough": "Breaking after the first match preserves the API’s first-occurrence contract. The second 8 at index two is never inspected.",
        "pitfall": "Returning a plausible index without a distinct absence value can make an unsuccessful search look successful.",
        "question": "Does linear search require sorted input?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "It checks each candidate directly rather than discarding an ordered interval.",
        "tryit": "Search for 99 and print missing when the returned index equals n.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "Binary search discards half of the remaining candidates using an ordering guarantee. Sorting is part of its contract.",
        "explanation": "Keep the candidates in [lo,hi), initially [0,n). The lower-bound helper returns the first position whose value is at least key, which may equal n. Convert that position to a membership result only after checking both the bound and equality. The interval shrinks on every iteration, with O(log n) worst-case comparisons and O(1) auxiliary space.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nsize_t lower(const int *a, size_t n, int key) {\n  size_t lo = 0, hi = n;\n  while (lo < hi) {\n    size_t mid = lo + (hi - lo) / 2;\n    if (a[mid] < key)\n      lo = mid + 1;\n    else\n      hi = mid;\n  }\n  return lo;\n}\nsize_t upper(const int *a, size_t n, int key) {\n  size_t lo = 0, hi = n;\n  while (lo < hi) {\n    size_t mid = lo + (hi - lo) / 2;\n    if (a[mid] <= key)\n      lo = mid + 1;\n    else\n      hi = mid;\n  }\n  return lo;\n}\n\nint main(void) {\n  int a[] = {2, 4, 6, 8, 10};\n  size_t i = lower(a, 5, 8);\n  printf(\"position=%zu found=%d\\n\", i, i < 5 && a[i] == 8);\n  return 0;\n}\n",
        "expected": "position=3 found=1",
        "walkthrough": "At position three the value equals eight. The left operand of && prevents indexing when the returned position is n.",
        "pitfall": "Applying the same code to an unsorted array removes the argument that discarded values cannot match.",
        "question": "Why can binary search discard a half?",
        "choices": [
          "The target is an integer",
          "The array is sorted under the same ordering"
        ],
        "answer": 1,
        "why": "An ordering comparison constrains every element in the discarded region.",
        "tryit": "Search for 1, 9, and 11 and explain every insertion position.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "Choose one interval convention and make every update agree with it. Half-open intervals represent empty input without an invalid n−1 index.",
        "explanation": "In [lo,hi), an empty interval has lo==hi. mid=lo+(hi−lo)/2 stays inside any nonempty interval and avoids adding two large endpoints. When a[mid] is too small, exclude it with lo=mid+1; otherwise keep mid as a possible lower bound with hi=mid. Never access a[hi] merely because hi is an endpoint.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nsize_t lower(const int *a, size_t n, int key) {\n  size_t lo = 0, hi = n;\n  while (lo < hi) {\n    size_t mid = lo + (hi - lo) / 2;\n    if (a[mid] < key)\n      lo = mid + 1;\n    else\n      hi = mid;\n  }\n  return lo;\n}\nsize_t upper(const int *a, size_t n, int key) {\n  size_t lo = 0, hi = n;\n  while (lo < hi) {\n    size_t mid = lo + (hi - lo) / 2;\n    if (a[mid] <= key)\n      lo = mid + 1;\n    else\n      hi = mid;\n  }\n  return lo;\n}\n\nint main(void) {\n  printf(\"empty=%zu\\n\", lower(NULL, 0, 7));\n  int a[] = {7};\n  printf(\"before=%zu after=%zu\\n\", lower(a, 1, 6), lower(a, 1, 8));\n  return 0;\n}\n",
        "expected": "empty=0\nbefore=0 after=1",
        "walkthrough": "The empty call never enters the loop or reads NULL. A one-element array has insertion positions zero and one.",
        "pitfall": "Mixing hi=n with an inclusive lo≤hi condition can read one past the array.",
        "question": "What represents an empty half-open interval?",
        "choices": [
          "lo == hi",
          "lo == hi + 1"
        ],
        "answer": 0,
        "why": "The number of candidate positions is hi−lo.",
        "tryit": "Trace lo, hi, and mid for a missing key in a two-element array.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "Finding any matching element does not locate every duplicate. Use two boundary searches to describe the full matching range.",
        "explanation": "lower returns the first value ≥key; upper returns the first value >key. Their difference counts matches, and [lower,upper) is the duplicate range. Both searches use the same sorted input but differ in which equality case moves the left boundary. A missing key produces equal boundaries.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nsize_t lower(const int *a, size_t n, int key) {\n  size_t lo = 0, hi = n;\n  while (lo < hi) {\n    size_t mid = lo + (hi - lo) / 2;\n    if (a[mid] < key)\n      lo = mid + 1;\n    else\n      hi = mid;\n  }\n  return lo;\n}\nsize_t upper(const int *a, size_t n, int key) {\n  size_t lo = 0, hi = n;\n  while (lo < hi) {\n    size_t mid = lo + (hi - lo) / 2;\n    if (a[mid] <= key)\n      lo = mid + 1;\n    else\n      hi = mid;\n  }\n  return lo;\n}\n\nint main(void) {\n  int a[] = {1, 3, 3, 3, 8};\n  size_t lo = lower(a, 5, 3), hi = upper(a, 5, 3);\n  printf(\"range=[%zu,%zu) count=%zu\\n\", lo, hi, hi - lo);\n  return 0;\n}\n",
        "expected": "range=[1,4) count=3",
        "walkthrough": "The three matching elements occupy indices one, two, and three. The upper endpoint four is not another matching element.",
        "pitfall": "A binary search that stops at the first equality cannot promise the first duplicate.",
        "question": "How many values match in [lo,hi)?",
        "choices": [
          "hi - lo + 1",
          "hi - lo"
        ],
        "answer": 1,
        "why": "The endpoint hi is excluded.",
        "tryit": "Test a value below all elements, above all elements, and an array containing only duplicates.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "Searching records uses an ordering key while returning a record or an explicit missing result. Keep the key order consistent with updates.",
        "explanation": "The table is sorted by ID, not by name. The search returns a position into caller-owned rows; its caller verifies equality before reading the record. Insertions must maintain the ID order or rebuild the index. A pointer into a growable table may be invalidated by relocation, so define how long a result may be retained.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  int id;\n  const char *name;\n} Row;\nsize_t find_id(const Row *rows, size_t n, int id) {\n  size_t lo = 0, hi = n;\n  while (lo < hi) {\n    size_t mid = lo + (hi - lo) / 2;\n    if (rows[mid].id < id)\n      lo = mid + 1;\n    else\n      hi = mid;\n  }\n  return lo;\n}\n\nint main(void) {\n  Row rows[] = {{2, \"Ada\"}, {5, \"Grace\"}, {9, \"Linus\"}};\n  size_t i = find_id(rows, 3, 5);\n  if (i < 3 && rows[i].id == 5)\n    printf(\"%d %s\\n\", rows[i].id, rows[i].name);\n  return 0;\n}\n",
        "expected": "5 Grace",
        "walkthrough": "The key search selects index one and equality confirms the row before printing. The string is borrowed from a literal with static lifetime.",
        "pitfall": "Searching by one field in a table ordered by another field does not satisfy binary search’s precondition.",
        "question": "Which order does this lookup require?",
        "choices": [
          "Ascending ID order",
          "Alphabetical name order"
        ],
        "answer": 0,
        "why": "Every comparison is against rows[mid].id.",
        "tryit": "Insert an ID between 2 and 5 while preserving order, then implement find-or-missing cases.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practice": "search",
    "practicePlan": {
      "goal": "Find records while maintaining a shrinking search interval.",
      "tasks": [
        "Maintain explicit search intervals, handle absence and duplicates, and apply ordered search to records.",
        "Insert an ID between 2 and 5 while preserving order, then implement find-or-missing cases.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "searching-5"
    }
  },
  "sorting": {
    "intro": "Compare algorithms by their invariants, movement, stability, and sensitivity to input order.",
    "outcomes": [
      "Maintain sorted regions without losing values.",
      "Compare O(n²), O(n log n), and pivot-dependent behavior.",
      "Use callbacks and auxiliary storage safely."
    ],
    "topics": {
      "1": {
        "intro": "Selection sort chooses the smallest remaining element. Insertion sort places the next element into an already sorted prefix.",
        "explanation": "Before insertion iteration i, a[0..i) is sorted and contains the original prefix values. Shift larger values right, then fill the resulting gap. Using > rather than ≥ preserves equal-element order. Selection sort always scans the remaining suffix; insertion sort can exploit already sorted input. Both have quadratic worst-case time and constant auxiliary storage.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nvoid show(const int *a, size_t n) {\n  for (size_t i = 0; i < n; ++i)\n    printf(\"%s%d\", i ? \" \" : \"\", a[i]);\n  puts(\"\");\n}\nsize_t insertion(int *a, size_t n) {\n  size_t moves = 0;\n  for (size_t i = 1; i < n; ++i) {\n    int x = a[i];\n    size_t j = i;\n    while (j && a[j - 1] > x) {\n      a[j] = a[j - 1];\n      --j;\n      ++moves;\n    }\n    a[j] = x;\n  }\n  return moves;\n}\nvoid selection(int *a, size_t n) {\n  for (size_t i = 0; i < n; ++i) {\n    size_t least = i;\n    for (size_t j = i + 1; j < n; ++j)\n      if (a[j] < a[least])\n        least = j;\n    int t = a[i];\n    a[i] = a[least];\n    a[least] = t;\n  }\n}\nint compare_int(const void *x, const void *y) {\n  int a = *(const int *)x, b = *(const int *)y;\n  return (a > b) - (a < b);\n}\n\nint main(void) {\n  int a[] = {4, 1, 3, 2}, b[] = {4, 1, 3, 2};\n  selection(a, 4);\n  insertion(b, 4);\n  show(a, 4);\n  show(b, 4);\n  return 0;\n}\n",
        "expected": "1 2 3 4\n1 2 3 4",
        "walkthrough": "The two methods produce the same ordered multiset through different operations. A matching result alone does not establish the algorithm or its cost.",
        "pitfall": "Shifting without saving the insertion value first destroys information.",
        "question": "Which region is sorted before insertion iteration i?",
        "choices": [
          "a[0..i)",
          "a[i..n)"
        ],
        "answer": 0,
        "why": "The next value at i has not yet been inserted.",
        "tryit": "Count shifts for sorted and reverse-sorted inputs of the same size.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "Merge sort sorts two halves and combines them by consuming their smallest remaining values.",
        "explanation": "During merging, the output prefix is sorted and contains exactly the consumed inputs. Selecting the left element on equality makes this merge stable. Each level handles O(n) values and there are O(log n) levels, giving Θ(n log n) time. This implementation borrows an n-element temporary array and uses O(log n) call-stack depth.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nvoid show(const int *a, size_t n) {\n  for (size_t i = 0; i < n; ++i)\n    printf(\"%s%d\", i ? \" \" : \"\", a[i]);\n  puts(\"\");\n}\nsize_t insertion(int *a, size_t n) {\n  size_t moves = 0;\n  for (size_t i = 1; i < n; ++i) {\n    int x = a[i];\n    size_t j = i;\n    while (j && a[j - 1] > x) {\n      a[j] = a[j - 1];\n      --j;\n      ++moves;\n    }\n    a[j] = x;\n  }\n  return moves;\n}\nvoid selection(int *a, size_t n) {\n  for (size_t i = 0; i < n; ++i) {\n    size_t least = i;\n    for (size_t j = i + 1; j < n; ++j)\n      if (a[j] < a[least])\n        least = j;\n    int t = a[i];\n    a[i] = a[least];\n    a[least] = t;\n  }\n}\nint compare_int(const void *x, const void *y) {\n  int a = *(const int *)x, b = *(const int *)y;\n  return (a > b) - (a < b);\n}\nvoid merge_sort(int *a, int *tmp, size_t n) {\n  if (n < 2)\n    return;\n  size_t m = n / 2;\n  merge_sort(a, tmp, m);\n  merge_sort(a + m, tmp + m, n - m);\n  size_t i = 0, j = m, k = 0;\n  while (i < m && j < n)\n    tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];\n  while (i < m)\n    tmp[k++] = a[i++];\n  while (j < n)\n    tmp[k++] = a[j++];\n  for (k = 0; k < n; ++k)\n    a[k] = tmp[k];\n}\n\nint main(void) {\n  int a[] = {5, 1, 4, 1, 3}, tmp[5];\n  merge_sort(a, tmp, 5);\n  show(a, 5);\n  return 0;\n}\n",
        "expected": "1 1 3 4 5",
        "walkthrough": "Both duplicates survive. Each recursive subproblem has fewer elements and the n<2 base case ends recursion.",
        "pitfall": "Do not allocate an n-element temporary array at every recursive level when one reusable buffer suffices.",
        "question": "What extra array space does this merge sort use?",
        "choices": [
          "O(1)",
          "O(n)"
        ],
        "answer": 1,
        "why": "The merge buffer has one slot per input element.",
        "tryit": "Attach original-position tags to equal keys and verify that their order is preserved.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "A partition places one pivot in its final position and divides the remaining values into smaller subproblems.",
        "explanation": "The example uses the last value as pivot, keeping values smaller than it before boundary. After partitioning, the pivot is excluded from both recursive calls. Balanced partitions give O(n log n) work; persistently one-sided partitions give Θ(n²) work and Θ(n) stack depth. Randomization can improve expected behavior but does not eliminate the worst case.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nvoid show(const int *a, size_t n) {\n  for (size_t i = 0; i < n; ++i)\n    printf(\"%s%d\", i ? \" \" : \"\", a[i]);\n  puts(\"\");\n}\nsize_t insertion(int *a, size_t n) {\n  size_t moves = 0;\n  for (size_t i = 1; i < n; ++i) {\n    int x = a[i];\n    size_t j = i;\n    while (j && a[j - 1] > x) {\n      a[j] = a[j - 1];\n      --j;\n      ++moves;\n    }\n    a[j] = x;\n  }\n  return moves;\n}\nvoid selection(int *a, size_t n) {\n  for (size_t i = 0; i < n; ++i) {\n    size_t least = i;\n    for (size_t j = i + 1; j < n; ++j)\n      if (a[j] < a[least])\n        least = j;\n    int t = a[i];\n    a[i] = a[least];\n    a[least] = t;\n  }\n}\nint compare_int(const void *x, const void *y) {\n  int a = *(const int *)x, b = *(const int *)y;\n  return (a > b) - (a < b);\n}\nvoid quick(int *a, size_t n) {\n  if (n < 2)\n    return;\n  int pivot = a[n - 1];\n  size_t boundary = 0;\n  for (size_t j = 0; j + 1 < n; ++j)\n    if (a[j] < pivot) {\n      int t = a[j];\n      a[j] = a[boundary];\n      a[boundary++] = t;\n    }\n  a[n - 1] = a[boundary];\n  a[boundary] = pivot;\n  quick(a, boundary);\n  quick(a + boundary + 1, n - boundary - 1);\n}\n\nint main(void) {\n  int a[] = {5, 2, 4, 1, 3};\n  quick(a, 5);\n  show(a, 5);\n  return 0;\n}\n",
        "expected": "1 2 3 4 5",
        "walkthrough": "The first pivot is 3. Its partition leaves two values on each side; later calls sort those regions.",
        "pitfall": "This simple partition degenerates on many equal keys. Three-way partitioning is one useful improvement.",
        "question": "Does choosing the final element guarantee balanced partitions?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "Sorted input repeatedly selects an extreme pivot in this version.",
        "tryit": "Add a partition counter and compare sorted, reversed, and duplicate-heavy inputs.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "Stable means equal keys retain their relative order. In-place describes auxiliary storage; these are independent properties.",
        "explanation": "Sort records by key while keeping a distinguishing tag. The strict comparison in insertion sort moves only larger keys, preserving equal-key order. A common selection-sort swap can reverse equal records even when the final keys are sorted. Always specify whether stack storage is included when describing an algorithm as in-place.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  struct Item {\n    int key;\n    char tag;\n  } a[] = {{2, 'A'}, {1, 'B'}, {2, 'C'}};\n  for (size_t i = 1; i < 3; ++i) {\n    struct Item x = a[i];\n    size_t j = i;\n    while (j && a[j - 1].key > x.key) {\n      a[j] = a[j - 1];\n      --j;\n    }\n    a[j] = x;\n  }\n  for (size_t i = 0; i < 3; ++i)\n    printf(\"%d%c%s\", a[i].key, a[i].tag, i == 2 ? \"\\n\" : \" \");\n  return 0;\n}\n",
        "expected": "1B 2A 2C",
        "walkthrough": "The equal-key records A and C remain in their original order. The tag makes stability observable.",
        "pitfall": "Sorted keys alone cannot reveal whether a sort is stable.",
        "question": "What must remain ordered for a stable sort?",
        "choices": [
          "Every record’s original array index",
          "The original order among equal keys"
        ],
        "answer": 1,
        "why": "Different keys must move; equal-key relative order is the preserved relation.",
        "tryit": "Change > to >= in the shift condition and inspect the equal-key tags.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "qsort accepts an ordering callback and an element size; neither is inferred from the array at runtime.",
        "explanation": "The callback receives pointers to elements and returns a negative, zero, or positive value. Subtracting two arbitrary ints can overflow, so compare relationally. The standard does not promise stability or a particular algorithm for qsort. Pass sizeof a[0] and the actual initialized element count.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nvoid show(const int *a, size_t n) {\n  for (size_t i = 0; i < n; ++i)\n    printf(\"%s%d\", i ? \" \" : \"\", a[i]);\n  puts(\"\");\n}\nsize_t insertion(int *a, size_t n) {\n  size_t moves = 0;\n  for (size_t i = 1; i < n; ++i) {\n    int x = a[i];\n    size_t j = i;\n    while (j && a[j - 1] > x) {\n      a[j] = a[j - 1];\n      --j;\n      ++moves;\n    }\n    a[j] = x;\n  }\n  return moves;\n}\nvoid selection(int *a, size_t n) {\n  for (size_t i = 0; i < n; ++i) {\n    size_t least = i;\n    for (size_t j = i + 1; j < n; ++j)\n      if (a[j] < a[least])\n        least = j;\n    int t = a[i];\n    a[i] = a[least];\n    a[least] = t;\n  }\n}\nint compare_int(const void *x, const void *y) {\n  int a = *(const int *)x, b = *(const int *)y;\n  return (a > b) - (a < b);\n}\n\nint main(void) {\n  int a[] = {INT_MAX, -7, 0, INT_MIN};\n  qsort(a, 4, sizeof a[0], compare_int);\n  printf(\"ordered=%d extremes=%d\\n\",\n         a[0] <= a[1] && a[1] <= a[2] && a[2] <= a[3],\n         a[0] == INT_MIN && a[3] == INT_MAX);\n  return 0;\n}\n",
        "expected": "ordered=1 extremes=1",
        "walkthrough": "The test checks ordering and both extreme values without assuming that int is exactly 32 bits.",
        "pitfall": "Casting an incompatible callback type does not make the function call valid.",
        "question": "Why avoid returning a-b for arbitrary int keys?",
        "choices": [
          "Signed subtraction can overflow",
          "qsort requires a Boolean return value"
        ],
        "answer": 0,
        "why": "Only the sign is needed, and relational comparisons avoid the overflow.",
        "tryit": "Sort records with a tie-break on ID and document whether that total ordering matches your application.",
        "input": "",
        "runtime": "browser"
      },
      "6": {
        "intro": "Comparisons and moves can respond differently to the same input. Instrument both when choosing an algorithm for a workload.",
        "explanation": "For insertion sort, sorted input causes no shifts; reversed distinct input causes n(n−1)/2 shifts. An assignment that writes the saved key back is not counted as a shift here. State that convention, keep output outside timing, and verify that every run preserves the multiset.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nvoid show(const int *a, size_t n) {\n  for (size_t i = 0; i < n; ++i)\n    printf(\"%s%d\", i ? \" \" : \"\", a[i]);\n  puts(\"\");\n}\nsize_t insertion(int *a, size_t n) {\n  size_t moves = 0;\n  for (size_t i = 1; i < n; ++i) {\n    int x = a[i];\n    size_t j = i;\n    while (j && a[j - 1] > x) {\n      a[j] = a[j - 1];\n      --j;\n      ++moves;\n    }\n    a[j] = x;\n  }\n  return moves;\n}\nvoid selection(int *a, size_t n) {\n  for (size_t i = 0; i < n; ++i) {\n    size_t least = i;\n    for (size_t j = i + 1; j < n; ++j)\n      if (a[j] < a[least])\n        least = j;\n    int t = a[i];\n    a[i] = a[least];\n    a[least] = t;\n  }\n}\nint compare_int(const void *x, const void *y) {\n  int a = *(const int *)x, b = *(const int *)y;\n  return (a > b) - (a < b);\n}\n\nint main(void) {\n  int sorted[] = {1, 2, 3, 4}, reverse[] = {4, 3, 2, 1};\n  printf(\"sorted shifts=%zu reverse shifts=%zu\\n\", insertion(sorted, 4),\n         insertion(reverse, 4));\n  return 0;\n}\n",
        "expected": "sorted shifts=0 reverse shifts=6",
        "walkthrough": "The reversed input shifts 1+2+3 values. This illustrates an input-sensitive cost while keeping n fixed.",
        "pitfall": "A count labeled moves is ambiguous unless you define whether final placement and swaps count once or multiple times.",
        "question": "What is being counted here?",
        "choices": [
          "Every executed C statement",
          "Rightward shifts of existing elements"
        ],
        "answer": 1,
        "why": "The counter changes only inside the shift loop.",
        "tryit": "Build a comparison table for insertion and merge sort on four input orders, retaining correctness checks.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practice": "sort",
    "practicePlan": {
      "goal": "Implement and compare sorting algorithms on different input orders.",
      "tasks": [
        "Compare algorithms by their invariants, movement, stability, and sensitivity to input order.",
        "Build a comparison table for insertion and merge sort on four input orders, retaining correctness checks.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "sorting-6"
    }
  },
  "recursion": {
    "intro": "Make recursive subproblems smaller, track each call’s state, and compare explicit and implicit stacks.",
    "outcomes": [
      "Identify a base case and a decreasing measure.",
      "Account for recursive auxiliary space.",
      "Traverse a directory-like tree without assuming parent data disappears."
    ],
    "topics": {
      "1": {
        "intro": "A recursive function needs both a terminating base case and progress toward it on every recursive path.",
        "explanation": "Factorial on the small domain 0..10 uses 0!=1 and n!=n·(n−1)!. The argument decreases until it is less than two. The domain restriction matters: machine integers are finite, so this is not an implementation for arbitrarily large mathematical factorials.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nunsigned factorial(unsigned n) { return n < 2 ? 1 : n * factorial(n - 1); }\nunsigned factorial_loop(unsigned n) {\n  unsigned result = 1;\n  for (unsigned i = 2; i <= n; ++i)\n    result *= i;\n  return result;\n}\n\nint main(void) {\n  printf(\"zero=%u five=%u\\n\", factorial(0), factorial(5));\n  return 0;\n}\n",
        "expected": "zero=1 five=120",
        "walkthrough": "Zero returns at the base case. Five multiplies 5·4·3·2·1 while calls return.",
        "pitfall": "A base case that cannot be reached from a valid input does not guarantee termination.",
        "question": "What decreases in this recursion?",
        "choices": [
          "The unsigned argument for n≥2",
          "The size of the result"
        ],
        "answer": 0,
        "why": "Each recursive call receives n−1 only when n is at least two.",
        "tryit": "Add a checked public wrapper that rejects values above the documented domain.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "Each recursive call has its own parameters and local state. Trace entry and return to distinguish the active call from its caller.",
        "explanation": "The countdown prints before and after its recursive call. Its local n remains unchanged while the child runs. At the base case, the function returns without making another call. Stack depth grows linearly with the initial n; a huge input can exhaust implementation resources even when the recurrence terminates mathematically.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nvoid visit(unsigned n) {\n  printf(\"enter %u\\n\", n);\n  if (n)\n    visit(n - 1);\n  printf(\"leave %u\\n\", n);\n}\n\nint main(void) {\n  visit(2);\n  return 0;\n}\n",
        "expected": "enter 2\nenter 1\nenter 0\nleave 0\nleave 1\nleave 2",
        "walkthrough": "Returns unwind in the reverse order of calls, because each caller resumes after its child completes.",
        "pitfall": "The trace describes logical call nesting, not a portable memory-address layout of the native stack.",
        "question": "Which call returns first?",
        "choices": [
          "The initial call with n=2",
          "The base-case call with n=0"
        ],
        "answer": 1,
        "why": "The caller waits for the child’s result.",
        "tryit": "Draw one box per active call and mark the point where the maximum number of boxes is live.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "An iterative formulation can remove recursive call overhead and stack growth when the problem permits a compact accumulator.",
        "explanation": "Both factorial implementations compute the same small-domain result. The loop keeps one accumulator and counter, using O(1) auxiliary space; the direct recursive version has O(n) active call depth. Tail-call optimization is not a C language guarantee, so do not use it as a correctness or space-safety assumption.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nunsigned factorial(unsigned n) { return n < 2 ? 1 : n * factorial(n - 1); }\nunsigned factorial_loop(unsigned n) {\n  unsigned result = 1;\n  for (unsigned i = 2; i <= n; ++i)\n    result *= i;\n  return result;\n}\n\nint main(void) {\n  printf(\"recursive=%u iterative=%u\\n\", factorial(6), factorial_loop(6));\n  return 0;\n}\n",
        "expected": "recursive=720 iterative=720",
        "walkthrough": "Equality of results is checked for one fixture; test the entire documented small domain before replacing the implementation.",
        "pitfall": "Changing control structure does not remove overflow from an unchecked arithmetic formula.",
        "question": "Does C require tail-call elimination?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "An implementation may preserve a call frame for each recursive call.",
        "tryit": "Compare both versions for every input from zero through ten and add overflow checks before multiplication.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "A recursion tree exposes how many subproblems exist at each depth and how much nonrecursive work each node performs.",
        "explanation": "A balanced split into two half-sized problems with constant leaf cost and linear combine cost satisfies T(n)=2T(n/2)+Θ(n). Every level contributes Θ(n) work, and the tree has Θ(log n) levels. Count leaves separately from the total number of nodes; for the example’s power-of-two input, there are n leaves and 2n−1 nodes.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nvoid count_tree(unsigned n, unsigned *nodes, unsigned *leaves) {\n  ++*nodes;\n  if (n < 2) {\n    ++*leaves;\n    return;\n  }\n  count_tree(n / 2, nodes, leaves);\n  count_tree(n - n / 2, nodes, leaves);\n}\n\nint main(void) {\n  unsigned nodes = 0, leaves = 0;\n  count_tree(8, &nodes, &leaves);\n  printf(\"nodes=%u leaves=%u\\n\", nodes, leaves);\n  return 0;\n}\n",
        "expected": "nodes=15 leaves=8",
        "walkthrough": "This program counts the split tree only. A merge-sort combine step adds linear work at each internal node, producing the extra logarithmic factor.",
        "pitfall": "Two recursive calls do not by themselves imply exponential work; their argument sizes matter.",
        "question": "What detail distinguishes merge sort from two calls on n−1?",
        "choices": [
          "Both use two function calls",
          "The subproblem sizes shrink by about half"
        ],
        "answer": 1,
        "why": "A recurrence must describe sizes and nonrecursive work, not just call count.",
        "tryit": "Repeat with n=7, draw the uneven leaves, and explain why the asymptotic merge-sort bound is unchanged.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "A tree traversal visits each node and recursively processes its children. Directory-like structure can be modeled without requiring filesystem access.",
        "explanation": "Nodes borrow immutable names and child arrays. Preorder visits the parent before its descendants. For a tree with V nodes, traversal takes Θ(V) visits and O(h) active stack depth, where h is its height. A general graph needs a visited policy to avoid revisiting nodes or following cycles forever.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct Node {\n  const char *name;\n  const struct Node *children;\n  size_t count;\n} Node;\nvoid walk(const Node *node, unsigned depth) {\n  for (unsigned i = 0; i < depth; ++i)\n    printf(\"  \");\n  puts(node->name);\n  for (size_t i = 0; i < node->count; ++i)\n    walk(&node->children[i], depth + 1);\n}\n\nint main(void) {\n  Node files[] = {{\"main.c\", NULL, 0}, {\"db.c\", NULL, 0}};\n  Node root = {\"src\", files, 2};\n  walk(&root, 0);\n  return 0;\n}\n",
        "expected": "src\n  main.c\n  db.c",
        "walkthrough": "The root prints first and each leaf prints one indentation level deeper. No host directory is opened.",
        "pitfall": "Deep or cyclic external structures need depth limits and validation; a trusted small tree does not demonstrate those protections.",
        "question": "What controls the active recursion depth?",
        "choices": [
          "The tree’s height",
          "Only the number of siblings"
        ],
        "answer": 0,
        "why": "Calls remain active along the current root-to-node path.",
        "tryit": "Add a nested directory and then implement the traversal with an explicit bounded stack.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practicePlan": {
      "goal": "Traverse a tree and account for the recursive call stack.",
      "tasks": [
        "Make recursive subproblems smaller, track each call’s state, and compare explicit and implicit stacks.",
        "Add a nested directory and then implement the traversal with an explicit bounded stack.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "recursion-5"
    }
  },
  "strategies": {
    "intro": "Choose between enumeration, greedy choices, and dynamic programming by examining state and counterexamples.",
    "outcomes": [
      "Prune backtracking without discarding valid solutions.",
      "Disprove a greedy rule with a concrete input.",
      "Choose states and evaluation order for dynamic programs."
    ],
    "topics": {
      "1": {
        "intro": "Brute force makes the candidate space explicit. Backtracking adds choices incrementally and abandons a branch when it cannot lead to a valid solution.",
        "explanation": "For a small subset-sum instance, each position has include and exclude choices. The nonnegative-data contract permits pruning when a partial sum exceeds the target. Without memoization this explores up to 2ⁿ subsets. The base case decides whether the complete choice reaches the target, and every call advances the index.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nbool subset(const int *a, size_t n, size_t i, int remaining) {\n  if (remaining == 0)\n    return true;\n  if (i == n || remaining < 0)\n    return false;\n  return subset(a, n, i + 1, remaining - a[i]) ||\n         subset(a, n, i + 1, remaining);\n}\n\nint main(void) {\n  int a[] = {2, 4, 7};\n  printf(\"target6=%d target5=%d\\n\", subset(a, 3, 0, 6), subset(a, 3, 0, 5));\n  return 0;\n}\n",
        "expected": "target6=1 target5=0",
        "walkthrough": "Including 2 and 4 reaches six. No subset of these values reaches five. Both branches progress to the next input position.",
        "pitfall": "Pruning on a negative remainder is invalid if later values may be negative.",
        "question": "Why is this pruning valid here?",
        "choices": [
          "All input values are nonnegative",
          "Recursion always permits pruning"
        ],
        "answer": 0,
        "why": "The remaining sum cannot be increased by including another nonnegative value.",
        "tryit": "Count recursive calls and compare pruning with full enumeration on the same small inputs.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "A greedy rule makes a locally attractive choice without reconsidering it. A plausible rule needs a proof, not just several successful examples.",
        "explanation": "For coins 1, 3, and 4, repeatedly taking the largest available coin uses 4+1+1 for amount six, while 3+3 uses only two coins. A single counterexample disproves optimality for this coin system. Some coin systems admit a correct greedy rule, but that is a separate theorem with explicit assumptions.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  int coins[] = {4, 3, 1}, remaining = 6, count = 0;\n  for (size_t i = 0; i < 3; ++i)\n    while (remaining >= coins[i]) {\n      remaining -= coins[i];\n      ++count;\n    }\n  printf(\"greedy=%d better=%d\\n\", count, 2);\n  return 0;\n}\n",
        "expected": "greedy=3 better=2",
        "walkthrough": "The program executes the greedy choice; the displayed better solution is the concrete witness 3+3 described in the text.",
        "pitfall": "A fast local choice can produce a suboptimal global solution.",
        "question": "What does one valid counterexample establish?",
        "choices": [
          "No greedy algorithm can ever work",
          "The greedy rule is not always optimal"
        ],
        "answer": 1,
        "why": "It refutes this rule under the stated domain, not all greedy methods.",
        "tryit": "Find the smallest amount where this coin system’s greedy count differs from an optimal table.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "Dynamic programming reuses solutions to overlapping subproblems. Memoization computes states on demand; bottom-up evaluation computes them in a dependency order.",
        "explanation": "Let best[x] be the minimum number of coins needed for amount x, with best[0]=0. For each coin c≤x, try best[x−c]+1. The fixed bounded table and positive denominations make dependencies point to smaller states. With A amounts and C denominations, this version uses O(AC) time and O(A) space.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  int coins[] = {1, 3, 4}, best[7];\n  best[0] = 0;\n  for (int x = 1; x <= 6; ++x) {\n    best[x] = 99;\n    for (size_t j = 0; j < 3; ++j)\n      if (coins[j] <= x && best[x - coins[j]] + 1 < best[x])\n        best[x] = best[x - coins[j]] + 1;\n  }\n  printf(\"optimal=%d\\n\", best[6]);\n  return 0;\n}\n",
        "expected": "optimal=2",
        "walkthrough": "At amount six, the transition from best[3] through coin three produces two. Smaller states are initialized before use.",
        "pitfall": "An unreachable sentinel must not overflow when incremented; use a checked sentinel or guard the transition.",
        "question": "Why may best[x] use best[x-c]?",
        "choices": [
          "x-c is an already solved smaller state",
          "All table cells initially contain valid answers"
        ],
        "answer": 0,
        "why": "Positive coin values and increasing x establish the dependency order.",
        "tryit": "Remove coin one, represent unreachable states explicitly, and test both reachable and impossible amounts.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "A state must retain every fact needed by future choices. Different questions can need different dimensions even when their input looks similar.",
        "explanation": "For obstacle-free grid paths moving right or down, ways[r][c] depends on the cell above and the cell to the left. Boundary cells have one path. A full table uses O(RC) space; retaining just one row uses O(C) because the overwritten entry still represents the previous row until updated. Use bounded sizes or checked arithmetic to avoid path-count overflow.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  unsigned ways[3][3];\n  for (size_t r = 0; r < 3; ++r)\n    for (size_t col = 0; col < 3; ++col)\n      ways[r][col] =\n          (r == 0 || col == 0) ? 1 : ways[r - 1][col] + ways[r][col - 1];\n  for (size_t r = 0; r < 3; ++r)\n    printf(\"%u %u %u\\n\", ways[r][0], ways[r][1], ways[r][2]);\n  return 0;\n}\n",
        "expected": "1 1 1\n1 2 3\n1 3 6",
        "walkthrough": "The destination receives three paths from above and three from the left, for six total. The table itself is the dependency diagram.",
        "pitfall": "Reducing space without preserving dependency order can accidentally reuse the current row instead of the previous row.",
        "question": "Which earlier cells determine an interior cell?",
        "choices": [
          "Every cell in the grid",
          "The cell above and the cell to the left"
        ],
        "answer": 1,
        "why": "Every valid final move enters from one of those two predecessors.",
        "tryit": "Add one blocked cell and set its count to zero before applying the recurrence.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "For 0/1 knapsack, each item may be used at most once. Update order determines whether an item is accidentally reused.",
        "explanation": "Let best[w] be the best value attainable within capacity w. For each item, visit capacities downward so best[w−weight] still refers to the solution before this item. Updating upward would solve an unbounded-use variant instead. With N items and integer capacity W, the table takes O(NW) time: this is pseudo-polynomial in numeric capacity, not polynomial in its bit length.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  int weight[] = {2, 3, 4}, value[] = {3, 4, 5}, best[6] = {0};\n  for (size_t i = 0; i < 3; ++i)\n    for (int w = 5; w >= weight[i]; --w)\n      if (best[w - weight[i]] + value[i] > best[w])\n        best[w] = best[w - weight[i]] + value[i];\n  printf(\"capacity5=%d\\n\", best[5]);\n  return 0;\n}\n",
        "expected": "capacity5=7",
        "walkthrough": "Choosing weights two and three gives value seven. Each item contributes at most once because capacities descend.",
        "pitfall": "A one-dimensional table can silently change the problem if its iteration order changes.",
        "question": "Why iterate capacities downward?",
        "choices": [
          "To avoid reusing the current item",
          "To make every knapsack instance greedy"
        ],
        "answer": 0,
        "why": "The source state must exclude the current item for 0/1 semantics.",
        "tryit": "Record predecessor choices to reconstruct the selected items, then verify the total weight and value.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practicePlan": {
      "goal": "Choose and justify a strategy for a small optimization problem.",
      "tasks": [
        "Choose between enumeration, greedy choices, and dynamic programming by examining state and counterexamples.",
        "Record predecessor choices to reconstruct the selected items, then verify the total weight and value.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "strategies-5"
    }
  }
};
