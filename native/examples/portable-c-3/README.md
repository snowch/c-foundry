# Feature detection and conditional compilation

Complete native example, ready to edit and run in Codespaces or locally.

## 33.3 Feature detection and conditional compilation

Probe the facility you need with the selected compiler and libraries. A platform name or accepted language-mode flag does not establish that an API can be linked.

The build chooses CF_HAVE_MONOTONIC only after compiling and linking a clock_gettime/CLOCK_MONOTONIC probe. A conservative build defaults to zero and reports the service as unconfigured. Defining _POSIX_C_SOURCE before headers requests the POSIX declarations; it does not create an implementation. The check-portability runner exercises both the default path and the detected path. When monotonic timing is required, an unavailable result must remain unavailable: wall-clock time is not a semantics-preserving replacement.

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

**Try:** Run python3 tools/check_portability.py --compiler gcc and inspect the capability report. Compare the result with Windows MSVC in the Actions matrix.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-3
```

