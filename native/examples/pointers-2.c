#include <stdio.h>

void swap(int *a, int *b) {
    int saved = *a;
    *a = *b;
    *b = saved;
}

void point_to(int **destination, int *target) {
    *destination = target;
}

int main(void) {
    int a = 10, b = 42;
    swap(&a, &b);
    int *p = &a;
    point_to(&p, &b);
    printf("%d %d %d\n", a, b, *p);
    return 0;
}
