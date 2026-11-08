# Acquire/release through concrete examples

Complete native example, ready to edit and run in Codespaces or locally.

## 37.3 Acquire/release through concrete examples

Release and acquire can publish initialized ordinary data when the acquiring load reads the released flag value.

The worker writes payload before a release store to ready. main waits for an acquire load that observes true, establishing a synchronizes-with relationship and making the earlier payload write visible. The object remains alive throughout, and no writer changes it afterward. Reusing this one-shot flag for repeated publications needs a new protocol.

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
atomic_bool ready;
int payload;
void *publish_payload(void *unused) {
  (void)unused;
  payload = 42;
  atomic_store_explicit(&ready, true, memory_order_release);
  return NULL;
}

int main(void) {
  atomic_init(&ready, false);
  pthread_t writer;
  CHECK(pthread_create(&writer, NULL, publish_payload, NULL));
  while (!atomic_load_explicit(&ready, memory_order_acquire))
    sched_yield();
  printf("published=%d\n", payload);
  CHECK(pthread_join(writer, NULL));
  return 0;
}
```

Output:

```text
published=42
```

The payload read occurs after the successful acquire, before join. The flag synchronization is therefore essential to that read’s validity.

**Watch for:** Using a relaxed load here would not establish the required payload publication relationship.

**Check:** Which load must observe the release store?

1. The acquire load of ready
2. Any unrelated relaxed counter load

<details><summary>Answer</summary>

The acquire load of ready. Synchronization depends on the matching atomic communication.

</details>

**Try:** Explain why reading payload before the acquire would violate the protocol, then design a generation-based repeated-publication version.

Run from the repository root:

```sh
make example EXAMPLE=atomics-3
```

