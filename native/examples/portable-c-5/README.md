# Text and binary streams, LF and CRLF

Complete native example, ready to edit and run in Codespaces or locally.

## 33.5 Text and binary streams, LF and CRLF

Choose text mode for logical text and binary mode for specified bytes. Treat line-ending normalization as an explicit input policy.

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

**Try:** Add empty, CRLF-only, final-record-without-newline, and truncated-buffer cases. State separately how your parser rejects an incomplete record.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-5
```

