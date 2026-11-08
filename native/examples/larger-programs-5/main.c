#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef enum { OK, BAD_INPUT, NO_MEMORY } Status;

Status copy_name(const char *source, char **out) {
    if (!out) return BAD_INPUT;
    *out = NULL;
    if (!source) return BAD_INPUT;
    size_t bytes = strlen(source) + 1;
    char *copy = malloc(bytes);
    if (!copy) return NO_MEMORY;
    memcpy(copy, source, bytes);
    *out = copy;
    return OK;
}

int main(void) {
    char *name = NULL;
    Status result = copy_name("Ada", &name);
    if (result != OK) return 1;
    printf("%s\n", name);
    free(name);
    name = NULL;
    printf("bad input=%d\n", copy_name(NULL, &name) == BAD_INPUT);
    return 0;
}
