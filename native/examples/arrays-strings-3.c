#include <stdio.h>

int main(void) {
    char line[32];
    if (fgets(line, sizeof line, stdin) == NULL) {
        puts("no line");
        return 0;
    }
    printf("Read: %s", line);
    return 0;
}
