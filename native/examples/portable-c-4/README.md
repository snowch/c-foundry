# Native platforms versus WebAssembly/WASI

Complete native example, ready to edit and run in Codespaces or locally.

## 33.4 Native platforms versus WebAssembly/WASI

WebAssembly/WASI is a host contract, not an emulation of every native operating-system facility. Algorithmic C can be portable while system integrations differ.

This native example reports its compilation target using a target macro. The course’s Wasm toolchain provides a limited older WASI runtime, not native pthreads, sockets, arbitrary host filesystem access, or sanitizer runtimes. Keep portable encoders and data structures separate from adapters for persistence, threads, and process facilities.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
#if defined(__wasi__)
  puts("target=WASI host_adapter_required");
#else
  puts("target=native host_adapter_required");
#endif
  return 0;
}
```

Output:

```text
target=native host_adapter_required
```

Codespaces executes the native path. Merely changing the target triple cannot supply a missing host integration.

**Watch for:** Browser reading availability and browser execution support are separate product capabilities.

**Check:** Can every native POSIX program run unchanged in the current page runner?

1. Yes
2. No

<details><summary>Answer</summary>

No. The runner exposes a restricted host API and toolchain.

</details>

**Try:** List every OS dependency in your assembled database and place each behind an explicit platform adapter.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-4
```

