# Chapter 7: Dynamic memory and ownership

Part 2: Understand memory and practical C. Teaching baseline: C17.

Make memory lifetimes explicit. Allocate and initialize safely, preserve ownership across failures, and build buffers whose length and capacity have separate meanings.

## Outcomes

- Use malloc, calloc, realloc, and free with a clear owner.
- Reject overflowing sizes and handle deterministic failure paths.
- Build a growable array and understand the matching string-builder pattern.

## 7.1 Stack storage and heap allocation

Automatic storage is tied to a block’s execution. Dynamically allocated storage remains available until it is released, so its lifetime must be managed explicitly.

malloc requests a byte count and returns either a suitably aligned allocation or NULL. The allocation is not initialized. Use sizeof on the pointed-to type when calculating space, check the result, and initialize each element before reading it. In C, the void * result converts to an object pointer without an explicit cast. The owner is the code responsible for eventually calling free.

### main.c

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    size_t count = 5;
    int *values = malloc(count * sizeof *values);
    if (values == NULL) return 1;
    int total = 0;
    for (size_t i = 0; i < count; i++) {
        values[i] = (int)i + 1;
        total += values[i];
    }
    printf("%d\n", total);
    free(values);
    return 0;
}
```

Output:

```text
15
```

The constant count is small enough for this size calculation. Each value is written before it contributes to the sum. free ends the allocation’s lifetime after its final use. The local pointer variable itself remains in scope, but its old value must not be used to access the released object.

**Watch for:** Returning a pointer to an ordinary local array does not create a heap allocation. Its block lifetime ends even though the address can be copied elsewhere.

**Check:** Does malloc initialize every int to zero?

1. Yes
2. No

<details><summary>Answer</summary>

No. The bytes have indeterminate contents until you establish values in them.

</details>

**Try:** Move free before printf only if the sum has already been copied into total. Explain which objects the print still accesses.

Run from the repository root:

```sh
make example EXAMPLE=allocation-1
```

## 7.2 malloc, calloc, realloc, and free

calloc initializes its allocated bytes to zero. realloc changes an allocation’s size and may move it. Treat that possible move as an ownership transition rather than assuming the address stays fixed.

For a nonzero requested size, a failed realloc leaves the original allocation valid. Store the result in a temporary pointer and replace the owner only after success. On success, old aliases must no longer be used, even if the numerical address appears unchanged. Newly added bytes are not initialized by realloc; establish values before reading them. Avoid zero-size allocation edge cases in this interface.

### main.c

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *values = calloc(3, sizeof *values);
    if (!values) return 1;
    printf("first=%d\n", values[0]);
    int *grown = realloc(values, 6 * sizeof *values);
    if (!grown) { free(values); return 1; }
    values = grown;
    for (int i = 3; i < 6; i++) values[i] = i + 1;
    printf("last=%d\n", values[5]);
    free(values);
    return 0;
}
```

Output:

```text
first=0
last=6
```

The first three int objects have zero values after calloc on these C integer types. The expanded region is filled explicitly, so the last value is 6. If growth fails, the code frees the still-owned original allocation. If it succeeds, values becomes the sole owner of the resized allocation.

**Watch for:** Writing values = realloc(values, bytes) directly can lose the only pointer to the old allocation when realloc returns NULL.

**Check:** When a nonzero realloc request fails, who still owns the original allocation?

1. The caller
2. Nobody: it was automatically freed

<details><summary>Answer</summary>

The caller. Failure preserves the original allocation and its contents.

</details>

**Try:** Change the initial values, grow the array, and verify that the earlier elements are preserved.

Run from the repository root:

```sh
make example EXAMPLE=allocation-2
```

## 7.3 Allocation failure and size calculations

Allocation sizes need arithmetic checks before the allocator is called. Otherwise a multiplication can wrap to a small size while later code assumes a much larger array.

For count elements of type int, reject a count larger than SIZE_MAX / sizeof(int) before multiplying. Define your policy for zero elements explicitly. To study a failure path without depending on the operating system’s memory state, inject a deterministic allocator that can deliberately return NULL. Such a test is a model of failure, not evidence that a particular large allocation will fail on every machine.

### main.c

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

void *allocate_for_demo(size_t bytes, bool fail) {
    if (fail) return NULL;
    return malloc(bytes);
}

