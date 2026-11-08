#include <stdio.h>
#include <assert.h>

int at(const int *values, size_t count, size_t index) {
    assert(values != NULL);
    assert(index < count);
    return values[index];
}

int main(void) {
    const int values[] = {4, 8, 12};
    size_t index = 2;
    if (index >= 3) return 1;
    printf("%d\n", at(values, 3, index));
    return 0;
}
