#include <stdio.h>

int search(const int *a, int n, int target) {
    // TODO: implement binary search.
    return -1;
}

int main(void) {
    int a[] = {2, 5, 8, 12, 16, 23, 38, 56};
    int target;
    if (scanf("%d", &target) != 1) return 1;
    printf("%d\n", search(a, 8, target));
    return 0;
}
