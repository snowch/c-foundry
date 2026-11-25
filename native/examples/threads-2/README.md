# Thread lifetimes and shared memory

Complete Linux example, ready to edit and run in the browser terminal.

## 35.2 Thread lifetimes and shared memory

Worker arguments and result storage must outlive every access. Returning from a scope can invalidate pointers even when the thread still runs.

main keeps the Job object alive while the worker accesses it and joins before reading its result. Passing the address of a loop variable reused by all workers can let workers read changed inputs. Concurrently modifying that variable also needs synchronization, and leaving its scope too early ends its lifetime. Thread-local variables and separate per-worker objects simplify ownership but do not automatically protect genuinely shared objects.

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

### Join keeps the shared Job use ordered

When may main read result and let job leave scope?

When may main read result and let job leave scope? Dependency; main; Worker. 1; Create job {21,0}; pass &job; Starts with access to the same Job; 2; pthread_join waits; Writes result=42; returns; 3; join returns; read result=42; Finished; 4; job may leave scope; No further access. Ordering, not elapsed time. Worker completion → successful join return → main reads result.. The one Job object remains alive throughout worker access. Thread scheduling and simultaneous execution are not demonstrated by these rows.

The one Job object remains alive throughout worker access. Thread scheduling and simultaneous execution are not demonstrated by these rows. Illustration of the supplied example; edits do not update this picture.

**Watch for:** Detaching a worker removes the ability to use join as its argument-lifetime boundary.

**Check:** When may this stack Job leave scope?

1. Immediately after pthread_create returns
2. After its worker has finished and been joined

<details><summary>Answer</summary>

After its worker has finished and been joined. Creation does not imply the worker has completed its accesses.

</details>

**Try:** Edit the example in Browser Linux.  In native/examples/threads-2/main.c, change the Job initializer’s input from 21 to 12. Repeat the terminal run. Find input= and result=. Which operation lets the owner read the worker’s completed result?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [Read pthread_create(3)](../../manuals/pthread_create.3.txt) (included) — Read thread start arguments, error returns, and the required native threading environment.
- Course notes: C11 concurrency (included in the explanation above) — Check thread creation, joining, mutexes, and optional implementation support.

**Optional further reading (internet required):**

- [C reference: C11 concurrency](https://en.cppreference.com/w/c/thread.html)

**Use the documentation (optional):** Does creating a thread copy or transfer ownership of every object its start argument points to?

<details><summary>Compare your answer</summary>

No. The argument is a pointer value. The referenced storage needs a suitable lifetime and a documented ownership/synchronization contract.

</details>

Native source: `native/examples/threads-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=threads-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

