#include <stdio.h>

typedef struct { int id; char name[32]; int score; } Row;

Row *find(Row *rows, size_t count, int id) {
    for (size_t i = 0; i < count; i++) {
        if (rows[i].id == id) return &rows[i];
    }
    return NULL;
}

int main(void) {
    Row rows[] = {{1, "Ada", 80}, {2, "Grace", 90}};
    Row *found = find(rows, 2, 2);
    if (found) found->score = 99;
    printf("%s %d\n", rows[1].name, rows[1].score);
    return 0;
}
