# Include guards and the preprocessor

Complete Linux example, ready to edit and run in the browser terminal.

## 9.3 Include guards and the preprocessor

The preprocessor transforms source before ordinary C compilation. Keep its role small and visible: header guards and explicit configuration are common uses.

Also editable and runnable inline in the browser course. Run here, or use Browser Linux for a full GCC build.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/larger-programs/3). Choose scale.h above the editor. Change the default FACTOR from 3 to 4 and choose Run code. Compare Console with the original 21. For a separate preprocessing experiment, open Browser Linux from the footer, choose Start Linux, and wait for Linux is ready. At the shell, run cd ~/work/c-foundry/native/examples/larger-programs-3 && gcc -E main.c. Find scale.h’s single function definition despite its two includes. The inline edit does not change the separate Linux copy; that copy still uses its original FACTOR unless you edit it there.

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: preprocessing (included in the explanation above) — Find inclusion, conditional compilation, and macro replacement rules.
- Course notes: storage duration and linkage (included in the explanation above) — Separate an object’s lifetime from which declarations name it.

**Optional further reading (internet required):**

- [C reference: preprocessing](https://en.cppreference.com/w/c/preprocessor.html)
- [C reference: storage duration and linkage](https://en.cppreference.com/w/c/language/storage_duration.html)

**Use the documentation (optional):** Does an include guard stop duplicate external function definitions in different source files?

<details><summary>Compare your answer</summary>

No. It prevents repeated inclusion within a translation unit. Each source file is preprocessed separately; shared external definitions still need one definition and compatible declarations.

</details>

Native source: `native/examples/larger-programs-3/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=larger-programs-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

