# Atomic operations and happens-before relationships

Complete native example, ready to edit and run in Codespaces or locally.

## 37.1 Atomic operations and happens-before relationships

An atomic read-modify-write updates one atomic object without lost increments. Ordering other objects is a separate requirement.

The counter uses relaxed fetch-add because only the numeric total is shared through that atomic object; joins establish worker completion before main reads the total. Relaxed ordering would not be sufficient to publish an unrelated payload through a flag. All increments still participate in the counter’s atomic modification order.

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
  printf("atomic_total=%u\n", joined_counter());
  return 0;
}
```

Output:

```text
atomic_total=4000
```

Four workers perform one thousand indivisible increments each. No plain read-plus-write sequence can lose an increment.

**Watch for:** An atomic counter does not automatically protect a surrounding mutable table or pointer graph.

**Check:** Does relaxed atomicity publish unrelated non-atomic data?

1. Not by itself
2. Always

<details><summary>Answer</summary>

Not by itself. Atomicity for one object and synchronization of other objects are distinct obligations.

</details>

**Try:** Replace the relaxed operations with default sequentially consistent operations, then explain why both totals match this contract.

Run from the repository root:

```sh
make example EXAMPLE=atomics-1
```

