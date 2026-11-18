# Testing, sanitizers, portability, and browser runtime limits

Complete native example, ready to edit and run in Codespaces or locally.

## 10.5 Testing, sanitizers, portability, and browser runtime limits

Combine tests with compiler diagnostics, sanitizers, and portability checks. Each tool detects a different set of mistakes; none is a proof that a program is correct.

Also editable and runnable inline in the browser course. This program runs with the browser’s fixed C17 toolchain. Use the native command below for compiler warnings, sanitizer checks, and comparisons between toolchains.

The copy helper requires valid nonoverlapping source and destination objects and a terminated source. It rejects text that cannot fit including the terminator. Test both the boundary that fits and the first value that does not. AddressSanitizer helps detect many invalid memory accesses, and UndefinedBehaviorSanitizer detects selected invalid operations. Use them on native builds: the page’s Wasm runner is not providing these native sanitizer runtimes.

### main.c

```c
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

bool copy_checked(char *destination, size_t capacity, const char *source) {
    size_t length = strlen(source);
    if (length >= capacity) return false;
    memcpy(destination, source, length + 1);
    return true;
}

int main(void) {
    char small[4];
    printf("short=%s\n", copy_checked(small, sizeof small, "Ada") ? "ok" : "rejected");
    printf("too-long=%s\n", copy_checked(small, sizeof small, "Grace") ? "ok" : "rejected");
    return 0;
}
```

Output:

```text
short=ok
too-long=rejected
```

Ada needs exactly four chars with its terminator and fits. Grace does not, so the helper returns without copying it. In Codespaces, run this example with SANITIZE=1 and compare GCC and Clang builds. Keep a passing test distinct from evidence about paths that have not executed.

**Watch for:** Sanitizers have coverage and platform limits. They do not generally prove ownership, absence of logical errors, or race freedom; concurrency needs additional tools and reasoning.

**Check:** Does a sanitizer-clean run prove there are no bugs?

1. Yes
2. No

<details><summary>Answer</summary>

No. It checks the executed behavior for the classes of problems that sanitizer can detect.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/files-bytes/5). In main.c, change small[4] to small[6]. Choose Run code and compare short= and too-long=. How many bytes does Grace need including its terminator? Use the optional native command with SANITIZE=1 to check the same boundary under native diagnostics.

### References and help

- [GCC manual: instrumentation](https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html) — Read what each sanitizer observes and which runtime/toolchain it needs.
- [GCC manual: warning options](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html) — Look up a diagnostic option and the conditions it reports.
- [WebAssembly concepts](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Concepts) — Distinguish source code, a Wasm module, and the host/runtime that supplies its environment.

Native source: `native/examples/files-bytes-5/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=files-bytes-5 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

