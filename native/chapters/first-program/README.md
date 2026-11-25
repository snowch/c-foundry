# Chapter 1: Your first C program

Part 1: Learn the language. Teaching baseline: C17.

Write, run, and diagnose a complete C program. You will learn which parts of the source are declarations, statements, and output, and what the browser runner does with them.

## Outcomes

- Trace source through compilation, linking, and execution.
- Write a valid main and format a short output message.
- Use diagnostics to fix a missing-semicolon error and export a file.
- Find a function reference, identify its contract, and verify a documented result.

## 1.1 Source code, compilation, linking, and execution

Your main.c file is text. Before it can run, tools prepare it, translate it, and connect it to library code.

You don’t need to understand every build step yet. <strong>Run code</strong> handles those steps for you. For now, focus on running the program and changing its greeting. We’ll explore preprocessing, compilation, and linking further in [Chapter 9, Building larger programs](https://snowch.github.io/c-foundry/#/chapter/larger-programs).

<strong>Preprocessing</strong> handles lines such as `#include <stdio.h>`, which brings in descriptions of available functions. The <strong>compiler</strong> checks your C and translates it into an object file, one piece of the program. The <strong>linker</strong> connects that piece to library code such as `printf`. Together, these steps <strong>build</strong> the program. Here the result is <strong>WebAssembly</strong>: a binary program format the browser can run. A local build can instead produce an executable for your computer.

### Source becomes a runnable program

Preprocessing, compilation, linking, and execution have different jobs.

Start with main.c. Preprocessing expands includes and macros. Compilation translates the resulting C into object code. The linker resolves references between objects and libraries and produces a program. A native operating system or a Wasm runtime executes the result. A successful translation is separate from a successful run.

The target determines whether the final program is native code or a WebAssembly module.

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

The header declares printf. Calling printf writes the greeting and a newline. Returning zero reports successful completion to the runtime.

**Watch for:** A compiler error prevents the new program from running. A runtime error happens after compilation and linking have succeeded. Treat these as different points in the process.

**Check:** Which stage connects your program to the library code for printf?

1. Editing
2. Linking
3. Running

<details><summary>Answer</summary>

Linking. The linker connects the translated program with the library code it needs.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/first-program/1). In main.c, replace Hello, C! with Hello, Ada! inside the printf string. Leave the newline escape in place. Choose Run code again and find Hello, Ada! in Console. The new run replaces the earlier output. Which characters changed from the original greeting?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [GCC manual: compilation stages](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html) (online) — Compare preprocessing, compilation, assembly, and linking; inspect -E, -S, and -c.
- [WebAssembly concepts](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Concepts) (online) — Distinguish source code, a Wasm module, and the host/runtime that supplies its environment.

