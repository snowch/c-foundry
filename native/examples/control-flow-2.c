#include <stdio.h>

int main(void) {
    int divisor = 0;
    int numerator = 10;
    if (divisor != 0 && numerator / divisor > 2) {
        puts("large quotient");
    } else {
        puts("not evaluated or too small");
    }
    return 0;
}
