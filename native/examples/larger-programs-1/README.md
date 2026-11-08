# Header files and separate compilation

Complete native example, ready to edit and run in Codespaces or locally.

## 9.1 Header files and separate compilation

Separate compilation lets an implementation change without placing every definition in the caller’s source file. The header states an interface; the source file provides its implementation.

Each .c file is preprocessed and compiled as its own translation unit. Include the module’s own header in its implementation as well as in callers, so incompatible declarations can be diagnosed. The linker then combines the object files. A declaration makes a name and type known; it does not by itself supply the function’s executable definition.

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

**Try:** Change twice in operations.c and rebuild the same multi-file example.

Run from the repository root:

```sh
make example EXAMPLE=larger-programs-1
```

