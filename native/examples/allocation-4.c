#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *copy_text(const char *source) {
    size_t bytes = strlen(source) + 1;
    char *copy = malloc(bytes);
    if (copy) memcpy(copy, source, bytes);
    return copy;
}

int main(void) {
    char original[] = "Hi";
    char *copy = copy_text(original);
    if (!copy) return 1;
    copy[0] = 'B';
    printf("%s %s\n", original, copy);
    free(copy);
    copy = NULL;
    return 0;
}
