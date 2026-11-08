#include <stdio.h>

int add_one(int value) {
    value++;
    return value;
}

int main(void) {
    int original = 10;
    int result = add_one(original);
    printf("%d %d\n", original, result);
    return 0;
}
