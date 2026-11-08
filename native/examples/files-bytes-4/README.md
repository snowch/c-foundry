# Undefined behavior, assertions, and debugging

Complete native example, ready to edit and run in Codespaces or locally.

## 10.4 Undefined behavior, assertions, and debugging

Undefined behavior is a broken language contract, not a particular error message. A program can appear to work while reading a dead object or crossing an array boundary.

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

The runtime guard protects the external boundary, while the assertions express assumptions inside at. The program accesses a live array element. To investigate in Codespaces, build with -g, set a breakpoint in at using GDB, and inspect values, count, and index before continuing.

**Watch for:** A dangling pointer is not safe because its address is non-null. Likewise, changing optimization settings may expose a bug, but does not make undefined behavior valid at another setting.

**Check:** Should an assertion be the only validation of untrusted input?

1. Yes
2. No

<details><summary>Answer</summary>

No. Assertions can disappear; external input still needs a runtime error-handling policy.

</details>

**Try:** Use GDB on the example and inspect the valid index rather than deliberately executing an out-of-bounds access.

Run from the repository root:

```sh
make example EXAMPLE=files-bytes-4
```

