# Chapter 38: Build a concurrent storage service

Part 8: Concurrency in C. Teaching baseline: C17.

Put a bounded queue between callers and a single storage owner, with a shutdown and testing contract.

## Outcomes

- Choose and document the threading API.
- Transfer accepted requests without exposing mutable table internals.
- Drain or reject work predictably during shutdown.

## 38.1 C11 threading facilities versus POSIX threads

C11 threads and POSIX threads are separate APIs with different names and availability rules. Choose an adapter boundary rather than mixing their handles.

This fixture uses the standard threads.h interface on the Codespaces toolchain. thrd_create and thrd_join report thrd_success, and a worker returns an int result. Implementations may lack the optional threading facility; the feature guard makes that requirement explicit. The rest of this course’s Linux queue examples use pthreads and do not claim their types are interchangeable.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#if defined(__STDC_NO_THREADS__)
#error "C11 threads required for this example"
#endif
#include <threads.h>

int standard_worker(void *unused) {
  (void)unused;
  return 42;
}

int main(void) {
  thrd_t thread;
  int result = 0;
  if (thrd_create(&thread, standard_worker, NULL) != thrd_success ||
      thrd_join(thread, &result) != thrd_success)
    return 1;
  printf("joined_result=%d\n", result);
  return 0;
}
```

Output:

```text
joined_result=42
```

The worker’s return value arrives through the C11 join API. This checks the actual selected compiler and native library combination.

**Watch for:** A language-version macro alone does not guarantee that an optional threading library is present.

**Check:** May pthread_t and thrd_t be assumed interchangeable?

1. No
2. Yes

<details><summary>Answer</summary>

No. They belong to distinct APIs and contracts.

</details>

**Try:** Wrap create/join behind a small project interface and add platform-specific adapters only where tested.

Run from the repository root:

```sh
make example EXAMPLE=concurrent-storage-1
```

## 38.2 A bounded work queue

A storage service should bound pending requests and define when ownership transfers from a caller to the queue.

The integer request fixture copies values into queue slots. Successful admission transfers the queued value, while rejected admission leaves the caller responsible for any external payload owner. For pointer-bearing requests, define whether enqueue borrows, clones, or takes ownership. A caller must not hold a storage lock while blocking on queue capacity if the consumer needs that lock.

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
enum { WORK_CAP = 4, WORK_ITEMS = 8 };
typedef struct {
  int data[WORK_CAP];
  size_t head, count;
  bool closed;
  pthread_mutex_t lock;
  pthread_cond_t ready, space;
} WorkQueue;
bool offer_work(WorkQueue *q, int value) {
  CHECK(pthread_mutex_lock(&q->lock));
  while (q->count == WORK_CAP && !q->closed)
    CHECK(pthread_cond_wait(&q->space, &q->lock));
  if (q->closed) {
    CHECK(pthread_mutex_unlock(&q->lock));
    return false;
  }
  q->data[(q->head + q->count) % WORK_CAP] = value;
  ++q->count;
  CHECK(pthread_cond_signal(&q->ready));
  CHECK(pthread_mutex_unlock(&q->lock));
  return true;
}
bool take_work(WorkQueue *q, int *out) {
  CHECK(pthread_mutex_lock(&q->lock));
  while (!q->count && !q->closed)
    CHECK(pthread_cond_wait(&q->ready, &q->lock));
  if (!q->count) {
    CHECK(pthread_mutex_unlock(&q->lock));
    return false;
  }
  *out = q->data[q->head];
  q->head = (q->head + 1) % WORK_CAP;
  --q->count;
  CHECK(pthread_cond_signal(&q->space));
  CHECK(pthread_mutex_unlock(&q->lock));
  return true;
}
void close_work(WorkQueue *q) {
  CHECK(pthread_mutex_lock(&q->lock));
  q->closed = true;
  CHECK(pthread_cond_broadcast(&q->ready));
  CHECK(pthread_cond_broadcast(&q->space));
  CHECK(pthread_mutex_unlock(&q->lock));
}
typedef struct {
  WorkQueue *queue;
  unsigned received;
  long sum;
} Work;
void *produce(void *arg) {
  Work *w = arg;
  for (int i = 1; i <= WORK_ITEMS; ++i)
    if (!offer_work(w->queue, i))
      return NULL;
  close_work(w->queue);
  return NULL;
}
void *consume(void *arg) {
  Work *w = arg;
  int value;
  while (take_work(w->queue, &value)) {
    ++w->received;
    w->sum += value;
  }
  return NULL;
}
void run_queue(unsigned *count, long *sum) {
  WorkQueue q = {.lock = PTHREAD_MUTEX_INITIALIZER,
                 .ready = PTHREAD_COND_INITIALIZER,
                 .space = PTHREAD_COND_INITIALIZER};
  Work work = {&q, 0, 0};
  pthread_t producer, consumer;
  CHECK(pthread_create(&consumer, NULL, consume, &work));
  CHECK(pthread_create(&producer, NULL, produce, &work));
  CHECK(pthread_join(producer, NULL));
  CHECK(pthread_join(consumer, NULL));
  *count = work.received;
  *sum = work.sum;
  CHECK(pthread_cond_destroy(&q.ready));
  CHECK(pthread_cond_destroy(&q.space));
  CHECK(pthread_mutex_destroy(&q.lock));
}

int main(void) {
  unsigned count;
  long sum;
  run_queue(&count, &sum);
  printf("accepted_and_drained=%u total=%ld\n", count, sum);
  return 0;
}
```

