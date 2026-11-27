# Chapter 4: Functions and program structure

Part 1: Learn the language. Teaching baseline: C17.

Give computations names and interfaces. Learn how calls pass values, how local state behaves, and how to test a function separately from input and output.

## Outcomes

- Write a prototype, definition, and call with a clear return value.
- Explain parameter copies, local scope, and persistent static storage.
- Decompose and test small computations using representative boundaries.

## 4.1 Parameters, return values, and prototypes

A function packages a computation behind a name, parameter list, and return type. Calling it supplies argument values; execution enters its body and later returns to the caller.

A definition includes the body. A declaration or prototype describes the interface so a caller can be checked before the definition is encountered. In `int twice(int value)`, value is a parameter local to the function and the result type is int. The call `twice(21)` supplies 21 as an argument. A return expression computes the value delivered to the caller. Write void in the parameter list of a C17 function that accepts no arguments.

### main.c

```c
#include <stdio.h>

int twice(int value) {
    return value * 2;
}

int main(void) {
    printf("%d\n", twice(21));
    return 0;
}
```

Output:

```text
42
```

The argument 21 initializes the parameter value. The body computes 42 and returns it. That return value becomes the argument passed to printf. Defining twice above main also declares it before the call; in a larger file, a prototype can appear first and the definition later.

**Watch for:** A return type is a contract. A function that promises an int must provide an appropriate result on every normal path where its caller uses that result. Compiler warnings help detect missing returns.

**Check:** What is the value of twice(4)?

1. 4
2. 8
3. It prints 4 itself

<details><summary>Answer</summary>

8. The function returns 4 * 2. It does not print; printf in the caller handles output.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/functions/1). In main.c, replace the definition of twice above main with int twice(int value); and place the original definition below main. Choose Run code. Does Console still print 42? What information does main get from the prototype?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: functions (included in the explanation above) — Read declarations, parameter types, and the rules for calling functions.
- Course notes: object lifetime (included in the explanation above) — Check when an object exists and when access through a pointer becomes invalid.

**Optional further reading (internet required):**

