#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 1 || n > 100) return 1;
    int *values = NULL; // TODO: allocate n integers.
    if (!values) return 1;
    for (int i = 0; i < n; i++) {
        values[i] = 0; // TODO: calculate the square.
        printf("%s%d", i ? " " : "", values[i]);
    }
    printf("\n");
    // TODO: release the allocation.
    return 0;
}
