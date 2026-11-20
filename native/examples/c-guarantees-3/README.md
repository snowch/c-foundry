# Why code can behave differently under optimization

Complete Linux example, ready to edit and run in the browser terminal.

## 32.3 Why code can behave differently under optimization

Optimizers may transform valid programs while preserving their required observable behavior. They need not preserve a guessed result after undefined behavior.

Also editable and runnable inline in the browser course. This probe runs with the inline browser’s fixed C17 toolchain. Use Browser Linux for GCC/Clang comparisons and supported language modes. Optional external sanitizer tooling is described separately.

The fixture uses unsigned fixed-width arithmetic with a defined wrap result and a bounded representable sum. Compile it at multiple optimization levels and compare those outputs. If a different program changes behavior under optimization, audit its language contracts, races, and uninitialized state before treating the difference as an optimizer bug.

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
  uint32_t x = UINT32_MAX;
  x += UINT32_C(1);
  unsigned sum = 0;
  for (unsigned i = 1; i <= 4; ++i)
    sum += i;
  printf("wrapped=%u sum=%u\n", (unsigned)x, sum);
  return 0;
}
```

Output:

```text
wrapped=0 sum=10
```

The required result remains zero and ten under valid optimizing transformations. The native fixture requests -O2; the inline runner uses its fixed unoptimized C17 build. Compare native -O0 and -O2 builds to investigate optimization.

**Watch for:** Turning optimization off can hide a defect without fixing it.

**Check:** What should be checked first after an optimization-sensitive failure?

1. Lifetime, bounds, aliasing, initialization, and synchronization
2. Whether -O0 appears to work

<details><summary>Answer</summary>

Lifetime, bounds, aliasing, initialization, and synchronization. A valid source contract is the basis for expecting preserved behavior.

</details>

**Try:** Compile with GCC and Clang at -O0 and -O2, then run the same independent fixtures.

### References and help

- [C reference: behavior categories](https://en.cppreference.com/w/c/language/behavior.html) — Distinguish undefined, unspecified, and implementation-defined behavior.
- [C reference: numeric limits](https://en.cppreference.com/w/c/types/limits.html) — Find the macros that describe the selected implementation’s ranges.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-3
```

