# Language standards versus compiler extensions

Complete native example, ready to edit and run in Codespaces or locally.

## 31.2 Language standards versus compiler extensions

Compiler extensions can be useful when isolated behind a checked interface, but they are not portable language guarantees.

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

**Try:** Compile with -Wpedantic -Werror, then write a feature probe that checks the exact extension your project needs.

Run from the repository root:

```sh
make example EXAMPLE=standards-evolution-2
```

