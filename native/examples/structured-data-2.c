#include <stdio.h>

typedef enum { NUMBER, TEXT } Kind;
typedef struct {
    Kind kind;
    union { int number; const char *text; } data;
} Value;

void show(Value value) {
    switch (value.kind) {
        case NUMBER: printf("number=%d\n", value.data.number); break;
        case TEXT: printf("text=%s\n", value.data.text); break;
    }
}

int main(void) {
    Value value = {.kind = NUMBER, .data.number = 7};
    show(value);
    value.kind = TEXT;
    value.data.text = "Ada";
    show(value);
    return 0;
}
