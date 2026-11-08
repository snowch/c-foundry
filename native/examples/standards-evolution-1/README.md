# C89/C90, C99, C11, C17, and C23

Complete native example, ready to edit and run in Codespaces or locally.

## 31.1 C89/C90, C99, C11, C17, and C23

C revisions add facilities while retaining compatibility rules and implementation choices. A course baseline should be explicit.

C89/C90 standardized the early language; C99 added facilities such as declarations in for loops and standard fixed-width integer interfaces; C11 added atomics and alignment facilities; C17 primarily corrected defects; C23 adds facilities including nullptr, typeof/typeof_unqual, constexpr objects, and inferred auto declarations; probe the exact facility before depending on it. __STDC_VERSION__ identifies the selected language revision when provided, but does not prove every optional library facility is available. This course uses C17 unless a feature probe says otherwise.

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
  printf("C17_or_later=%d C11_or_later=%d\n", __STDC_VERSION__ >= 201710L,
         __STDC_VERSION__ >= 201112L);
  return 0;
}
```

Output:

```text
C17_or_later=1 C11_or_later=1
```

The example command explicitly requests C17. Use make standards-matrix to test the repository’s separate mode-specific probes under GCC and Clang.

**Watch for:** Compiler release dates and language-mode macros are not a complete conformance certificate.

**Check:** What determines the selected language mode?

1. The compiler invocation and supported mode
2. The file extension alone

<details><summary>Answer</summary>

The compiler invocation and supported mode. A .c file can be compiled under several revisions and extension policies.

</details>

**Try:** Run make standards-matrix and record actual accepted modes and diagnostics for both toolchains.

Run from the repository root:

```sh
make example EXAMPLE=standards-evolution-1
```

