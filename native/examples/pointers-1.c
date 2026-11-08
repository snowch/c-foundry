#include <stdio.h>

int main(void) {
    int value = 10;
    int *p = &value;
    *p = 42;
    printf("value=%d\n", value);
    p = NULL;
    printf("null=%d\n", p == NULL);
    return 0;
}
