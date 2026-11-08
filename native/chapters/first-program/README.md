# Chapter 1: Your first C program

Part 1: Learn the language. Teaching baseline: C17.

Write, run, and diagnose a complete C program. You will learn which parts of the source are declarations, statements, and output, and what the browser runner does with them.

## Outcomes

- Trace source through compilation, linking, and execution.
- Write a valid main and format a short output message.
- Use diagnostics to fix a missing-semicolon error and export a file.

## 1.1 Source code, compilation, linking, and execution

A C source file is a description of a program. The computer cannot run that text directly: a compiler translates it, and a linker combines the translated code with the support it needs.

In this course the file is called `main.c`. Preprocessing handles directives such as `#include`. Compilation checks the language rules and produces object code; linking resolves references such as a call to `printf`. On a Linux system, the result is a native executable. In this page, Clang and the linker produce a WebAssembly module that the browser can execute. These stages explain why a successful edit is not yet a running program.

### main.c

```c
#include <stdio.h>

int main(void) {
    printf("Hello, C!\n");
    return 0;
}
```

Output:

```text
Hello, C!
```

The header declares printf so the compiler can check its use. The call asks the runtime to write a line. The final return ends main successfully. The browser lab performs the compile, link, and run stages when you choose Run code; you do not need to install a compiler for Part 1.

**Watch for:** A compiler error prevents the new program from running. A runtime error happens after compilation and linking have succeeded. Treat these as different points in the process.

**Check:** Which stage resolves a reference to a library function such as printf?

1. Editing
2. Linking
3. Running

<details><summary>Answer</summary>

Linking. The linker connects translated code with the functions and support it references.

</details>

**Try:** Change the greeting, run the program, and check that the console reflects the new text.

Run from the repository root:

```sh
make example EXAMPLE=first-program-1
```

## 1.2 main, statements, comments, and return values

Execution begins in main for the small hosted C programs in this course. Read the function body from its opening brace to its closing brace: statements normally execute in order.

`int main(void)` says that main returns an integer status and takes no arguments. The braces delimit its body. An expression statement such as a function call ends in a semicolon. A `//` comment continues to the end of its line; a `/* ... */` comment can span several lines. Comments help a reader understand intent but do not execute. Function definitions and return values get a fuller treatment in Chapter 4.

### main.c

```c
#include <stdio.h>

int main(void) {
    // Print two messages, in order.
    printf("First\n");
    printf("Second\n");
    return 0;
}
```

Output:

```text
First
Second
```

The first printf completes before the second call is reached. Each string contains a newline, so the two calls produce two lines. Returning 0 tells the environment that the program completed successfully. It is a status, not a request to print the number zero.

**Watch for:** Braces group statements; semicolons terminate many statements. A missing semicolon can cause an error on the following line, where the compiler finally notices the problem.

**Check:** Does return 0 print a zero in the console?

1. Yes
2. No

<details><summary>Answer</summary>

No. Returning a status and writing output are separate operations.

</details>

**Try:** Swap the two printf statements. Predict the new order before running.

Run from the repository root:

```sh
make example EXAMPLE=first-program-2
```

## 1.3 Printing with printf

printf writes formatted text. The first argument is a format string: ordinary characters are printed, while conversion specifications describe how to print later arguments.

A string literal uses double quotes. Within it, `\n` represents a newline, `\t` a tab, `\\` a backslash, and `\"` a double quote. The specification `%d` expects an int; `%%` prints a literal percent sign and consumes no argument. The order and types of arguments must match the format. Chapter 2 introduces additional types and their formats.

### main.c

```c
#include <stdio.h>

int main(void) {
    printf("Count: %d\n", 3);
    printf("Progress: 100%%\n");
    return 0;
}
```

Output:

```text
Count: 3
Progress: 100%
```

The first call substitutes 3 for %d and then starts a new line. The second prints a percent sign from %%. A newline is part of the output string; it does not come automatically from printf. Incorrect format/argument combinations can cause undefined behavior, so read format warnings carefully.

