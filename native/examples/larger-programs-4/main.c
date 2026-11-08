#include <stdio.h>
#include <stdlib.h>

int compare_ints(const void *left, const void *right) {
    int a = *(const int *)left;
    int b = *(const int *)right;
    return (a > b) - (a < b);
}

int main(void) {
    int values[] = {7, -3, 0, 7};
    qsort(values, 4, sizeof values[0], compare_ints);
    for (size_t i = 0; i < 4; i++) printf("%s%d", i ? " " : "", values[i]);
    puts("");
    return 0;
}
