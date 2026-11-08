# Thread lifetimes and shared memory

Complete native example, ready to edit and run in Codespaces or locally.

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

