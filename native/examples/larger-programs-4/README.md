# Function pointers and callbacks

Complete native example, ready to edit and run in Codespaces or locally.

## 9.4 Function pointers and callbacks

A function pointer lets a caller supply behavior through a typed interface. A callback is a function passed for another component to call according to a documented contract.

Also editable and runnable inline in the browser course. Run here, or use the native command below with your own C toolchain.

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

**Check:** Why avoid a - b as this comparator?

1. It can overflow
2. qsort only accepts positive results

<details><summary>Answer</summary>

It can overflow. A comparator should handle every supported int pair without undefined signed overflow.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/larger-programs/4). In main.c, swap the two comparison expressions in compare_ints so positive becomes negative and negative becomes positive. Choose Run code. Which output end now contains -3, and do both 7 values remain?

### References and help

- [C reference: functions](https://en.cppreference.com/w/c/language/functions.html) — Read declarations, parameter types, and the rules for calling functions.
- [C reference: pointers](https://en.cppreference.com/w/c/language/pointer.html) — Check pointer declarations, null pointers, and valid pointer operations.

Native source: `native/examples/larger-programs-4/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=larger-programs-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

