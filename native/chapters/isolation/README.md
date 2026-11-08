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

**Watch for:** Adding a read lock to only some readers leaves the overall shared-state contract broken.

**Check:** What protects a reader from a half-completed transfer?

1. Holding the shared lock across both field reads
2. Reading each field at unrelated times

<details><summary>Answer</summary>

Holding the shared lock across both field reads. The invariant spans both fields and needs one consistent observation interval.

</details>

**Try:** Define a lock hierarchy for accounts and tables, then measure contention with verified invariant checks.

Run from the repository root:

```sh
make example EXAMPLE=isolation-1
```

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

## Build it yourself

Specify the behavior of concurrent reads before changing the locking strategy.

1. Specify what readers may observe before changing locks. Race freedom and transaction isolation are related but different contracts.
2. Write schedule tests for nonrepeatable reads, lost updates, and multi-row consistency before choosing an isolation label.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=isolation-3
```

Chapter workspace command: `make chapter CHAPTER=isolation`.

Generated from dist/part9.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/isolation