Native source: `native/examples/first-program-1.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=first-program-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/first-program/2). In main.c, move the printf line for Second above the line for First. Choose Run code. Does Console now print Second before First, and does return 0 add a line?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [C reference: main](https://en.cppreference.com/w/c/language/main_function.html) (online) — Check the supported forms of main and what returning a status means.
- [C reference: functions](https://en.cppreference.com/w/c/language/functions.html) (online) — Read declarations, parameter types, and the rules for calling functions.

Native source: `native/examples/first-program-2.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=first-program-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/first-program/3). In main.c, change the 3 argument in the first printf to 7 and change 100%% to 75%% in the second string. Choose Run code. Find Count: 7 and Progress: 75% in Console. Why does the second line display one percent sign?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [C reference: printf family](https://en.cppreference.com/w/c/io/fprintf.html) (online) — Read conversion specifiers, required argument types, and the return value.
- [Linux manual: printf(3)](https://man7.org/linux/man-pages/man3/printf.3.html) (online) — Use SYNOPSIS, conversion specifications, RETURN VALUE, and STANDARDS; note POSIX extensions.

**Use the documentation (optional):** What does printf return on success, and how many characters does printf("Hi!\n") report?

<details><summary>Compare your answer</summary>

On success printf returns the number of characters transmitted, excluding the terminating null byte. H, i, !, and the newline make four. A negative result reports an output or encoding error.

</details>

Native source: `native/examples/first-program-3.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=first-program-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

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

A diagnostic may point to the next statement because that is where the compiler discovers the missing terminator. Read the first diagnostic before chasing later ones. Its exact wording depends on the compiler.

**Watch for:** Do not change a large number of lines to silence a list of errors. A small edit-and-recompile cycle makes it easier to connect a cause with its effect.

**Check:** The compiler points at return, but the preceding printf has no semicolon. What should you inspect first?

1. The preceding statement
2. The browser storage
3. The output font

<details><summary>Answer</summary>

The preceding statement. The reported location is where parsing failed, which can follow the actual mistake.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/first-program/4). In main.c, remove the semicolon immediately after printf("Hello\n"). Choose Run code and read the first compiler diagnostic in Console. Put the semicolon back and run again. Which source line does the first diagnostic identify? Why can the compiler report the line after the missing semicolon?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [GCC manual: warning options](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html) (online) — Look up a diagnostic option and the conditions it reports.

Native source: `native/examples/first-program-4.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=first-program-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 1.5 C, WebAssembly, and standard input/output

The browser runs compiled C and supplies a small operating-system interface.

Input passes text to the program before execution. For example, scanf or fgets can read this prepared text during the run. Use Console to see the program output and any diagnostics.

### Source becomes a runnable program

Preprocessing, compilation, linking, and execution have different jobs.

Start with main.c. Preprocessing expands includes and macros. Compilation translates the resulting C into object code. The linker resolves references between objects and libraries and produces a program. A native operating system or a Wasm runtime executes the result. A successful translation is separate from a successful run.

The target determines whether the final program is native code or a WebAssembly module.

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

This starter writes to standard output. The page compiles it into WebAssembly and runs it locally. Stop is available while a run is active.

**Watch for:** The inline runner supplies no Linux processes, sockets, or threads. Lessons that need them provide an Open Browser Linux button; that terminal also runs in your browser.

**Check:** When should you supply input for the current browser runner?

1. Before pressing Run code
2. Only after the program asks in Console

<details><summary>Answer</summary>

Before pressing Run code. The runner passes the Input text at the start. It does not offer an interactive stdin prompt.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/first-program/5). In main.c, replace “This program runs in the browser.” inside the printf string with “I changed this message.” Leave the newline escape at the end of the string and the surrounding quotation marks unchanged. Choose Run code, then confirm Console shows the new line. In Editor tools, choose Export to save the edited main.c. The chapter’s greeting exercise uses Check output for separate practice.

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [WebAssembly concepts](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Concepts) (online) — Distinguish source code, a Wasm module, and the host/runtime that supplies its environment.
- [C reference: input/output](https://en.cppreference.com/w/c/io.html) (online) — Compare stream modes, positioning, error indicators, and formatted I/O.

Native source: `native/examples/first-program-5.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=first-program-5 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 1.6 Finding and reading C documentation

Find an answer in C documentation, turn it into a prediction, and check it with a small program.

A function reference describes a contract: the header to include, the arguments to supply, the result it returns, and conditions you must handle. Start with one concrete question. For `printf`, ask “What does it return?” before trying to memorize the complete format table. C17 is this course’s baseline; a reference can also describe newer C revisions, POSIX facilities, or Linux extensions. Check those labels before assuming an API or format is available in the browser.

### Choose the right entry

Open printf(3) in the lesson’s manual reader, then select RETURN VALUE. You can also use man 3 printf in the Browser Linux terminal. Section 3 describes C library functions; section 1 describes shell commands. The course bundles selected C library and Linux manuals. Shell-command manuals such as printf(1) are separate online references.

```text
man 3 printf
man -k printf
```

### Read the contract before the examples

In SYNOPSIS, find stdio.h and the function’s int return type. DESCRIPTION explains conversion specifiers and the types they require. RETURN VALUE gives the success and failure results. ERRORS and STANDARDS add failure conditions and portability details. You do not need to understand every pointer annotation yet; pointers are covered later.

```text
int printf(const char *restrict format, ...);
```

### Search, predict, then verify

Use your browser’s Find feature to locate RETURN VALUE in the bundled printf(3) manual. Read that success returns the transmitted character count and output or encoding failure returns a negative value. Predict the result for Hi! followed by a newline, then run the example. The Linux terminal also has Find in manual, Previous page, Next page and Close manual controls. The keyboard equivalents are /RETURN VALUE, n and q. man -k printf searches available names and descriptions.

### main.c

```c
#include <stdio.h>

int main(void) {
    int written = printf("Hi!\n");
    printf("count=%d\n", written);
    return 0;
}
```

Output:

```text
Hi!
count=4
```

With the original Hi! string, the first call writes H, i, !, and a newline: four characters. The terminating null byte in the C string is not transmitted. int written stores that return value; the next chapter develops variables and types. The second call prints the stored count using %d. Read printf’s own return contract, rather than assuming every C function uses zero to mean success.

**Watch for:** Do not confuse printf(1), the command-line utility, with printf(3), the C library function. Match format specifiers to argument types, and check whether a documented facility belongs to ISO C, POSIX, or a particular implementation. A reference describing a feature does not establish support in every compiler or runtime.

**Check:** Which command opens the manual for the C library function printf?

1. man 3 printf: C library function
2. man 1 printf: shell command
3. man -k printf: directly opens the C library manual

<details><summary>Answer</summary>

man 3 printf: C library function. Section 3 describes C library functions. Section 1 describes commands. man -k searches available names and descriptions; it does not open the function’s manual.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/first-program/6). In main.c, replace Hi! inside the first printf string with C%%. Keep the newline escape and quotation marks. Predict the new return value below, choose Run code, and compare count= in Console with your prediction. Use the manual’s DESCRIPTION to find what %% prints if you are unsure.

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [C reference: printf family](https://en.cppreference.com/w/c/io/fprintf.html) (online) — Read conversion specifiers, required argument types, and the return value.
- [Linux manual: printf(3)](https://man7.org/linux/man-pages/man3/printf.3.html) (online) — Use SYNOPSIS, conversion specifications, RETURN VALUE, and STANDARDS; note POSIX extensions.
- [Linux manual: printf(1)](https://man7.org/linux/man-pages/man1/printf.1.html) (online) — Compare the command-line utility with the C library function in section 3.

Native source: `native/examples/first-program-6.c`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=first-program-6 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## Chapter practice

Edit `native/exercises/hello.c`, then run:

```sh
make exercise EXERCISE=hello
```

Chapter workspace command: `make chapter CHAPTER=first-program`.

Generated from dist/part1.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/first-program
