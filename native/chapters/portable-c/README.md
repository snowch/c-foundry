# Chapter 33: Writing portable C

Part 7: C standards and portable systems programming. Teaching baseline: C17.

State the target requirements and isolate host APIs from portable C data and algorithms.

## Outcomes

- Separate standard-library operations from POSIX facilities.
- Encode fixed-width bytes independently of native layout.
- Detect facilities and document native versus WASI limits.

## 33.1 Standard library versus operating-system APIs

The C standard library and an operating-system API are different portability layers. POSIX facilities require a POSIX target and their own contracts.

This native example uses clock_gettime with CLOCK_MONOTONIC, exposed through the POSIX feature-test macro before any headers. It checks both calls and compares timestamps without claiming a measurable workload duration. A different host needs an adapter or another supported API; ISO C alone does not require this exact interface.

### main.c

```c
#define _POSIX_C_SOURCE 200809L
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

int main(void) {
  struct timespec a, b;
  if (clock_gettime(CLOCK_MONOTONIC, &a) || clock_gettime(CLOCK_MONOTONIC, &b))
    return 1;
  printf("clock_read=1 ordered=%d\n",
         b.tv_sec > a.tv_sec ||
             (b.tv_sec == a.tv_sec && b.tv_nsec >= a.tv_nsec));
  return 0;
}
```

Output:

```text
clock_read=1 ordered=1
```

Both reads succeed on the Codespaces Linux target. Two adjacent observations are used only for an ordering property, not a performance claim.

**Watch for:** A POSIX feature macro requests declarations; it does not make the API exist on every platform.

**Check:** Does ISO C require CLOCK_MONOTONIC?

1. No
2. Yes

<details><summary>Answer</summary>

No. It belongs to a host API with a narrower platform contract.

</details>

**Try:** Define a small clock abstraction and test its Linux implementation separately from algorithmic counters.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-1
```

## 33.2 Fixed-width types, endianness, and binary compatibility

Fixed-width types simplify an external protocol only when their availability and byte-size requirements are stated. Endianness still needs explicit encoding.

The byte codec extracts and assembles little-endian uint32_t values instead of writing native objects. Exact-width types are optional on some C implementations; this course’s supported targets provide uint32_t and eight-bit bytes. Schema and format compatibility also depend on string encoding, version rules, and validation, not only on integer width.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };
void put32(unsigned char *out, uint32_t value) {
  for (unsigned i = 0; i < 4; ++i)
    out[i] = (unsigned char)(value >> (8 * i));
}
uint32_t get32(const unsigned char *in) {
  uint32_t value = 0;
  for (unsigned i = 0; i < 4; ++i)
    value |= (uint32_t)in[i] << (8 * i);
  return value;
}

int main(void) {
  unsigned char bytes[4];
  put32(bytes, UINT32_C(0x01020304));
  printf("bytes=%u,%u,%u,%u value_ok=%d\n", (unsigned)bytes[0], (unsigned)bytes[1], (unsigned)bytes[2],
         (unsigned)bytes[3], get32(bytes) == UINT32_C(0x01020304));
  return 0;
}
```

Output:

```text
bytes=4,3,2,1 value_ok=1
```

The byte order is identical on little- and big-endian supported hosts because the encoder defines it.

**Watch for:** Using uint32_t inside a raw dumped struct does not remove padding or byte-order assumptions.

**Check:** Does a fixed-width field alone make raw structs portable files?

1. Yes
2. No

<details><summary>Answer</summary>

No. Layout, padding, byte order, and other representation choices remain.

</details>

**Try:** Decode independently specified bytes and test all integer extremes without consulting sizeof(Row).

Run from the repository root:

```sh
make example EXAMPLE=portable-c-2
```

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

## Build it yourself

Compare GCC and Clang builds and inspect platform-dependent properties.

1. State the target requirements and isolate host APIs from portable C data and algorithms.
2. List every OS dependency in your assembled database and place each behind an explicit platform adapter.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=portable-c-4
```

Chapter workspace command: `make chapter CHAPTER=portable-c`.

Generated from dist/part7.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/portable-c
