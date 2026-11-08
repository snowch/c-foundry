# Reader/writer locking

Complete native example, ready to edit and run in Codespaces or locally.

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

