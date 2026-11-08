#include <stdio.h>
#include <stdbool.h>
#include <limits.h>
#include <stdint.h>
#include <stddef.h>

bool checked_negate(int value,int *out){
    if(value < -INT_MAX)return false;
    *out=-value;return true;
}
bool checked_divrem(int a,int b,int *quotient,int *remainder){
    if(b==0||(b==-1&&a < -INT_MAX))return false;
    int q=a/b,r=a%b;
    *quotient=q;*remainder=r;return true;
}

int main(void) {
    int quotient=77,remainder=88,negated=99;
    bool zero=checked_divrem(7,0,&quotient,&remainder);
    bool edge=checked_divrem(INT_MIN,-1,&quotient,&remainder);
    bool negation=checked_negate(INT_MIN,&negated);
    printf("zero_rejected=%d min_div_rejected=%d min_negate_rejected=%d\n",!zero,!edge,!negation);
    if(!checked_divrem(-7,3,&quotient,&remainder))return 1;
    printf("quotient=%d remainder=%d\n",quotient,remainder);
    return 0;
}
