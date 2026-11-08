#include <stdio.h>

int main(void) {
    int score = 72;
    if (score >= 50) {
        puts("pass");
    } else {
        puts("retry");
    }
    int command = 2;
    switch (command) {
        case 1: puts("start"); break;
        case 2: puts("stop"); break;
        default: puts("unknown"); break;
    }
    return 0;
}
