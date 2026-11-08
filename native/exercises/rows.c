#include <stdio.h>

typedef struct {
    int id;
    char name[32];
} Row;

int main(void) {
    Row row = {0, ""};
    // TODO: read the two fields from stdin.
    printf("%d | %s\n", row.id, row.name);
    return 0;
}