int main(void) {
    size_t count = SIZE_MAX;
    if (count > SIZE_MAX / sizeof(int)) puts("overflow rejected");
    int *values = allocate_for_demo(4 * sizeof *values, true);
    if (!values) puts("simulated failure handled");
    free(values);
    return 0;
}
```

Output:

```text
overflow rejected
simulated failure handled
```

The count check rejects the impossible int-array size before multiplication. The second request deliberately fails, allowing the error branch to be observed repeatably. free(NULL) is defined to do nothing. A successful request would instead need initialization, use, and eventual release.

**Watch for:** Do not deliberately consume the machine’s memory to test failure handling. It is unreliable and can disrupt other work. Also distinguish arithmetic validation from the allocator’s own ability to satisfy a valid request.

**Check:** Should count * sizeof(int) be evaluated before checking for size overflow?

1. Yes
2. No

<details><summary>Answer</summary>

No. A wrapped multiplication has already lost the size you intended to request.

</details>

**Try:** Make the injected allocator succeed for a small request, initialize the ints, and add cleanup for that path.

Run from the repository root:

```sh
make example EXAMPLE=allocation-3
```

## 7.4 Leaks, dangling pointers, and double frees

Ownership is a program convention explaining who releases an allocation. Copying a pointer does not copy the allocation or create another independent owner.

A helper that returns a newly allocated copy transfers ownership to its caller. A borrowed pointer permits use under a stated lifetime but does not transfer the obligation to free. Define whether a function borrows, takes, or returns ownership in its interface. After free, every alias into that allocation is invalid for access; setting one owner variable to NULL does not update other aliases.

### main.c

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *copy_text(const char *source) {
    size_t bytes = strlen(source) + 1;
    char *copy = malloc(bytes);
    if (copy) memcpy(copy, source, bytes);
    return copy;
}

int main(void) {
    char original[] = "Hi";
    char *copy = copy_text(original);
    if (!copy) return 1;
    copy[0] = 'B';
    printf("%s %s\n", original, copy);
    free(copy);
    copy = NULL;
    return 0;
}
```

Output:

```text
Hi Bi
```

The source is borrowed and must be a valid terminated string whose length plus one is representable. The helper copies its bytes into separate storage. Changing copy does not change original. The caller frees the returned allocation once and does not attempt to free the automatic original array.

**Watch for:** A double free is not harmless cleanup, and a dangling pointer is not made safe by being non-null. Review all returns and error paths for the same ownership rule.

**Check:** Does assigning another pointer variable to copy create a second allocation?

1. Yes
2. No

<details><summary>Answer</summary>

No. It copies an address. Both pointers would reach the same allocation.

</details>

**Try:** Write down the owner and borrowed access paths in this program before adding another pointer to the copy.

Run from the repository root:

```sh
make example EXAMPLE=allocation-4
```

## 7.5 A growing array and string builder

A growable buffer separates length from capacity. Length describes initialized content in use; capacity describes how much storage is currently available.

A string builder also needs one spare byte for its zero terminator. Before appending, compute the required size without overflow, grow through a temporary realloc result if necessary, and copy the new text including its terminator. This append interface borrows suffix and requires that it not point into the builder’s own allocation, since growth could invalidate such an alias. On failure, the caller still owns the previous buffer.

### main.c

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>

bool append(char **text, size_t *length, size_t *capacity, const char *suffix) {
    size_t extra = strlen(suffix);
    if (*length == SIZE_MAX || extra > SIZE_MAX - *length - 1) return false;
    size_t needed = *length + extra + 1;
    if (needed > *capacity) {
        size_t next = *capacity ? *capacity : 8;
        while (next < needed) {
            if (next > SIZE_MAX / 2) { next = needed; break; }
            next *= 2;
        }
        char *grown = realloc(*text, next);
        if (!grown) return false;
        *text = grown;
        *capacity = next;
    }
    memcpy(*text + *length, suffix, extra + 1);
    *length += extra;
    return true;
}

int main(void) {
    char *text = NULL;
    size_t length = 0, capacity = 0;
    if (!append(&text, &length, &capacity, "hello") ||
        !append(&text, &length, &capacity, " C")) {
        free(text);
        return 1;
    }
    printf("%s\nlength=%zu fits=%d\n", text, length, capacity >= length + 1);
    free(text);
    return 0;
}
```

Output:

```text
hello C
length=7 fits=1
```

The first append creates storage and writes a valid string. The second reuses capacity if it fits. length excludes the zero terminator; needed includes it. The pointer-to-pointer lets append replace the caller’s owner after growth. The chapter project applies the same rules to a dynamic int array.

**Watch for:** Capacity is not the number of initialized elements. Never traverse unused capacity as though it were meaningful content, and never discard the owner on a failed growth request.

**Check:** For a string of length 7, what minimum capacity is needed?

1. 7
2. 8

<details><summary>Answer</summary>

8. The terminator needs one additional char element.

</details>

**Try:** Append another literal, then implement the chapter’s growable-array project.

Run from the repository root:

```sh
make example EXAMPLE=allocation-5
```

## Chapter practice

Edit `native/exercises/grow.c`.

```sh
make exercise EXERCISE=grow
```

Chapter workspace command: `make chapter CHAPTER=allocation`.

Generated from dist/part2.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/allocation
