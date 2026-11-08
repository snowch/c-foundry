# Chapter 9: Building larger programs

Part 2: Understand memory and practical C. Teaching baseline: C17.

Build real module boundaries. Compile source files separately, control linkage, and define callback, ownership, and failure contracts that callers can use correctly.

## Outcomes

- Separate header declarations from source definitions.
- Explain internal/external linkage, include guards, and configuration.
- Implement and test a small owned-record module across multiple files.

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

## 9.3 Include guards and the preprocessor

The preprocessor transforms source before ordinary C compilation. Keep its role small and visible: header guards and explicit configuration are common uses.

An include guard wraps a header in a conditional so repeated inclusion in one translation unit does not repeat its contents. The separate FACTOR conditional supplies a default only when configuration has not already defined it. A static inline function keeps ordinary parameter evaluation rules, unlike an expression macro that may evaluate an argument more than once. Header guards do not prevent multiple external definitions across different translation units.

### scale.h

```c
#ifndef SCALE_H
#define SCALE_H
#ifndef FACTOR
#define FACTOR 3
#endif
static inline int scale(int value) { return value * FACTOR; }
#endif
```

### main.c

```c
#include <stdio.h>
#include "scale.h"
#include "scale.h"

int main(void) {
    printf("%d\n", scale(7));
    return 0;
}
```

Output:

```text
21
```

Although scale.h is included twice, its guard admits the body once in main’s translation unit. FACTOR defaults to 3, so scale(7) returns 21. The helper has internal linkage and can appear in another translation unit without creating one conflicting external function definition.

**Watch for:** A macro such as SQUARE(x) expanding to (x)*(x) is unsafe for an argument with side effects. Also parenthesize expression macros carefully when they are genuinely needed.

**Check:** Does an include guard protect against every linker multiple-definition problem?

1. Yes
2. No

<details><summary>Answer</summary>

No. It prevents repetition within one translation unit; separate translation units still need a correct linkage design.

</details>

**Try:** Change the default factor, then inspect the preprocessed source with gcc -E main.c in the example folder.

Run from the repository root:

```sh
make example EXAMPLE=larger-programs-3
```

## 9.4 Function pointers and callbacks

A function pointer lets a caller supply behavior through a typed interface. A callback is a function passed for another component to call according to a documented contract.

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

**Try:** Reverse the comparison’s sign to sort descending and predict the new output.

Run from the repository root:

```sh
make example EXAMPLE=larger-programs-4
```

## 9.5 Interfaces, ownership contracts, and error reporting

A usable interface explains more than parameter types. State what it borrows, what it owns, how it reports failure, and what its outputs mean after failure.

copy_name borrows a valid source string and returns a separately allocated owner through out on success. It sets a supplied output slot to NULL before a failure is possible, making the cleanup policy predictable. Distinct status values distinguish invalid arguments from allocation failure. The output slot must not already be the caller’s only owner of another allocation: overwriting that owner would leak it.

### main.c

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef enum { OK, BAD_INPUT, NO_MEMORY } Status;

Status copy_name(const char *source, char **out) {
    if (!out) return BAD_INPUT;
    *out = NULL;
    if (!source) return BAD_INPUT;
    size_t bytes = strlen(source) + 1;
    char *copy = malloc(bytes);
    if (!copy) return NO_MEMORY;
    memcpy(copy, source, bytes);
    *out = copy;
    return OK;
}

int main(void) {
    char *name = NULL;
    Status result = copy_name("Ada", &name);
    if (result != OK) return 1;
    printf("%s\n", name);
    free(name);
    name = NULL;
    printf("bad input=%d\n", copy_name(NULL, &name) == BAD_INPUT);
    return 0;
}
```

Output:

```text
Ada
bad input=1
```

The caller checks the status before reading the returned string and frees it exactly once. The second call supplies an invalid source and observes BAD_INPUT with a null output. The chapter project extends this ownership contract into a multi-file record-store module.

**Watch for:** Error handling is part of the API, not an afterthought. Document output state on failure and ensure the implementation matches that promise.

**Check:** May a caller assume name is usable after any status?

1. Yes
2. Only after OK

<details><summary>Answer</summary>

Only after OK. The status determines whether the returned owner was established.

</details>

**Try:** Implement the native record-store project and test its failure and cleanup paths.

Run from the repository root:

```sh
make example EXAMPLE=larger-programs-5
```

## Chapter practice

Complete the TODOs in `native/projects/record-store`. The initial student code intentionally fails its checks; consult the project README for requirements.

```sh
make project PROJECT=record-store
```

Chapter workspace command: `make chapter CHAPTER=larger-programs`.

Generated from dist/part2.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/larger-programs
