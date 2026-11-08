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
#include <stdlib.h>
#include <errno.h>
#if !defined(NAN)||!defined(INFINITY)
#error "This example requires NaN and infinity support"
#endif

bool parse_finite(const char *text,double *out){
    char *end;errno=0;double value=strtod(text,&end);
    if(end==text||*end!='\0'||errno==ERANGE||!isfinite(value))return false;
    *out=value;return true;
}

int main(void) {
    double quiet=NAN,infinite=INFINITY,value=7.0;
    printf("nan_self_equal=%d nan_classified=%d infinity_classified=%d\n",quiet==quiet,isnan(quiet)!=0,isinf(infinite)!=0);
    bool bad=parse_finite("nan",&value);printf("nan_rejected=%d preserved=%d\n",!bad,value==7.0);
    bool good=parse_finite("-1.25",&value);printf("finite_accepted=%d value=%.2f\n",good,value);
    return 0;
}
