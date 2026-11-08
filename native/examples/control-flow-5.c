#include <stdio.h>

int main(void) {
    int guess;
    int result = scanf("%d", &guess);
    if (result != 1) {
        puts("invalid input");
    } else if (guess < 1 || guess > 10) {
        puts("out of range");
    } else if (guess == 7) {
        puts("correct");
    } else {
        puts("try again");
    }
    return 0;
}
