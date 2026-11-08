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
#include <errno.h>


int main(void) {
    _Static_assert(DBL_HAS_SUBNORM==1,"This fixture requires gradual subnormals");
    int previous=fegetround();if(previous<0||fesetround(FE_TONEAREST)!=0)return 1;
    double below_normal=scalbn(DBL_MIN,-1);
    double smallest=nextafter(0.0,1.0);errno=0;
    volatile double source=smallest;double lost=scalbn(source,-1);
    printf("below_min_is_subnormal=%d smallest_positive=%d\n",fpclassify(below_normal)==FP_SUBNORMAL,smallest>0.0);
    printf("scaled_to_zero=%d finite_subnormal=%d\n",lost==0.0,isfinite(below_normal)!=0);
    if(fesetround(previous)!=0)return 1;
    return 0;
}
