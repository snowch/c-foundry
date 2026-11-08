# Include guards and the preprocessor

Complete native example, ready to edit and run in Codespaces or locally.

## 9.3 Include guards and the preprocessor

The preprocessor transforms source before ordinary C compilation. Keep its role small and visible: header guards and explicit configuration are common uses.

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

**Try:** Change the default factor, then inspect the preprocessed source with gcc -E main.c in the example folder.

Run from the repository root:

```sh
make example EXAMPLE=larger-programs-3
```

