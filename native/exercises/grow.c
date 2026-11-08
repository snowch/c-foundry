#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <stdint.h>
#include <errno.h>
#include <string.h>

bool push(int **values, size_t *length, size_t *capacity, int value) {
    (void)values; (void)length; (void)capacity; (void)value;
    // TODO: grow safely if full, then store value and increase length.
    return false;
}

int main(void) {
    char line[64], *end;
    if (!fgets(line, sizeof line, stdin)) { puts("invalid"); return 0; }
    line[strcspn(line, "\r\n")] = '\0';
    errno = 0;
    long count = strtol(line, &end, 10);
    if (errno == ERANGE || end == line || *end != '\0' || count < 0 || count > 16) {
        puts("invalid"); return 0;
    }
    int *values = NULL;
    size_t length = 0, capacity = 0;
    for (long i = 0; i < count; i++) {
        if (!push(&values, &length, &capacity, (int)i + 1)) {
            free(values); puts("allocation failed"); return 0;
        }
    }
    printf("%zu |", length);
    for (size_t i = 0; i < length; i++) printf(" %d", values[i]);
    puts("");
    free(values);
    return 0;
}