- [C reference: functions](https://en.cppreference.com/w/c/language/functions.html)
- [C reference: object lifetime](https://en.cppreference.com/w/c/language/lifetime.html)

**Use the documentation (optional):** Does a function’s return type tell you every error condition or ownership rule?

<details><summary>Compare your answer</summary>

No. The type states the returned value’s type. The function’s documented contract must explain error results, ownership, preconditions, and any side effects.

</details>

Native source: `native/examples/functions-1.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=functions-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 4.2 Passing arguments by value

C passes arguments by value: a parameter receives a value of its own. Assigning to that parameter does not replace the caller’s variable.

Think of the call as initializing a new local parameter from the argument. The parameter and the caller’s object then have separate identities. If a caller needs a computed result, return it and assign it explicitly. Later, pointers let functions access objects through addresses, but those pointer arguments are also passed by value. That is an extension of this rule, not an exception to it.

### A parameter is a separate object

Separate illustration: assigning 42 to parameter n leaves caller variable x at 10.

Before the call, caller variable x contains 10. The function receives a copy, parameter n, also containing 10. Assigning 42 to n changes n alone; x remains 10.

The arrow represents copying a value, not shared storage.

### main.c

```c
#include <stdio.h>

int add_one(int value) {
    value++;
    return value;
}

int main(void) {
    int original = 10;
    int result = add_one(original);
    printf("%d %d\n", original, result);
    return 0;
}
```

Output:

```text
10 11
```

value begins at 10 inside add_one, then becomes 11. original in main remains 10. result receives the returned 11. If you instead want original to hold 11, write original = add_one(original). This makes the data flow visible at the call site.

**Watch for:** Matching variable names do not create shared storage. A local variable or parameter named original in another function would still be a separate object.

**Check:** Inside add_one, does value++ directly change main’s variable original?

1. Yes
2. No

<details><summary>Answer</summary>

No. The increment changes the parameter copy. Only the returned result is given back.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/functions/2). In main.c, insert original = result; above printf. Choose Run code. Compare both Console numbers with 10 11. Which assignment changes the caller’s variable?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: functions (included in the explanation above) — Read declarations, parameter types, and the rules for calling functions.
- Course notes: object lifetime (included in the explanation above) — Check when an object exists and when access through a pointer becomes invalid.

**Optional further reading (internet required):**

- [C reference: functions](https://en.cppreference.com/w/c/language/functions.html)
- [C reference: object lifetime](https://en.cppreference.com/w/c/language/lifetime.html)

Native source: `native/examples/functions-2.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=functions-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 4.3 Scope, lifetime, and storage duration

Scope determines where a name can be used. Lifetime determines when its object exists. These ideas are related, but they answer different questions.

An automatic local object normally exists for the execution of its block. A static local object keeps its stored value for the entire program while its name remains local to that scope. A name declared in an inner block can hide a name from an outer block, which is called shadowing. Use distinct names when hiding would confuse a reader. File-scope objects and linkage receive a fuller treatment in the multi-file chapter.

### Scope entry and object lifetime

An ordinary automatic local object cannot be used after its lifetime ends.

On entry to its associated block, an ordinary non-VLA automatic object’s lifetime begins. Its name follows C scope rules, and a value must be initialized before it is read. Leaving the block ends that object’s lifetime. Keeping a pointer does not extend it.

This models non-VLA automatic objects, not a required physical stack layout. Static and allocated storage have different lifetime rules.

### main.c

```c
#include <stdio.h>

int next_count(void) {
    static int count = 0;
    count++;
    return count;
}

int main(void) {
    printf("%d\n", next_count());
    printf("%d\n", next_count());
    return 0;
}
```

Output:

```text
1
2
```

The static object count is initialized once and survives the first return. The second call therefore increments 1 to 2. If count were an ordinary local initialized to zero on each call, both calls would return 1. Persistent state can be useful, but it makes calls depend on history and can later require synchronization.

**Watch for:** Do not return the address of an ordinary local variable for later use: its lifetime ends when the relevant block exits. Part 2 makes that memory rule concrete with pointer examples.

**Check:** If next_count declares int count = 0 instead of static int count = 0, what does its second call return?

1. 1
2. 2
3. 3

<details><summary>Answer</summary>

1. The automatic local is initialized to zero again on each call.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/functions/3). In next_count in main.c, replace static int count = 0; with int count = 0;. Choose Run code again without editing the two calls. Why does Console print 1 twice instead of 1 then 2?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: storage duration and linkage (included in the explanation above) — Separate an object’s lifetime from which declarations name it.
- Course notes: object lifetime (included in the explanation above) — Check when an object exists and when access through a pointer becomes invalid.

**Optional further reading (internet required):**

- [C reference: storage duration and linkage](https://en.cppreference.com/w/c/language/storage_duration.html)
- [C reference: object lifetime](https://en.cppreference.com/w/c/language/lifetime.html)

Native source: `native/examples/functions-3.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=functions-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 4.4 Decomposing a problem into functions

Decomposition separates a program into pieces with clear responsibilities. Begin with a computation that accepts values and returns a result, keeping input and printing outside it.

A rectangle calculator can separate area from perimeter. Each function then has a small contract: nonnegative, suitably bounded dimensions enter, and a numeric result comes back. main can validate input, call the functions, and format the result. This is easier to reason about than a helper that reads input, changes unrelated state, calculates, and prints all at once. Splitting into functions is useful when it clarifies an interface, not merely to make every function tiny.

### main.c

```c
#include <stdio.h>

int area(int width, int height) {
    return width * height;
}

int perimeter(int width, int height) {
    return 2 * (width + height);
}

int main(void) {
    int width = 3, height = 4;
    printf("area=%d perimeter=%d\n",
           area(width, height), perimeter(width, height));
    return 0;
}
```

Output:

```text
area=12 perimeter=14
```

The two helper calls depend only on their parameters and do not change shared state, so their unspecified argument evaluation order is harmless here. Both results are ready when printf formats them. In the chapter exercise, dimensions are restricted to 1 through 100 so the integer operations stay comfortably within the required range.

**Watch for:** A function name should reveal its result or effect. Also document input constraints: moving a multiplication into a helper does not remove its overflow risks.

**Check:** In the rectangle calculator, which responsibility belongs in main rather than the area helper?

1. Formatting the final output
2. Making area read from stdin

<details><summary>Answer</summary>

Formatting the final output. Keeping I/O at the boundary leaves the computation easy to call and test independently.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/functions/4). In main.c, change width from 3 to 5, leaving height at 4. Choose Run code. Compare area= and perimeter= in Console. Which function multiplies the dimensions and which adds them?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: functions (included in the explanation above) — Read declarations, parameter types, and the rules for calling functions.
- Course notes: object lifetime (included in the explanation above) — Check when an object exists and when access through a pointer becomes invalid.

**Optional further reading (internet required):**

- [C reference: functions](https://en.cppreference.com/w/c/language/functions.html)
- [C reference: object lifetime](https://en.cppreference.com/w/c/language/lifetime.html)

Native source: `native/examples/functions-4.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=functions-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 4.5 Testing functions independently

Testing a function means checking its result against its contract for representative inputs. Include ordinary cases and the boundaries where a condition changes behavior.

For a maximum-of-two function, try a first argument that is larger, a second argument that is larger, and equal arguments. Negative values and zero exercise cases that positive-only checks miss. `assert` from `<assert.h>` checks a programmer expectation while assertions are enabled. It is not a replacement for validating external input, and compiling with NDEBUG removes assertions. Never put required side effects into an assertion.

### main.c

```c
#include <stdio.h>
#include <assert.h>

int maximum(int a, int b) {
    if (a > b) return a;
    return b;
}

int main(void) {
    assert(maximum(5, 2) == 5);
    assert(maximum(-3, 0) == 0);
    assert(maximum(4, 4) == 4);
    puts("checks passed");
    return 0;
}
```

Output:

```text
checks passed
```

All calls are pure computations. An incorrect result would stop the assertion-enabled program at the failed expectation. The final line is reached only after the checks pass. These three tests are useful evidence, not a proof for every possible pair of ints. The function’s two return paths also need to be understood.

**Watch for:** An output check can pass even when the intended technique was not used. Combine tests with an explanation of the control flow and constraints, rather than treating a green result as the whole learning goal.

**Check:** Why should a required increment not be written inside assert?

1. Assertions can be removed by NDEBUG
2. assert always runs twice

<details><summary>Answer</summary>

Assertions can be removed by NDEBUG. Removing assertions must not remove behavior the program needs.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/functions/5). In main.c, add assert(maximum(-5, -2) == -2); before puts. Choose Run code and check for checks passed. Then use -5 as the expected value and run again. What evidence tells you the compiler succeeded but an assertion stopped the program?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: functions (included in the explanation above) — Read declarations, parameter types, and the rules for calling functions.
- Course notes: object lifetime (included in the explanation above) — Check when an object exists and when access through a pointer becomes invalid.

**Optional further reading (internet required):**

- [C reference: functions](https://en.cppreference.com/w/c/language/functions.html)
- [C reference: object lifetime](https://en.cppreference.com/w/c/language/lifetime.html)

Native source: `native/examples/functions-5.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=functions-5 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## Chapter practice

Edit `native/exercises/functions.c`, then run:

```sh
make exercise EXERCISE=functions
```

Chapter workspace command: `make chapter CHAPTER=functions`.

Generated from dist/part1.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/functions
