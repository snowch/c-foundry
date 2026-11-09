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
