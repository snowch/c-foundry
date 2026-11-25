# Atomic operations and happens-before relationships

Complete Linux example, ready to edit and run in the browser terminal.

## 37.1 Atomic operations and happens-before relationships

An atomic read-modify-write updates one atomic object without lost increments. Ordering other objects is a separate requirement.

The counter uses relaxed fetch-add because only the numeric total is shared through that atomic object; joins establish worker completion before main reads the total. Relaxed ordering would not be sufficient to publish an unrelated payload through a flag. All increments still participate in the counter’s atomic modification order.

### Release/acquire can publish earlier writes

The acquiring load must observe the value from the releasing store.

A writer initializes payload, then stores true to ready with release ordering. A reader loads ready with acquire ordering. If that load reads the released true value, the release synchronizes with the acquire. The earlier payload write happens before the later reader access. Payload remains alive and is not changed again in this one-shot protocol.

The ordering arrow between rows is conditional on that read-from relationship. Reusing the flag needs a new protocol.

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

Four workers perform one thousand indivisible increments each. Each fetch-add performs the complete increment atomically, so another worker cannot overwrite it with a stale read-plus-write result.

**Watch for:** An atomic counter does not automatically protect a surrounding mutable table or pointer graph.

**Check:** Does relaxed atomicity publish unrelated non-atomic data?

1. Not by itself
2. Always

<details><summary>Answer</summary>

Not by itself. Atomicity for one object and synchronization of other objects are distinct obligations.

</details>

**Try:** Edit the example in Browser Linux.  In native/examples/atomics-1/main.c, find atomic_fetch_add_explicit with memory_order_relaxed in the worker. Replace the call with atomic_fetch_add using the same first two arguments. Repeat the terminal run. Which invariant about the atomic counter makes atomic_total= agree in both runs?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: atomics (included in the explanation above) — Read atomic operations and their memory-order contracts.
- Course notes: C11 concurrency (included in the explanation above) — Check thread creation, joining, mutexes, and optional implementation support.

**Optional further reading (internet required):**

- [C reference: atomics](https://en.cppreference.com/w/c/atomic.html)
- [C reference: C11 concurrency](https://en.cppreference.com/w/c/thread.html)

Native source: `native/examples/atomics-1/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=atomics-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

