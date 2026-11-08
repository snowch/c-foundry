# Defining and testing an isolation contract

Complete native example, ready to edit and run in Codespaces or locally.

## 40.3 Defining and testing an isolation contract

An isolation contract states which anomalies are allowed across a transaction’s sequence of operations. Protecting each statement does not automatically provide repeatable reads.

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

**Watch for:** Race-free field access is necessary but does not define all database isolation semantics.

**Check:** Does per-statement locking guarantee repeatable reads for a longer transaction?

1. No
2. Yes

<details><summary>Answer</summary>

No. Another transaction may commit between statements after each lock is released.

</details>

**Try:** Write schedule tests for nonrepeatable reads, lost updates, and multi-row consistency before choosing an isolation label.

Run from the repository root:

```sh
make example EXAMPLE=isolation-3
```

