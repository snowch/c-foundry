window.PART_EIGHT = {
  "threads": {
    "intro": "Create and join threads with explicit argument lifetimes and shared-memory ownership. Distinguish concurrency bugs from safe interleavings.",
    "outcomes": [
      "Keep worker arguments alive until joined.",
      "Use synchronization for shared mutable state.",
      "Reproduce an interleaving without deliberately executing a C data race."
    ],
    "topics": {
      "1": {
        "intro": "Concurrency means multiple activities may be in progress. Parallelism means work actually executes simultaneously; a concurrent program may run on one CPU.",
        "explanation": "The fixture starts four POSIX threads, each writing a separate Job result, then joins them before reading those results. The output depends on completion, not scheduling order. It does not prove that the OS ran the workers at the same instant or that threads made this tiny workload faster.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\ntypedef struct {\n  int input, result;\n} Job;\nvoid *twice_job(void *arg) {\n  Job *job = arg;\n  job->result = job->input * 2;\n  return NULL;\n}\n\nint main(void) {\n  pthread_t threads[4];\n  Job jobs[4];\n  for (int i = 0; i < 4; ++i) {\n    jobs[i] = (Job){i + 1, 0};\n    CHECK(pthread_create(&threads[i], NULL, twice_job, &jobs[i]));\n  }\n  int sum = 0;\n  for (int i = 0; i < 4; ++i) {\n    CHECK(pthread_join(threads[i], NULL));\n    sum += jobs[i].result;\n  }\n  printf(\"joined=4 sum=%d\\n\", sum);\n  return 0;\n}\n",
        "expected": "joined=4 sum=20",
        "walkthrough": "The worker results are two, four, six, and eight. Joining establishes completion before their sum is read.",
        "pitfall": "Thread creation overhead can exceed useful work for very small jobs; speedup requires measurement.",
        "question": "Does this output establish parallel execution?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "Joined results establish completed work, not simultaneous scheduling.",
        "tryit": "Compare sequential and threaded versions on a larger verified workload without assuming a speedup.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      },
      "2": {
        "intro": "Worker arguments and result storage must outlive every access. Returning from a scope can invalidate pointers even when the thread still runs.",
        "explanation": "main keeps the Job object alive while the worker accesses it and joins before reading its result. Passing the address of a loop variable reused by all workers can create both a lifetime or synchronization problem and incorrect logical inputs. Thread-local variables and separate per-worker objects simplify ownership but do not automatically protect genuinely shared objects.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\ntypedef struct {\n  int input, result;\n} Job;\nvoid *twice_job(void *arg) {\n  Job *job = arg;\n  job->result = job->input * 2;\n  return NULL;\n}\n\nint main(void) {\n  Job job = {21, 0};\n  pthread_t thread;\n  CHECK(pthread_create(&thread, NULL, twice_job, &job));\n  CHECK(pthread_join(thread, NULL));\n  printf(\"input=%d result=%d\\n\", job.input, job.result);\n  return 0;\n}\n",
        "expected": "input=21 result=42",
        "walkthrough": "The worker borrows a live Job and writes a result that main reads only after join. No heap ownership transfer is needed.",
        "pitfall": "Detaching a worker removes the ability to use join as its argument-lifetime boundary.",
        "question": "When may this stack Job leave scope?",
        "choices": [
          "Immediately after pthread_create returns",
          "After its worker has finished and been joined"
        ],
        "answer": 1,
        "why": "Creation does not imply the worker has completed its accesses.",
        "tryit": "Give each of several workers its own argument object and verify every result after joining.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      },
      "3": {
        "intro": "A C data race is conflicting unsynchronized access to a memory location with at least one write. A logical lost update can also occur even when each individual access is protected.",
        "explanation": "The fixture uses a barrier to ensure both workers read zero before either publishes one. Each read and write is mutex-protected, so the program avoids a C data race, yet the compound read-modify-write operation is not atomic. The final value is one rather than two. Removing the locks would introduce undefined behavior, not a reliable demonstration of a particular final result.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\npthread_mutex_t gate = PTHREAD_MUTEX_INITIALIZER;\npthread_barrier_t read_barrier;\nint shared_value;\nvoid *stale_update(void *unused) {\n  (void)unused;\n  CHECK(pthread_mutex_lock(&gate));\n  int copy = shared_value;\n  CHECK(pthread_mutex_unlock(&gate));\n  int result = pthread_barrier_wait(&read_barrier);\n  if (result != 0 && result != PTHREAD_BARRIER_SERIAL_THREAD)\n    exit(1);\n  CHECK(pthread_mutex_lock(&gate));\n  shared_value = copy + 1;\n  CHECK(pthread_mutex_unlock(&gate));\n  return NULL;\n}\n\nint main(void) {\n  CHECK(pthread_barrier_init(&read_barrier, NULL, 2));\n  pthread_t a, b;\n  CHECK(pthread_create(&a, NULL, stale_update, NULL));\n  CHECK(pthread_create(&b, NULL, stale_update, NULL));\n  CHECK(pthread_join(a, NULL));\n  CHECK(pthread_join(b, NULL));\n  printf(\"final=%d expected_atomic_increment=2\\n\", shared_value);\n  CHECK(pthread_barrier_destroy(&read_barrier));\n  CHECK(pthread_mutex_destroy(&gate));\n  return 0;\n}\n",
        "expected": "final=1 expected_atomic_increment=2",
        "walkthrough": "Both protected writes store their stale local zero plus one. Protecting the whole increment with one lock acquisition fixes the lost update.",
        "pitfall": "A race-free program can still violate an application’s transaction semantics.",
        "question": "What must be atomic to avoid this lost update?",
        "choices": [
          "The complete read-modify-write operation",
          "Only each separate load and store"
        ],
        "answer": 0,
        "why": "Both workers must not base their committed update on the same stale state.",
        "tryit": "Move the entire increment under one lock and verify final two; use ThreadSanitizer separately rather than relying on a data-race output.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      }
    },
    "practicePlan": {
      "goal": "Run joined threads and distinguish safe shared state from a data race.",
      "tasks": [
        "Create and join threads with explicit argument lifetimes and shared-memory ownership. Distinguish concurrency bugs from safe interleavings.",
        "Move the entire increment under one lock and verify final two; use ThreadSanitizer separately rather than relying on a data-race output.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "threads-3"
    }
  },
  "coordination": {
    "intro": "Use mutex-protected predicates and condition-variable loops to coordinate bounded work and orderly shutdown.",
    "outcomes": [
      "Wait in predicate loops and recheck after waking.",
      "Apply backpressure without losing FIFO data.",
      "Adopt a consistent lock order and an explicit fairness policy."
    ],
    "topics": {
      "1": {
        "intro": "A condition variable is a way to wait for a protected predicate to change, not a remembered message. Hold the mutex while checking the predicate.",
        "explanation": "The queue waits in while loops for not-empty and not-full conditions. pthread_cond_wait releases the mutex while waiting and reacquires it before returning; spurious wakes and competition require a predicate recheck. Mutations and signals occur under the queue’s lock, and close broadcasts to both classes of waiter.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\nenum { WORK_CAP = 4, WORK_ITEMS = 8 };\ntypedef struct {\n  int data[WORK_CAP];\n  size_t head, count;\n  bool closed;\n  pthread_mutex_t lock;\n  pthread_cond_t ready, space;\n} WorkQueue;\nbool offer_work(WorkQueue *q, int value) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  while (q->count == WORK_CAP && !q->closed)\n    CHECK(pthread_cond_wait(&q->space, &q->lock));\n  if (q->closed) {\n    CHECK(pthread_mutex_unlock(&q->lock));\n    return false;\n  }\n  q->data[(q->head + q->count) % WORK_CAP] = value;\n  ++q->count;\n  CHECK(pthread_cond_signal(&q->ready));\n  CHECK(pthread_mutex_unlock(&q->lock));\n  return true;\n}\nbool take_work(WorkQueue *q, int *out) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  while (!q->count && !q->closed)\n    CHECK(pthread_cond_wait(&q->ready, &q->lock));\n  if (!q->count) {\n    CHECK(pthread_mutex_unlock(&q->lock));\n    return false;\n  }\n  *out = q->data[q->head];\n  q->head = (q->head + 1) % WORK_CAP;\n  --q->count;\n  CHECK(pthread_cond_signal(&q->space));\n  CHECK(pthread_mutex_unlock(&q->lock));\n  return true;\n}\nvoid close_work(WorkQueue *q) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  q->closed = true;\n  CHECK(pthread_cond_broadcast(&q->ready));\n  CHECK(pthread_cond_broadcast(&q->space));\n  CHECK(pthread_mutex_unlock(&q->lock));\n}\ntypedef struct {\n  WorkQueue *queue;\n  unsigned received;\n  long sum;\n} Work;\nvoid *produce(void *arg) {\n  Work *w = arg;\n  for (int i = 1; i <= WORK_ITEMS; ++i)\n    if (!offer_work(w->queue, i))\n      return NULL;\n  close_work(w->queue);\n  return NULL;\n}\nvoid *consume(void *arg) {\n  Work *w = arg;\n  int value;\n  while (take_work(w->queue, &value)) {\n    ++w->received;\n    w->sum += value;\n  }\n  return NULL;\n}\nvoid run_queue(unsigned *count, long *sum) {\n  WorkQueue q = {.lock = PTHREAD_MUTEX_INITIALIZER,\n                 .ready = PTHREAD_COND_INITIALIZER,\n                 .space = PTHREAD_COND_INITIALIZER};\n  Work work = {&q, 0, 0};\n  pthread_t producer, consumer;\n  CHECK(pthread_create(&consumer, NULL, consume, &work));\n  CHECK(pthread_create(&producer, NULL, produce, &work));\n  CHECK(pthread_join(producer, NULL));\n  CHECK(pthread_join(consumer, NULL));\n  *count = work.received;\n  *sum = work.sum;\n  CHECK(pthread_cond_destroy(&q.ready));\n  CHECK(pthread_cond_destroy(&q.space));\n  CHECK(pthread_mutex_destroy(&q.lock));\n}\n\nint main(void) {\n  unsigned count;\n  long sum;\n  run_queue(&count, &sum);\n  printf(\"received=%u sum=%ld\\n\", count, sum);\n  return 0;\n}\n",
        "expected": "received=8 sum=36",
        "walkthrough": "The consumer drains all eight items. No timing sleep is needed to make the producer and consumer coordinate correctly.",
        "pitfall": "Replacing while with if assumes a wake guarantees the predicate is still true, which condition variables do not promise.",
        "question": "Why recheck after a condition wait?",
        "choices": [
          "The predicate may still be false",
          "Every wake owns a distinct queued item"
        ],
        "answer": 0,
        "why": "A wake is permission to re-evaluate state under the mutex.",
        "tryit": "Add two consumers and verify exactly-once consumption with a protected item-count reference.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      },
      "2": {
        "intro": "A bounded producer–consumer queue turns overload into backpressure rather than unbounded memory growth.",
        "explanation": "This four-slot queue carries eight requests, so a producer may wait for space. Every successful enqueue has one corresponding dequeue, and close rejects later offers while allowing already queued work to drain. FIFO is defined by queue admission order, not by when producer threads started. The example uses one producer and consumer to make the basic contract easy to verify.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\nenum { WORK_CAP = 4, WORK_ITEMS = 8 };\ntypedef struct {\n  int data[WORK_CAP];\n  size_t head, count;\n  bool closed;\n  pthread_mutex_t lock;\n  pthread_cond_t ready, space;\n} WorkQueue;\nbool offer_work(WorkQueue *q, int value) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  while (q->count == WORK_CAP && !q->closed)\n    CHECK(pthread_cond_wait(&q->space, &q->lock));\n  if (q->closed) {\n    CHECK(pthread_mutex_unlock(&q->lock));\n    return false;\n  }\n  q->data[(q->head + q->count) % WORK_CAP] = value;\n  ++q->count;\n  CHECK(pthread_cond_signal(&q->ready));\n  CHECK(pthread_mutex_unlock(&q->lock));\n  return true;\n}\nbool take_work(WorkQueue *q, int *out) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  while (!q->count && !q->closed)\n    CHECK(pthread_cond_wait(&q->ready, &q->lock));\n  if (!q->count) {\n    CHECK(pthread_mutex_unlock(&q->lock));\n    return false;\n  }\n  *out = q->data[q->head];\n  q->head = (q->head + 1) % WORK_CAP;\n  --q->count;\n  CHECK(pthread_cond_signal(&q->space));\n  CHECK(pthread_mutex_unlock(&q->lock));\n  return true;\n}\nvoid close_work(WorkQueue *q) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  q->closed = true;\n  CHECK(pthread_cond_broadcast(&q->ready));\n  CHECK(pthread_cond_broadcast(&q->space));\n  CHECK(pthread_mutex_unlock(&q->lock));\n}\ntypedef struct {\n  WorkQueue *queue;\n  unsigned received;\n  long sum;\n} Work;\nvoid *produce(void *arg) {\n  Work *w = arg;\n  for (int i = 1; i <= WORK_ITEMS; ++i)\n    if (!offer_work(w->queue, i))\n      return NULL;\n  close_work(w->queue);\n  return NULL;\n}\nvoid *consume(void *arg) {\n  Work *w = arg;\n  int value;\n  while (take_work(w->queue, &value)) {\n    ++w->received;\n    w->sum += value;\n  }\n  return NULL;\n}\nvoid run_queue(unsigned *count, long *sum) {\n  WorkQueue q = {.lock = PTHREAD_MUTEX_INITIALIZER,\n                 .ready = PTHREAD_COND_INITIALIZER,\n                 .space = PTHREAD_COND_INITIALIZER};\n  Work work = {&q, 0, 0};\n  pthread_t producer, consumer;\n  CHECK(pthread_create(&consumer, NULL, consume, &work));\n  CHECK(pthread_create(&producer, NULL, produce, &work));\n  CHECK(pthread_join(producer, NULL));\n  CHECK(pthread_join(consumer, NULL));\n  *count = work.received;\n  *sum = work.sum;\n  CHECK(pthread_cond_destroy(&q.ready));\n  CHECK(pthread_cond_destroy(&q.space));\n  CHECK(pthread_mutex_destroy(&q.lock));\n}\n\nint main(void) {\n  unsigned count;\n  long sum;\n  run_queue(&count, &sum);\n  if (count != WORK_ITEMS || sum != 36)\n    return 1;\n  printf(\"capacity=%d exactly_once=%u\\n\", WORK_CAP, count);\n  return 0;\n}\n",
        "expected": "capacity=4 exactly_once=8",
        "walkthrough": "More work than capacity completes because slots are reused after consumption. The verification checks count and sum for this known unique sequence.",
        "pitfall": "Count and sum alone are not a complete exactly-once proof for arbitrary inputs; production tests should track each request ID.",
        "question": "What happens when the queue fills under this policy?",
        "choices": [
          "The oldest request is silently overwritten",
          "The producer waits for space or closure"
        ],
        "answer": 1,
        "why": "Blocking admission preserves accepted work instead of dropping it.",
        "tryit": "Track every request ID in a bitmap, then test multiple producers and repeated queue wraparound.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      },
      "3": {
        "intro": "Lock ordering prevents circular wait when every path follows the same global order. It does not by itself guarantee fairness or eliminate every blocking failure.",
        "explanation": "Both workers acquire first_lock before second_lock and release in reverse order. A conflicting path that acquires them in the opposite order could deadlock. Also avoid holding a database lock while waiting for queue space or an external callback that may need that same lock. POSIX mutexes do not generally promise a specific fairness order.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\npthread_mutex_t first_lock = PTHREAD_MUTEX_INITIALIZER,\n                second_lock = PTHREAD_MUTEX_INITIALIZER;\nunsigned completed_work;\nvoid *ordered_locks(void *unused) {\n  (void)unused;\n  CHECK(pthread_mutex_lock(&first_lock));\n  CHECK(pthread_mutex_lock(&second_lock));\n  ++completed_work;\n  CHECK(pthread_mutex_unlock(&second_lock));\n  CHECK(pthread_mutex_unlock(&first_lock));\n  return NULL;\n}\n\nint main(void) {\n  pthread_t a, b;\n  CHECK(pthread_create(&a, NULL, ordered_locks, NULL));\n  CHECK(pthread_create(&b, NULL, ordered_locks, NULL));\n  CHECK(pthread_join(a, NULL));\n  CHECK(pthread_join(b, NULL));\n  printf(\"completed=%u\\n\", completed_work);\n  CHECK(pthread_mutex_destroy(&first_lock));\n  CHECK(pthread_mutex_destroy(&second_lock));\n  return 0;\n}\n",
        "expected": "completed=2",
        "walkthrough": "Both critical sections complete and their increments are protected. The output does not establish starvation freedom under an unbounded workload.",
        "pitfall": "Do not demonstrate deadlock by hanging the course runner; model the wait-for cycle or use a bounded diagnostic test.",
        "question": "Does a global lock order guarantee fairness?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "It addresses circular wait, not every scheduling policy.",
        "tryit": "Draw the lock-order graph for your database and reject any proposed edge that creates a cycle.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      }
    },
    "practicePlan": {
      "goal": "Explore a bounded queue that coordinates a producer and consumer.",
      "tasks": [
        "Use mutex-protected predicates and condition-variable loops to coordinate bounded work and orderly shutdown.",
        "Draw the lock-order graph for your database and reject any proposed edge that creates a cycle.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "coordination-3"
    }
  },
  "atomics": {
    "intro": "Use atomic operations for the exact shared-state protocol you need, and treat memory ordering as a correctness contract.",
    "outcomes": [
      "Distinguish atomic modification from publication of other data.",
      "Start with sequential consistency for compound reasoning.",
      "Explain acquire/release and why volatile is not synchronization."
    ],
    "topics": {
      "1": {
        "intro": "An atomic read-modify-write updates one atomic object without lost increments. Ordering other objects is a separate requirement.",
        "explanation": "The counter uses relaxed fetch-add because only the numeric total is shared through that atomic object; joins establish worker completion before main reads the total. Relaxed ordering would not be sufficient to publish an unrelated payload through a flag. All increments still participate in the counter’s atomic modification order.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\natomic_uint counter;\nvoid *increment_counter(void *unused) {\n  (void)unused;\n  for (unsigned i = 0; i < 1000; ++i)\n    atomic_fetch_add_explicit(&counter, 1, memory_order_relaxed);\n  return NULL;\n}\nunsigned joined_counter(void) {\n  atomic_init(&counter, 0);\n  pthread_t threads[4];\n  for (unsigned i = 0; i < 4; ++i)\n    CHECK(pthread_create(&threads[i], NULL, increment_counter, NULL));\n  for (unsigned i = 0; i < 4; ++i)\n    CHECK(pthread_join(threads[i], NULL));\n  return atomic_load_explicit(&counter, memory_order_relaxed);\n}\n\nint main(void) {\n  printf(\"atomic_total=%u\\n\", joined_counter());\n  return 0;\n}\n",
        "expected": "atomic_total=4000",
        "walkthrough": "Four workers perform one thousand indivisible increments each. No plain read-plus-write sequence can lose an increment.",
        "pitfall": "An atomic counter does not automatically protect a surrounding mutable table or pointer graph.",
        "question": "Does relaxed atomicity publish unrelated non-atomic data?",
        "choices": [
          "Not by itself",
          "Always"
        ],
        "answer": 0,
        "why": "Atomicity for one object and synchronization of other objects are distinct obligations.",
        "tryit": "Replace the relaxed operations with default sequentially consistent operations, then explain why both totals match this contract.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      },
      "2": {
        "intro": "Sequential consistency provides a single order for sequentially consistent atomic operations that respects each thread’s required ordering. It is a useful starting point.",
        "explanation": "The fixture uses the default atomic exchange and load operations, which are sequentially consistent. Exchange returns the previous value while installing the new one atomically. More complex protocols should first have a clear sequentially consistent argument; weakening orderings requires a new proof about which synchronization relationships remain.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\n\nint main(void) {\n  atomic_uint state;\n  atomic_init(&state, 0);\n  unsigned previous = atomic_exchange(&state, 7);\n  printf(\"previous=%u current=%u\\n\", previous, atomic_load(&state));\n  return 0;\n}\n",
        "expected": "previous=0 current=7",
        "walkthrough": "The exchange changes the state to seven and returns zero. Atomic exchange is not a substitute for a multi-object transaction.",
        "pitfall": "A collection of atomic fields can still expose a combination of values that violates an application invariant.",
        "question": "Does atomic exchange cover an entire arbitrary struct update?",
        "choices": [
          "Yes",
          "No, it acts on its atomic object"
        ],
        "answer": 1,
        "why": "The operation’s atomicity scope is the object supplied.",
        "tryit": "Describe an invariant spanning two fields and choose a mutex or an explicit publication protocol that preserves it.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      },
      "3": {
        "intro": "Release and acquire can publish initialized ordinary data when the acquiring load reads the released flag value.",
        "explanation": "The worker writes payload before a release store to ready. main waits for an acquire load that observes true, establishing a synchronizes-with relationship and making the earlier payload write visible. The object remains alive throughout, and no writer changes it afterward. Reusing this one-shot flag for repeated publications needs a new protocol.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\natomic_bool ready;\nint payload;\nvoid *publish_payload(void *unused) {\n  (void)unused;\n  payload = 42;\n  atomic_store_explicit(&ready, true, memory_order_release);\n  return NULL;\n}\n\nint main(void) {\n  atomic_init(&ready, false);\n  pthread_t writer;\n  CHECK(pthread_create(&writer, NULL, publish_payload, NULL));\n  while (!atomic_load_explicit(&ready, memory_order_acquire))\n    sched_yield();\n  printf(\"published=%d\\n\", payload);\n  CHECK(pthread_join(writer, NULL));\n  return 0;\n}\n",
        "expected": "published=42",
        "walkthrough": "The payload read occurs after the successful acquire, before join. The flag synchronization is therefore essential to that read’s validity.",
        "pitfall": "Using a relaxed load here would not establish the required payload publication relationship.",
        "question": "Which load must observe the release store?",
        "choices": [
          "The acquire load of ready",
          "Any unrelated relaxed counter load"
        ],
        "answer": 0,
        "why": "Synchronization depends on the matching atomic communication.",
        "tryit": "Explain why reading payload before the acquire would violate the protocol, then design a generation-based repeated-publication version.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      },
      "4": {
        "intro": "volatile changes certain access semantics but does not make ordinary shared accesses atomic or establish thread synchronization.",
        "explanation": "The volatile variable in this fixture is accessed only by main and serves as a deliberately local example. The shared counter uses C11 atomics, not volatile. Removing atomics and merely adding volatile to the counter would create conflicting unsynchronized accesses and undefined behavior. Device-register use of volatile has additional platform-specific rules.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\natomic_uint counter;\nvoid *increment_counter(void *unused) {\n  (void)unused;\n  for (unsigned i = 0; i < 1000; ++i)\n    atomic_fetch_add_explicit(&counter, 1, memory_order_relaxed);\n  return NULL;\n}\nunsigned joined_counter(void) {\n  atomic_init(&counter, 0);\n  pthread_t threads[4];\n  for (unsigned i = 0; i < 4; ++i)\n    CHECK(pthread_create(&threads[i], NULL, increment_counter, NULL));\n  for (unsigned i = 0; i < 4; ++i)\n    CHECK(pthread_join(threads[i], NULL));\n  return atomic_load_explicit(&counter, memory_order_relaxed);\n}\n\nint main(void) {\n  volatile unsigned local = 0;\n  for (unsigned i = 0; i < 3; ++i)\n    ++local;\n  printf(\"local_volatile=%u atomic_total=%u\\n\", local, joined_counter());\n  return 0;\n}\n",
        "expected": "local_volatile=3 atomic_total=4000",
        "walkthrough": "The local volatile increments have no cross-thread role. The correct shared total comes from atomic fetch-add operations and worker joins.",
        "pitfall": "An observed correct result from a volatile shared counter does not establish a valid synchronization contract.",
        "question": "Can volatile replace a mutex or atomic operation for shared increments?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "It supplies neither the required atomic update nor the inter-thread ordering relationship.",
        "tryit": "Audit shared variables in your queue and database; identify the mutex or atomic protocol protecting each one.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      }
    },
    "practicePlan": {
      "goal": "Compare a mutex-protected counter with a C11 atomic counter.",
      "tasks": [
        "Use atomic operations for the exact shared-state protocol you need, and treat memory ordering as a correctness contract.",
        "Audit shared variables in your queue and database; identify the mutex or atomic protocol protecting each one.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "atomics-4"
    }
  },
  "concurrent-storage": {
    "intro": "Put a bounded queue between callers and a single storage owner, with a shutdown and testing contract.",
    "outcomes": [
      "Choose and document the threading API.",
      "Transfer accepted requests without exposing mutable table internals.",
      "Drain or reject work predictably during shutdown."
    ],
    "topics": {
      "1": {
        "intro": "C11 threads and POSIX threads are separate APIs with different names and availability rules. Choose an adapter boundary rather than mixing their handles.",
        "explanation": "This fixture uses the standard threads.h interface on the Codespaces toolchain. thrd_create and thrd_join report thrd_success, and a worker returns an int result. Implementations may lack the optional threading facility; the feature guard makes that requirement explicit. The rest of this course’s Linux queue examples use pthreads and do not claim their types are interchangeable.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#if defined(__STDC_NO_THREADS__)\n#error \"C11 threads required for this example\"\n#endif\n#include <threads.h>\n\nint standard_worker(void *unused) {\n  (void)unused;\n  return 42;\n}\n\nint main(void) {\n  thrd_t thread;\n  int result = 0;\n  if (thrd_create(&thread, standard_worker, NULL) != thrd_success ||\n      thrd_join(thread, &result) != thrd_success)\n    return 1;\n  printf(\"joined_result=%d\\n\", result);\n  return 0;\n}\n",
        "expected": "joined_result=42",
        "walkthrough": "The worker’s return value arrives through the C11 join API. This checks the actual selected compiler and native library combination.",
        "pitfall": "A language-version macro alone does not guarantee that an optional threading library is present.",
        "question": "May pthread_t and thrd_t be assumed interchangeable?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "They belong to distinct APIs and contracts.",
        "tryit": "Wrap create/join behind a small project interface and add platform-specific adapters only where tested.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      },
      "2": {
        "intro": "A storage service should bound pending requests and define when ownership transfers from a caller to the queue.",
        "explanation": "The integer request fixture copies values into queue slots. Successful admission transfers the queued value, while rejected admission leaves the caller responsible for any external payload owner. For pointer-bearing requests, define whether enqueue borrows, clones, or takes ownership. A caller must not hold a storage lock while blocking on queue capacity if the consumer needs that lock.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\nenum { WORK_CAP = 4, WORK_ITEMS = 8 };\ntypedef struct {\n  int data[WORK_CAP];\n  size_t head, count;\n  bool closed;\n  pthread_mutex_t lock;\n  pthread_cond_t ready, space;\n} WorkQueue;\nbool offer_work(WorkQueue *q, int value) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  while (q->count == WORK_CAP && !q->closed)\n    CHECK(pthread_cond_wait(&q->space, &q->lock));\n  if (q->closed) {\n    CHECK(pthread_mutex_unlock(&q->lock));\n    return false;\n  }\n  q->data[(q->head + q->count) % WORK_CAP] = value;\n  ++q->count;\n  CHECK(pthread_cond_signal(&q->ready));\n  CHECK(pthread_mutex_unlock(&q->lock));\n  return true;\n}\nbool take_work(WorkQueue *q, int *out) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  while (!q->count && !q->closed)\n    CHECK(pthread_cond_wait(&q->ready, &q->lock));\n  if (!q->count) {\n    CHECK(pthread_mutex_unlock(&q->lock));\n    return false;\n  }\n  *out = q->data[q->head];\n  q->head = (q->head + 1) % WORK_CAP;\n  --q->count;\n  CHECK(pthread_cond_signal(&q->space));\n  CHECK(pthread_mutex_unlock(&q->lock));\n  return true;\n}\nvoid close_work(WorkQueue *q) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  q->closed = true;\n  CHECK(pthread_cond_broadcast(&q->ready));\n  CHECK(pthread_cond_broadcast(&q->space));\n  CHECK(pthread_mutex_unlock(&q->lock));\n}\ntypedef struct {\n  WorkQueue *queue;\n  unsigned received;\n  long sum;\n} Work;\nvoid *produce(void *arg) {\n  Work *w = arg;\n  for (int i = 1; i <= WORK_ITEMS; ++i)\n    if (!offer_work(w->queue, i))\n      return NULL;\n  close_work(w->queue);\n  return NULL;\n}\nvoid *consume(void *arg) {\n  Work *w = arg;\n  int value;\n  while (take_work(w->queue, &value)) {\n    ++w->received;\n    w->sum += value;\n  }\n  return NULL;\n}\nvoid run_queue(unsigned *count, long *sum) {\n  WorkQueue q = {.lock = PTHREAD_MUTEX_INITIALIZER,\n                 .ready = PTHREAD_COND_INITIALIZER,\n                 .space = PTHREAD_COND_INITIALIZER};\n  Work work = {&q, 0, 0};\n  pthread_t producer, consumer;\n  CHECK(pthread_create(&consumer, NULL, consume, &work));\n  CHECK(pthread_create(&producer, NULL, produce, &work));\n  CHECK(pthread_join(producer, NULL));\n  CHECK(pthread_join(consumer, NULL));\n  *count = work.received;\n  *sum = work.sum;\n  CHECK(pthread_cond_destroy(&q.ready));\n  CHECK(pthread_cond_destroy(&q.space));\n  CHECK(pthread_mutex_destroy(&q.lock));\n}\n\nint main(void) {\n  unsigned count;\n  long sum;\n  run_queue(&count, &sum);\n  printf(\"accepted_and_drained=%u total=%ld\\n\", count, sum);\n  return 0;\n}\n",
        "expected": "accepted_and_drained=8 total=36",
        "walkthrough": "All accepted copied requests are processed before shutdown completes. No mutable queue pointer escapes to callers.",
        "pitfall": "Passing pointers to short-lived request objects through a queue does not extend their lifetimes.",
        "question": "What must be explicit for pointer-bearing requests?",
        "choices": [
          "Only the pointer’s numeric value",
          "Ownership on successful and failed enqueue"
        ],
        "answer": 1,
        "why": "The asynchronous consumer may run after the caller’s scope ends.",
        "tryit": "Replace integer requests with owned command objects and verify cleanup on rejected enqueue and successful processing.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      },
      "3": {
        "intro": "Single-writer ownership can replace fine-grained mutation locks with serialized request processing. Reads and acknowledgements still need an explicit protocol.",
        "explanation": "The consumer alone updates its sum while producers only submit copied deltas. main reads the final state after joining the consumer. A database version would execute validated requests in that owner and return copied responses through a completion mechanism; it must not hand callers raw pointers into mutable storage. Durable acknowledgement still depends on the log protocol, not queue admission.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\nenum { WORK_CAP = 4, WORK_ITEMS = 8 };\ntypedef struct {\n  int data[WORK_CAP];\n  size_t head, count;\n  bool closed;\n  pthread_mutex_t lock;\n  pthread_cond_t ready, space;\n} WorkQueue;\nbool offer_work(WorkQueue *q, int value) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  while (q->count == WORK_CAP && !q->closed)\n    CHECK(pthread_cond_wait(&q->space, &q->lock));\n  if (q->closed) {\n    CHECK(pthread_mutex_unlock(&q->lock));\n    return false;\n  }\n  q->data[(q->head + q->count) % WORK_CAP] = value;\n  ++q->count;\n  CHECK(pthread_cond_signal(&q->ready));\n  CHECK(pthread_mutex_unlock(&q->lock));\n  return true;\n}\nbool take_work(WorkQueue *q, int *out) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  while (!q->count && !q->closed)\n    CHECK(pthread_cond_wait(&q->ready, &q->lock));\n  if (!q->count) {\n    CHECK(pthread_mutex_unlock(&q->lock));\n    return false;\n  }\n  *out = q->data[q->head];\n  q->head = (q->head + 1) % WORK_CAP;\n  --q->count;\n  CHECK(pthread_cond_signal(&q->space));\n  CHECK(pthread_mutex_unlock(&q->lock));\n  return true;\n}\nvoid close_work(WorkQueue *q) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  q->closed = true;\n  CHECK(pthread_cond_broadcast(&q->ready));\n  CHECK(pthread_cond_broadcast(&q->space));\n  CHECK(pthread_mutex_unlock(&q->lock));\n}\ntypedef struct {\n  WorkQueue *queue;\n  unsigned received;\n  long sum;\n} Work;\nvoid *produce(void *arg) {\n  Work *w = arg;\n  for (int i = 1; i <= WORK_ITEMS; ++i)\n    if (!offer_work(w->queue, i))\n      return NULL;\n  close_work(w->queue);\n  return NULL;\n}\nvoid *consume(void *arg) {\n  Work *w = arg;\n  int value;\n  while (take_work(w->queue, &value)) {\n    ++w->received;\n    w->sum += value;\n  }\n  return NULL;\n}\nvoid run_queue(unsigned *count, long *sum) {\n  WorkQueue q = {.lock = PTHREAD_MUTEX_INITIALIZER,\n                 .ready = PTHREAD_COND_INITIALIZER,\n                 .space = PTHREAD_COND_INITIALIZER};\n  Work work = {&q, 0, 0};\n  pthread_t producer, consumer;\n  CHECK(pthread_create(&consumer, NULL, consume, &work));\n  CHECK(pthread_create(&producer, NULL, produce, &work));\n  CHECK(pthread_join(producer, NULL));\n  CHECK(pthread_join(consumer, NULL));\n  *count = work.received;\n  *sum = work.sum;\n  CHECK(pthread_cond_destroy(&q.ready));\n  CHECK(pthread_cond_destroy(&q.space));\n  CHECK(pthread_mutex_destroy(&q.lock));\n}\n\nint main(void) {\n  unsigned processed;\n  long state;\n  run_queue(&processed, &state);\n  printf(\"writer_state=%ld processed=%u\\n\", state, processed);\n  return 0;\n}\n",
        "expected": "writer_state=36 processed=8",
        "walkthrough": "There is one writer of the aggregate state, and join establishes the final read boundary. The fixture models request ownership, not a network server.",
        "pitfall": "Enqueued does not mean executed, committed, or durable; those are distinct response stages.",
        "question": "Does successful queue admission mean a transaction is durably committed?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "The request has not necessarily been processed or synchronized to storage.",
        "tryit": "Add per-request responses with separate accepted, executed, and durable statuses, and document their wait boundaries.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      },
      "4": {
        "intro": "Shutdown must wake blocked participants and decide what happens to already accepted work. Cooperative closure is easier to reason about than abrupt cancellation.",
        "explanation": "The queue’s close flag rejects future puts and lets takes drain existing items before returning false. Both condition variables are broadcast so blocked producers and consumers recheck their predicates. All workers join before mutex and condition-variable destruction. The fixture repeats startup and shutdown to expose lifecycle mistakes without using scheduling sleeps.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\nenum { WORK_CAP = 4, WORK_ITEMS = 8 };\ntypedef struct {\n  int data[WORK_CAP];\n  size_t head, count;\n  bool closed;\n  pthread_mutex_t lock;\n  pthread_cond_t ready, space;\n} WorkQueue;\nbool offer_work(WorkQueue *q, int value) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  while (q->count == WORK_CAP && !q->closed)\n    CHECK(pthread_cond_wait(&q->space, &q->lock));\n  if (q->closed) {\n    CHECK(pthread_mutex_unlock(&q->lock));\n    return false;\n  }\n  q->data[(q->head + q->count) % WORK_CAP] = value;\n  ++q->count;\n  CHECK(pthread_cond_signal(&q->ready));\n  CHECK(pthread_mutex_unlock(&q->lock));\n  return true;\n}\nbool take_work(WorkQueue *q, int *out) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  while (!q->count && !q->closed)\n    CHECK(pthread_cond_wait(&q->ready, &q->lock));\n  if (!q->count) {\n    CHECK(pthread_mutex_unlock(&q->lock));\n    return false;\n  }\n  *out = q->data[q->head];\n  q->head = (q->head + 1) % WORK_CAP;\n  --q->count;\n  CHECK(pthread_cond_signal(&q->space));\n  CHECK(pthread_mutex_unlock(&q->lock));\n  return true;\n}\nvoid close_work(WorkQueue *q) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  q->closed = true;\n  CHECK(pthread_cond_broadcast(&q->ready));\n  CHECK(pthread_cond_broadcast(&q->space));\n  CHECK(pthread_mutex_unlock(&q->lock));\n}\ntypedef struct {\n  WorkQueue *queue;\n  unsigned received;\n  long sum;\n} Work;\nvoid *produce(void *arg) {\n  Work *w = arg;\n  for (int i = 1; i <= WORK_ITEMS; ++i)\n    if (!offer_work(w->queue, i))\n      return NULL;\n  close_work(w->queue);\n  return NULL;\n}\nvoid *consume(void *arg) {\n  Work *w = arg;\n  int value;\n  while (take_work(w->queue, &value)) {\n    ++w->received;\n    w->sum += value;\n  }\n  return NULL;\n}\nvoid run_queue(unsigned *count, long *sum) {\n  WorkQueue q = {.lock = PTHREAD_MUTEX_INITIALIZER,\n                 .ready = PTHREAD_COND_INITIALIZER,\n                 .space = PTHREAD_COND_INITIALIZER};\n  Work work = {&q, 0, 0};\n  pthread_t producer, consumer;\n  CHECK(pthread_create(&consumer, NULL, consume, &work));\n  CHECK(pthread_create(&producer, NULL, produce, &work));\n  CHECK(pthread_join(producer, NULL));\n  CHECK(pthread_join(consumer, NULL));\n  *count = work.received;\n  *sum = work.sum;\n  CHECK(pthread_cond_destroy(&q.ready));\n  CHECK(pthread_cond_destroy(&q.space));\n  CHECK(pthread_mutex_destroy(&q.lock));\n}\n\nint main(void) {\n  for (unsigned run = 0; run < 20; ++run) {\n    unsigned count;\n    long sum;\n    run_queue(&count, &sum);\n    if (count != 8 || sum != 36)\n      return 1;\n  }\n  puts(\"20 start-drain-join cycles passed\");\n  return 0;\n}\n",
        "expected": "20 start-drain-join cycles passed",
        "walkthrough": "Each run initializes fresh synchronization objects and destroys them only after both workers finish. This tests a useful subset of schedules, not every possible interleaving.",
        "pitfall": "pthread_cancel can require cleanup handlers for held resources; it is not a drop-in replacement for this cooperative close protocol.",
        "question": "When may synchronization objects be destroyed?",
        "choices": [
          "As soon as close sets a flag",
          "After every accessing worker has finished"
        ],
        "answer": 1,
        "why": "A woken or draining worker may still need the lock and conditions.",
        "tryit": "Add repeated close, blocked admission, consumer failure, and per-ID exactly-once checks; run ThreadSanitizer where supported.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      }
    },
    "practicePlan": {
      "goal": "Use the queue as a foundation for a single-writer storage service.",
      "tasks": [
        "Put a bounded queue between callers and a single storage owner, with a shutdown and testing contract.",
        "Add repeated close, blocked admission, consumer failure, and per-ID exactly-once checks; run ThreadSanitizer where supported.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "concurrent-storage-4"
    }
  }
};
