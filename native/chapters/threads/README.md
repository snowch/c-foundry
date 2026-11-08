# Chapter 35: Processes, threads, and shared state

Part 8: Concurrency in C. Teaching baseline: C17.

Create and join threads with explicit argument lifetimes and shared-memory ownership. Distinguish concurrency bugs from safe interleavings.

## Outcomes

- Keep worker arguments alive until joined.
- Use synchronization for shared mutable state.
- Reproduce an interleaving without deliberately executing a C data race.

## 35.1 Concurrency versus parallelism

Concurrency means multiple activities may be in progress. Parallelism means work actually executes simultaneously; a concurrent program may run on one CPU.

The fixture starts four POSIX threads, each writing a separate Job result, then joins them before reading those results. The output depends on completion, not scheduling order. It does not prove that the OS ran the workers at the same instant or that threads made this tiny workload faster.

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
typedef struct {
  int input, result;
} Job;
void *twice_job(void *arg) {
  Job *job = arg;
  job->result = job->input * 2;
  return NULL;
}

int main(void) {
  pthread_t threads[4];
  Job jobs[4];
  for (int i = 0; i < 4; ++i) {
    jobs[i] = (Job){i + 1, 0};
    CHECK(pthread_create(&threads[i], NULL, twice_job, &jobs[i]));
  }
  int sum = 0;
  for (int i = 0; i < 4; ++i) {
    CHECK(pthread_join(threads[i], NULL));
    sum += jobs[i].result;
  }
  printf("joined=4 sum=%d\n", sum);
  return 0;
}
```

Output:

```text
joined=4 sum=20
```

The worker results are two, four, six, and eight. Joining establishes completion before their sum is read.

**Watch for:** Thread creation overhead can exceed useful work for very small jobs; speedup requires measurement.

**Check:** Does this output establish parallel execution?

1. No
2. Yes

<details><summary>Answer</summary>

No. Joined results establish completed work, not simultaneous scheduling.

</details>

**Try:** Compare sequential and threaded versions on a larger verified workload without assuming a speedup.

Run from the repository root:

```sh
make example EXAMPLE=threads-1
```

## 35.2 Thread lifetimes and shared memory

Worker arguments and result storage must outlive every access. Returning from a scope can invalidate pointers even when the thread still runs.

main keeps the Job object alive while the worker accesses it and joins before reading its result. Passing the address of a loop variable reused by all workers can create both a lifetime or synchronization problem and incorrect logical inputs. Thread-local variables and separate per-worker objects simplify ownership but do not automatically protect genuinely shared objects.

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
typedef struct {
  int input, result;
} Job;
void *twice_job(void *arg) {
  Job *job = arg;
  job->result = job->input * 2;
  return NULL;
}

int main(void) {
  Job job = {21, 0};
  pthread_t thread;
  CHECK(pthread_create(&thread, NULL, twice_job, &job));
  CHECK(pthread_join(thread, NULL));
  printf("input=%d result=%d\n", job.input, job.result);
  return 0;
}
```

Output:

```text
input=21 result=42
```

The worker borrows a live Job and writes a result that main reads only after join. No heap ownership transfer is needed.

**Watch for:** Detaching a worker removes the ability to use join as its argument-lifetime boundary.

**Check:** When may this stack Job leave scope?

1. Immediately after pthread_create returns
2. After its worker has finished and been joined

<details><summary>Answer</summary>

After its worker has finished and been joined. Creation does not imply the worker has completed its accesses.

</details>

**Try:** Give each of several workers its own argument object and verify every result after joining.

Run from the repository root:

```sh
make example EXAMPLE=threads-2
```

## 35.3 Data races and reproducible interleavings

A C data race is conflicting unsynchronized access to a memory location with at least one write. A logical lost update can also occur even when each individual access is protected.

The fixture uses a barrier to ensure both workers read zero before either publishes one. Each read and write is mutex-protected, so the program avoids a C data race, yet the compound read-modify-write operation is not atomic. The final value is one rather than two. Removing the locks would introduce undefined behavior, not a reliable demonstration of a particular final result.

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
pthread_mutex_t gate = PTHREAD_MUTEX_INITIALIZER;
pthread_barrier_t read_barrier;
int shared_value;
void *stale_update(void *unused) {
  (void)unused;
  CHECK(pthread_mutex_lock(&gate));
  int copy = shared_value;
  CHECK(pthread_mutex_unlock(&gate));
  int result = pthread_barrier_wait(&read_barrier);
  if (result != 0 && result != PTHREAD_BARRIER_SERIAL_THREAD)
    exit(1);
  CHECK(pthread_mutex_lock(&gate));
  shared_value = copy + 1;
  CHECK(pthread_mutex_unlock(&gate));
  return NULL;
}

int main(void) {
  CHECK(pthread_barrier_init(&read_barrier, NULL, 2));
  pthread_t a, b;
  CHECK(pthread_create(&a, NULL, stale_update, NULL));
  CHECK(pthread_create(&b, NULL, stale_update, NULL));
  CHECK(pthread_join(a, NULL));
  CHECK(pthread_join(b, NULL));
  printf("final=%d expected_atomic_increment=2\n", shared_value);
  CHECK(pthread_barrier_destroy(&read_barrier));
  CHECK(pthread_mutex_destroy(&gate));
  return 0;
}
```

Output:

```text
final=1 expected_atomic_increment=2
```

Both protected writes store their stale local zero plus one. Protecting the whole increment with one lock acquisition fixes the lost update.

**Watch for:** A race-free program can still violate an application’s transaction semantics.

**Check:** What must be atomic to avoid this lost update?

1. The complete read-modify-write operation
2. Only each separate load and store

<details><summary>Answer</summary>

The complete read-modify-write operation. Both workers must not base their committed update on the same stale state.

</details>

**Try:** Move the entire increment under one lock and verify final two; use ThreadSanitizer separately rather than relying on a data-race output.

Run from the repository root:

```sh
make example EXAMPLE=threads-3
```

## Build it yourself

Run joined threads and distinguish safe shared state from a data race.

1. Create and join threads with explicit argument lifetimes and shared-memory ownership. Distinguish concurrency bugs from safe interleavings.
2. Move the entire increment under one lock and verify final two; use ThreadSanitizer separately rather than relying on a data-race output.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=threads-3
```

Chapter workspace command: `make chapter CHAPTER=threads`.

Generated from dist/part8.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/threads
