# Optional Part 2 lab: Debugging C with GDB

Read the lesson in any browser: https://snowch.github.io/c-foundry/#/chapter/files-bytes/7.
Run this lab in GitHub Codespaces (GDB is preinstalled), a local Linux dev container, or Linux/WSL with GCC or Clang, GDB, Make, and Python 3. It is optional: browser-only learners can continue to Part 3. The browser Wasm runner does not provide this GDB session.

## Investigate before editing

The array `4, 8, 12` should sum to 24; this deliberately faulty starter prints 20. It has a logical bug, with no deliberate out-of-bounds access. The test values are bounded so their sums fit in int; this exercise is not a general checked-integer API.

From the repository root:

```sh
make debug-lab LAB=basics
make debug-check LAB=basics
make debug-gdb LAB=basics
```

The check command initially fails three cases and passes the empty-array case. A passing boundary alone does not establish correctness. `debug-gdb` builds with `-g -O0` and opens real GDB, stopped in `sum_values`.

At the `(gdb)` prompt, run these commands one at a time:

```gdb
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
print total
```

`count` is 3 and the array is `{4, 8, 12}`. `next` executes the initializer; `total` is then 0. The software watchpoint stops at the first value change, from 0 to 8, with `i` equal to 1. Ask which input has not been added. Addresses and line numbers vary; the values and call relationships are the evidence.

`next` advances a source statement without entering its calls; `step` can enter a call. `disable 2` disables this session’s watchpoint before `finish` runs until the selected function returns; `backtrace`, `frame 1`, and `frame 0` let you inspect the caller and callee. `continue` resumes until another stop. Hardware watchpoints are often faster; this lab uses a software watchpoint so the exercise does not depend on available hardware slots. With software watchpoints GDB may display a nearby source line after the change, so inspect the value and the executed statement together.

## Repair and verify

Quit GDB, edit `native/debugging/basics/main.c`, then rebuild and check:

```sh
make debug-check LAB=basics
```

Expected totals: ordinary 24, single 7, empty 0, negative -2. Add another bounded input, predict its result, and add a regression case. Record the symptom, hypothesis, observation, source fix, and test. Changing `total` with GDB's `set variable` changes only that running process; it does not repair the source.

After trying, compare `.reference/main.c` or run:

```sh
make debug-check LAB=basics REFERENCE=1
```

That checks the separate reference; it does not complete the student starter. Lab binaries and unique session directories live under `.build/debugging/basics/`. Every invocation preserves earlier sessions. `make clean` removes those artifacts, not source edits.

If GDB cannot launch a child process in a restricted container, use the supplied Codespaces dev container or a local Linux session with debugging permitted. A working native terminal alone does not guarantee ptrace is available. The GDB environment command is not a command for the browser CLI.
