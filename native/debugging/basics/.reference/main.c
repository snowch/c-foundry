/* Reference repair. All accesses stay within the array. */
#include <stddef.h>
#include <stdio.h>
#include <string.h>

/* The caller supplies a live array and values whose sum fits in int. */
int sum_values(const int *values, size_t count) {
    int total = 0;
    for (size_t i = 0; i < count; ++i) {
        total += values[i];
    }
    return total;
}

int main(int argc, char **argv) {
    const int ordinary[] = {4, 8, 12};
    const int single[] = {7};
    const int negative[] = {-5, 2, 1};
    const int *values = ordinary;
    size_t count = sizeof ordinary / sizeof ordinary[0];
    if (argc > 1 && strcmp(argv[1], "single") == 0) {
        values = single;
        count = 1;
    } else if (argc > 1 && strcmp(argv[1], "empty") == 0) {
        count = 0;
    } else if (argc > 1 && strcmp(argv[1], "negative") == 0) {
        values = negative;
        count = sizeof negative / sizeof negative[0];
    }
    int result = sum_values(values, count);
    printf("total=%d\n", result);
    return 0;
}
