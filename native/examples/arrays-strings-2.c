#include <stdio.h>
#include <string.h>

int main(void) {
    char word[] = "cat";
    printf("length=%zu capacity=%zu\n", strlen(word), sizeof word);
    return 0;
}
