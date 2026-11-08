# Chapter 32: What C guarantees

Part 7: C standards and portable systems programming. Teaching baseline: C17.

Distinguish language guarantees from platform choices and invalid operations before using optimization results as evidence.

## Outcomes

- Classify defined, implementation-defined, unspecified, and undefined behavior.
- Respect object lifetime, effective types, and alignment.
- Compare optimized builds only on valid programs.

## 32.1 Defined, implementation-defined, unspecified, and undefined behavior

Different kinds of latitude in C require different responses. Undefined behavior is not just another documented platform choice.

Defined behavior follows the language contract. Implementation-defined behavior requires an implementation’s documented choice, such as relevant integer characteristics. Unspecified behavior permits a set of allowed choices without requiring the same choice every time, such as many operand evaluation orders. Undefined behavior imposes no requirements. The executable uses defined operations and reports a guaranteed minimum property, avoiding deliberate invalid accesses.

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
  unsigned wrapped = UINT_MAX;
  wrapped += 1;
  printf("char_bits_at_least8=%d unsigned_wrap=%u\n", CHAR_BIT >= 8, wrapped);
  return 0;
}
```

Output:

```text
char_bits_at_least8=1 unsigned_wrap=0
```

Unsigned arithmetic is modulo its type’s range. That guarantee does not extend to overflowing signed arithmetic.

**Watch for:** An observed compiler result cannot turn undefined behavior into a portable rule.

**Check:** Is signed overflow merely an implementation-defined wrap choice?

1. No, it is undefined behavior in standard C
2. Yes

<details><summary>Answer</summary>

No, it is undefined behavior in standard C. Standard unsigned and signed arithmetic have different overflow contracts.

</details>

**Try:** Classify five expressions from TinyDB and cite the exact assumption or guarantee each relies on.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-1
```

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

## 32.3 Why code can behave differently under optimization

Optimizers may transform valid programs while preserving their required observable behavior. They need not preserve a guessed result after undefined behavior.

The fixture uses unsigned fixed-width arithmetic with a defined wrap result and a bounded representable sum. Compile it at multiple optimization levels and compare those outputs. If a different program changes behavior under optimization, audit its language contracts, races, and uninitialized state before treating the difference as an optimizer bug.

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
  uint32_t x = UINT32_MAX;
  x += UINT32_C(1);
  unsigned sum = 0;
  for (unsigned i = 1; i <= 4; ++i)
    sum += i;
  printf("wrapped=%u sum=%u\n", (unsigned)x, sum);
  return 0;
}
```

Output:

```text
wrapped=0 sum=10
```

The required result remains zero and ten under valid optimizing transformations. The example is compiled with optimization enabled, not a deliberately invalid aliasing trick.

**Watch for:** Turning optimization off can hide a defect without fixing it.

**Check:** What should be checked first after an optimization-sensitive failure?

1. Lifetime, bounds, aliasing, initialization, and synchronization
2. Whether -O0 appears to work

<details><summary>Answer</summary>

Lifetime, bounds, aliasing, initialization, and synchronization. A valid source contract is the basis for expecting preserved behavior.

</details>

**Try:** Compile with GCC and Clang at -O0 and -O2, then run the same independent fixtures.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-3
```

## Build it yourself

Audit a short program and distinguish guarantees from assumptions.

1. Distinguish language guarantees from platform choices and invalid operations before using optimization results as evidence.
2. Compile with GCC and Clang at -O0 and -O2, then run the same independent fixtures.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=c-guarantees-3
```

Chapter workspace command: `make chapter CHAPTER=c-guarantees`.

Generated from dist/part7.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/c-guarantees
