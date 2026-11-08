#include <stdio.h>

int next_count(void) {
    static int count = 0;
    count++;
    return count;
}

int main(void) {
    printf("%d\n", next_count());
    printf("%d\n", next_count());
    return 0;
}
