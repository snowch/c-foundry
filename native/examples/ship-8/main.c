#include <stdbool.h>
#include <stddef.h>
#include <stdio.h>

typedef struct { unsigned id, score; } Row;

bool update_score(Row *rows, size_t count, unsigned id, unsigned score) {
    for (size_t i = 0; i < count; ++i) {
        if (rows[i].id == id) {
            rows[i].score = score;
            return true;
        }
    }
    return false;
}

int main(void) {
    Row rows[] = {{1, 90}, {2, 80}, {3, 70}};
    if (!update_score(rows, 3, 2, 99)) return 1;
    for (size_t i = 0; i < 3; ++i)
        printf("id=%u score=%u\n", rows[i].id, rows[i].score);
    return 0;
}
