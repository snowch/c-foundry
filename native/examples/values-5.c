#include <stdio.h>
#include <limits.h>

int main(void) {
    unsigned int value = 0;
    value -= 1;
    printf("%d\n", value == UINT_MAX);
    return 0;
}
