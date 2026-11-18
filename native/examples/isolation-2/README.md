# Lost updates and inconsistent reads

Complete native example, ready to edit and run in Codespaces or locally.

## 40.2 Lost updates and inconsistent reads

An optimistic update can reject a stale read instead of silently overwriting a newer result. The version comparison and write must share one atomic critical section in concurrent use.

Also editable and runnable inline in the browser course. This is a bounded, single-threaded model. Run and change it here; use a native build for the full system and its host-specific guarantees.

Two logical sessions read version one. The first commits a new value and advances the version; the second is rejected when its observed version no longer matches. This deterministic sequential schedule models the conflict rule. A threaded implementation must guard compare_commit with a mutex or an appropriate atomic state protocol, including version-wrap handling.

### Safe individual accesses can still lose a transaction’s update

The full read–modify–write operation needs a suitable isolation contract.

Two transactions both read balance 100. Transaction A computes 110 and later writes 110. Transaction B computes 120 from its stale value 100 and writes 120 after A. The final result is 120, so A’s addition of 10 has been lost; a correctly serialized pair of additions would yield 130.

A conceptual schedule with individually safe accesses. It does not predict the result of an ordinary C data race, which has undefined behavior.

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
  unsigned first = db.version, second = db.version;
  bool a = compare_commit(&db, first, 11), b = compare_commit(&db, second, 12);
  printf("first=%d stale_rejected=%d value=%d version=%u\n", a, !b, db.value,
         db.version);
  return 0;
}
```

Output:

```text
first=1 stale_rejected=1 value=11 version=2
```

The stale second write does not erase the first committed update. A client may retry after rereading under an explicit application policy.

**Watch for:** A plain version check followed by an unlocked store is still vulnerable to a check-then-act race.

**Check:** Which steps need one concurrent atomic boundary?

1. Only reading the version number
2. Version validation and publication of the new value/version

<details><summary>Answer</summary>

Version validation and publication of the new value/version. Another writer must not slip between validation and publication.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/isolation/2). In main.c, assign second = db.version; before the second compare_commit, after the first call has returned. Split the declarations of a and b if needed. Run code and compare stale_rejected=, value=, and version=. Which version makes the second commit valid?

### References and help

- [SQLite documentation: isolation](https://www.sqlite.org/isolation.html) — Compare committed visibility and snapshot behavior with the lesson’s explicit contract.

Native source: `native/examples/isolation-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=isolation-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

