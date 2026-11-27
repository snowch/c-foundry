# Producer–consumer queues

Complete Linux example, ready to edit and run in the browser terminal.

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
  printf("capacity=%d received_count=%u\n", WORK_CAP, count);
  return 0;
}
```

Output:

```text
capacity=4 received_count=8
```

Reusing slots lets this four-slot queue drain eight requests. The fixture checks the total and count from a fixed sequence of offered values.

### Wake, reacquire, then test the queue again

Why can a woken consumer still need to wait?

Why can a woken consumer still need to wait? Nodes: count > 0?, Wait (release mutex), Reacquire (mutex locked), Take item (under mutex). Connections: count > 0? leads to Wait (No); Wait leads to Reacquire (wake); Reacquire leads to count > 0? (recheck); count > 0? leads to Take item (Yes). The empty-and-closed case exits instead of waiting. A producer changes the predicate while holding the same mutex.. The actual take_work predicate is !count && !closed. pthread_cond_wait releases the mutex while waiting and reacquires it before returning. A notification is not a stored item; always recheck in a while loop.

The actual take_work predicate is !count && !closed. pthread_cond_wait releases the mutex while waiting and reacquires it before returning. A notification is not a stored item; always recheck in a while loop. Illustration of the supplied example; edits do not update this picture.

**Watch for:** Count and sum alone are not a complete exactly-once proof for arbitrary inputs; production tests should track each request ID.

**Check:** Under the bounded queue’s blocking-admission policy, what happens when the queue fills?

1. The oldest request is silently overwritten
2. The producer waits for space or closure

<details><summary>Answer</summary>

The producer waits for space or closure. Blocking admission preserves accepted work instead of dropping it.

</details>

**Try:** Edit the example in Browser Linux.  In native/examples/coordination-2/main.c, change WORK_CAP from 4 to 3. Repeat the terminal run and read capacity= and received_count=. How could repeated and missing request IDs escape the fixture’s count and sum checks?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [Read pthread_cond_wait(3)](../../manuals/pthread_cond_wait.3.txt) (included) — Read the predicate-loop and mutex rules for waiting on a condition variable.
- Course notes: C11 concurrency (included in the explanation above) — Check thread creation, joining, mutexes, and optional implementation support.

**Optional further reading (internet required):**

- [C reference: C11 concurrency](https://en.cppreference.com/w/c/thread.html)

Native source: `native/examples/coordination-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=coordination-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

