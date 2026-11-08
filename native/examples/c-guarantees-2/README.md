# Integer representation, alignment, object lifetime, and aliasing

Complete native example, ready to edit and run in Codespaces or locally.

## 32.2 Integer representation, alignment, object lifetime, and aliasing

A pointer’s numeric appearance does not establish alignment, type compatibility, or object lifetime. Use character access and memcpy for representation transfers.

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

**Try:** Replace a raw pointer cast in a decoder with explicit byte assembly and test it with unaligned input offsets.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-2
```

