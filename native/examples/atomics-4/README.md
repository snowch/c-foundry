# Why volatile does not provide thread synchronization

Complete native example, ready to edit and run in Codespaces or locally.

## 37.4 Why volatile does not provide thread synchronization

volatile changes certain access semantics but does not make ordinary shared accesses atomic or establish thread synchronization.

The volatile variable in this fixture is accessed only by main and serves as a deliberately local example. The shared counter uses C11 atomics, not volatile. Removing atomics and merely adding volatile to the counter would create conflicting unsynchronized accesses and undefined behavior. Device-register use of volatile has additional platform-specific rules.

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
atomic_uint counter;
void *increment_counter(void *unused) {
  (void)unused;
  for (unsigned i = 0; i < 1000; ++i)
    atomic_fetch_add_explicit(&counter, 1, memory_order_relaxed);
  return NULL;
}
unsigned joined_counter(void) {
  atomic_init(&counter, 0);
  pthread_t threads[4];
  for (unsigned i = 0; i < 4; ++i)
    CHECK(pthread_create(&threads[i], NULL, increment_counter, NULL));
  for (unsigned i = 0; i < 4; ++i)
    CHECK(pthread_join(threads[i], NULL));
  return atomic_load_explicit(&counter, memory_order_relaxed);
}

int main(void) {
  volatile unsigned local = 0;
  for (unsigned i = 0; i < 3; ++i)
    ++local;
  printf("local_volatile=%u atomic_total=%u\n", local, joined_counter());
  return 0;
}
```

Output:

```text
local_volatile=3 atomic_total=4000
```

The local volatile increments have no cross-thread role. The correct shared total comes from atomic fetch-add operations and worker joins.

**Watch for:** An observed correct result from a volatile shared counter does not establish a valid synchronization contract.

**Check:** Can volatile replace a mutex or atomic operation for shared increments?

1. Yes
2. No

<details><summary>Answer</summary>

No. It supplies neither the required atomic update nor the inter-thread ordering relationship.

</details>

**Try:** Audit shared variables in your queue and database; identify the mutex or atomic protocol protecting each one.

Run from the repository root:

```sh
make example EXAMPLE=atomics-4
```

