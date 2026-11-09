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
