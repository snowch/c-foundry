# Testing, sanitizers, portability, and browser runtime limits

Complete native example, ready to edit and run in Codespaces or locally.

## 10.5 Testing, sanitizers, portability, and browser runtime limits

Combine tests with compiler diagnostics, sanitizers, and portability checks. Each tool detects a different set of mistakes; none is a proof that a program is correct.

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

**Try:** Run make example EXAMPLE=files-bytes-5 SANITIZE=1, then add a destination-capacity boundary case.

Run from the repository root:

```sh
make example EXAMPLE=files-bytes-5
```

