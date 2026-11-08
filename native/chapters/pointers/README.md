# Chapter 6: Pointers

Part 2: Understand memory and practical C. Teaching baseline: C17.

Follow addresses without losing track of the objects they designate. Learn which writes change values, which change pointers, and how array bounds and const constrain access.

## Outcomes

- Distinguish a pointer object, its value, and its live target.
- Pass addresses and pointer-to-pointer outputs deliberately.
- Respect array endpoints, const declarations, and aliasing.

## 6.1 Addresses, dereferencing, and null pointers

A pointer is an object whose value can designate another object. Keep three things separate: the pointer variable, the address value it holds, and the object reached through that address.

`&x` produces the address of x. In an expression, `*p` accesses the object that p points to; in a declaration, the * is part of declaring a pointer. A null pointer designates no object. Test a pointer when its contract permits NULL, and never dereference it in that state. Being non-null alone does not prove that its target is alive or accessible.

### main.c

```c
#include <stdio.h>

int main(void) {
    int value = 10;
    int *p = &value;
    *p = 42;
    printf("value=%d\n", value);
    p = NULL;
    printf("null=%d\n", p == NULL);
    return 0;
}
```

Output:

```text
value=42
null=1
```

p first holds an address that reaches value. The assignment through *p changes value, not the address in p. Assigning NULL afterward changes the pointer itself. It does not undo the earlier write or destroy value. The program compares the null pointer but never dereferences it.

**Watch for:** An uninitialized pointer is not an empty pointer. Initialize it to a valid address or NULL, and establish lifetime and bounds before use.

**Check:** Which statement changes the integer reached by p?

1. p = NULL;
2. *p = 42;

<details><summary>Answer</summary>

*p = 42;. Dereferencing selects the pointed-to object as the destination of the assignment.

</details>

**Try:** Change the write to 21, then compare value and *p before setting p to NULL.

Run from the repository root:

```sh
make example EXAMPLE=pointers-1
```

## 6.2 Pointers as function arguments

Passing a pointer still passes a value: the callee receives a copy of an address. That copy can reach a caller-owned object, so writing through it can change that object.

A swap takes two int pointers and exchanges the pointed-to values. To change a caller’s pointer variable itself, a function instead needs the address of that pointer: an int ** parameter. Read the levels deliberately. `*destination = target` writes an int * into the caller’s pointer object; `**destination` would access the integer reached through it.

### main.c

```c
#include <stdio.h>

void swap(int *a, int *b) {
    int saved = *a;
    *a = *b;
    *b = saved;
}

void point_to(int **destination, int *target) {
    *destination = target;
}

int main(void) {
    int a = 10, b = 42;
    swap(&a, &b);
    int *p = &a;
    point_to(&p, &b);
    printf("%d %d %d\n", a, b, *p);
    return 0;
}
```

Output:

```text
42 10 10
```

The swap writes 42 into a and 10 into b. The local pointer p initially reaches a. point_to receives &p, so its assignment redirects p to b. These helpers require non-null pointers to live objects; the caller supplies them. Each pointer parameter is still a separate copy.

**Watch for:** Assigning to a plain int * parameter cannot redirect the caller’s pointer. It only replaces the callee’s copy unless the function returns a new pointer or receives a pointer-to-pointer.

**Check:** What parameter type allows a helper to replace a caller’s int *?

1. int
2. int *
3. int **

<details><summary>Answer</summary>

int **. The helper needs access to the pointer object itself, through its address.

</details>

**Try:** Remove point_to and pass &p to a helper that sets p to NULL. Do not dereference p afterward.

Run from the repository root:

```sh
make example EXAMPLE=pointers-2
```

## 6.3 Arrays, pointers, and pointer arithmetic

Pointer arithmetic moves in elements of the pointed-to type. It is constrained by the array object involved; it is not permission to inspect arbitrary neighboring memory.

For an array with n elements, a pointer may designate an element or the one-past position used as an endpoint. A one-past pointer may be compared or subtracted within the appropriate array range, but not dereferenced. Subtracting pointers into the same array produces ptrdiff_t. Most array expressions convert to a pointer to their first element; an array parameter therefore needs an explicit length rather than sizeof on the parameter.

### main.c

