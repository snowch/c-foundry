# Feature detection and conditional compilation

Complete Linux example, ready to edit and run in the browser terminal.

## 33.3 Feature detection and conditional compilation

Probe the facility you need with the selected compiler and libraries. A platform name or accepted language-mode flag does not establish that an API can be linked.

Also editable and runnable inline in the browser course. This probe runs with the inline browser’s fixed C17 toolchain. Use Browser Linux for GCC/Clang comparisons and supported language modes.

The build chooses CF_HAVE_MONOTONIC only after compiling and linking a clock_gettime/CLOCK_MONOTONIC probe. A conservative build defaults to zero and reports the service as unconfigured. Defining _POSIX_C_SOURCE before headers requests the POSIX declarations; it does not create an implementation. The check-portability runner exercises both the default path and the detected path. When monotonic timing is required, an unavailable result must remain unavailable: wall-clock time is not a semantics-preserving replacement.

### Select a facility using evidence from the actual toolchain

A supported language mode and an available library API are separate checks.

Start with a required facility and the chosen C language baseline. Compile and, where necessary, link a small probe against the actual compiler and libraries. If supported, use the documented feature path. Otherwise select a tested fallback or report an unsupported target. A compiler name or revision macro alone is not sufficient evidence.

### main.c

```c
#ifndef CF_HAVE_MONOTONIC
#define CF_HAVE_MONOTONIC 0
#endif
#if CF_HAVE_MONOTONIC
#define _POSIX_C_SOURCE 200809L
#include <time.h>
#endif
#include <stdio.h>

int main(void) {
#if CF_HAVE_MONOTONIC
    struct timespec now;
    if (clock_gettime(CLOCK_MONOTONIC, &now) != 0) return 1;
#endif
    printf("monotonic_configured=%d\n", CF_HAVE_MONOTONIC);
    return 0;
}
```

Output:

```text
monotonic_configured=0
```

The normal example does not guess a platform capability. The portability runner records a compile/link result and passes the resulting macro explicitly when testing the other branch. A successful API probe still requires runtime errors to be handled.

**Watch for:** Compiler identity is not an API test. Cross-compilation may support compile/link probes while being unable to run the target binary, so separate configuration evidence from target execution evidence.

**Check:** If the monotonic-clock probe fails, what is an honest fallback?

1. Report that the required service is unavailable
2. Silently return a wall-clock value and promise monotonicity

<details><summary>Answer</summary>

Report that the required service is unavailable. A fallback may preserve a contract or explicitly report unsupported behavior; it must not silently change the meaning.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/portable-c/3). After observing monotonic_configured=0 in the browser, choose Linux in the header, complete its setup, and at ~/work/c-foundry run python3 tools/check_portability.py --compiler gcc. Compare its capability result with the browser. Which toolchain and environment reported each result?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [C reference: preprocessing](https://en.cppreference.com/w/c/preprocessor.html) (online) — Find inclusion, conditional compilation, and macro replacement rules.
- [C reference: language history](https://en.cppreference.com/w/c/language/history.html) (online) — Separate C17 facilities from later additions and compiler extensions.

Native source: `native/examples/portable-c-3/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=portable-c-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

