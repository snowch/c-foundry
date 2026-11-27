# Header files and separate compilation

Complete Linux example, ready to edit and run in the browser terminal.

## 9.1 Header files and separate compilation

Separate compilation lets an implementation change without placing every definition in the caller’s source file. The header states an interface; the source file provides its implementation.

Also editable and runnable inline in the browser course. Run here, or use Browser Linux for a full GCC build.

Each .c file is preprocessed and compiled as its own translation unit. Include the module’s own header in its implementation as well as in callers, so incompatible declarations can be diagnosed. The linker then combines the object files. A declaration makes a name and type known; it does not by itself supply the function’s executable definition.

### Source becomes a runnable program

Preprocessing, compilation, linking, and execution have different jobs.

Start with main.c. Preprocessing expands includes and macros. Compilation translates the resulting C into object code. The linker resolves references between objects and libraries and produces a program. A native operating system or a Wasm runtime executes the result. A successful translation is separate from a successful run.

The target determines whether the final program is native code or a WebAssembly module.

### operations.h

```c
#ifndef OPERATIONS_H
#define OPERATIONS_H
int twice(int value);
#endif
```

### operations.c

```c
#include "operations.h"

int twice(int value) {
    return value * 2;
}
```

### main.c

```c
#include <stdio.h>
#include "operations.h"

int main(void) {
    printf("%d\n", twice(21));
    return 0;
}
```

Output:

```text
42
```

main.c sees the declaration of twice through operations.h. operations.c supplies the matching definition. Compile both .c files and link them together; compiling only main.c cannot provide the missing definition. The example command compiles the complete file set in the repository workspace.

**Watch for:** Do not include operations.c into main.c to simulate a module boundary. Include the header and compile the implementation separately.

**Check:** Which file belongs in an #include in the caller?

1. operations.h
2. operations.c

<details><summary>Answer</summary>

operations.h. The public header describes the interface; the implementation is a separately compiled translation unit.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/larger-programs/1). Choose operations.c above the editor. In twice, change the multiplication by 2 to multiplication by 3. Choose Run code and compare Console with 42. Which file supplies the changed definition?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: compilation stages (included in the explanation above) — Compare preprocessing, compilation, assembly, and linking; inspect -E, -S, and -c.
- Course notes: storage duration and linkage (included in the explanation above) — Separate an object’s lifetime from which declarations name it.

**Optional further reading (internet required):**

- [GCC manual: compilation stages](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html)
- [C reference: storage duration and linkage](https://en.cppreference.com/w/c/language/storage_duration.html)

Native source: `native/examples/larger-programs-1/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=larger-programs-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

