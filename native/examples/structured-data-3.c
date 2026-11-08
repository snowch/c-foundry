#include <stdio.h>
#include <stddef.h>

typedef struct { char flag; int count; } Row;

int main(void) {
    printf("fields fit=%d\n", sizeof(Row) >= sizeof(char) + sizeof(int));
    printf("count aligned=%d\n", offsetof(Row, count) % _Alignof(int) == 0);
    return 0;
}
