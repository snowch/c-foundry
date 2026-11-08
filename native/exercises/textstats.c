#include <stdio.h>
#include <stdbool.h>
#include <ctype.h>

int main(void) {
    char line[128];
    int characters = 0, words = 0;
    bool in_word = false;
    if (fgets(line, sizeof line, stdin) != NULL) {
        for (size_t i = 0; line[i] != '\0' && line[i] != '\n'; i++) {
            // TODO: count this character and detect the start of a word.
        }
    }
    printf("%d %d\n", characters, words);
    return 0;
}
