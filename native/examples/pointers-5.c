#include <stdio.h>

void swap(int *a, int *b) {
    int saved = *a;
    *a = *b;
    *b = saved;
}

int main(void) {
    int x = 10, y = 42;
    swap(&x, &y);
    int same = 7;
    swap(&same, &same);
    printf("%d %d %d\n", x, y, same);
    return 0;
}
