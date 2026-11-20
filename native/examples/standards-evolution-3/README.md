# Choosing a baseline and checking feature support

Complete Linux example, ready to edit and run in the browser terminal.

## 31.3 Choosing a baseline and checking feature support

Feature detection should test the facility you need. A standard-version test alone cannot account for partial implementations or optional APIs.

Also editable and runnable inline in the browser course. This probe runs with the inline browser’s fixed C17 toolchain. Use Browser Linux for GCC/Clang comparisons and supported language modes. Optional external sanitizer tooling is described separately.

The example selects a conservative C17 fallback at the course’s default language mode. A separate compile probe can attempt a C23-only facility under -std=c23 and report whether that compiler/library combination accepts it. Treat a failed probe as a result to handle, not permission to silently change the project’s semantics.

### Select a facility using evidence from the actual toolchain

A supported language mode and an available library API are separate checks.

Start with a required facility and the chosen C language baseline. Compile and, where necessary, link a small probe against the actual compiler and libraries. If supported, use the documented feature path. Otherwise select a tested fallback or report an unsupported target. A compiler name or revision macro alone is not sufficient evidence.

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
#if defined(__STDC_VERSION__) && __STDC_VERSION__ >= 202311L
  puts("mode=C23 feature_probe_required");
#else
  puts("mode=C17 fallback_selected");
#endif
  return 0;
}
```

Output:

```text
mode=C17 fallback_selected
```

The checked example is intentionally compiled as C17. The standards-matrix command performs newer-mode experiments without making this page depend on full C23 support.

**Watch for:** Do not use an unchecked newer feature merely because a compiler accepts the language-mode flag.

**Check:** What is stronger evidence of a needed facility?

1. A compile/link probe of that actual facility
2. The compiler executable’s filename

<details><summary>Answer</summary>

A compile/link probe of that actual facility. Language and library support can vary independently.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/standards-evolution/3). In main.c, change the fallback message from mode=C17 fallback_selected to mode=pre-C23 fallback_selected. Run code. Which condition selects the fallback? Use make standards-matrix in your native checkout to see accepted modes separately from feature support.

### References and help

- [C reference: language history](https://en.cppreference.com/w/c/language/history.html) — Separate C17 facilities from later additions and compiler extensions.
- [GCC manual: C dialect options](https://gcc.gnu.org/onlinedocs/gcc/C-Dialect-Options.html) — Check -std modes and distinguish standard language facilities from GNU extensions.

**Use the documentation (optional):** Does selecting a newer -std mode prove that every facility from that C revision is implemented?

<details><summary>Compare your answer</summary>

No. Check the compiler’s documented mode and probe the exact language/library facility needed. A revision macro or an accepted flag is not complete conformance evidence.

</details>

Native source: `native/examples/standards-evolution-3/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=standards-evolution-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

