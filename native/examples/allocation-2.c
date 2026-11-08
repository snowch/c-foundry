#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *values = calloc(3, sizeof *values);
    if (!values) return 1;
    printf("first=%d\n", values[0]);
    int *grown = realloc(values, 6 * sizeof *values);
    if (!grown) { free(values); return 1; }
    values = grown;
    for (int i = 3; i < 6; i++) values[i] = i + 1;
    printf("last=%d\n", values[5]);
    free(values);
    return 0;
}
