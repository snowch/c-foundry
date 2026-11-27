# C89/C90, C99, C11, C17, and C23

Complete Linux example, ready to edit and run in the browser terminal.

## 31.1 C89/C90, C99, C11, C17, and C23

C revisions add facilities while retaining compatibility rules and implementation choices. A course baseline should be explicit.

Also editable and runnable inline in the browser course. This probe runs with the inline browser’s fixed C17 toolchain. Use Browser Linux for GCC/Clang comparisons and supported language modes.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/standards-evolution/1). After the browser run, open Browser Linux from the footer, choose Start Linux if needed, and wait for Linux is ready. Run cd ~/work/c-foundry && make standards-matrix in the terminal. Compare the reported GCC and Clang modes and feature-probe diagnostics. Which modes were accepted, and which named facilities were actually compiled and linked?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: language history (included in the explanation above) — Separate C17 facilities from later additions and compiler extensions.
- Course notes: C dialect options (included in the explanation above) — Check -std modes and distinguish standard language facilities from GNU extensions.

**Optional further reading (internet required):**

- [C reference: language history](https://en.cppreference.com/w/c/language/history.html)
- [GCC manual: C dialect options](https://gcc.gnu.org/onlinedocs/gcc/C-Dialect-Options.html)

Native source: `native/examples/standards-evolution-1/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=standards-evolution-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

