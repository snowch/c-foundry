#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <errno.h>
#include <limits.h>

int main(void) {
    char copy[8];
    int written = snprintf(copy, sizeof copy, "%s", "Ada");
    if (written < 0 || (size_t)written >= sizeof copy) {
        puts("copy did not fit");
        return 0;
    }
    printf("same=%d copy=%s\n", strcmp(copy, "Ada") == 0, copy);

    char text[] = "42";
    char *end;
    errno = 0;
    long parsed = strtol(text, &end, 10);
    if (errno == ERANGE || end == text || *end != '\0' ||
        parsed < INT_MIN || parsed > INT_MAX) {
        puts("invalid integer");
    } else {
        printf("number=%d\n", (int)parsed);
    }
    return 0;
}
