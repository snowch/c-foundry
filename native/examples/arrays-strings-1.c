#include <stdio.h>

int main(void) {
    int values[] = {1, 2, 3, 4, 5};
    size_t count = sizeof values / sizeof values[0];
    int total = 0;
    for (size_t i = 0; i < count; i++) {
        total += values[i];
    }
    printf("%d\n", total);
    return 0;
}
