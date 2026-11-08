#include <stdio.h>
#include <string.h>

typedef struct { int id; char name[32]; } Row;
Row rows[32];
int count = 0;

int find_row(int id) {
    // TODO: find the row index for this ID.
    return -1;
}

int main(void) {
    char command[16];
    int id;
    while (scanf("%15s %d", command, &id) == 2) {
        if (strcmp(command, "insert") == 0) {
            char name[32];
            if (scanf("%31s", name) != 1) return 1;
            if (find_row(id) >= 0) { puts("duplicate id"); continue; }
            if (count == 32) { puts("table full"); continue; }
            rows[count].id = id;
            strcpy(rows[count++].name, name);
            puts("inserted");
        } else if (strcmp(command, "select") == 0) {
            int i = find_row(id);
            if (i < 0) puts("not found");
            else printf("%d | %s\n", rows[i].id, rows[i].name);
        } else puts("unknown command");
    }
    return 0;
}
