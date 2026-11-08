#include <stdio.h>

int main(void) {
    int a = 10, b = 20;
    const int *read = &a;
    int *const fixed = &a;
    *fixed = 11;
    read = &b;
    printf("%d %d\n", a, *read);
    return 0;
}
