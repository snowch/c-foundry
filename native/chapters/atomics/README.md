# Chapter 37: Atomics and the C memory model

Part 8: Concurrency in C. Teaching baseline: C17.

Use atomic operations for the exact shared-state protocol you need, and treat memory ordering as a correctness contract.

## Outcomes

- Distinguish atomic modification from publication of other data.
- Start with sequential consistency for compound reasoning.
- Explain acquire/release and why volatile is not synchronization.

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

- [C reference: atomics](https://en.cppreference.com/w/c/atomic.html) — Read atomic operations and their memory-order contracts.
- [C reference: C11 concurrency](https://en.cppreference.com/w/c/thread.html) — Check thread creation, joining, mutexes, and optional implementation support.

Native source: `native/examples/atomics-1/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=atomics-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 37.2 Sequential consistency first

Sequential consistency provides a single order for sequentially consistent atomic operations that respects each thread’s required ordering. Start with this ordering when reasoning about several atomic objects so their operations can be traced in one consistent order.

The fixture uses the default atomic exchange and load operations, which are sequentially consistent. Exchange returns the previous value while installing the new one atomically. More complex protocols should first have a clear sequentially consistent argument; weakening orderings requires a new proof about which synchronization relationships remain.

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

int main(void) {
  atomic_uint state;
  atomic_init(&state, 0);
  unsigned previous = atomic_exchange(&state, 7);
  printf("previous=%u current=%u\n", previous, atomic_load(&state));
  return 0;
}
```

Output:

```text
previous=0 current=7
```

The exchange changes the state to seven and returns zero. Atomic exchange is not a substitute for a multi-object transaction.

**Watch for:** A collection of atomic fields can still expose a combination of values that violates an application invariant.

**Check:** Does exchanging one atomic counter also atomically update other, separately stored fields?

1. Yes
2. No, it acts on its atomic object

<details><summary>Answer</summary>

No, it acts on its atomic object. The operation’s atomicity scope is the object supplied.

</details>

**Try:** Edit the example in Browser Linux.  In native/examples/atomics-2/main.c, change the initial atomic value from 0 to 2 and the exchange value from 7 to 9. Repeat the terminal run. Which of previous= and current= belongs to the state before the exchange?

### References and help

- [C reference: atomics](https://en.cppreference.com/w/c/atomic.html) — Read atomic operations and their memory-order contracts.
- [C reference: C11 concurrency](https://en.cppreference.com/w/c/thread.html) — Check thread creation, joining, mutexes, and optional implementation support.

Native source: `native/examples/atomics-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=atomics-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## 37.3 Acquire/release through concrete examples

Release and acquire can publish initialized ordinary data when the acquiring load reads the released flag value.

The worker writes payload before a release store to ready. main waits for an acquire load that observes true, establishing a synchronizes-with relationship and making the earlier payload write visible. The object remains alive throughout, and no writer changes it afterward. Reusing this one-shot flag for repeated publications needs a new protocol.

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
atomic_bool ready;
int payload;
void *publish_payload(void *unused) {
  (void)unused;
  payload = 42;
  atomic_store_explicit(&ready, true, memory_order_release);
  return NULL;
}

int main(void) {
  atomic_init(&ready, false);
  pthread_t writer;
  CHECK(pthread_create(&writer, NULL, publish_payload, NULL));
  while (!atomic_load_explicit(&ready, memory_order_acquire))
    sched_yield();
  printf("published=%d\n", payload);
  CHECK(pthread_join(writer, NULL));
  return 0;
}
```

Output:

```text
published=42
```

The payload read occurs after the successful acquire, before join. The flag synchronization is therefore essential to that read’s validity.

**Watch for:** Using a relaxed load here would not establish the required payload publication relationship.

**Check:** Which load must observe the release store?

1. The acquire load of ready
2. Any unrelated relaxed counter load

<details><summary>Answer</summary>

The acquire load of ready. Synchronization depends on the matching atomic communication.

</details>

**Try:** Edit the example in Browser Linux.  In native/examples/atomics-3/main.c, change the value assigned to payload by publish_payload from 42 to 17. Leave the release and acquire operations in place and repeat the terminal run. Which order lets the reader see published= safely?

### References and help

- [C reference: atomics](https://en.cppreference.com/w/c/atomic.html) — Read atomic operations and their memory-order contracts.
- [C reference: C11 concurrency](https://en.cppreference.com/w/c/thread.html) — Check thread creation, joining, mutexes, and optional implementation support.

Native source: `native/examples/atomics-3/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=atomics-3 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

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

**Try:** Edit the example in Browser Linux.  In native/examples/atomics-4/main.c, change the local volatile loop bound from 3 to 5 and repeat the terminal run. Compare local_volatile= and atomic_total=. Which quantity is local and which receives updates from more than one worker?

### References and help

- [C reference: atomics](https://en.cppreference.com/w/c/atomic.html) — Read atomic operations and their memory-order contracts.
- [C reference: C11 concurrency](https://en.cppreference.com/w/c/thread.html) — Check thread creation, joining, mutexes, and optional implementation support.

**Use the documentation (optional):** Does volatile make ordinary shared accesses atomic or establish inter-thread synchronization?

<details><summary>Compare your answer</summary>

No. volatile is not a substitute for atomic operations or synchronization. Use documented atomic ordering or mutex-based rules to establish the required relationships.

</details>

Native source: `native/examples/atomics-4/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=atomics-4 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

## Build it yourself

Explain atomic counter updates and one-shot payload publication.

1. Audit shared variables in your queue and database; identify the mutex or atomic protocol protecting each one.
2. List each shared field and the mutex or atomic operation protecting it; distinguish counter atomicity from payload publication.

### Check your work

- Check the counter total after joins and trace the release store read by the payload’s acquire load.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=atomics-4
```

Chapter workspace command: `make chapter CHAPTER=atomics`.

Generated from dist/part8.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/atomics
