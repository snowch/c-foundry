# Chapter 32: What C guarantees

Part 7: Writing portable C. Teaching baseline: C17.

Audit C’s behavior and numeric boundaries: conversions, checked arithmetic, exceptional integer operations, and finite floating-point calculations.

## Outcomes

- Classify defined, implementation-defined, unspecified, and undefined behavior.
- Respect object lifetime, effective types, and alignment.
- Compare optimized builds only on valid programs.
- Validate signed/unsigned comparisons and narrowing before values change meaning.
- Reject overflow, invalid division/remainder, and unrepresentable negation before evaluating them.
- Choose a floating-point error policy for rounding, NaN, infinity, and underflow.

## 32.1 Defined, implementation-defined, unspecified, and undefined behavior

Different kinds of latitude in C require different responses. Undefined behavior is not just another documented platform choice.

Defined behavior follows the language contract. Implementation-defined behavior requires an implementation’s documented choice, such as relevant integer characteristics. Unspecified behavior permits a set of allowed choices without requiring the same choice every time, such as many operand evaluation orders. Undefined behavior imposes no requirements. The executable uses defined operations and reports a guaranteed minimum property, avoiding deliberate invalid accesses.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  unsigned wrapped = UINT_MAX;
  wrapped += 1;
  printf("char_bits_at_least8=%d unsigned_wrap=%u\n", CHAR_BIT >= 8, wrapped);
  return 0;
}
```

Output:

```text
char_bits_at_least8=1 unsigned_wrap=0
```

Unsigned arithmetic is modulo its type’s range. That guarantee does not extend to overflowing signed arithmetic.

**Watch for:** An observed compiler result cannot turn undefined behavior into a portable rule.

**Check:** Is signed overflow merely an implementation-defined wrap choice?

1. No, it is undefined behavior in standard C
2. Yes

<details><summary>Answer</summary>

No, it is undefined behavior in standard C. Standard unsigned and signed arithmetic have different overflow contracts.

</details>

**Try:** Classify five expressions from TinyDB and cite the exact assumption or guarantee each relies on.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-1
```

## 32.2 Integer representation, alignment, object lifetime, and aliasing

A pointer’s numeric appearance does not establish alignment, type compatibility, or object lifetime. Use character access and memcpy for representation transfers.

The example copies an unsigned integer’s object representation into an unsigned-char array and back into a compatible object. Access through unsigned char may inspect object bytes; casting arbitrary byte storage to a wider pointer can violate alignment and effective-type rules. None of these operations extend an object’s lifetime or permit access after free.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  uint32_t source = UINT32_C(0x12345678), copy = 0;
  unsigned char bytes[sizeof source];
  memcpy(bytes, &source, sizeof bytes);
  memcpy(&copy, bytes, sizeof copy);
  printf("roundtrip=%d bytes=%zu\n", copy == source, sizeof bytes);
  return 0;
}
```

Output:

```text
roundtrip=1 bytes=4
```

On the supported eight-bit-byte targets, uint32_t occupies four bytes. The test compares restored value rather than assuming a host byte order.

**Watch for:** A byte-for-byte native representation round trip is not a portable external file encoding.

**Check:** Why avoid casting this arbitrary byte array to uint32_t *?

1. memcpy cannot copy integer values
2. Alignment and object-type requirements may not be satisfied

<details><summary>Answer</summary>

Alignment and object-type requirements may not be satisfied. memcpy transfers representation bytes without requiring a misaligned typed access.

</details>

**Try:** Replace a raw pointer cast in a decoder with explicit byte assembly and test it with unaligned input offsets.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-2
```

## 32.3 Why code can behave differently under optimization

Optimizers may transform valid programs while preserving their required observable behavior. They need not preserve a guessed result after undefined behavior.

