# Data races and reproducible interleavings

Complete native example, ready to edit and run in Codespaces or locally.

## 35.3 Data races and reproducible interleavings

A C data race is conflicting unsynchronized access to a memory location with at least one write. A logical lost update can also occur even when each individual access is protected.

The fixture uses a barrier to ensure both workers read zero before either publishes one. Each read and write is mutex-protected, so the program avoids a C data race, yet the compound read-modify-write operation is not atomic. The final value is one rather than two. Removing the locks would introduce undefined behavior, not a reliable demonstration of a particular final result.

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
pthread_mutex_t gate = PTHREAD_MUTEX_INITIALIZER;
pthread_barrier_t read_barrier;
int shared_value;
void *stale_update(void *unused) {
  (void)unused;
  CHECK(pthread_mutex_lock(&gate));
  int copy = shared_value;
  CHECK(pthread_mutex_unlock(&gate));
  int result = pthread_barrier_wait(&read_barrier);
  if (result != 0 && result != PTHREAD_BARRIER_SERIAL_THREAD)
    exit(1);
  CHECK(pthread_mutex_lock(&gate));
  shared_value = copy + 1;
  CHECK(pthread_mutex_unlock(&gate));
  return NULL;
}

int main(void) {
  CHECK(pthread_barrier_init(&read_barrier, NULL, 2));
  pthread_t a, b;
  CHECK(pthread_create(&a, NULL, stale_update, NULL));
  CHECK(pthread_create(&b, NULL, stale_update, NULL));
  CHECK(pthread_join(a, NULL));
  CHECK(pthread_join(b, NULL));
  printf("final=%d expected_atomic_increment=2\n", shared_value);
  CHECK(pthread_barrier_destroy(&read_barrier));
  CHECK(pthread_mutex_destroy(&gate));
  return 0;
}
```

Output:

```text
final=1 expected_atomic_increment=2
```

Both protected writes store their stale local zero plus one. Protecting the whole increment with one lock acquisition fixes the lost update.

**Watch for:** A race-free program can still violate an application’s transaction semantics.

**Check:** What must be atomic to avoid this lost update?

1. The complete read-modify-write operation
2. Only each separate load and store

<details><summary>Answer</summary>

The complete read-modify-write operation. Both workers must not base their committed update on the same stale state.

</details>

**Try:** Move the entire increment under one lock and verify final two; use ThreadSanitizer separately rather than relying on a data-race output.

Run from the repository root:

```sh
make example EXAMPLE=threads-3
```

