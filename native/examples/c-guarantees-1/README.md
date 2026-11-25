# Defined, implementation-defined, unspecified, and undefined behavior

Complete Linux example, ready to edit and run in the browser terminal.

## 32.1 Defined, implementation-defined, unspecified, and undefined behavior

Different kinds of latitude in C require different responses. Undefined behavior is not just another documented platform choice.

Also editable and runnable inline in the browser course. This probe runs with the inline browser’s fixed C17 toolchain. Use Browser Linux for GCC/Clang comparisons and supported language modes.

Defined behavior follows the language contract. Implementation-defined behavior requires an implementation’s documented choice, such as relevant integer characteristics. Unspecified behavior permits a set of allowed choices without requiring the same choice every time, such as many operand evaluation orders. Undefined behavior imposes no requirements. The executable uses defined operations and reports a guaranteed minimum property, avoiding deliberate invalid accesses.

### Unsigned wrap and signed overflow are different

Only the unsigned result is defined to wrap modulo its type’s range.

Adding unsigned 1 to UINT_MAX yields unsigned zero by modular arithmetic. Evaluating signed INT_MAX plus signed 1 exceeds the signed int range and has undefined behavior. Do not evaluate that signed expression to test whether it overflowed; check beforehand.

No particular int width is assumed.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/1). In main.c, change wrapped += 1; to wrapped += 2;. Run code and compare unsigned_wrap=. Which bound gives the starting value? How does the rule for unsigned addition let you predict the result without knowing the exact width of unsigned?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [C reference: behavior categories](https://en.cppreference.com/w/c/language/behavior.html) (online) — Distinguish undefined, unspecified, and implementation-defined behavior.
- [C reference: numeric limits](https://en.cppreference.com/w/c/types/limits.html) (online) — Find the macros that describe the selected implementation’s ranges.

Native source: `native/examples/c-guarantees-1/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

