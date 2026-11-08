# Choosing a baseline and checking feature support

Complete native example, ready to edit and run in Codespaces or locally.

## 31.3 Choosing a baseline and checking feature support

Feature detection should test the facility you need. A standard-version test alone cannot account for partial implementations or optional APIs.

The example selects a conservative C17 fallback at the course’s default language mode. A separate compile probe can attempt a C23-only facility under -std=c23 and report whether that compiler/library combination accepts it. Treat a failed probe as a result to handle, not permission to silently change the project’s semantics.

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

**Try:** Add a positive and negative feature probe to your build and keep its diagnostics in the setup documentation.

Run from the repository root:

```sh
make example EXAMPLE=standards-evolution-3
```

