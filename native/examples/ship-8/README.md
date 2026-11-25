# Optional workshop: Repair a broken TinyDB with GDB

Complete Linux example, ready to edit and run in the browser terminal.

## 30.8 Optional workshop: Repair a broken TinyDB with GDB

Use GDB to explain two data-integrity failures in a deliberately broken copy of the real TinyDB CLI, then verify the repair after reopening its database file.

A database can exit successfully and still update the wrong row or lose a survivor during deletion. The repair workshop freezes a copy of the runnable C CLI and introduces two logical defects. Each launch seeds a new three-row file, so the investigation does not touch a database you want to keep. Begin with the failing contract, inspect the selected ID and array slot, and follow the candidate table through mutation and serialization. The small example below states the neighbor-preservation contract; the separate workshop contains the full CLI to repair. Complete the [optional Part 2 GDB lab](https://snowch.github.io/c-foundry/#/chapter/files-bytes/7) first, or skip this optional workshop.

## Optional repair workshop: a broken TinyDB (optional)

Run in the Browser Linux terminal with GDB; the browser CLI does not provide GDB. Starter checks initially fail on purpose. Guide and editable source: `native/debugging/tinydb`.

```sh
make debug-lab LAB=tinydb
```

### Reproduce the contracts

The seed is Ada/90, Grace/80, and Linus/70 with IDs 1, 2, and 3. Updating ID 2 should preserve its neighbors. Deleting any one row should preserve the remaining two. All four starter checks initially fail.

```text
make debug-lab LAB=tinydb
make debug-check LAB=tinydb
```

### Trace the UPDATE write

The guided launcher opens a fresh fixture and stops in execute. Use list execute to locate the score-assignment line; break at its current source line number and continue. Before the write, statement.id is 2, at is 1, and candidate.rows[at].id is 2. The guide in the lab files includes a watchpoint on the neighboring score.

```text
make debug-gdb LAB=tinydb
```

### Trace the DELETE count

Quit the first GDB session. This command starts another fresh fixture using DELETE for ID 2. Locate the count-decrement line, break there, and watch candidate.count. Explain why a copied record can still be in memory while an incorrect count omits it from the saved file.

```text
make debug-gdb LAB=tinydb CASE=delete
```

### Rebuild and reopen

Edit native/debugging/tinydb/main.c, then repeat the regression checks. Each check uses an independent fixture and reopens the saved database. Keep both source fixes and add cases beyond the failing examples.

```text
make debug-check LAB=tinydb
```

<details><summary>Hint and separate reference</summary>

The correct slot returned by lookup must also select the destination of an update. Each successful deletion reduces the logical count by exactly one. After trying, inspect the separate .reference/main.c or run make debug-check LAB=tinydb REFERENCE=1.

</details>

### main.c

```c
#include <stdbool.h>
#include <stddef.h>
#include <stdio.h>

typedef struct { unsigned id, score; } Row;

bool update_score(Row *rows, size_t count, unsigned id, unsigned score) {
    for (size_t i = 0; i < count; ++i) {
        if (rows[i].id == id) {
            rows[i].score = score;
            return true;
        }
    }
    return false;
}

int main(void) {
    Row rows[] = {{1, 90}, {2, 80}, {3, 70}};
    if (!update_score(rows, 3, 2, 99)) return 1;
    for (size_t i = 0; i < 3; ++i)
        printf("id=%u score=%u\n", rows[i].id, rows[i].score);
    return 0;
}
```

Output:

```text
id=1 score=90
id=2 score=99
id=3 score=70
```

The lookup matches ID 2 at slot 1 and writes only that slot. IDs 1 and 3 keep their scores. In the repair lab, the update regression reopens the file after changing ID 2, and the delete regressions check that first, middle, and last deletion preserve the other rows. Passing the small worked example does not validate the separate faulty CLI.

**Watch for:** Do not fix the shared browser CLI to complete this exercise: edit native/debugging/tinydb/main.c. A successful exit and sanitizer-clean execution cannot establish row identity or preservation. Debug only the isolated fixtures, and check persisted results as well as live memory.

**Check:** Why does the regression reopen the database after the mutation?

1. The in-memory table alone cannot establish that the saved rows are correct
2. Reopening proves that the program is safe under every crash

<details><summary>Answer</summary>

The in-memory table alone cannot establish that the saved rows are correct. Reopening checks the persistence boundary for this completed operation. It does not prove crash durability, transaction isolation, or correctness for every input.

</details>

**Try:** Edit the example in Browser Linux.  For the guided repair, edit native/debugging/tinydb/main.c using the optional GDB commands above. Run the four specified regression checks on the isolated copy. The separate terminal example below illustrates the correct UPDATE for ID 2.

**Extend the example:** After the four guided checks pass, add regression cases in the isolated TinyDB lab for a missing ID, sole-row deletion, and duplicate rejection.

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: debugging a program (included in the explanation above) — Look up breakpoints, stepping, backtraces, and watchpoints in the native debugger.
- Course notes: integrity checks (included in the explanation above) — Compare structural checks with the invariants tested in the teaching database.

**Optional further reading (internet required):**

- [GDB manual: debugging a program](https://sourceware.org/gdb/current/onlinedocs/gdb.html/)
- [SQLite documentation: integrity checks](https://www.sqlite.org/pragma.html#pragma_integrity_check)

Native source: `native/examples/ship-8/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=ship-8 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

