# NaN, infinity, and finite numeric input

Complete native example, ready to edit and run in Codespaces or locally.

## 32.9 NaN, infinity, and finite numeric input

A floating-point result can be finite, infinite, or NaN on the supported IEEE-style targets. Test the category you require rather than relying on ordinary comparisons.

The example obtains special values from the standard NAN and INFINITY macros, not from invalid integer arithmetic or an assumed floating divide-by-zero extension. A quiet NaN is unordered: comparisons such as x==x are false, so x==NAN is not a NaN test. Use isnan, isinf, and isfinite. strtod accepts spellings such as nan and inf; a database field that requires finite numbers must reject them explicitly. This strict parser also rejects ERANGE, no conversion, and trailing input before assigning its output.

### main.c

```c
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
```

Output:

```text
nan_self_equal=0 nan_classified=1 infinity_classified=1
nan_rejected=1 preserved=1
finite_accepted=1 value=-1.25
```

The classification macros return nonzero for the matching category. Rejecting nan retains the earlier value seven; the valid finite literal then replaces it with −1.25. Parse success is not the same as meeting a finite-only schema or fitting a later integer conversion.

**Watch for:** A check such as value < minimum || value > maximum can miss NaN because both ordered comparisons are false. Do not compile these classification examples with -ffast-math, whose assumptions can invalidate NaN/infinity reasoning.

**Check:** Which check establishes a finite value for a finite-only field?

1. isfinite(value)
2. value == value, which also accepts infinity

<details><summary>Answer</summary>

isfinite(value). Self-equality excludes quiet NaN but still permits infinities; isfinite excludes both categories.

</details>

**Try:** Test inf, -inf, nan, 1e9999, empty input, and a valid prefix followed by junk. Confirm rejected parses preserve the output and report the intended error category.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-9
```

