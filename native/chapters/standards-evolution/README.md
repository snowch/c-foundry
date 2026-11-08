# Chapter 31: How C has evolved

Part 7: C standards and portable systems programming. Teaching baseline: C17.

Choose a language baseline and verify features with the actual compiler instead of assuming that a modern compiler name implies complete conformance.

## Outcomes

- Identify major standard revisions and their practical additions.
- Separate standard facilities from extensions.
- Build feature probes in multiple language modes.

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

## Build it yourself

Compile a feature probe under different language standards.

1. Choose a language baseline and verify features with the actual compiler instead of assuming that a modern compiler name implies complete conformance.
2. Add a positive and negative feature probe to your build and keep its diagnostics in the setup documentation.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=standards-evolution-3
```

Chapter workspace command: `make chapter CHAPTER=standards-evolution`.

Generated from dist/part7.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/standards-evolution
