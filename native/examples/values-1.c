#include <stdio.h>
#include <stdbool.h>

int main(void) {
    int count = 7;
    double distance = 2.5;
    char letter = 'A';
    bool ready = true;
    printf("%d %.1f %c %d\n", count, distance, letter, ready);
    double tenth = 0.1;
    printf("rounded: %.1f\n", tenth);
    printf("more digits: %.17f\n", tenth);
    return 0;
}
