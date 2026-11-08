#include <stdio.h>
#include <stdbool.h>
#include <limits.h>
#include <stdint.h>
#include <stddef.h>
#include <math.h>
#include <float.h>
#include <fenv.h>
_Static_assert(FLT_RADIX==2&&DBL_MANT_DIG==53&&DBL_MAX_EXP==1024,
               "This native demonstration requires binary64 double");

bool nearly_equal(double a,double b,double absolute,double relative){
    if(!isfinite(a)||!isfinite(b)||!isfinite(absolute)||!isfinite(relative)||
       absolute<0.0||relative<0.0)return false;
    /* Domain for this teaching helper: finite |a|,|b|,relative <= 1. */
    if(fabs(a)>1.0||fabs(b)>1.0||relative>1.0)return false;
    double scale=fmax(fabs(a),fabs(b));
    return fabs(a-b)<=fmax(absolute,relative*scale);
}

int main(void) {
    int previous=fegetround();if(previous<0||fesetround(FE_TONEAREST)!=0)return 1;
    volatile double a=0.1,b=0.2,big=0x1p53,one=1.0;
    double sum=a+b;double lost=(big+one)-big;
    printf("sum=%.17g exact=%d close=%d\n",sum,sum==0.3,nearly_equal(sum,0.3,1e-15,1e-12));
    printf("small_increment_lost=%d\n",lost==0.0);
    if(fesetround(previous)!=0)return 1;
    return 0;
}
