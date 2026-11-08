# Transaction boundaries

Complete native example, ready to edit and run in Codespaces or locally.

## 39.2 Transaction boundaries

A transaction boundary must belong to a session, not merely to whichever request arrives next. Other clients cannot commit or mutate another client’s working state.

The serialized-owner model tracks the active session ID. SET and COMMIT reject a different session without changing the active transaction. This fixture contains one value and an in-memory commit; integrating durable logging must retain the same ownership checks before acknowledgement. Define timeouts, disconnect rollback, and admission fairness separately.

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
  unsigned owner;
  bool active;
  int committed, working;
} SessionDB;
bool tx_begin(SessionDB *db, unsigned session) {
  if (!session || db->active)
    return false;
  db->owner = session;
  db->working = db->committed;
  db->active = true;
  return true;
}
bool tx_set(SessionDB *db, unsigned session, int value) {
  if (!db->active || db->owner != session)
    return false;
  db->working = value;
  return true;
}
bool tx_commit(SessionDB *db, unsigned session) {
  if (!db->active || db->owner != session)
    return false;
  db->committed = db->working;
  db->active = false;
  db->owner = 0;
  return true;
}

int main(void) {
  SessionDB db = {0};
  tx_begin(&db, 1);
  tx_set(&db, 1, 42);
  bool wrong = tx_commit(&db, 2);
  bool right = tx_commit(&db, 1);
  printf("other_rejected=%d owner_committed=%d value=%d\n", !wrong, right,
         db.committed);
  return 0;
}
```

Output:

```text
other_rejected=1 owner_committed=1 value=42
```

The failed session-two commit leaves session one’s working value intact. Only its owner can publish it.

**Watch for:** Serializing individual requests does not automatically serialize a multi-request transaction under one owner.

**Check:** May another session commit the current transaction?

1. Yes
2. No

<details><summary>Answer</summary>

No. The transaction handle is associated with a session identity.

</details>

**Try:** Add disconnect rollback and reject stale requests from a session whose transaction has already ended.

Run from the repository root:

```sh
make example EXAMPLE=multi-client-2
```