```c
#include <stdio.h>
#include <stddef.h>

int main(void) {
    int values[] = {2, 4, 6};
    int *p = values + 1;
    int *end = values + 3;
    printf("%d %d %td\n", *p, *(p + 1), end - values);
    return 0;
}
```

Output:

```text
4 6 3
```

p reaches the second int, so *p is 4 and *(p + 1) is 6. end is one past the third element, and end - values counts three int elements, not their byte size. The td format prints ptrdiff_t. No expression reads *end.

**Watch for:** Subtracting unrelated pointers or dereferencing the endpoint has undefined behavior. An apparently plausible address is not evidence that an access is valid.

**Check:** May this program read *end?

1. Yes: it is an endpoint
2. No: it is one past the array

<details><summary>Answer</summary>

No: it is one past the array. The one-past position supports iteration boundaries, not reading another element.

</details>

**Try:** Write a loop from values to end that prints each value while p != end.

Run from the repository root:

```sh
make example EXAMPLE=pointers-3
```

## 6.4 const and pointer declarations

const can constrain the pointed-to object, the pointer object, or both. Read each declaration from the name outward and ask which assignment the compiler should reject.

`const int *read` prevents modifying an int through read, but read may be redirected. `int *const fixed` fixes the pointer after initialization, while permitting writes through it to a modifiable int. These declarations do not create ownership or extend the target’s lifetime. A read-only interface can accept a modifiable object without promising that the entire program has no other writer.

### main.c

```c
#include <stdio.h>

int main(void) {
    int a = 10, b = 20;
    const int *read = &a;
    int *const fixed = &a;
    *fixed = 11;
    read = &b;
    printf("%d %d\n", a, *read);
    return 0;
}
```

Output:

```text
11 20
```

fixed keeps the address of a and writes 11 into a. read can then point at b and read 20. Trying *read = 7 or fixed = &b is rejected by the relevant type constraint. A cast that removes const does not make a genuinely const object modifiable.

**Watch for:** const is not a lock and does not make shared access thread-safe. Also, a const-qualified pointer can still dangle when the target’s lifetime ends.

**Check:** Which assignment is allowed by const int *read?

1. read = &b;
2. *read = 7;

<details><summary>Answer</summary>

read = &b;. The pointer may change, but this access path does not permit modifying the int.

</details>

**Try:** Introduce one forbidden assignment at a time, read the diagnostic, and restore the valid version.

Run from the repository root:

```sh
make example EXAMPLE=pointers-4
```

## 6.5 Swapping values through pointers

Implementing swap is a small way to check your understanding of addresses, reads, and writes. Explain where the original value goes before either destination is overwritten.

Save *a in an ordinary local int, assign *b into *a, then assign the saved int into *b. The saved value is a copy, so a later write through a cannot change it. This version also works when both pointers designate the same int. Aliasing means that multiple access paths can reach one object; do not assume different parameter names imply different storage.

### main.c

```c
#include <stdio.h>

void swap(int *a, int *b) {
    int saved = *a;
    *a = *b;
    *b = saved;
}

int main(void) {
    int x = 10, y = 42;
    swap(&x, &y);
    int same = 7;
    swap(&same, &same);
    printf("%d %d %d\n", x, y, same);
    return 0;
}
```

Output:

```text
42 10 7
```

The first call exchanges two objects. The second reads and writes the same object through both parameters; each step leaves a valid value and the final result is still 7. Both calls satisfy the helper’s requirement of pointers to live, modifiable ints.

**Watch for:** Overwriting *a before saving it loses the original value. Conversely, changing a rather than *a changes only a pointer copy.

**Check:** Why does the temporary survive the write to *a?

1. It stores its own int value
2. It is another name for *a

<details><summary>Answer</summary>

It stores its own int value. The initializer copies the integer into a separate local object.

</details>

**Try:** Complete the pointer exercise, then add a same-object call and explain the result.

Run from the repository root:

```sh
make example EXAMPLE=pointers-5
```

## Chapter practice

Edit `native/exercises/pointers.c`, then run:

```sh
make exercise EXERCISE=pointers
```

Chapter workspace command: `make chapter CHAPTER=pointers`.

Generated from dist/part2.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/pointers
