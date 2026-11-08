# Why code can behave differently under optimization

Complete native example, ready to edit and run in Codespaces or locally.

## 32.3 Why code can behave differently under optimization

Optimizers may transform valid programs while preserving their required observable behavior. They need not preserve a guessed result after undefined behavior.

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

The required result remains zero and ten under valid optimizing transformations. The example is compiled with optimization enabled, not a deliberately invalid aliasing trick.

**Watch for:** Turning optimization off can hide a defect without fixing it.

**Check:** What should be checked first after an optimization-sensitive failure?

1. Lifetime, bounds, aliasing, initialization, and synchronization
2. Whether -O0 appears to work

<details><summary>Answer</summary>

Lifetime, bounds, aliasing, initialization, and synchronization. A valid source contract is the basis for expecting preserved behavior.

</details>

**Try:** Compile with GCC and Clang at -O0 and -O2, then run the same independent fixtures.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-3
```

