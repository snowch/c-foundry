#include <stdio.h>

int main(void) {
    for (int i = 0; i < 7; i++) {
        if (i == 2) continue;
        if (i == 5) break;
        printf("%d\n", i);
    }
    return 0;
}
