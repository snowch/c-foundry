#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

void *allocate_for_demo(size_t bytes, bool fail) {
    if (fail) return NULL;
    return malloc(bytes);
}

int main(void) {
    size_t count = SIZE_MAX;
    if (count > SIZE_MAX / sizeof(int)) puts("overflow rejected");
    int *values = allocate_for_demo(4 * sizeof *values, true);
    if (!values) puts("simulated failure handled");
    free(values);
    return 0;
}
