# Defined, implementation-defined, unspecified, and undefined behavior

Complete native example, ready to edit and run in Codespaces or locally.

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