The fixture uses unsigned fixed-width arithmetic with a defined wrap result and a bounded representable sum. Compile it at multiple optimization levels and compare those outputs. If a different program changes behavior under optimization, audit its language contracts, races, and uninitialized state before treating the difference as an optimizer bug.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  uint32_t x = UINT32_MAX;
  x += UINT32_C(1);
  unsigned sum = 0;
  for (unsigned i = 1; i <= 4; ++i)
    sum += i;
  printf("wrapped=%u sum=%u\n", (unsigned)x, sum);
  return 0;
}
```

Output:

```text
wrapped=0 sum=10
```

The required result remains zero and ten under valid optimizing transformations. The example is compiled with optimization enabled, not a deliberately invalid aliasing trick.

**Watch for:** Turning optimization off can hide a defect without fixing it.

**Check:** What should be checked first after an optimization-sensitive failure?

1. Lifetime, bounds, aliasing, initialization, and synchronization
2. Whether -O0 appears to work

<details><summary>Answer</summary>

Lifetime, bounds, aliasing, initialization, and synchronization. A valid source contract is the basis for expecting preserved behavior.

</details>

**Try:** Compile with GCC and Clang at -O0 and -O2, then run the same independent fixtures.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-3
```

## 32.4 Signed/unsigned comparisons and integer promotions

Before evaluating a mixed-type expression, determine the promoted operand types. A negative signed value can become a large unsigned value before comparison.

For operands of type int and unsigned int, the usual arithmetic conversions convert the int operand to unsigned int. Thus the mathematical comparison −1 < 1 differs from its mixed-type C counterpart. The program makes that conversion explicit so strict compiler warnings remain enabled. For index validation, first reject negatives, then compare in an unsigned type that can represent both nonnegative operands. Small integer types are promoted too: uint8_t operands commonly add as int, so a later narrowing cast is a separate operation.

### main.c

```c
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
```

Output:

```text
converted_less=0 mathematical_less=1 valid_index=0
promoted_sum=260 narrowed_sum=4
```

Converting −1 to unsigned produces UINT_MAX, which is not less than one. The guarded mathematical comparison correctly says a negative integer is smaller than an unsigned nonnegative value, while the index check rejects it. The two uint8_t operands promote to int and sum to 260; casting that result to uint8_t then reduces it modulo 256 to four.

**Watch for:** Casting a negative index to size_t does not validate it. Also, signed/unsigned rules depend on rank and representability; a wider signed type can sometimes represent every value of the unsigned operand.

**Check:** On these targets, what is the type of the sum of two uint8_t operands?

1. uint8_t, so addition itself must wrap at 255
2. int after integer promotion

<details><summary>Answer</summary>

int after integer promotion. An int can represent every uint8_t value on the supported targets, so both operands promote to int before addition.

</details>

**Try:** Compare indices −1, 0, count−1, and count with the guarded index predicate. Then predict and run uint8_t sums around 255 before and after narrowing.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-4
```

## 32.5 Narrowing conversions and range-checked casts

A cast asks for a conversion; it does not promise that the converted value retains the original meaning. Validate a destination’s range before narrowing.

Converting an integer to an unsigned type reduces it modulo that type’s range. In the course’s C17 baseline, an out-of-range conversion to a signed integer type instead has an implementation-defined result or can raise an implementation-defined signal. C23 changes integer conversion rules, but wrapping still may violate the application’s intent. Signed arithmetic overflow remains undefined: conversion rules do not make overflowing signed arithmetic valid. This helper accepts only values in SCHAR_MIN..SCHAR_MAX, assigns after validation, and leaves the output unchanged on rejection. Exact-width uint8_t is an explicit supported-target requirement.

### main.c

```c
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
```

Output:

```text
unsigned_narrow=4 signed_rejected=1 output=7
endpoints_accepted=1
```

The unsigned conversion is defined and yields four. The signed conversion of 130 is never attempted on these eight-bit-byte targets: the guard rejects it and retains seven. Both representable signed endpoints are accepted. The example does not assume a particular implementation-defined out-of-range signed result.

**Watch for:** Checking whether a value fits after casting it checks the already changed value. Unsigned-to-signed, integer-to-floating, and floating-to-integer conversions also have distinct rules; the integer narrowing rule is not a universal conversion policy.

**Check:** When should a range check for a narrowing conversion run?

1. Before converting, using the original value
2. After converting, using only the narrowed value

<details><summary>Answer</summary>

Before converting, using the original value. The original information may be lost or the conversion may already have triggered an invalid or implementation-defined result.

</details>

**Try:** Test SCHAR_MIN−1, SCHAR_MIN, SCHAR_MAX, and SCHAR_MAX+1 on the supported targets. Require the destination to retain its earlier value after every rejection.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-5
```

## 32.6 Checked addition, subtraction, and multiplication

Reject an unrepresentable signed result before evaluating the operation. Checking for wrap after signed overflow is too late.

