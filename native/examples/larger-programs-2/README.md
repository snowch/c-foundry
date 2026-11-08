# Declarations, definitions, linkage, and static

Complete native example, ready to edit and run in Codespaces or locally.

## 9.2 Declarations, definitions, linkage, and static

Linkage determines whether declarations in different scopes or translation units can refer to the same entity. It is distinct from the lifetime of an object.

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

**Watch for:** Defining a shared mutable global in a header can produce multiple definitions at link time. Prefer module functions when they make state ownership clearer.

**Check:** How many source files should define the exported operations object?

1. Exactly one
2. Every file that includes the header

<details><summary>Answer</summary>

Exactly one. The extern declaration can be repeated; the object needs one program definition.

</details>

**Try:** Make operations private too and replace the public object declaration with a read function.

Run from the repository root:

```sh
make example EXAMPLE=larger-programs-2
```

