#include <stdio.h>

int main(void) {
    const int unit_price = 7;
    int quantity = 3;
    int total = unit_price * quantity;
    quantity = 4;
    printf("%d %d\n", total, quantity);
    return 0;
}
