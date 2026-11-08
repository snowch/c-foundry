#include <stdio.h>

void sort(int *a, int n) {
    // TODO: sort a in ascending order.
}

int main(void) {
    int n, a[32];
    if (scanf("%d", &n) != 1 || n < 1 || n > 32) return 1;
    for (int i = 0; i < n; i++)
        if (scanf("%d", &a[i]) != 1) return 1;
    sort(a, n);
    for (int i = 0; i < n; i++)
        printf("%s%d", i ? " " : "", a[i]);
    printf("\n");
    return 0;
}
