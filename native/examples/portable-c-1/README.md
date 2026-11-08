# Standard library versus operating-system APIs

Complete native example, ready to edit and run in Codespaces or locally.

## 33.1 Standard library versus operating-system APIs

The C standard library and an operating-system API are different portability layers. POSIX facilities require a POSIX target and their own contracts.

This native example uses clock_gettime with CLOCK_MONOTONIC, exposed through the POSIX feature-test macro before any headers. It checks both calls and compares timestamps without claiming a measurable workload duration. A different host needs an adapter or another supported API; ISO C alone does not require this exact interface.

### main.c

```c
#define _POSIX_C_SOURCE 200809L
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

int main(void) {
  struct timespec a, b;
  if (clock_gettime(CLOCK_MONOTONIC, &a) || clock_gettime(CLOCK_MONOTONIC, &b))
    return 1;
  printf("clock_read=1 ordered=%d\n",
         b.tv_sec > a.tv_sec ||
             (b.tv_sec == a.tv_sec && b.tv_nsec >= a.tv_nsec));
  return 0;
}
```

Output:

```text
clock_read=1 ordered=1
```

Both reads succeed on the Codespaces Linux target. Two adjacent observations are used only for an ordering property, not a performance claim.

**Watch for:** A POSIX feature macro requests declarations; it does not make the API exist on every platform.

**Check:** Does ISO C require CLOCK_MONOTONIC?

1. No
2. Yes

<details><summary>Answer</summary>

No. It belongs to a host API with a narrower platform contract.

</details>

**Try:** Define a small clock abstraction and test its Linux implementation separately from algorithmic counters.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-1
```

