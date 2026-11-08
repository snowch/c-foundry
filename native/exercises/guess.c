#include <stdio.h>

int main(void) {
    int guess;
    for (;;) {
        int result = scanf("%d", &guess);
        if (result == EOF) { puts("no more guesses"); break; }
        if (result != 1) { puts("invalid input"); break; }
        if (guess < 1 || guess > 10) { puts("out of range"); continue; }
        // TODO: compare guess with 7 and keep reading until correct.
        puts("not implemented");
        break;
    }
    return 0;
}
