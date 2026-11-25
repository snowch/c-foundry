# Chapter 40: Concurrent readers and isolation

Part 9: Advanced TinyDB. Teaching baseline: C17.

Specify what readers may observe before changing locks. Race freedom and transaction isolation are related but different contracts.

## Outcomes

- Protect multi-field invariants with reader/writer locking.
- Detect stale writes rather than losing updates.
- Distinguish statement visibility from repeatable transaction snapshots.

## 40.1 Reader/writer locking

Reader/writer locking permits simultaneous readers while excluding a writer from protected state. Every access must follow the same protocol.

The account transfer updates two fields under an exclusive lock; readers compute their sum under a shared lock. No reader may observe the half-completed transfer. The test verifies an invariant rather than a particular scheduling order. Lock fairness and starvation behavior depend on the implementation and policy, not merely the use of a reader/writer lock.

### main.c

```c
#define _POSIX_C_SOURCE 200809L
#include <limits.h>
#include <pthread.h>
#include <sched.h>
#include <stdatomic.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CHECK(call)                                                            \
  do {                                                                         \
    int error = (call);                                                        \
    if (error) {                                                               \
      fprintf(stderr, "thread error %d\n", error);                             \
      exit(1);                                                                 \
    }                                                                          \
  } while (0)
typedef struct {
  int a, b;
  pthread_rwlock_t lock;
} Account;
Account account = {100, 0, PTHREAD_RWLOCK_INITIALIZER};
atomic_bool invalid_read;
void *transfer(void *unused) {
  (void)unused;
  for (unsigned i = 0; i < 1000; ++i) {
    CHECK(pthread_rwlock_wrlock(&account.lock));
    if (i % 2 == 0) {
      --account.a;
      ++account.b;
    } else {
      ++account.a;
      --account.b;
    }
    CHECK(pthread_rwlock_unlock(&account.lock));
  }
  return NULL;
}
void *read_total(void *unused) {
  (void)unused;
  for (unsigned i = 0; i < 1000; ++i) {
    CHECK(pthread_rwlock_rdlock(&account.lock));
    if (account.a + account.b != 100)
      atomic_store(&invalid_read, true);
    CHECK(pthread_rwlock_unlock(&account.lock));
  }
  return NULL;
}
void run_accounts(void) {
  atomic_init(&invalid_read, false);
  pthread_t writer, readers[2];
  CHECK(pthread_create(&writer, NULL, transfer, NULL));
  for (unsigned i = 0; i < 2; ++i)
    CHECK(pthread_create(&readers[i], NULL, read_total, NULL));
  CHECK(pthread_join(writer, NULL));
  for (unsigned i = 0; i < 2; ++i)
    CHECK(pthread_join(readers[i], NULL));
}

int main(void) {
  run_accounts();
  printf("consistent=%d final_total=%d\n", !atomic_load(&invalid_read),
         account.a + account.b);
  CHECK(pthread_rwlock_destroy(&account.lock));
  return 0;
}
```

Output:

```text
consistent=1 final_total=100
```

After joins there is no concurrent access, so main can read the final total directly. During execution every account access follows the lock discipline.

### One lock protects the whole transfer

Can a reader observe the state between the two field updates?

At the first transfer, accounts a and b start at 100 and 0. With the writer lock held, decrementing a produces the intermediate state 99,0. Incrementing b completes the transfer at 99,1. A reader holding the required reader lock cannot overlap that writer critical section, so it cannot observe the intermediate total 99. Before or after the transfer the protected total is 100.

This shows the first transfer, not the final account values after all iterations. Every participating reader and writer must use the same lock; no C data race is executed.

**Watch for:** Adding a read lock to only some readers leaves the overall shared-state contract broken.

**Check:** What protects a reader from a half-completed transfer?

1. Holding the shared lock across both field reads
2. Reading each field at unrelated times

<details><summary>Answer</summary>

Holding the shared lock across both field reads. The invariant spans both fields and needs one consistent observation interval.

</details>

**Try:** Edit the example in Browser Linux.  In native/examples/isolation-1/main.c, change Account account’s initial balances from 100, 0 to 90, 10. Repeat the terminal run. Why can consistent= and final_total= remain the same when the individual balances differ?

### References and help

- [SQLite documentation: isolation](https://www.sqlite.org/isolation.html) — Compare committed visibility and snapshot behavior with the lesson’s explicit contract.

Native source: `native/examples/isolation-1/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=isolation-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 40.2 Lost updates and inconsistent reads

An optimistic update can reject a stale read instead of silently overwriting a newer result. The version comparison and write must share one atomic critical section in concurrent use.

Also editable and runnable inline in the browser course.

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

## 40.3 Defining and testing an isolation contract

An isolation contract states which anomalies are allowed across a transaction’s sequence of operations. Protecting each statement does not automatically provide repeatable reads.

Also editable and runnable inline in the browser course.

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

## Build it yourself

Specify the behavior of concurrent reads before changing the locking strategy.

1. Write schedule tests for nonrepeatable reads, lost updates, and multi-row consistency before choosing an isolation label.
2. Write fixed schedules for a nonrepeatable read, a stale write, and a two-account transfer.

### Check your work

- Check which committed versions each read may observe and whether the account total stays constant; name only the isolation guarantees your tests specify.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=isolation-3
```

Chapter workspace command: `make chapter CHAPTER=isolation`.

Generated from dist/part9.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/isolation
