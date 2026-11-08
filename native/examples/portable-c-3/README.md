# Feature detection and conditional compilation

Complete native example, ready to edit and run in Codespaces or locally.

## 33.3 Feature detection and conditional compilation

Conditional compilation should expose a clear capability decision and preserve a tested baseline path. Avoid silently enabling partially supported features.

C11 atomics can be unavailable when an implementation defines __STDC_NO_ATOMICS__. This probe rejects that unsupported target explicitly before including stdatomic.h. The fixture uses an atomic object only through atomic operations. More advanced optional facilities should be tested with compile and link probes, not guessed from a platform name.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#if defined(__STDC_NO_ATOMICS__)
#error "This example requires standard atomics"
#endif
#include <stdatomic.h>

int main(void) {
  atomic_uint value;
  atomic_init(&value, 0);
  atomic_fetch_add(&value, 1);
  printf("atomic_probe=%u\n", atomic_load(&value));
  return 0;
}
```

Output:

```text
atomic_probe=1
```

The Codespaces toolchains provide this facility. A clean probe result establishes this example’s needs, not lock freedom for every atomic type.

**Watch for:** An atomic operation need not be implemented without locks; lock freedom is a separate capability.

**Check:** Does atomic support guarantee every atomic type is lock-free?

1. No
2. Yes

<details><summary>Answer</summary>

No. The standard permits implementations with internal synchronization.

</details>

**Try:** Add a probe for atomic_is_lock_free and report its result as a platform property rather than a fixed course expectation.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-3
```

