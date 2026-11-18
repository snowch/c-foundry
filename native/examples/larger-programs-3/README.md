# Include guards and the preprocessor

Complete native example, ready to edit and run in Codespaces or locally.

## 9.3 Include guards and the preprocessor

The preprocessor transforms source before ordinary C compilation. Keep its role small and visible: header guards and explicit configuration are common uses.

Also editable and runnable inline in the browser course. Run here, or use the native command below with your own C toolchain.

An include guard wraps a header in a conditional so repeated inclusion in one translation unit does not repeat its contents. The separate FACTOR conditional supplies a default only when configuration has not already defined it. A static inline function keeps ordinary parameter evaluation rules, unlike an expression macro that may evaluate an argument more than once. Header guards do not prevent multiple external definitions across different translation units.

### scale.h

```c
#ifndef SCALE_H
#define SCALE_H
#ifndef FACTOR
#define FACTOR 3
#endif
static inline int scale(int value) { return value * FACTOR; }
#endif
```

### main.c

```c
#include <stdio.h>
#include "scale.h"
#include "scale.h"

int main(void) {
    printf("%d\n", scale(7));
    return 0;
}
```

Output:

```text
21
```

Although scale.h is included twice, its guard admits the body once in main’s translation unit. FACTOR defaults to 3, so scale(7) returns 21. The helper has internal linkage and can appear in another translation unit without creating one conflicting external function definition.

**Watch for:** A macro such as SQUARE(x) expanding to (x)*(x) is unsafe for an argument with side effects. Also parenthesize expression macros carefully when they are genuinely needed.

**Check:** Does an include guard protect against every linker multiple-definition problem?

1. Yes
2. No

<details><summary>Answer</summary>

No. It prevents repetition within one translation unit; separate translation units still need a correct linkage design.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/larger-programs/3). Choose scale.h in Source files. Change the default FACTOR from 3 to 4 and choose Run code. Compare Console with 21. To inspect the expanded source in a native checkout, change into native/examples/larger-programs-3 and run gcc -E main.c.

### References and help

- [C reference: preprocessing](https://en.cppreference.com/w/c/preprocessor.html) — Find inclusion, conditional compilation, and macro replacement rules.
- [C reference: storage duration and linkage](https://en.cppreference.com/w/c/language/storage_duration.html) — Separate an object’s lifetime from which declarations name it.

**Use the documentation (optional):** Does an include guard stop duplicate external function definitions in different source files?

<details><summary>Compare your answer</summary>

No. It prevents repeated inclusion within a translation unit. Each source file is preprocessed separately; shared external definitions still need one definition and compatible declarations.

</details>

Native source: `native/examples/larger-programs-3/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=larger-programs-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

