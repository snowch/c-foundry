#include <stdio.h>
#include <stdbool.h>
#include <limits.h>
#include <stdint.h>
#include <stddef.h>


int main(void) {
    int negative=-1;unsigned limit=1;
    unsigned converted=(unsigned)negative;
    bool mathematical_less=negative<0||(uintmax_t)negative<(uintmax_t)limit;
    size_t count=3;bool valid_index=negative>=0&&(uintmax_t)negative<(uintmax_t)count;
    uint8_t a=250,b=10;int promoted=a+b;
    printf("converted_less=%d mathematical_less=%d valid_index=%d\n",converted<limit,mathematical_less,valid_index);
    printf("promoted_sum=%d narrowed_sum=%u\n",promoted,(unsigned)(uint8_t)promoted);
    return 0;
}
