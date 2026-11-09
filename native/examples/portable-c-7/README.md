# Encodings, locale, and safe byte classification

Complete native example, ready to edit and run in Codespaces or locally.

## 33.7 Encodings, locale, and safe byte classification

Distinguish bytes, encoded characters, and locale-dependent classification. Make the external text encoding part of the format.

A char may be signed, and passing a negative value other than EOF to isalpha, isspace, or toupper has undefined behavior. Convert a byte through unsigned char before classification. The C locale is available on hosted implementations, while installed locale names differ by host; a named UTF-8 locale is not universally present. This example sets the C locale and counts ASCII letters in a known UTF-8 byte sequence. Applying byte-wise ctype does not decode a multibyte character, perform Unicode case folding, or count user-perceived characters. UTF-8 validation and a byte-length limit are separate policies in the audit codec.

### main.c

```c
#include <ctype.h>
#include <locale.h>
#include <stdio.h>

int main(void) {
    if (!setlocale(LC_CTYPE, "C")) return 1;
    const unsigned char text[] = {0x43, 0x68, 0x6c, 0x6f, 0xc3, 0xa9};
    size_t letters = 0;
    for (size_t i = 0; i < sizeof text; ++i)
        if (isalpha((unsigned char)text[i])) ++letters;
    printf("utf8_bytes=%zu ascii_letters=%zu\n", sizeof text, letters);
    return 0;
}
```

Output:

```text
utf8_bytes=6 ascii_letters=4
```

Chloé occupies six UTF-8 bytes. In the C locale the four ASCII letters are classified as alphabetic; the two encoding bytes for é are not a decoded character for this byte-wise operation. The supported hosts use ASCII-compatible execution character sets.

**Watch for:** Strlen counts bytes before a zero terminator, not Unicode characters. Setting a process-global locale also affects other library calls and needs coordination in threaded programs.

**Check:** What does casting to unsigned char before isalpha accomplish?

1. It makes any byte a valid classification argument
2. It turns each UTF-8 byte into a complete Unicode character

<details><summary>Answer</summary>

It makes any byte a valid classification argument. The cast satisfies the ctype argument requirement. It does not implement Unicode decoding.

</details>

**Try:** Compare the byte length of an ASCII name and a multibyte name, and test invalid UTF-8 rejection separately from name length and locale classification.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-7
```

