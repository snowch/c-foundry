# Chapter 36: Locks and coordination

Part 8: Concurrency in C. Teaching baseline: C17.

Use mutex-protected predicates and condition-variable loops to coordinate bounded work and orderly shutdown.

## Outcomes

- Wait in predicate loops and recheck after waking.
- Apply backpressure without losing FIFO data.
- Adopt a consistent lock order and an explicit fairness policy.

## 36.1 Mutexes and condition variables

A condition variable is a way to wait for a protected predicate to change, not a remembered message. Hold the mutex while checking the predicate.

The queue waits in while loops for not-empty and not-full conditions. pthread_cond_wait releases the mutex while waiting and reacquires it before returning; spurious wakes and competition require a predicate recheck. Mutations and signals occur under the queue’s lock, and close broadcasts to both classes of waiter.

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
  printf("received=%u sum=%ld\n", count, sum);
  return 0;
}
```

Output:

```text
received=8 sum=36
```

The consumer drains all eight items. No timing sleep is needed to make the producer and consumer coordinate correctly.

**Watch for:** Replacing while with if assumes a wake guarantees the predicate is still true, which condition variables do not promise.

**Check:** Why recheck after a condition wait?

1. The predicate may still be false
2. Every wake owns a distinct queued item

<details><summary>Answer</summary>

The predicate may still be false. A wake is permission to re-evaluate state under the mutex.

</details>

**Try:** Add two consumers and verify exactly-once consumption with a protected item-count reference.

Run from the repository root:

```sh
make example EXAMPLE=coordination-1
```

## 36.2 Producer–consumer queues

A bounded producer–consumer queue turns overload into backpressure rather than unbounded memory growth.

This four-slot queue carries eight requests, so a producer may wait for space. Every successful enqueue has one corresponding dequeue, and close rejects later offers while allowing already queued work to drain. FIFO is defined by queue admission order, not by when producer threads started. The example uses one producer and consumer to make the basic contract easy to verify.

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
  if (count != WORK_ITEMS || sum != 36)
    return 1;
  printf("capacity=%d exactly_once=%u\n", WORK_CAP, count);
  return 0;
}
```

Output:

```text
capacity=4 exactly_once=8
```

More work than capacity completes because slots are reused after consumption. The verification checks count and sum for this known unique sequence.

**Watch for:** Count and sum alone are not a complete exactly-once proof for arbitrary inputs; production tests should track each request ID.

**Check:** What happens when the queue fills under this policy?

1. The oldest request is silently overwritten
2. The producer waits for space or closure

<details><summary>Answer</summary>

The producer waits for space or closure. Blocking admission preserves accepted work instead of dropping it.

</details>

**Try:** Track every request ID in a bitmap, then test multiple producers and repeated queue wraparound.

Run from the repository root:

```sh
make example EXAMPLE=coordination-2
```

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

**Watch for:** Do not demonstrate deadlock by hanging the course runner; model the wait-for cycle or use a bounded diagnostic test.

**Check:** Does a global lock order guarantee fairness?

1. No
2. Yes

<details><summary>Answer</summary>

No. It addresses circular wait, not every scheduling policy.

</details>

**Try:** Draw the lock-order graph for your database and reject any proposed edge that creates a cycle.

Run from the repository root:

```sh
make example EXAMPLE=coordination-3
```

## Build it yourself

Explore a bounded queue that coordinates a producer and consumer.

1. Use mutex-protected predicates and condition-variable loops to coordinate bounded work and orderly shutdown.
2. Draw the lock-order graph for your database and reject any proposed edge that creates a cycle.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=coordination-3
```

Chapter workspace command: `make chapter CHAPTER=coordination`.

Generated from dist/part8.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/coordination