**Watch for:** Writing /n uses a forward slash and the letter n. It is not the newline escape. Also, avoid using user-provided text as the format string; print text through a suitable fixed format instead.

**Check:** What does printf("%d%%", 25) print?

1. 25%
2. 25%%
3. %d%

<details><summary>Answer</summary>

25%. The %d consumes 25; %% contributes one literal percent sign.

</details>

**Try:** Print two labeled integer values on separate lines. Include a literal percent sign in one line.

Run from the repository root:

```sh
make example EXAMPLE=first-program-3
```

## 1.4 Reading compiler errors

A diagnostic is evidence about where the compiler became unable to understand or accept your source. Read the first error, inspect its location, and make one small correction before compiling again.

Consider `printf("Hello")` followed by `return 0;`. The call is missing its semicolon. The compiler may point at return because that is where it discovers the previous statement was not terminated. Warnings describe suspicious constructs that a compiler may still translate. Keep warnings visible: a successful build does not establish correct behavior. Linking failures, such as an undefined function reference, belong to a later stage.

### main.c

```c
#include <stdio.h>

int main(void) {
    printf("Hello\n");
    return 0;
}
```

Output:

```text
Hello
```

This is the corrected program. Remove the semicolon after printf in the editor and run it to observe a real compiler diagnostic. Restore the semicolon and rerun. If several errors appear, start at the first; later messages can be consequences of the same initial mistake. Exact diagnostic wording depends on compiler version.

**Watch for:** Do not change a large number of lines to silence a list of errors. A small edit-and-recompile cycle makes it easier to connect a cause with its effect.

**Check:** The compiler points at return, but the preceding printf has no semicolon. What should you inspect first?

1. The preceding statement
2. The browser storage
3. The output font

<details><summary>Answer</summary>

The preceding statement. The reported location is where parsing failed, which can follow the actual mistake.

</details>

**Try:** Create the missing-semicolon error, read it, fix it, and explain why its location may be one line later.

Run from the repository root:

```sh
make example EXAMPLE=first-program-4
```

## 1.5 C, WebAssembly, and standard input/output

The browser lab is a C environment with a limited operating-system interface. It is useful to know what belongs to the C language, what belongs to the runtime, and what the page itself provides.

The editor contains source. Run code compiles and executes it in a worker so the page remains responsive. Console shows program output and diagnostics. Input supplies text before execution; it is not an interactive terminal that waits for you to type midway through the run. Later exercises will read it. Check output compares observable results with practice cases. It does not prove that an algorithm is appropriate or memory is managed correctly.

### main.c

```c
#include <stdio.h>

int main(void) {
    printf("This program runs in the browser.\n");
    return 0;
}
```

Output:

```text
This program runs in the browser.
```

This program needs only standard output. A Wasm module is generated and executed locally. Your edited source can be saved in this browser, but a program’s temporary files do not become permanent course data. Use Export for a copy you can keep or move to Codespaces. Stop terminates the running worker, including a program stuck in a loop.

**Watch for:** Native Linux processes, sockets, and C threads are not supplied by this lab. Chapters that need those capabilities identify Codespaces as their execution environment; they are still readable on a tablet.

**Check:** When should you supply input for the current browser runner?

1. Before pressing Run code
2. Only after the program asks in Console

<details><summary>Answer</summary>

Before pressing Run code. The runner passes the Input text at the start. It does not offer an interactive stdin prompt.

</details>

**Try:** Open the chapter’s greeting exercise. Edit, run, check, and export your first C file.

Run from the repository root:

```sh
make example EXAMPLE=first-program-5
```

## Chapter practice

Edit `native/exercises/hello.c`, then run:

```sh
make exercise EXERCISE=hello
```

Chapter workspace command: `make chapter CHAPTER=first-program`.

Generated from dist/part1.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/first-program
