# Interfaces, ownership contracts, and error reporting

Complete native example, ready to edit and run in Codespaces or locally.

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

