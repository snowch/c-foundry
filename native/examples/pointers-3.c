#include <stdio.h>
#include <stddef.h>

int main(void) {
    int values[] = {2, 4, 6};
    int *p = values + 1;
    int *end = values + 3;
    printf("%d %d %td\n", *p, *(p + 1), end - values);
    return 0;
}
