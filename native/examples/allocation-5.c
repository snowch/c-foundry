#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>

bool append(char **text, size_t *length, size_t *capacity, const char *suffix) {
    size_t extra = strlen(suffix);
    if (*length == SIZE_MAX || extra > SIZE_MAX - *length - 1) return false;
    size_t needed = *length + extra + 1;
    if (needed > *capacity) {
        size_t next = *capacity ? *capacity : 8;
        while (next < needed) {
            if (next > SIZE_MAX / 2) { next = needed; break; }
            next *= 2;
        }
        char *grown = realloc(*text, next);
        if (!grown) return false;
        *text = grown;
        *capacity = next;
    }
    memcpy(*text + *length, suffix, extra + 1);
    *length += extra;
    return true;
}

int main(void) {
    char *text = NULL;
    size_t length = 0, capacity = 0;
    if (!append(&text, &length, &capacity, "hello") ||
        !append(&text, &length, &capacity, " C")) {
        free(text);
        return 1;
    }
    printf("%s\nlength=%zu fits=%d\n", text, length, capacity >= length + 1);
    free(text);
    return 0;
}
