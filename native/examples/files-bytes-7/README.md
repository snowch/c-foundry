# Optional lab: Debugging C with GDB

Complete Linux example, ready to edit and run in the browser terminal.

## 10.7 Optional lab: Debugging C with GDB

Investigate a reproducible logical bug using breakpoints, stepping, variables, call stacks, and a watchpoint. Read here; run the optional lab in Browser Linux.

A useful debugging loop is: reproduce a failure, state the expected behavior, form one hypothesis, observe the running program, make a source fix, and add a regression test. GDB supplies observations; it does not decide whether the behavior meets your contract. This starter should sum 4, 8, and 12 to 24, but prints 20 without any deliberate invalid memory access. The lab builds with `-g -O0` so source locations and variables are easier to follow. This investigation is optional. Use the Continue to Part 3 link to proceed without running GDB.

## Optional GDB lab: investigate, repair, verify (optional)

Run in the Browser Linux terminal with GDB; the browser CLI does not provide GDB. Starter checks initially fail on purpose. Guide and editable source: `native/debugging/basics`.

```sh
make debug-lab LAB=basics
```

### Reproduce and state a hypothesis

The editable copy is native/debugging/basics/main.c. The check command initially fails; expected totals are 24, 7, 0, and -2. Write down which input you suspect is skipped.

```text
make debug-lab LAB=basics
make debug-check LAB=basics
```

### Open real GDB

Run this in the full Browser Linux terminal. GDB stops inside sum_values before the total initializer.

```text
make debug-gdb LAB=basics
```

### Observe the call and the first write

At the (gdb) prompt, run these one at a time. count is 3, the array is {4, 8, 12}, and the first change to total is 0 → 8 with i = 1. The software watchpoint works without hardware watchpoint slots.

```text
list
info args
print count
print *values@count
backtrace
next
print total
set can-use-hw-watchpoints 0
watch total
step
continue
print i
```

### Practice stepping and call frames

next steps over calls; step can enter them; Disable this session’s watchpoint 2 before using finish to run until the selected function returns. backtrace shows the call chain, and frame 1 selects the caller. Observe variables only while their scope exists. Quit GDB before rebuilding.

```text
disable 2
finish
backtrace
quit
```

### Repair the source and keep the regression

Edit the starter and rebuild. All four cases must pass. Add another bounded case and record the symptom, hypothesis, observation, source fix, and test.

```text
make debug-check LAB=basics
```

<details><summary>Hint and separate reference</summary>

Compare the first visited index with the array’s first element. After trying, the separate reference is available with make debug-check LAB=basics REFERENCE=1. A reference pass does not grade the student copy.

</details>

### main.c

```c
/* Deliberately faulty lab starter. All accesses stay within the array. */
#include <stddef.h>
#include <stdio.h>
#include <string.h>

/* The caller supplies a live array and values whose sum fits in int. */
int sum_values(const int *values, size_t count) {
    int total = 0;
    for (size_t i = 1; i < count; ++i) {
        total += values[i];
    }
    return total;
}

int main(int argc, char **argv) {
    const int ordinary[] = {4, 8, 12};
    const int single[] = {7};
    const int negative[] = {-5, 2, 1};
    const int *values = ordinary;
    size_t count = sizeof ordinary / sizeof ordinary[0];
    if (argc > 1 && strcmp(argv[1], "single") == 0) {
        values = single;
        count = 1;
    } else if (argc > 1 && strcmp(argv[1], "empty") == 0) {
        count = 0;
    } else if (argc > 1 && strcmp(argv[1], "negative") == 0) {
        values = negative;
        count = sizeof negative / sizeof negative[0];
    }
    int result = sum_values(values, count);
    printf("total=%d\n", result);
    return 0;
}
```

Output:

```text
total=20
```

The faulty starter begins at element 1 and produces 20. The original-output check confirms that reproduction. Use debug-check on the repaired student file to require 24 and exercise single, empty, and negative inputs.

**Watch for:** A watchpoint reports a value change; it does not prove that the right value was written. Changing a variable inside GDB repairs only the current execution. Save a source fix, rebuild, and rerun the independent checks. Run GDB in Browser Linux; the small C command workspace does not provide it.

**Check:** You use GDB to set total to 24 and the output becomes correct. What still needs doing?

1. Mark the defect fixed because this run passed
2. Fix the source, rebuild, and add a regression test

<details><summary>Answer</summary>

Fix the source, rebuild, and add a regression test. The debugger changed one live process. The faulty loop remains in the source until you edit it and verify the rebuilt program.

</details>

**Try:** Edit the example in Browser Linux.  For the optional repair, edit native/debugging/basics/main.c as described in the GDB instructions. Run its four regression cases after the repair. The separate terminal command below reproduces the faulty starter output total=20.

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: debugging a program (included in the explanation above) — Look up breakpoints, stepping, backtraces, and watchpoints in the native debugger.

**Optional further reading (internet required):**

- [GDB manual: debugging a program](https://sourceware.org/gdb/current/onlinedocs/gdb.html/)

Native source: `native/examples/files-bytes-7/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=files-bytes-7 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

