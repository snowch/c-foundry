# Sequential consistency first

Complete Linux example, ready to edit and run in the browser terminal.

## 37.2 Sequential consistency first

Sequential consistency provides a single order for sequentially consistent atomic operations that respects each thread’s required ordering. Start with this ordering when reasoning about several atomic objects so their operations can be traced in one consistent order.

The fixture uses the default atomic exchange and load operations, which are sequentially consistent. Exchange returns the previous value while installing the new one atomically. More complex protocols should first have a clear sequentially consistent argument; weakening orderings requires a new proof about which synchronization relationships remain.

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

int main(void) {
  atomic_uint state;
  atomic_init(&state, 0);
  unsigned previous = atomic_exchange(&state, 7);
  printf("previous=%u current=%u\n", previous, atomic_load(&state));
  return 0;
}
```

Output:

```text
previous=0 current=7
```

The exchange changes the state to seven and returns zero. Atomic exchange is not a substitute for a multi-object transaction.

**Watch for:** A collection of atomic fields can still expose a combination of values that violates an application invariant.

**Check:** Does exchanging one atomic counter also atomically update other, separately stored fields?

1. Yes
2. No, it acts on its atomic object

<details><summary>Answer</summary>

No, it acts on its atomic object. The operation’s atomicity scope is the object supplied.

</details>

**Try:** Edit the example in Browser Linux.  In native/examples/atomics-2/main.c, change the initial atomic value from 0 to 2 and the exchange value from 7 to 9. Repeat the terminal run. Which of previous= and current= belongs to the state before the exchange?

### References and help

- [C reference: atomics](https://en.cppreference.com/w/c/atomic.html) — Read atomic operations and their memory-order contracts.
- [C reference: C11 concurrency](https://en.cppreference.com/w/c/thread.html) — Check thread creation, joining, mutexes, and optional implementation support.

Native source: `native/examples/atomics-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=atomics-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

