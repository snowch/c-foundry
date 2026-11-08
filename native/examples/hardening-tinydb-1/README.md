# Auditing assumptions about types and memory

Complete native example, ready to edit and run in Codespaces or locally.

## 34.1 Auditing assumptions about types and memory

An assumption audit checks where input sizes, arithmetic ranges, alignment, and lifetimes cross API boundaries.

For an array allocation, validate count≤SIZE_MAX/element_size before multiplication. Also define a zero-element policy and who owns the result. The fixture rejects an impossible int-array size without attempting memory exhaustion. Similar checks belong in page offsets, slot lengths, result buffers, and log record counts.

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
  size_t count = SIZE_MAX;
  bool rejected = count > SIZE_MAX / sizeof(int);
  printf("oversize_rejected=%d\n", rejected);
  return 0;
}
```

Output:

```text
oversize_rejected=1
```

On the supported targets sizeof(int)>1, so the requested count cannot fit a byte size. The operating system is not asked to perform a huge allocation.

**Watch for:** A NULL check after an already overflowing multiplication does not repair the requested size.

**Check:** When must multiplication overflow be checked?

1. Before multiplying
2. Only after malloc fails

<details><summary>Answer</summary>

Before multiplying. An overflowed size may request a small allocation and later cause an out-of-bounds write.

</details>

**Try:** Audit every size calculation in the pager, index, parser, and vector with a stated maximum.

Run from the repository root:

```sh
make example EXAMPLE=hardening-tinydb-1
```

