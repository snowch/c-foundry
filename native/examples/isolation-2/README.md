# Lost updates and inconsistent reads

Complete native example, ready to edit and run in Codespaces or locally.

## 40.2 Lost updates and inconsistent reads

An optimistic update can reject a stale read instead of silently overwriting a newer result. The version comparison and write must share one atomic critical section in concurrent use.

Two logical sessions read version one. The first commits a new value and advances the version; the second is rejected when its observed version no longer matches. This deterministic sequential schedule models the conflict rule. A threaded implementation must guard compare_commit with a mutex or an appropriate atomic state protocol, including version-wrap handling.

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

**Try:** Protect compare_commit with a lock, then test two sessions synchronized to read the same initial version.

Run from the repository root:

```sh
make example EXAMPLE=isolation-2
```

