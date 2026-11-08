# Floating-point underflow, subnormals, and range errors

Complete native example, ready to edit and run in Codespaces or locally.

## 32.10 Floating-point underflow, subnormals, and range errors

Floating-point underflow is a loss of tiny-magnitude range or precision, not unsigned integer wraparound. Gradual subnormals can extend the range below the smallest normal value.

DBL_MIN is the smallest positive normal double, not the most negative value and not the smallest positive subnormal. On the explicitly required binary64 target with gradual underflow, nextafter(0,1) produces the smallest positive representable value. This experiment uses specified math-library functions to scale values, establishes round-to-nearest, and classifies results. A sufficiently small result rounds to zero; subnormals are finite but have less relative precision. errno and floating exceptions have math_errhandling-dependent contracts, so classification and application policy must not assume every implementation reports them identically.

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
```

Output:

```text
below_min_is_subnormal=1 smallest_positive=1
scaled_to_zero=1 finite_subnormal=1
```

Half of DBL_MIN remains a finite subnormal on these targets. Halving the smallest subnormal through scalbn rounds to zero under the chosen rounding mode. The value does not wrap to a large positive number. This example intentionally checks portable classification interfaces under a stated floating-format contract instead of asserting one exact errno or exception-flag result.

**Watch for:** A finite check alone does not detect every underflow because a tiny result may be a finite subnormal or zero. Decide whether tiny values are acceptable; rejecting every ERANGE in a parser is one strict policy, not the only valid numerical policy.

**Check:** What does DBL_MIN describe?

1. The most negative finite double
2. The smallest positive normal double

<details><summary>Answer</summary>

The smallest positive normal double. Use -DBL_MAX for the negative finite endpoint; subnormal values may exist between zero and DBL_MIN.

</details>

**Try:** Compare scalbn(DBL_MIN,-1), nextafter(0,1), and further halvings. Then test a strict strtod parser with 1e-9999 and decide whether your application should reject or retain tiny finite values.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-10
```

