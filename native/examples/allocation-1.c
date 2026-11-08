#include <stdio.h>
#include <stdlib.h>

int main(void) {
    size_t count = 5;
    int *values = malloc(count * sizeof *values);
    if (values == NULL) return 1;
    int total = 0;
    for (size_t i = 0; i < count; i++) {
        values[i] = (int)i + 1;
        total += values[i];
    }
    printf("%d\n", total);
    free(values);
    return 0;
}
