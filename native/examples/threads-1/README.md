# Concurrency versus parallelism

Complete native example, ready to edit and run in Codespaces or locally.

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

