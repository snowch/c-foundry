# Concurrent workloads and contention measurements

Complete native example, ready to edit and run in Codespaces or locally.

## 44.1 Concurrent workloads and contention measurements

A contention workload should preserve correctness while collecting schedule-dependent metrics. Do not require one exact interleaving to pass.

Four workers each process a thousand protected increments. A failed try-lock due to EBUSY increments a contention counter before blocking normally. The fixture asserts the deterministic total and a bound on counted waits, but does not fix the actual wait count. Instrumentation changes timing, and wait counts are not latency measurements.

### main.c

```c
#define _POSIX_C_SOURCE 200809L
#include <errno.h>
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
pthread_mutex_t service_lock = PTHREAD_MUTEX_INITIALIZER;
atomic_uint waited;
unsigned processed;
void *requests(void *unused) {
  (void)unused;
  for (unsigned i = 0; i < 1000; ++i) {
    int error = pthread_mutex_trylock(&service_lock);
    if (error == EBUSY) {
      atomic_fetch_add(&waited, 1);
      CHECK(pthread_mutex_lock(&service_lock));
    } else if (error)
      exit(1);
    ++processed;
    CHECK(pthread_mutex_unlock(&service_lock));
  }
  return NULL;
}

int main(void) {
  atomic_init(&waited, 0);
  pthread_t workers[4];
  for (unsigned i = 0; i < 4; ++i)
    CHECK(pthread_create(&workers[i], NULL, requests, NULL));
  for (unsigned i = 0; i < 4; ++i)
    CHECK(pthread_join(workers[i], NULL));
  if (processed != 4000)
    return 1;
  printf("requests=%u wait_count_bounded=%d\n", processed,
         atomic_load(&waited) <= processed);
  CHECK(pthread_mutex_destroy(&service_lock));
  return 0;
}
```

Output:

```text
requests=4000 wait_count_bounded=1
```

Every request completes. The number that initially encountered a busy lock may differ on another run without indicating a correctness failure.

**Watch for:** A benchmark that asserts a nonzero wait count can be flaky when the scheduler runs workers mostly sequentially.

**Check:** Which value is safe to assert exactly here?

1. The total processed requests
2. The number of contended attempts

<details><summary>Answer</summary>

The total processed requests. Correctness is deterministic even when the schedule and contention metrics vary.

</details>

**Try:** Record wait distributions and request latency under several client counts while preserving per-request correctness checks.

Run from the repository root:

```sh
make example EXAMPLE=reliability-1
```

