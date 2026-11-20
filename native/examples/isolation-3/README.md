# Defining and testing an isolation contract

Complete Linux example, ready to edit and run in the browser terminal.

## 40.3 Defining and testing an isolation contract

An isolation contract states which anomalies are allowed across a transaction’s sequence of operations. Protecting each statement does not automatically provide repeatable reads.

Also editable and runnable inline in the browser course. This is a bounded, single-threaded model. Run and change it here; use a native build for the full system and its host-specific guarantees.

The fixture models a reader observing a committed value, another session committing a change, and the first reader observing the newer value on its next statement. That is compatible with a per-statement committed-read policy but not a repeatable snapshot. A complete implementation must specify multi-row reads, phantoms, write conflicts, and transaction boundaries rather than borrowing a label without its tests.

### A snapshot chooses a visible committed version

Creation is inclusive; deletion is exclusive in this model.

An older committed version has value 10, created at timestamp 1 and deleted at 3. A newer committed version has value 42, created at 3 and not deleted. Snapshot 2 sees value 10. Snapshot 3 does not see the old version because 3 is not less than its deleted timestamp; it sees value 42.

Only committed immutable versions are shown. Conflict handling and safe reclamation are separate responsibilities.

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

**Watch for:** Race-free field access is necessary but does not define all database isolation semantics.

**Check:** Does per-statement locking guarantee repeatable reads for a longer transaction?

1. No
2. Yes

<details><summary>Answer</summary>

No. Another transaction may commit between statements after each lock is released.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/isolation/3). In main.c, change compare_commit(&db, 1, 20) to compare_commit(&db, 1, 10). Run code and compare statement_reads= and repeatable=. What does equal output in this one schedule tell you about the fixture? What remains to demonstrate about repeated reads?

### References and help

- [SQLite documentation: isolation](https://www.sqlite.org/isolation.html) — Compare committed visibility and snapshot behavior with the lesson’s explicit contract.

**Use the documentation (optional):** Can a reader infer a database’s isolation guarantee merely because each individual access uses a lock?

<details><summary>Compare your answer</summary>

No. The isolation contract concerns the visibility and ordering of complete operations or transactions. Lock scope, publication, and the permitted schedules determine the guarantee.

</details>

Native source: `native/examples/isolation-3/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=isolation-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

