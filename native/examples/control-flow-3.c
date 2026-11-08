#include <stdio.h>

int main(void) {
    for (int i = 0; i < 3; i++) {
        printf("%d\n", i);
    }
    int remaining = 2;
    while (remaining > 0) {
        remaining--;
    }
    printf("remaining=%d\n", remaining);
    return 0;
}
