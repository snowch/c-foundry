# Defining and testing an isolation contract

Complete Linux example, ready to edit and run in the browser terminal.

## 40.3 Defining and testing an isolation contract

An isolation contract states which anomalies are allowed across a transaction’s sequence of operations. Protecting each statement does not automatically provide repeatable reads.

Also editable and runnable inline in the browser course.

The fixture models a reader observing a committed value, another session committing a change, and the first reader observing the newer value on its next statement. That is compatible with a per-statement committed-read policy but not a repeatable snapshot. A complete implementation must specify multi-row reads, phantoms, write conflicts, and transaction boundaries rather than borrowing a label without its tests.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  int value;
  unsigned version;
} Versioned;
bool compare_commit(Versioned *db, unsigned observed, int value) {
  if (db->version != observed)
    return false;
  db->value = value;
  ++db->version;
  return true;
}

int main(void) {
  Versioned db = {10, 1};
  int first = db.value;
  compare_commit(&db, 1, 20);
  int second = db.value;
  printf("statement_reads=%d,%d repeatable=%d\n", first, second,
         first == second);
  return 0;
}
```

Output:

```text
statement_reads=10,20 repeatable=0
```

Both reads observe committed state, but they do not belong to one frozen snapshot. The example makes the nonrepeatable read explicit without using a C data race.

### Two statements can observe different committed values

Which commit happens between the two reads?

Which commit happens between the two reads? Step; Reader session; Other session. 1; first = 10; —; 2; —; commit value 20; version 1 → 2; 3; second = 20; —; Result; statement_reads=10,20; repeatable=0; —. . . The fixture models a per-statement committed-read policy. It does not provide a repeatable snapshot or a complete multi-row isolation implementation.

The fixture models a per-statement committed-read policy. It does not provide a repeatable snapshot or a complete multi-row isolation implementation. Illustration of the supplied example; edits do not update this picture.

**Watch for:** Race-free field access is necessary but does not define all database isolation semantics.

**Check:** Does per-statement locking guarantee repeatable reads for a longer transaction?

1. No
2. Yes

<details><summary>Answer</summary>

No. Another transaction may commit between statements after each lock is released.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/isolation/3). In main.c, change compare_commit(&db, 1, 20) to compare_commit(&db, 1, 10). Run code and compare statement_reads= and repeatable=. What does equal output in this one schedule tell you about the fixture? What remains to demonstrate about repeated reads?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: isolation (included in the explanation above) — Compare committed visibility and snapshot behavior with the lesson’s explicit contract.

**Optional further reading (internet required):**

- [SQLite documentation: isolation](https://www.sqlite.org/isolation.html)

**Use the documentation (optional):** Can a reader infer a database’s isolation guarantee merely because each individual access uses a lock?

<details><summary>Compare your answer</summary>

No. The isolation contract concerns the visibility and ordering of complete operations or transactions. Lock scope, publication, and the permitted schedules determine the guarantee.

</details>

Native source: `native/examples/isolation-3/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=isolation-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

