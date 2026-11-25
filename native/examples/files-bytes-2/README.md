# Fixed-width integers, bitwise operations, and masks

Complete Linux example, ready to edit and run in the browser terminal.

## 10.2 Fixed-width integers, bitwise operations, and masks

Bitwise operators manipulate the representation of unsigned values. Use them to define flags and packed fields deliberately, with shifts constrained to the type’s width.

Also editable and runnable inline in the browser course. Run here, or use Browser Linux for a full GCC build.

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

### Clearing one flag preserves the other

Which bit changes when the code clears bit 2?

Bits are numbered from zero at the least significant end. After setting bits 2 and 5, the low eight bits are 00100100, hexadecimal 24, decimal 36. Clearing bit 2 gives 00100000, hexadecimal 20, decimal 32. Bit 5 remains set. The upper 24 bits of the uint32_t value stay zero.

Bit 5 stays set; only bit 2 is cleared. The upper 24 bits stay zero. These are bit positions, not memory byte order; hex=20 means decimal 32.

**Watch for:** Shifting by a negative count or by a count at least as large as the promoted operand’s width is undefined. Bitwise & also does not short-circuit like logical &&.

**Check:** Which operation clears the selected bit while preserving the others?

1. flags &= ~mask
2. flags = ~mask

<details><summary>Answer</summary>

flags &= ~mask. The AND limits the change to bits selected by the inverted mask.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/files-bytes/2). In main.c, remove the line that clears bit 2 and choose Run code. Compare hex=, bit2=, and bit5=. Which field confirms that clearing one bit in the starter preserves the other?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [C reference: input/output](https://en.cppreference.com/w/c/io.html) (online) — Compare stream modes, positioning, error indicators, and formatted I/O.
- [C reference: printf family](https://en.cppreference.com/w/c/io/fprintf.html) (online) — Read conversion specifiers, required argument types, and the return value.
- [C reference: fixed-width integers](https://en.cppreference.com/w/c/types/integer.html) (online) — Check when exact-width types exist and which format macros match them.

Native source: `native/examples/files-bytes-2/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=files-bytes-2 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

