#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <limits.h>

typedef struct { int id; char name[32]; } Row;
typedef enum { UPDATED, NOT_FOUND, BAD_NAME } Result;

Result update_name(Row *rows, size_t count, int id, const char *name) {
    (void)rows; (void)count; (void)id; (void)name;
    // TODO: validate the name, find the ID, and copy the complete string.
    return NOT_FOUND;
}

int main(void) {
    Row rows[] = {{1, "Ada"}, {2, "Grace"}, {3, "Linus"}};
    char id_line[64], name[64], *end;
    if (!fgets(id_line, sizeof id_line, stdin)) { puts("invalid id"); return 0; }
    id_line[strcspn(id_line, "\r\n")] = '\0';
    errno = 0;
    long id = strtol(id_line, &end, 10);
    if (errno == ERANGE || end == id_line || *end != '\0' || id < 1 || id > INT_MAX) {
        puts("invalid id"); return 0;
    }
    if (!fgets(name, sizeof name, stdin)) { puts("invalid name"); return 0; }
    name[strcspn(name, "\r\n")] = '\0';
    Result result = update_name(rows, 3, (int)id, name);
    if (result == BAD_NAME) puts("invalid name");
    else if (result == NOT_FOUND) puts("not found");
    else {
        for (size_t i = 0; i < 3; i++) {
            if (rows[i].id == id) printf("%d | %s\n", rows[i].id, rows[i].name);
        }
    }
    return 0;
}
