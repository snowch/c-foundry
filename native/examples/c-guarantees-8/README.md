# Floating-point rounding, cancellation, and tolerances

Complete native example, ready to edit and run in Codespaces or locally.

## 32.8 Floating-point rounding, cancellation, and tolerances

Floating-point arithmetic approximates many real-number operations. A type with more precision still cannot represent every decimal fraction exactly.

This native experiment explicitly requires binary64 double and round-to-nearest. It adds stored approximations of 0.1 and 0.2, prints enough digits to reveal their result, and compares with a combined absolute/relative tolerance. Absolute tolerance matters near zero; relative tolerance scales with magnitude. The small nearly_equal helper rejects nonfinite values and restricts its domain so its own subtraction and multiplication cannot overflow. A tolerance is an application error budget, not a universal replacement for equality or a sorting comparator. The repository command links the native math library with -lm; headers alone do not provide that linker step on Linux.

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
```

Output:

```text
sum=0.30000000000000004 exact=0 close=1
small_increment_lost=1
```

The stored sum differs from the stored 0.3 value but falls inside the stated tolerance. At 2^53, adding one rounds back to the same binary64 value under round-to-nearest, so subtracting the large value returns zero. Printing more decimal places exposes approximation; it does not restore lost information.

**Watch for:** Near-equality is generally not transitive and must not define qsort ordering. The safe domain of this helper is deliberately narrower than all finite doubles; a general-purpose comparison must handle overflow in its own calculations.

**Check:** Should one fixed epsilon be used for every magnitude and application?

1. Yes, DBL_EPSILON is a universal error allowance
2. No, choose absolute/relative tolerances from the problem’s error budget

<details><summary>Answer</summary>

No, choose absolute/relative tolerances from the problem’s error budget. DBL_EPSILON describes spacing near one, not every accumulated error or acceptable application difference.

</details>

**Try:** Change the increment near 2^53, compare numbers near zero, and vary each tolerance independently. Predict which error budget accepts each result before running.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-8
```

