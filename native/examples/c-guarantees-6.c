#include <stdio.h>
#include <stdbool.h>
#include <limits.h>
#include <stdint.h>
#include <stddef.h>

bool checked_add(int a,int b,int *out){
    if((b>0&&a>INT_MAX-b)||(b<0&&a<INT_MIN-b))return false;
    *out=a+b;return true;
}
bool checked_subtract(int a,int b,int *out){
    if((b>0&&a<INT_MIN+b)||(b<0&&a>INT_MAX+b))return false;
    *out=a-b;return true;
}
bool checked_multiply(int a,int b,int *out){
    if(a>0){if((b>0&&a>INT_MAX/b)||(b<0&&b<INT_MIN/a))return false;}
    else if(a<0){if((b>0&&a<INT_MIN/b)||(b<0&&a<INT_MAX/b))return false;}
    *out=a*b;return true;
}

int main(void) {
    int value=77;bool added=checked_add(INT_MAX,1,&value);
    printf("add_rejected=%d preserved=%d\n",!added,value==77);
    bool subtracted=checked_subtract(INT_MIN,1,&value);
    printf("subtract_rejected=%d preserved=%d\n",!subtracted,value==77);
    bool multiplied=checked_multiply(-7,6,&value);
    printf("multiply_accepted=%d result=%d\n",multiplied,value);
    return 0;
}