The helpers compare operands against safe rearrangements of INT_MIN and INT_MAX. Addition and subtraction split by the second operand’s sign. Multiplication splits by both signs and avoids dividing by zero through short-circuit conditions. Every guard calculation is itself representable, including the most-negative operand. Callers supply a valid int output object; rejection leaves it unchanged. These are portable C17 checks, not reliance on a compiler’s observed wrap behavior or a cast to a merely assumed wider type.

### main.c

```c
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
```

Output:

```text
add_rejected=1 preserved=1
subtract_rejected=1 preserved=1
multiply_accepted=1 result=-42
```

INT_MAX+1 and INT_MIN−1 are rejected without evaluation, retaining the sentinel 77. The valid product −42 is then stored. The sign branches also handle multiplication by zero without dividing by zero. Boundary tests must cover all operand-sign combinations, not only two positive operands.

**Watch for:** A test such as a+b<a may itself already execute undefined signed overflow. A larger integer type is useful only when its range is actually sufficient for the operands and intermediate result.

**Check:** Can a signed-overflow check safely evaluate a+b first and inspect the result?

1. Yes, if the result is stored immediately
2. No, the guard must run before the overflowing expression

<details><summary>Answer</summary>

No, the guard must run before the overflowing expression. Undefined behavior has already occurred once the unrepresentable signed operation is evaluated.

</details>

**Try:** Attempt the checked-arithmetic chapter exercise. Add tests for both endpoints, zero, all sign combinations, and failed operations retaining an existing output value.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-6
```

## 32.7 Division, remainder, and negating INT_MIN

Zero is not the only dangerous divisor. On two’s-complement targets, INT_MIN / -1 and -INT_MIN also require an unrepresentable positive result.

C17 integer division truncates toward zero, and a nonzero remainder has the dividend’s sign. Division or remainder by zero is invalid. If the quotient is not representable, both / and % have undefined behavior, even when the mathematical remainder would be zero. Negating INT_MIN is invalid when its positive counterpart exceeds INT_MAX. The guards use value < -INT_MAX, which is itself safe and respects C17 implementations with a symmetric signed range; the supplied native and Wasm targets have an asymmetric two’s-complement range. The division helper borrows two distinct live int output objects and writes neither on rejection.

### main.c

```c
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
```

Output:

```text
zero_rejected=1 min_div_rejected=1 min_negate_rejected=1
quotient=-2 remainder=-1
```

All three hazardous cases are rejected on the supported two’s-complement targets. The valid division produces quotient −2 and remainder −1: −7 = (−2)·3 + (−1). No demonstration deliberately performs an undefined negation, division, or remainder.

**Watch for:** Replacing division with remainder does not make the INT_MIN/-1 case safe. Also, abs(INT_MIN) has the same representability problem when the positive result cannot fit in int.

**Check:** On these targets, is INT_MIN % -1 valid just because the mathematical remainder is zero?

1. No: the unrepresentable quotient also makes % invalid
2. Yes: only division can overflow

<details><summary>Answer</summary>

No: the unrepresentable quotient also makes % invalid. C defines both operations in terms of a representable quotient; the exceptional pair invalidates both.

</details>

**Try:** Test ±7 with divisors ±3 and verify the quotient/remainder identity. Then test zero and the extreme divisor pair without evaluating a rejected operation.

Run from the repository root:

```sh
make example EXAMPLE=c-guarantees-7
```

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

## Chapter practice

Edit `native/exercises/arithmetic.c`, then run:

```sh
make exercise EXERCISE=arithmetic
```

## Build it yourself

Audit numeric assumptions and implement a checked arithmetic interface with boundary and rejection tests.

1. Implement the checked-arithmetic exercise and preserve the output object after rejection.
2. Test endpoints, all operand signs, zero divisors, the exceptional quotient, and narrowing limits.
3. Run the floating-point probes in Codespaces and document target, rounding mode, finite-value policy, and tolerance assumptions.

### Check your work

- Compare integer results against an independent arbitrary-precision oracle before accepting a boundary result.
- Verify that rejected operations never evaluate invalid arithmetic and do not change caller output.
- Check finite values, NaN/infinity rejection, and subnormal/zero classification under the stated floating target contract.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=c-guarantees-10
```

Chapter workspace command: `make chapter CHAPTER=c-guarantees`.

Generated from dist/part7.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/c-guarantees
