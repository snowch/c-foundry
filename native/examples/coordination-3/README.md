# Lock ordering, deadlocks, and starvation

Complete Linux example, ready to edit and run in the browser terminal.

## 36.3 Lock ordering, deadlocks, and starvation

Lock ordering prevents circular wait when every path follows the same global order. It does not by itself guarantee fairness or eliminate every blocking failure.

Both workers acquire first_lock before second_lock and release in reverse order. A conflicting path that acquires them in the opposite order could deadlock. Also avoid holding a database lock while waiting for queue space or an external callback that may need that same lock. POSIX mutexes do not generally promise a specific fairness order.

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

### Consistent order prevents this lock cycle

What cycle would opposite lock orders permit?

What cycle would opposite lock orders permit? Unchanged starter: both workers use the same order. lock first_lock; lock second_lock; complete work; unlock second_lock, then first_lock; Counterexample only: opposite orders. Nodes: Thread A, L, Thread B, R. Connections: L leads to Thread A (held by); Thread A leads to R (waits for); R leads to Thread B (held by); Thread B leads to L (waits for). Each thread holds one lock while waiting for the other.. The starter completes with completed=2. The opposite-order cycle is a separate illustration, not an observed deadlock. Lock ordering does not guarantee fairness.

The starter completes with completed=2. The opposite-order cycle is a separate illustration, not an observed deadlock. Lock ordering does not guarantee fairness. Illustration of the supplied example; edits do not update this picture.

**Watch for:** Do not demonstrate deadlock by hanging the course runner; model the wait-for cycle or use a bounded diagnostic test.

**Check:** Does a global lock order guarantee fairness?

1. No
2. Yes

<details><summary>Answer</summary>

No. It addresses circular wait, not every scheduling policy.

</details>

**Try:** Edit the example in Browser Linux.  In native/examples/coordination-3/main.c, create a third pthread_t, start it with ordered_locks as for a and b, and join it before the printf and lock destruction. Repeat the terminal run. How does completed= change when another worker follows the same acquisition order?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [Linux/POSIX manual: pthread_cond_wait(3)](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3.html) (online) — Read the predicate-loop and mutex rules for waiting on a condition variable.
- [C reference: C11 concurrency](https://en.cppreference.com/w/c/thread.html) (online) — Check thread creation, joining, mutexes, and optional implementation support.

Native source: `native/examples/coordination-3/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=coordination-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

