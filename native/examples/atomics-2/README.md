# Sequential consistency first

Complete native example, ready to edit and run in Codespaces or locally.

## 37.2 Sequential consistency first

Sequential consistency provides a single order for sequentially consistent atomic operations that respects each thread’s required ordering. It is a useful starting point.

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

**Check:** Does atomic exchange cover an entire arbitrary struct update?

1. Yes
2. No, it acts on its atomic object

<details><summary>Answer</summary>

No, it acts on its atomic object. The operation’s atomicity scope is the object supplied.

</details>

**Try:** Describe an invariant spanning two fields and choose a mutex or an explicit publication protocol that preserves it.

Run from the repository root:

```sh
make example EXAMPLE=atomics-2
```

