# Optional workshop: Repair a broken TinyDB with GDB

Complete native example, ready to edit and run in Codespaces or locally.

## 30.8 Optional workshop: Repair a broken TinyDB with GDB

Use GDB to explain two data-integrity failures in a deliberately broken copy of the real TinyDB CLI, then verify the repair after reopening its database file.

A database can exit successfully and still update the wrong row or lose a survivor during deletion. The repair workshop freezes a copy of the runnable C CLI and introduces two logical defects. Each launch seeds a new three-row file, so the investigation does not touch a database you want to keep. Begin with the failing contract, inspect the selected ID and array slot, and follow the candidate table through mutation and serialization. The small example below states the neighbor-preservation contract; the separate workshop contains the full CLI to repair. Complete the <a href="#/chapter/files-bytes/7">optional Part 2 GDB lab</a> first, or skip this native workshop.

## Optional repair workshop: a broken TinyDB (optional)

Run in Codespaces or local Linux with GDB; the browser CLI does not provide GDB. Starter checks initially fail on purpose. Guide and editable source: `native/debugging/tinydb`.

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

**Try:** Repair both defects in the isolated CLI copy, pass all four checks, and add missing-ID, sole-row deletion, and duplicate-rejection regressions. Record the GDB evidence for each source fix.

Run from the repository root:

```sh
make example EXAMPLE=ship-8
```

