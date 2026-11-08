# Chapter 39: Multiple clients, one safe writer

Part 9: Advanced TinyDB. Teaching baseline: C17.

Define request admission, transaction ownership, and overload behavior before accepting multiple callers.

## Outcomes

- Separate scheduling from execution and durable acknowledgement.
- Bind transaction state to a session.
- Bound pending requests and define backpressure.

## 39.1 Request scheduling

Multiple clients need a request order that storage can enforce and responses can identify. Arrival time is not necessarily admission order.

The bounded queue gives one consumer a serialized stream of copied requests. The fixture verifies all eight accepted requests reach the owner. A real protocol should attach request and session IDs and correlate responses; FIFO order is the order of successful queue admission, not a claim about wall-clock arrival across independent clients.

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

**Try:** Add session/request IDs, copy-out responses, and tests that every response matches one accepted request.

Run from the repository root:

```sh
make example EXAMPLE=multi-client-1
```

## 39.2 Transaction boundaries

A transaction boundary must belong to a session, not merely to whichever request arrives next. Other clients cannot commit or mutate another client’s working state.

The serialized-owner model tracks the active session ID. SET and COMMIT reject a different session without changing the active transaction. This fixture contains one value and an in-memory commit; integrating durable logging must retain the same ownership checks before acknowledgement. Define timeouts, disconnect rollback, and admission fairness separately.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  unsigned owner;
  bool active;
  int committed, working;
} SessionDB;
bool tx_begin(SessionDB *db, unsigned session) {
  if (!session || db->active)
    return false;
  db->owner = session;
  db->working = db->committed;
  db->active = true;
  return true;
}
bool tx_set(SessionDB *db, unsigned session, int value) {
  if (!db->active || db->owner != session)
    return false;
  db->working = value;
  return true;
}
bool tx_commit(SessionDB *db, unsigned session) {
  if (!db->active || db->owner != session)
    return false;
  db->committed = db->working;
  db->active = false;
  db->owner = 0;
  return true;
}

int main(void) {
  SessionDB db = {0};
  tx_begin(&db, 1);
  tx_set(&db, 1, 42);
  bool wrong = tx_commit(&db, 2);
  bool right = tx_commit(&db, 1);
  printf("other_rejected=%d owner_committed=%d value=%d\n", !wrong, right,
         db.committed);
  return 0;
}
```

Output:

```text
other_rejected=1 owner_committed=1 value=42
```

The failed session-two commit leaves session one’s working value intact. Only its owner can publish it.

**Watch for:** Serializing individual requests does not automatically serialize a multi-request transaction under one owner.

**Check:** May another session commit the current transaction?

1. Yes
2. No

<details><summary>Answer</summary>

No. The transaction handle is associated with a session identity.

</details>

**Try:** Add disconnect rollback and reject stale requests from a session whose transaction has already ended.

Run from the repository root:

```sh
make example EXAMPLE=multi-client-2
```

## 39.3 Contention and backpressure

Backpressure makes overload behavior explicit. A system must decide whether a full queue blocks, rejects, or sheds work under a documented policy.

The fixture uses blocking admission and draining close. Memory is bounded by four pending copied requests even while eight operations are processed. A production service may choose timeouts or immediate rejection, but it must define whether a timed-out request was never accepted, accepted but not completed, or committed with a lost response.

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
  printf("queue_bound=%d processed=%u\n", WORK_CAP, count);
  return 0;
}
```

Output:

```text
queue_bound=4 processed=8
```

The queue remains bounded while its slots are reused. Processing more requests than capacity does not imply unbounded buffering.

**Watch for:** Retrying after an ambiguous timeout can duplicate a committed operation unless request deduplication is part of the protocol.

**Check:** What must a timeout response clarify?

1. Whether admission or completion is known
2. Only that the client waited

<details><summary>Answer</summary>

Whether admission or completion is known. The client needs enough state to make a safe retry decision.

</details>

**Try:** Add try-offer and timed-admission variants, then test exactly-once request IDs across retries.

Run from the repository root:

```sh
make example EXAMPLE=multi-client-3
```

## Build it yourself

Extend the native TinyDB baseline with a serialized request path.

1. Define request admission, transaction ownership, and overload behavior before accepting multiple callers.
2. Add try-offer and timed-admission variants, then test exactly-once request IDs across retries.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=multi-client-3
```

Chapter workspace command: `make chapter CHAPTER=multi-client`.

Generated from dist/part9.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/multi-client
