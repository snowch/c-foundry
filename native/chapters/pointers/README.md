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

### A pointer stores an address

Dereferencing p accesses the object designated by the address it holds.

An int object x has value 42. Pointer object p holds the address of x, written as &x. Following that address makes *p designate x. The pointer object and its target are different objects. A null or dangling pointer has no valid target to access.

Object boxes show relationships, not physical addresses or sizes.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/pointers/1). In main.c, change *p = 42; to *p = 21;. Choose Run code. Compare value= and null= in Console. Which changes when you write through p, and which comes from the later assignment to p itself?

### References and help

- [C reference: pointers](https://en.cppreference.com/w/c/language/pointer.html) — Check pointer declarations, null pointers, and valid pointer operations.
- [C reference: object lifetime](https://en.cppreference.com/w/c/language/lifetime.html) — Check when an object exists and when access through a pointer becomes invalid.

Native source: `native/examples/pointers-1.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=pointers-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 6.2 Pointers as function arguments

Passing a pointer still passes a value: the callee receives a copy of an address. That copy can reach a caller-owned object, so writing through it can change that object.

A swap takes two int pointers and exchanges the pointed-to values. To change a caller’s pointer variable itself, a function instead needs the address of that pointer: an int ** parameter. Read the levels deliberately. `*destination = target` writes an int * into the caller’s pointer object; `**destination` would access the integer reached through it.

### Copying a pointer can preserve a shared target

The parameter has its own pointer value and still points to the caller’s object.

The caller’s pointer p and the function’s pointer parameter a are separate pointer objects holding the same address &x. Both designate caller object x. Writing *a changes x. Assigning a different address to a alone does not reassign p.

C still passes the pointer argument by value.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/pointers/2). In main.c, change point_to(&p, &b) to point_to(&p, &a). Choose Run code and compare the third Console value with a and b. Did point_to move either integer or change which one p refers to?

### References and help

- [C reference: pointers](https://en.cppreference.com/w/c/language/pointer.html) — Check pointer declarations, null pointers, and valid pointer operations.
- [C reference: object lifetime](https://en.cppreference.com/w/c/language/lifetime.html) — Check when an object exists and when access through a pointer becomes invalid.

Native source: `native/examples/pointers-2.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=pointers-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 6.3 Arrays, pointers, and pointer arithmetic

Pointer arithmetic moves in elements of the pointed-to type. It is constrained by the array object involved; it is not permission to inspect arbitrary neighboring memory.

For an array with n elements, a pointer may designate an element or the one-past position used as an endpoint. A one-past pointer may be compared or subtracted within the appropriate array range, but not dereferenced. Subtracting pointers into the same array produces ptrdiff_t. Most array expressions convert to a pointer to their first element; an array parameter therefore needs an explicit length rather than sizeof on the parameter.

### A half-open range includes lo and excludes hi

For [2, 5), the candidate indices are 2, 3, and 4.

Six array positions are labelled 0 through 5. The half-open interval begins at lo equal to 2 and ends before hi equal to 5. Positions 2, 3, and 4 are candidates. Positions 0, 1, and 5 are outside this interval. The range contains hi minus lo, or three, elements.

This marks a valid search interval within a six-element array; hi is not an index to dereference in this interval.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/pointers/3). In main.c, change int *p = values + 1; to int *p = values;. Choose Run code. Which two elements are now read through p, and why does end - values stay 3?

### References and help

- [C reference: pointers](https://en.cppreference.com/w/c/language/pointer.html) — Check pointer declarations, null pointers, and valid pointer operations.
- [C reference: object lifetime](https://en.cppreference.com/w/c/language/lifetime.html) — Check when an object exists and when access through a pointer becomes invalid.

**Use the documentation (optional):** May you form a pointer one past an array, and may you dereference it?

<details><summary>Compare your answer</summary>

A one-past pointer can be formed and used within the permitted comparison/arithmetic rules for that array. It does not designate an array element and must not be dereferenced.

</details>

Native source: `native/examples/pointers-3.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=pointers-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/pointers/4). In main.c, replace read = &b; with *read = 20; and choose Run code. Read the compiler diagnostic about writing through read. Restore read = &b; and rerun to see 11 20 again. What is const protecting?

### References and help

- [C reference: pointers](https://en.cppreference.com/w/c/language/pointer.html) — Check pointer declarations, null pointers, and valid pointer operations.
- [C reference: object lifetime](https://en.cppreference.com/w/c/language/lifetime.html) — Check when an object exists and when access through a pointer becomes invalid.

Native source: `native/examples/pointers-4.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=pointers-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 6.5 Swapping values through pointers

Implementing swap is a small way to check your understanding of addresses, reads, and writes. Explain where the original value goes before either destination is overwritten.

Save *a in an ordinary local int, assign *b into *a, then assign the saved int into *b. The saved value is a copy, so a later write through a cannot change it. This version also works when both pointers designate the same int. Aliasing means that multiple access paths can reach one object; do not assume different parameter names imply different storage.

### Copying a pointer can preserve a shared target

The parameter has its own pointer value and still points to the caller’s object.

The caller’s pointer p and the function’s pointer parameter a are separate pointer objects holding the same address &x. Both designate caller object x. Writing *a changes x. Assigning a different address to a alone does not reassign p.

C still passes the pointer argument by value.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/pointers/5). In main.c, initialize x to 3 and y to 8, leaving same at 7. Choose Run code and compare all three values. Why does the call with two pointers to same leave its value unchanged?

### References and help

- [C reference: pointers](https://en.cppreference.com/w/c/language/pointer.html) — Check pointer declarations, null pointers, and valid pointer operations.
- [C reference: object lifetime](https://en.cppreference.com/w/c/language/lifetime.html) — Check when an object exists and when access through a pointer becomes invalid.

Native source: `native/examples/pointers-5.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=pointers-5 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## Chapter practice

Edit `native/exercises/pointers.c`, then run:

```sh
make exercise EXERCISE=pointers
```

Chapter workspace command: `make chapter CHAPTER=pointers`.

Generated from dist/part2.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/pointers
