# Text and binary streams, LF and CRLF

Complete Linux example, ready to edit and run in the browser terminal.

## 33.5 Text and binary streams, LF and CRLF

Choose text mode for logical text and binary mode for specified bytes. Treat line-ending normalization as an explicit input policy.

Also editable and runnable inline in the browser course. This probe runs with the inline browser’s fixed C17 toolchain. Use Browser Linux for GCC/Clang comparisons and supported language modes.

Text streams may translate the host representation of a newline. A text-stream position is not necessarily a byte count, and the physical file need not have one byte for each character written. Use rb/wb for a byte-defined database format. When reading byte-defined text from binary input, a parser can explicitly accept LF and CRLF as terminators. The helper accepts a complete bounded record, strips one trailing LF and its preceding CR, and leaves a lone trailing CR unchanged; deciding whether that lone CR is allowed belongs to the input grammar.

### main.c

```c
#include <stdio.h>
#include <string.h>

size_t strip_line_ending(char *text, size_t n) {
    if (n && text[n-1] == '\n') {
        --n;
        if (n && text[n-1] == '\r') --n;
    }
    text[n] = 0;
    return n;
}
int main(void) {
    char lf[] = "Ada\n", crlf[] = "Ada\r\n", lone[] = "Ada\r";
    size_t a = strip_line_ending(lf, strlen(lf));
    size_t b = strip_line_ending(crlf, strlen(crlf));
    size_t d = strip_line_ending(lone, strlen(lone));
    printf("lf=%zu crlf=%zu equal=%d lone_cr=%zu\n", a, b, strcmp(lf, crlf) == 0, d);
    return 0;
}
```

Output:

```text
lf=3 crlf=3 equal=1 lone_cr=4
```

Both supported terminators produce the same three-character record. The lone CR remains part of a four-byte payload. The caller owns an array with space for text[n]; this helper does not establish that fgets supplied an entire untruncated record.

**Watch for:** Never strip all trailing whitespace from a field unless the grammar permits losing those characters. A buffer ending without LF may be the final complete record or only a prefix of a long line.

**Check:** Which mode preserves a byte-defined database file on Windows as well as Unix?

1. Binary mode, such as rb and wb
2. Text mode because a newline always occupies one byte

<details><summary>Answer</summary>

Binary mode, such as rb and wb. Binary mode avoids text-stream translations; the format still needs explicit widths, encoding, and validation.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/portable-c/5). In main.c, change the lone string from Ada\r to Ada with no line ending. Run code and compare lone_cr= with lf= and crlf=. Which cases actually remove bytes from the original buffer?

### References and help

- [C reference: input/output](https://en.cppreference.com/w/c/io.html) — Compare stream modes, positioning, error indicators, and formatted I/O.
- [C reference: fixed-width integers](https://en.cppreference.com/w/c/types/integer.html) — Check when exact-width types exist and which format macros match them.

Native source: `native/examples/portable-c-5/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=portable-c-5 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

