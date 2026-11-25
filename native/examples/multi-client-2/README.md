# Transaction boundaries

Complete Linux example, ready to edit and run in the browser terminal.

## 39.2 Transaction boundaries

A transaction boundary must belong to a session, not merely to whichever request arrives next. Other clients cannot commit or mutate another client’s working state.

Also editable and runnable inline in the browser course.

The serialized-owner model tracks the active session ID. SET and COMMIT reject a different session without changing the active transaction. This fixture contains one value and an in-memory commit; integrating durable logging must retain the same ownership checks before acknowledgement. Define timeouts, disconnect rollback, and admission fairness separately.

### A private working copy can commit or roll back

Uncommitted edits do not replace the live table in this model.

The live table starts with a score of 10. Begin copies it into a private working table. Editing changes the working score to 42 while live remains 10. Commit publishes the working table, making live 42. Rollback discards the working changes and leaves live 10.

An in-process, single-writer model. Publication alone provides neither crash durability nor concurrent isolation.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/multi-client/2). In main.c, change the tx_set value from 42 to 17. Run code. Compare other_rejected=, owner_committed=, and value=. Which session can publish the new value?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: transactions (included in the explanation above) — Compare BEGIN, COMMIT, and ROLLBACK with the deliberately smaller transaction model.
- Course notes: isolation (included in the explanation above) — Compare committed visibility and snapshot behavior with the lesson’s explicit contract.

**Optional further reading (internet required):**

- [SQLite documentation: transactions](https://www.sqlite.org/lang_transaction.html)
- [SQLite documentation: isolation](https://www.sqlite.org/isolation.html)

Native source: `native/examples/multi-client-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=multi-client-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