Output:

```text
accepted_and_drained=8 total=36
```

All accepted copied requests are processed before shutdown completes. No mutable queue pointer escapes to callers.

**Watch for:** Passing pointers to short-lived request objects through a queue does not extend their lifetimes.

**Check:** What must be explicit for pointer-bearing requests?

1. Only the pointer’s numeric value
2. Ownership on successful and failed enqueue

<details><summary>Answer</summary>

Ownership on successful and failed enqueue. The asynchronous consumer may run after the caller’s scope ends.

</details>

**Try:** Replace integer requests with owned command objects and verify cleanup on rejected enqueue and successful processing.

Run from the repository root:

```sh
make example EXAMPLE=concurrent-storage-2
```

## 38.3 A single writer processing requests

Single-writer ownership can replace fine-grained mutation locks with serialized request processing. Reads and acknowledgements still need an explicit protocol.

The consumer alone updates its sum while producers only submit copied deltas. main reads the final state after joining the consumer. A database version would execute validated requests in that owner and return copied responses through a completion mechanism; it must not hand callers raw pointers into mutable storage. Durable acknowledgement still depends on the log protocol, not queue admission.

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
enum { WORK_CAP = 4, WORK_ITEMS = 8 };
typedef struct {
  int data[WORK_CAP];
  size_t head, count;
  bool closed;
  pthread_mutex_t lock;
  pthread_cond_t ready, space;
} WorkQueue;
bool offer_work(WorkQueue *q, int value) {
  CHECK(pthread_mutex_lock(&q->lock));
  while (q->count == WORK_CAP && !q->closed)
    CHECK(pthread_cond_wait(&q->space, &q->lock));
  if (q->closed) {
    CHECK(pthread_mutex_unlock(&q->lock));
    return false;
  }
  q->data[(q->head + q->count) % WORK_CAP] = value;
  ++q->count;
  CHECK(pthread_cond_signal(&q->ready));
  CHECK(pthread_mutex_unlock(&q->lock));
  return true;
}
bool take_work(WorkQueue *q, int *out) {
  CHECK(pthread_mutex_lock(&q->lock));
  while (!q->count && !q->closed)
    CHECK(pthread_cond_wait(&q->ready, &q->lock));
  if (!q->count) {
    CHECK(pthread_mutex_unlock(&q->lock));
    return false;
  }
  *out = q->data[q->head];
  q->head = (q->head + 1) % WORK_CAP;
  --q->count;
  CHECK(pthread_cond_signal(&q->space));
  CHECK(pthread_mutex_unlock(&q->lock));
  return true;
}
void close_work(WorkQueue *q) {
  CHECK(pthread_mutex_lock(&q->lock));
  q->closed = true;
  CHECK(pthread_cond_broadcast(&q->ready));
  CHECK(pthread_cond_broadcast(&q->space));
  CHECK(pthread_mutex_unlock(&q->lock));
}
typedef struct {
  WorkQueue *queue;
  unsigned received;
  long sum;
} Work;
void *produce(void *arg) {
  Work *w = arg;
  for (int i = 1; i <= WORK_ITEMS; ++i)
    if (!offer_work(w->queue, i))
      return NULL;
  close_work(w->queue);
  return NULL;
}
void *consume(void *arg) {
  Work *w = arg;
  int value;
  while (take_work(w->queue, &value)) {
    ++w->received;
    w->sum += value;
  }
  return NULL;
}
void run_queue(unsigned *count, long *sum) {
  WorkQueue q = {.lock = PTHREAD_MUTEX_INITIALIZER,
                 .ready = PTHREAD_COND_INITIALIZER,
                 .space = PTHREAD_COND_INITIALIZER};
  Work work = {&q, 0, 0};
  pthread_t producer, consumer;
  CHECK(pthread_create(&consumer, NULL, consume, &work));
  CHECK(pthread_create(&producer, NULL, produce, &work));
  CHECK(pthread_join(producer, NULL));
  CHECK(pthread_join(consumer, NULL));
  *count = work.received;
  *sum = work.sum;
  CHECK(pthread_cond_destroy(&q.ready));
  CHECK(pthread_cond_destroy(&q.space));
  CHECK(pthread_mutex_destroy(&q.lock));
}

