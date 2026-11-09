# Bounded records and reliable numeric parsing

Complete native example, ready to edit and run in Codespaces or locally.

## 33.8 Bounded records and reliable numeric parsing

Parse a bounded decimal field with a stated grammar, range checks, and full consumption. Do not use a conversion’s numeric result as its success indicator.

strtoumax accepts optional signs and leading whitespace; this protocol does not. Validate every input character as a decimal digit, copy only a bounded field into a terminated temporary buffer, clear errno, convert in base ten, reject ERANGE, check the end pointer, and check the uint32_t limit before narrowing. The output parameter changes only after every check. This accepts exactly decimal digits with leading zeros permitted. It does not infer whether a surrounding line was truncated: the framing layer must establish the complete field first.

### main.c

```c
#include <errno.h>
#include <inttypes.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

bool parse_id(const char *text, size_t n, uint32_t *out) {
    if (!n || n > 32) return false;
    for (size_t i = 0; i < n; ++i) if (text[i] < '0' || text[i] > '9') return false;
    char buffer[33]; memcpy(buffer, text, n); buffer[n] = 0;
    errno = 0; char *end;
    uintmax_t value = strtoumax(buffer, &end, 10);
    if (errno == ERANGE || end != buffer + n || value > UINT32_MAX) return false;
    *out = (uint32_t)value; return true;
}
int main(void) {
    uint32_t value = 7;
    int maximum = parse_id("4294967295", 10, &value);
    printf("maximum=%d value=%" PRIu32 "\n", maximum, value);
    value = 7;
    int rejected = !parse_id("4294967296", 10, &value);
    printf("overflow_rejected=%d retained=%" PRIu32 " sign_rejected=%d\n", rejected, value, !parse_id("-1", 2, &value));
    return 0;
}
```

Output:

```text
maximum=1 value=4294967295
overflow_rejected=1 retained=7 sign_rejected=1
```

The largest uint32_t is accepted without assuming the width of unsigned long. The next integer is rejected before conversion to uint32_t, and both range and sign rejection preserve the previous output value.

**Watch for:** Atoi cannot distinguish a valid zero from a conversion failure and does not provide a safe overflow policy. Checking errno without checking consumption and the destination range is also incomplete.

**Check:** Why check value against UINT32_MAX after strtoumax succeeds?

1. The conversion type may have a wider range than the destination
2. Successful conversion automatically validates every narrower type

<details><summary>Answer</summary>

The conversion type may have a wider range than the destination. Conversion success establishes a uintmax_t value, not that it fits the database field.

</details>

**Try:** Add zero, empty input, plus/minus signs, whitespace, a suffix, embedded zero bytes, leading zeros, and an extremely long number; verify output preservation for every rejection.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-8
```

