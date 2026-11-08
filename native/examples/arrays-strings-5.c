#include <stdio.h>
#include <stdbool.h>
#include <ctype.h>

int main(void) {
    char line[128];
    int words = 0;
    bool in_word = false;
    if (fgets(line, sizeof line, stdin) != NULL) {
        for (size_t i = 0; line[i] != '\0' && line[i] != '\n'; i++) {
            if (isspace((unsigned char)line[i])) {
                in_word = false;
            } else if (!in_word) {
                words++;
                in_word = true;
            }
        }
    }
    printf("words=%d\n", words);
    return 0;
}
