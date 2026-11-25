# Declarations, definitions, linkage, and static

Complete Linux example, ready to edit and run in the browser terminal.

## 9.2 Declarations, definitions, linkage, and static

Linkage determines whether declarations in different scopes or translation units can refer to the same entity. It is distinct from the lifetime of an object.

Also editable and runnable inline in the browser course. Run here, or use Browser Linux for a full GCC build.

This header declares operations with extern. One source file provides its initialized definition. The file-scope static private_count has internal linkage, so other translation units cannot access it by that name; they use the exported functions. A static local also has persistent storage duration, but its name remains block-scoped. The same keyword participates in different declaration contexts, so describe the effect rather than memorizing one slogan.

### counter.h

```c
#ifndef COUNTER_H
#define COUNTER_H
extern int operations;
void tick(void);
int read_private(void);
#endif
```

### counter.c

```c
#include "counter.h"

int operations = 0;
static int private_count;

void tick(void) { operations++; private_count++; }
int read_private(void) { return private_count; }
```

### main.c

```c
#include <stdio.h>
#include "counter.h"

int main(void) {
    tick();
    tick();
    printf("calls=%d private=%d\n", operations, read_private());
    return 0;
}
```

Output:

```text
calls=2 private=2
```

Both objects persist across calls. tick updates the exported counter and the private counter, while main reads the latter through a function. The header contains no ordinary global object definition that would be repeated in each including file.

### A shared declaration refers to one definition

Which state can main name directly, and which stays inside counter.c?

counter.h declares extern int operations and the tick and read_private functions. counter.c defines the one operations object and a separate static private_count object. main.c calls tick twice, which increments both objects. main can name operations through the header, but obtains private_count only by calling read_private. Both reported counts are 2.

Both source files include counter.h. operations has one definition in counter.c; private_count stays private to that file.

**Watch for:** Defining a shared mutable global in a header can produce multiple definitions at link time. Prefer module functions when they make state ownership clearer.

**Check:** How many source files should define the exported operations object?

1. Exactly one
2. Every file that includes the header

<details><summary>Answer</summary>

Exactly one. The extern declaration can be repeated; the object needs one program definition.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/larger-programs/2). Choose main.c in Source files. Add a third tick() before printf. Choose Run code and compare calls= with private=. Which state is read through read_private?

### References and help

- [C reference: preprocessing](https://en.cppreference.com/w/c/preprocessor.html) — Find inclusion, conditional compilation, and macro replacement rules.
- [C reference: storage duration and linkage](https://en.cppreference.com/w/c/language/storage_duration.html) — Separate an object’s lifetime from which declarations name it.

Native source: `native/examples/larger-programs-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=larger-programs-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

