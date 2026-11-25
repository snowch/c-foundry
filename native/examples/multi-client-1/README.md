# Request scheduling

Complete Linux example, ready to edit and run in the browser terminal.

## 39.1 Request scheduling

Multiple clients need a request order that storage can enforce and responses can identify. Arrival time is not necessarily admission order.

The bounded queue gives one consumer a serialized stream of copied requests. The fixture verifies all eight accepted requests reach the owner. A real protocol should attach request and session IDs and correlate responses; FIFO order is the order of successful queue admission, not a claim about wall-clock arrival across independent clients.

### A bounded queue separates admission from execution

A single writer can own database mutations while callers submit work.

Producers submit requests to a queue with a fixed capacity. The single writer removes requests and performs database mutations. When the queue is full, the admission policy must block, reject, or otherwise apply a documented form of backpressure. Queue synchronization alone does not define transaction isolation or durable acknowledgement.

The capacity policy and acknowledgement point must be explicit parts of the interface.

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
  long total;
  run_queue(&count, &total);
  printf("scheduled=%u owner_total=%ld\n", count, total);
  return 0;
}
```

Output:

```text
scheduled=8 owner_total=36
```

The single consumer owns mutation of the aggregate. The example models scheduling in one process and does not open network sockets.

**Watch for:** A response without a request identity can be misattributed when clients have several operations in flight.

**Check:** Which order does this queue establish?

1. Successful admission order
2. A universal order of network arrival times

<details><summary>Answer</summary>

Successful admission order. The queue’s protected enqueue operation provides the ordering point.

</details>

**Try:** Edit the example in Browser Linux.  In native/examples/multi-client-1/main.c, reduce WORK_ITEMS from 8 to 6. Repeat the terminal run. Compare scheduled= and owner_total=. What evidence would let a caller match each response with its own request?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [Linux/POSIX manual: pthread_cond_wait(3)](https://man7.org/linux/man-pages/man3/pthread_cond_wait.3.html) (online) — Read the predicate-loop and mutex rules for waiting on a condition variable.
- [SQLite documentation: isolation](https://www.sqlite.org/isolation.html) (online) — Compare committed visibility and snapshot behavior with the lesson’s explicit contract.

Native source: `native/examples/multi-client-1/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=multi-client-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

