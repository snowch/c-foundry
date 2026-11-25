# Encodings, locale, and safe byte classification

Complete Linux example, ready to edit and run in the browser terminal.

## 33.7 Encodings, locale, and safe byte classification

Distinguish bytes, encoded characters, and locale-dependent classification. Make the external text encoding part of the format.

Also editable and runnable inline in the browser course. This probe runs with the inline browser’s fixed C17 toolchain. Use Browser Linux for GCC/Clang comparisons and supported language modes.

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

### Byte classification does not decode Unicode

Why are there 6 UTF-8 bytes but only 4 ASCII letters?

Why are there 6 UTF-8 bytes but only 4 ASCII letters? Known UTF-8 sequence: Chloé. C uses byte offsets 0: 43; h uses byte offsets 1: 68; l uses byte offsets 2: 6C; o uses byte offsets 3: 6F; é uses byte offsets 4 through 5: C3, A9. The C-locale isalpha calls recognize C,h,l,o. The two UTF-8 bytes of é do not separately become Unicode letters. This byte-defined input is not a C-wide Unicode classifier.

The C-locale isalpha calls recognize C,h,l,o. The two UTF-8 bytes of é do not separately become Unicode letters. This byte-defined input is not a C-wide Unicode classifier. Illustration of the supplied example; edits do not update this picture.

**Watch for:** Strlen counts bytes before a zero terminator, not Unicode characters. Setting a process-global locale also affects other library calls and needs coordination in threaded programs.

**Check:** What does casting to unsigned char before isalpha accomplish?

1. It makes any byte a valid classification argument
2. It turns each UTF-8 byte into a complete Unicode character

<details><summary>Answer</summary>

It makes any byte a valid classification argument. The cast satisfies the ctype argument requirement. It does not implement Unicode decoding.

</details>

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/portable-c/7). In main.c, replace the UTF-8 bytes 0xc3, 0xa9 with the single byte 0x65. Run code and compare utf8_bytes= and ascii_letters=. What does the toy count reveal about byte length and classification in the C locale?

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [Read setlocale(3)](../../manuals/setlocale.3.txt) (included) — setlocale - set the current locale
- [Read isspace(3)](../../manuals/isspace.3.txt) (included) — Check which argument values are valid and how locale affects classification.

**Optional further reading (internet required):**

- [C reference: locales](https://en.cppreference.com/w/c/locale.html)

Native source: `native/examples/portable-c-7/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=portable-c-7 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

