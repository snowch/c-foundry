#include <stdio.h>

int main(void) {
    double fractional = (double)7 / 2;
    double truncated = 7 / 2;
    printf("%.1f %.1f\n", fractional, truncated);
    return 0;
}
