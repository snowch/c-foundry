# Function pointers and callbacks

Complete Linux example, ready to edit and run in the browser terminal.

## 9.4 Function pointers and callbacks

A function pointer lets a caller supply behavior through a typed interface. A callback is a function passed for another component to call according to a documented contract.

Also editable and runnable inline in the browser course. Run here, or use Browser Linux for a full GCC build.

qsort receives a comparison callback. Its two arguments designate elements, and its result must be negative, zero, or positive according to their ordering. The callback converts each void pointer back to the correct element type before reading it. The function signature and element-size argument must match the actual array. The standard does not promise a particular sorting algorithm or stability.

### main.c

```c
#include <stdio.h>
#include <stdlib.h>

int compare_ints(const void *left, const void *right) {
    int a = *(const int *)left;
    int b = *(const int *)right;
    return (a > b) - (a < b);
}

int main(void) {
    int values[] = {7, -3, 0, 7};
    qsort(values, 4, sizeof values[0], compare_ints);
    for (size_t i = 0; i < 4; i++) printf("%s%d", i ? " " : "", values[i]);
    puts("");
    return 0;
}
```

Output:

```text
-3 0 7 7
```

The relational expressions each yield 0 or 1, so their difference produces a valid sign without subtracting the potentially extreme element values themselves. Equal values compare as zero. The callback must describe a consistent ordering throughout the call.

**Watch for:** return a - b can overflow for valid int values, and casting an incompatible function pointer does not repair a mismatched callback signature.

**Check:** Why would return a - b be unsafe for a comparator that must support every int pair?

1. It can overflow
2. qsort only accepts positive results

<details><summary>Answer</summary>

It can overflow. A comparator should handle every supported int pair without undefined signed overflow.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/larger-programs/4). In main.c, swap the two comparison expressions in compare_ints so positive becomes negative and negative becomes positive. Choose Run code. Which output end now contains -3, and do both 7 values remain?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: functions (included in the explanation above) — Read declarations, parameter types, and the rules for calling functions.
- Course notes: pointers (included in the explanation above) — Check pointer declarations, null pointers, and valid pointer operations.

**Optional further reading (internet required):**

- [C reference: functions](https://en.cppreference.com/w/c/language/functions.html)
- [C reference: pointers](https://en.cppreference.com/w/c/language/pointer.html)

Native source: `native/examples/larger-programs-4/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=larger-programs-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

