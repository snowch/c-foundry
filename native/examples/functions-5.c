#include <stdio.h>
#include <assert.h>

int maximum(int a, int b) {
    if (a > b) return a;
    return b;
}

int main(void) {
    assert(maximum(5, 2) == 5);
    assert(maximum(-3, 0) == 0);
    assert(maximum(4, 4) == 4);
    puts("checks passed");
    return 0;
}
