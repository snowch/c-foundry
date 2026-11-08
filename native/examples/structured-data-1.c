#include <stdio.h>

struct Row { int id; char name[32]; };

int main(void) {
    struct Row row = {.id = 1, .name = "Ada"};
    struct Row copy = row;
    copy.id = 2;
    printf("%d | %s\n%d | %s\n", row.id, row.name, copy.id, copy.name);
    return 0;
}
