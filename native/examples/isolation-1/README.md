# Reader/writer locking

Complete Linux example, ready to edit and run in the browser terminal.

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

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [SQLite documentation: isolation](https://www.sqlite.org/isolation.html) (online) — Compare committed visibility and snapshot behavior with the lesson’s explicit contract.

Native source: `native/examples/isolation-1/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=isolation-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