int main(void) {
  unsigned processed;
  long state;
  run_queue(&processed, &state);
  printf("writer_state=%ld processed=%u\n", state, processed);
  return 0;
}
```

Output:

```text
writer_state=36 processed=8
```

There is one writer of the aggregate state, and join establishes the final read boundary. The fixture models request ownership, not a network server.

**Watch for:** Enqueued does not mean executed, committed, or durable; those are distinct response stages.

**Check:** Does successful queue admission mean a transaction is durably committed?

1. No
2. Yes

<details><summary>Answer</summary>

No. The request has not necessarily been processed or synchronized to storage.

</details>

**Try:** Add per-request responses with separate accepted, executed, and durable statuses, and document their wait boundaries.

Run from the repository root:

```sh
make example EXAMPLE=concurrent-storage-3
```

## 38.4 Shutdown, cancellation, and concurrency testing

Shutdown must wake blocked participants and decide what happens to already accepted work. Cooperative closure is easier to reason about than abrupt cancellation.

The queue’s close flag rejects future puts and lets takes drain existing items before returning false. Both condition variables are broadcast so blocked producers and consumers recheck their predicates. All workers join before mutex and condition-variable destruction. The fixture repeats startup and shutdown to expose lifecycle mistakes without using scheduling sleeps.

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
enum { WORK_CAP = 4, WORK_ITEMS = 8 };
typedef struct {
  int data[WORK_CAP];
  size_t head, count;
  bool closed;
  pthread_mutex_t lock;
  pthread_cond_t ready, space;
} WorkQueue;
bool offer_work(WorkQueue *q, int value) {
  CHECK(pthread_mutex_lock(&q->lock));
  while (q->count == WORK_CAP && !q->closed)
    CHECK(pthread_cond_wait(&q->space, &q->lock));
  if (q->closed) {
    CHECK(pthread_mutex_unlock(&q->lock));
    return false;
  }
  q->data[(q->head + q->count) % WORK_CAP] = value;
  ++q->count;
  CHECK(pthread_cond_signal(&q->ready));
  CHECK(pthread_mutex_unlock(&q->lock));
  return true;
}
bool take_work(WorkQueue *q, int *out) {
  CHECK(pthread_mutex_lock(&q->lock));
  while (!q->count && !q->closed)
    CHECK(pthread_cond_wait(&q->ready, &q->lock));
  if (!q->count) {
    CHECK(pthread_mutex_unlock(&q->lock));
    return false;
  }
  *out = q->data[q->head];
  q->head = (q->head + 1) % WORK_CAP;
  --q->count;
  CHECK(pthread_cond_signal(&q->space));
  CHECK(pthread_mutex_unlock(&q->lock));
  return true;
}
void close_work(WorkQueue *q) {
  CHECK(pthread_mutex_lock(&q->lock));
  q->closed = true;
  CHECK(pthread_cond_broadcast(&q->ready));
  CHECK(pthread_cond_broadcast(&q->space));
  CHECK(pthread_mutex_unlock(&q->lock));
}
typedef struct {
  WorkQueue *queue;
  unsigned received;
  long sum;
} Work;
void *produce(void *arg) {
  Work *w = arg;
  for (int i = 1; i <= WORK_ITEMS; ++i)
    if (!offer_work(w->queue, i))
      return NULL;
  close_work(w->queue);
  return NULL;
}
void *consume(void *arg) {
  Work *w = arg;
  int value;
  while (take_work(w->queue, &value)) {
    ++w->received;
    w->sum += value;
  }
  return NULL;
}
void run_queue(unsigned *count, long *sum) {
  WorkQueue q = {.lock = PTHREAD_MUTEX_INITIALIZER,
                 .ready = PTHREAD_COND_INITIALIZER,
                 .space = PTHREAD_COND_INITIALIZER};
  Work work = {&q, 0, 0};
  pthread_t producer, consumer;
  CHECK(pthread_create(&consumer, NULL, consume, &work));
  CHECK(pthread_create(&producer, NULL, produce, &work));
  CHECK(pthread_join(producer, NULL));
  CHECK(pthread_join(consumer, NULL));
  *count = work.received;
  *sum = work.sum;
  CHECK(pthread_cond_destroy(&q.ready));
  CHECK(pthread_cond_destroy(&q.space));
  CHECK(pthread_mutex_destroy(&q.lock));
}

int main(void) {
  for (unsigned run = 0; run < 20; ++run) {
    unsigned count;
    long sum;
    run_queue(&count, &sum);
    if (count != 8 || sum != 36)
      return 1;
  }
  puts("20 start-drain-join cycles passed");
  return 0;
}
```

Output:

```text
20 start-drain-join cycles passed
```

Each run initializes fresh synchronization objects and destroys them only after both workers finish. This tests a useful subset of schedules, not every possible interleaving.

**Watch for:** pthread_cancel can require cleanup handlers for held resources; it is not a drop-in replacement for this cooperative close protocol.

**Check:** When may synchronization objects be destroyed?

1. As soon as close sets a flag
2. After every accessing worker has finished

<details><summary>Answer</summary>

After every accessing worker has finished. A woken or draining worker may still need the lock and conditions.

</details>

**Try:** Add repeated close, blocked admission, consumer failure, and per-ID exactly-once checks; run ThreadSanitizer where supported.

Run from the repository root:

```sh
make example EXAMPLE=concurrent-storage-4
```

## Build it yourself

Use the queue as a foundation for a single-writer storage service.

1. Put a bounded queue between callers and a single storage owner, with a shutdown and testing contract.
2. Add repeated close, blocked admission, consumer failure, and per-ID exactly-once checks; run ThreadSanitizer where supported.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=concurrent-storage-4
```

Chapter workspace command: `make chapter CHAPTER=concurrent-storage`.

Generated from dist/part8.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/concurrent-storage
