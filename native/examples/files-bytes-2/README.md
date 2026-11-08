# Fixed-width integers, bitwise operations, and masks

Complete native example, ready to edit and run in Codespaces or locally.

## 10.2 Fixed-width integers, bitwise operations, and masks

Bitwise operators manipulate the representation of unsigned values. Use them to define flags and packed fields deliberately, with shifts constrained to the type’s width.

OR sets mask bits, AND selects them, XOR toggles them, and complement inverts them. Fixed-width uint32_t is available on our target platforms; its existence is a format requirement, not a promise for every imaginable C implementation. Use a suitably typed unsigned left operand for shifts and keep the shift count below the width. inttypes.h supplies portable printf format macros for fixed-width types.

### main.c

```c
#include <stdio.h>
#include <stdint.h>
#include <inttypes.h>

int main(void) {
    uint32_t flags = 0;
    flags |= UINT32_C(1) << 2;
    flags |= UINT32_C(1) << 5;
    flags &= ~(UINT32_C(1) << 2);
    printf("hex=%" PRIx32 " bit2=%d bit5=%d\n", flags,
           (flags & (UINT32_C(1) << 2)) != 0,
           (flags & (UINT32_C(1) << 5)) != 0);
    return 0;
}
```

Output:

```text
hex=20 bit2=0 bit5=1
```

The program first sets bits 2 and 5, then clears only bit 2 with an inverted mask. The remaining value is hexadecimal 20, meaning bit 5 is set. The two comparisons turn selected bit fields into ordinary truth values for printing.

**Watch for:** Shifting by a negative count or by a count at least as large as the promoted operand’s width is undefined. Bitwise & also does not short-circuit like logical &&.

**Check:** Which operation clears the selected bit while preserving the others?

1. flags &= ~mask
2. flags = ~mask

<details><summary>Answer</summary>

flags &= ~mask. The AND limits the change to bits selected by the inverted mask.

</details>

**Try:** Add a third flag and toggle it twice with XOR; verify that the original flags are restored.

Run from the repository root:

```sh
make example EXAMPLE=files-bytes-2
```

