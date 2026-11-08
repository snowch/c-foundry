#include <stdio.h>
#include <stdbool.h>
#include <limits.h>
#include <stdint.h>
#include <stddef.h>

bool to_signed_char(int value,signed char *out){
    if(value<SCHAR_MIN||value>SCHAR_MAX)return false;
    *out=(signed char)value;return true;
}

int main(void) {
    _Static_assert(CHAR_BIT==8,"This fixture requires eight-bit bytes");
    signed char out=7;bool accepted=to_signed_char(130,&out);
    printf("unsigned_narrow=%u signed_rejected=%d output=%d\n",(unsigned)(uint8_t)260,!accepted,(int)out);
    bool low=to_signed_char(SCHAR_MIN,&out),high=to_signed_char(SCHAR_MAX,&out);
    printf("endpoints_accepted=%d\n",low&&high);
    return 0;
}
