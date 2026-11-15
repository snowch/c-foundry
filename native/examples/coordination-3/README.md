# Lock ordering, deadlocks, and starvation

Complete native example, ready to edit and run in Codespaces or locally.

## 36.3 Lock ordering, deadlocks, and starvation

Lock ordering prevents circular wait when every path follows the same global order. It does not by itself guarantee fairness or eliminate every blocking failure.

Both workers acquire first_lock before second_lock and release in reverse order. A conflicting path that acquires them in the opposite order could deadlock. Also avoid holding a database lock while waiting for queue space or an external callback that may need that same lock. POSIX mutexes do not generally promise a specific fairness order.

### Opposite lock orders can form a wait cycle

Both threads can wait forever while retaining the lock the other needs.

Thread A holds lock L and waits for R. Thread B holds R and waits for L. Each thread needs the lock held by the other, forming a cycle. For these two locks, requiring all threads to acquire L before R prevents this opposite-order cycle.

A global lock order addresses this cycle; shutdown, external resources, and other wait dependencies still need analysis.

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
pthread_mutex_t first_lock = PTHREAD_MUTEX_INITIALIZER,
                second_lock = PTHREAD_MUTEX_INITIALIZER;
unsigned completed_work;
void *ordered_locks(void *unused) {
  (void)unused;
  CHECK(pthread_mutex_lock(&first_lock));
  CHECK(pthread_mutex_lock(&second_lock));
  ++completed_work;
  CHECK(pthread_mutex_unlock(&second_lock));
  CHECK(pthread_mutex_unlock(&first_lock));
  return NULL;
}

int main(void) {
  pthread_t a, b;
  CHECK(pthread_create(&a, NULL, ordered_locks, NULL));
  CHECK(pthread_create(&b, NULL, ordered_locks, NULL));
  CHECK(pthread_join(a, NULL));
  CHECK(pthread_join(b, NULL));
  printf("completed=%u\n", completed_work);
  CHECK(pthread_mutex_destroy(&first_lock));
  CHECK(pthread_mutex_destroy(&second_lock));
  return 0;
}
```

Output:

```text
completed=2
```

Both critical sections complete and their increments are protected. The output does not establish starvation freedom under an unbounded workload.

**Watch for:** Do not demonstrate deadlock by hanging the course runner; model the wait-for cycle or use a bounded diagnostic test.

**Check:** Does a global lock order guarantee fairness?

1. No
2. Yes

<details><summary>Answer</summary>

No. It addresses circular wait, not every scheduling policy.

</details>

**Try:** Draw the lock-order graph for your database and reject any proposed edge that creates a cycle.

### References and help

- [Linux/POSIX manual: pthread_cond_wait(3)](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3.html) — Read the predicate-loop and mutex rules for waiting on a condition variable.
- [C reference: C11 concurrency](https://en.cppreference.com/w/c/thread.html) — Check thread creation, joining, mutexes, and optional implementation support.

Run from the repository root:

```sh
make example EXAMPLE=coordination-3
```

