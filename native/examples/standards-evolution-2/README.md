# Language standards versus compiler extensions

Complete Linux example, ready to edit and run in the browser terminal.

## 31.2 Language standards versus compiler extensions

Compiler extensions can be useful when isolated behind a checked interface, but they are not portable language guarantees.

Also editable and runnable inline in the browser course. This probe runs with the inline browser’s fixed C17 toolchain. Use Browser Linux for GCC/Clang comparisons and supported language modes. Optional external sanitizer tooling is described separately.

The example guards a GNU-compatible extended integer type and supplies a standard fallback. __extension__ is itself a compiler-specific escape used only within that guard. The output checks a capability property rather than promising that every C target has a 128-bit integer. Prefer a standard baseline path unless the extended representation is part of a documented platform requirement.

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
#if defined(__GNUC__) && defined(__SIZEOF_INT128__)
  __extension__ typedef unsigned __int128 Wide;
  printf("wide_at_least64=%d\n", sizeof(Wide) * CHAR_BIT >= 64);
#else
  printf("wide_at_least64=%d\n", sizeof(uint64_t) * CHAR_BIT >= 64);
#endif
  return 0;
}
```

Output:

```text
wide_at_least64=1
```

Both paths satisfy the property needed by this fixture, but the types and supported ranges differ. The fallback’s existence does not make extension-only code elsewhere portable.

**Watch for:** Defining a compiler-family macro does not guarantee every extension or target-specific type.

**Check:** Where should extension assumptions be isolated?

1. Every call site without checks
2. A guarded interface with a documented fallback or requirement

<details><summary>Answer</summary>

A guarded interface with a documented fallback or requirement. Centralizing the dependency makes supported targets and failures reviewable.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/standards-evolution/2). In main.c, change >= 64 to >= 128 in both branches and wide_at_least64= to wide_at_least128=. Run code. Compare the browser flag with a native run of the same edit. Which branch can supply a 128-bit type?

### References and help

- [C reference: language history](https://en.cppreference.com/w/c/language/history.html) — Separate C17 facilities from later additions and compiler extensions.
- [GCC manual: C dialect options](https://gcc.gnu.org/onlinedocs/gcc/C-Dialect-Options.html) — Check -std modes and distinguish standard language facilities from GNU extensions.

Native source: `native/examples/standards-evolution-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=standards-evolution-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

