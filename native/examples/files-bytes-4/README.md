# Undefined behavior, assertions, and debugging

Complete Linux example, ready to edit and run in the browser terminal.

## 10.4 Undefined behavior, assertions, and debugging

Undefined behavior is a broken language contract, not a particular error message. A program can appear to work while reading a dead object or crossing an array boundary.

Also editable and runnable inline in the browser course. This program runs with the browser’s fixed C17 toolchain. Use Browser Linux for compiler warnings and GCC/Clang comparisons; optional sanitizer tooling is described separately.

Validate external inputs before use, and use assertions to document internal invariants while developing. A debugger can show values, call stacks, and control flow, but an observed run cannot turn an invalid operation into a guarantee. Build with debug information and warnings. Keep required behavior outside assert, because NDEBUG can remove assertions. The example’s caller explicitly validates the index before calling the helper.

### main.c

```c
#include <stdio.h>
#include <assert.h>

int at(const int *values, size_t count, size_t index) {
    assert(values != NULL);
    assert(index < count);
    return values[index];
}

int main(void) {
    const int values[] = {4, 8, 12};
    size_t index = 2;
    if (index >= 3) return 1;
    printf("%d\n", at(values, 3, index));
    return 0;
}
```

Output:

```text
12
```

The runtime guard protects the external boundary, while the assertions express assumptions inside at. The program accesses a live array element. To investigate in Browser Linux, build with -g, set a breakpoint in at using GDB, and inspect values, count, and index before continuing.

**Watch for:** A dangling pointer is not safe because its address is non-null. Likewise, changing optimization settings may expose a bug, but does not make undefined behavior valid at another setting.

**Check:** Should an assertion be the only validation of untrusted input?

1. Yes
2. No

<details><summary>Answer</summary>

No. Assertions can disappear; external input still needs a runtime error-handling policy.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/files-bytes/4). In main.c, change index from 2 to 1 and choose Run code. Compare Console with 12. Both indices are valid; which element does each access?

### References and help

- [C reference: behavior categories](https://en.cppreference.com/w/c/language/behavior.html) — Distinguish undefined, unspecified, and implementation-defined behavior.
- [C reference: assert](https://en.cppreference.com/w/c/error/assert.html) — Check what the diagnostic macro does and how NDEBUG changes its behavior.

Native source: `native/examples/files-bytes-4/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=files-bytes-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

