# Integer representation, alignment, object lifetime, and aliasing

Complete Linux example, ready to edit and run in the browser terminal.

## 32.2 Integer representation, alignment, object lifetime, and aliasing

A pointer’s numeric appearance does not establish alignment, type compatibility, or object lifetime. Use character access and memcpy for representation transfers.

Also editable and runnable inline in the browser course. This probe runs with the inline browser’s fixed C17 toolchain. Use Browser Linux for GCC/Clang comparisons and supported language modes.

The example copies an unsigned integer’s object representation into an unsigned-char array and back into a compatible object. Access through unsigned char may inspect object bytes; casting arbitrary byte storage to a wider pointer can violate alignment and effective-type rules. None of these operations extend an object’s lifetime or permit access after free.

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
  uint32_t source = UINT32_C(0x12345678), copy = 0;
  unsigned char bytes[sizeof source];
  memcpy(bytes, &source, sizeof bytes);
  memcpy(&copy, bytes, sizeof copy);
  printf("roundtrip=%d bytes=%zu\n", copy == source, sizeof bytes);
  return 0;
}
```

Output:

```text
roundtrip=1 bytes=4
```

On the supported eight-bit-byte targets, uint32_t occupies four bytes. The test compares restored value rather than assuming a host byte order.

**Watch for:** A byte-for-byte native representation round trip is not a portable external file encoding.

**Check:** Why avoid casting this arbitrary byte array to uint32_t *?

1. memcpy cannot copy integer values
2. Alignment and object-type requirements may not be satisfied

<details><summary>Answer</summary>

Alignment and object-type requirements may not be satisfied. memcpy transfers representation bytes without requiring a misaligned typed access.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/2). In main.c, change the source from 0x12345678 to 0x12345679. Run code and compare roundtrip= and bytes=. What does copying the object representation establish on this target? A portable file format still needs an explicit byte order.

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- Course notes: behavior categories (included in the explanation above) — Distinguish undefined, unspecified, and implementation-defined behavior.
- [Read free(3)](../../manuals/free.3.txt) (included) — Check valid pointer arguments and access after deallocation.
- [Read memcpy(3)](../../manuals/memcpy.3.txt) (included) — Check byte counts, valid object ranges, and the non-overlap requirement.

**Optional further reading (internet required):**

- [C reference: behavior categories](https://en.cppreference.com/w/c/language/behavior.html)

Native source: `native/examples/c-guarantees-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

