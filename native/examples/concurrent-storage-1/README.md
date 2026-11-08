# C11 threading facilities versus POSIX threads

Complete native example, ready to edit and run in Codespaces or locally.

## 38.1 C11 threading facilities versus POSIX threads

C11 threads and POSIX threads are separate APIs with different names and availability rules. Choose an adapter boundary rather than mixing their handles.

This fixture uses the standard threads.h interface on the Codespaces toolchain. thrd_create and thrd_join report thrd_success, and a worker returns an int result. Implementations may lack the optional threading facility; the feature guard makes that requirement explicit. The rest of this course’s Linux queue examples use pthreads and do not claim their types are interchangeable.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#if defined(__STDC_NO_THREADS__)
#error "C11 threads required for this example"
#endif
#include <threads.h>

int standard_worker(void *unused) {
  (void)unused;
  return 42;
}

int main(void) {
  thrd_t thread;
  int result = 0;
  if (thrd_create(&thread, standard_worker, NULL) != thrd_success ||
      thrd_join(thread, &result) != thrd_success)
    return 1;
  printf("joined_result=%d\n", result);
  return 0;
}
```

Output:

```text
joined_result=42
```

The worker’s return value arrives through the C11 join API. This checks the actual selected compiler and native library combination.

**Watch for:** A language-version macro alone does not guarantee that an optional threading library is present.

**Check:** May pthread_t and thrd_t be assumed interchangeable?

1. No
2. Yes

<details><summary>Answer</summary>

No. They belong to distinct APIs and contracts.

</details>

**Try:** Wrap create/join behind a small project interface and add platform-specific adapters only where tested.

Run from the repository root:

```sh
make example EXAMPLE=concurrent-storage-1
```

