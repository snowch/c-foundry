window.PART_SEVEN = {
  "standards-evolution": {
    "intro": "Choose a language baseline and verify features with the actual compiler instead of assuming that a modern compiler name implies complete conformance.",
    "outcomes": [
      "Identify major standard revisions and their practical additions.",
      "Separate standard facilities from extensions.",
      "Build feature probes in multiple language modes."
    ],
    "topics": {
      "1": {
        "intro": "C revisions add facilities while retaining compatibility rules and implementation choices. A course baseline should be explicit.",
        "explanation": "C89/C90 standardized the early language; C99 added facilities such as declarations in for loops and standard fixed-width integer interfaces; C11 added atomics and alignment facilities; C17 primarily corrected defects; C23 adds facilities including nullptr, typeof/typeof_unqual, constexpr objects, and inferred auto declarations; probe the exact facility before depending on it. __STDC_VERSION__ identifies the selected language revision when provided, but does not prove every optional library facility is available. This course uses C17 unless a feature probe says otherwise.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  printf(\"C17_or_later=%d C11_or_later=%d\\n\", __STDC_VERSION__ >= 201710L,\n         __STDC_VERSION__ >= 201112L);\n  return 0;\n}\n",
        "expected": "C17_or_later=1 C11_or_later=1",
        "walkthrough": "The example command explicitly requests C17. Use make standards-matrix to test the repository’s separate mode-specific probes under GCC and Clang.",
        "pitfall": "Compiler release dates and language-mode macros are not a complete conformance certificate.",
        "question": "What determines the selected language mode?",
        "choices": [
          "The compiler invocation and supported mode",
          "The file extension alone"
        ],
        "answer": 0,
        "why": "A .c file can be compiled under several revisions and extension policies.",
        "tryit": "Run make standards-matrix and record actual accepted modes and diagnostics for both toolchains.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "Compiler extensions can be useful when isolated behind a checked interface, but they are not portable language guarantees.",
        "explanation": "The example guards a GNU-compatible extended integer type and supplies a standard fallback. __extension__ is itself a compiler-specific escape used only within that guard. The output checks a capability property rather than promising that every C target has a 128-bit integer. Prefer a standard baseline path unless the extended representation is part of a documented platform requirement.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n#if defined(__GNUC__) && defined(__SIZEOF_INT128__)\n  __extension__ typedef unsigned __int128 Wide;\n  printf(\"wide_at_least64=%d\\n\", sizeof(Wide) * CHAR_BIT >= 64);\n#else\n  printf(\"wide_at_least64=%d\\n\", sizeof(uint64_t) * CHAR_BIT >= 64);\n#endif\n  return 0;\n}\n",
        "expected": "wide_at_least64=1",
        "walkthrough": "Both paths satisfy the property needed by this fixture, but the types and supported ranges differ. The fallback’s existence does not make extension-only code elsewhere portable.",
        "pitfall": "Defining a compiler-family macro does not guarantee every extension or target-specific type.",
        "question": "Where should extension assumptions be isolated?",
        "choices": [
          "Every call site without checks",
          "A guarded interface with a documented fallback or requirement"
        ],
        "answer": 1,
        "why": "Centralizing the dependency makes supported targets and failures reviewable.",
        "tryit": "Compile with -Wpedantic -Werror, then write a feature probe that checks the exact extension your project needs.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "Feature detection should test the facility you need. A standard-version test alone cannot account for partial implementations or optional APIs.",
        "explanation": "The example selects a conservative C17 fallback at the course’s default language mode. A separate compile probe can attempt a C23-only facility under -std=c23 and report whether that compiler/library combination accepts it. Treat a failed probe as a result to handle, not permission to silently change the project’s semantics.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n#if defined(__STDC_VERSION__) && __STDC_VERSION__ >= 202311L\n  puts(\"mode=C23 feature_probe_required\");\n#else\n  puts(\"mode=C17 fallback_selected\");\n#endif\n  return 0;\n}\n",
        "expected": "mode=C17 fallback_selected",
        "walkthrough": "The checked example is intentionally compiled as C17. The standards-matrix command performs newer-mode experiments without making this page depend on full C23 support.",
        "pitfall": "Do not use an unchecked newer feature merely because a compiler accepts the language-mode flag.",
        "question": "What is stronger evidence of a needed facility?",
        "choices": [
          "A compile/link probe of that actual facility",
          "The compiler executable’s filename"
        ],
        "answer": 0,
        "why": "Language and library support can vary independently.",
        "tryit": "Add a positive and negative feature probe to your build and keep its diagnostics in the setup documentation.",
        "input": "",
        "runtime": "native"
      }
    },
    "practicePlan": {
      "goal": "Compile a feature probe under different language standards.",
      "tasks": [
        "Choose a language baseline and verify features with the actual compiler instead of assuming that a modern compiler name implies complete conformance.",
        "Add a positive and negative feature probe to your build and keep its diagnostics in the setup documentation.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "standards-evolution-3"
    }
  },
  "c-guarantees": {
    "intro": "Audit C’s behavior and numeric boundaries: conversions, checked arithmetic, exceptional integer operations, and finite floating-point calculations.",
    "outcomes": [
      "Classify defined, implementation-defined, unspecified, and undefined behavior.",
      "Respect object lifetime, effective types, and alignment.",
      "Compare optimized builds only on valid programs.",
      "Validate signed/unsigned comparisons and narrowing before values change meaning.",
      "Reject overflow, invalid division/remainder, and unrepresentable negation before evaluating them.",
      "Choose a floating-point error policy for rounding, NaN, infinity, and underflow."
    ],
    "topics": {
      "1": {
        "intro": "Different kinds of latitude in C require different responses. Undefined behavior is not just another documented platform choice.",
        "explanation": "Defined behavior follows the language contract. Implementation-defined behavior requires an implementation’s documented choice, such as relevant integer characteristics. Unspecified behavior permits a set of allowed choices without requiring the same choice every time, such as many operand evaluation orders. Undefined behavior imposes no requirements. The executable uses defined operations and reports a guaranteed minimum property, avoiding deliberate invalid accesses.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  unsigned wrapped = UINT_MAX;\n  wrapped += 1;\n  printf(\"char_bits_at_least8=%d unsigned_wrap=%u\\n\", CHAR_BIT >= 8, wrapped);\n  return 0;\n}\n",
        "expected": "char_bits_at_least8=1 unsigned_wrap=0",
        "walkthrough": "Unsigned arithmetic is modulo its type’s range. That guarantee does not extend to overflowing signed arithmetic.",
        "pitfall": "An observed compiler result cannot turn undefined behavior into a portable rule.",
        "question": "Is signed overflow merely an implementation-defined wrap choice?",
        "choices": [
          "No, it is undefined behavior in standard C",
          "Yes"
        ],
        "answer": 0,
        "why": "Standard unsigned and signed arithmetic have different overflow contracts.",
        "tryit": "Classify five expressions from TinyDB and cite the exact assumption or guarantee each relies on.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "A pointer’s numeric appearance does not establish alignment, type compatibility, or object lifetime. Use character access and memcpy for representation transfers.",
        "explanation": "The example copies an unsigned integer’s object representation into an unsigned-char array and back into a compatible object. Access through unsigned char may inspect object bytes; casting arbitrary byte storage to a wider pointer can violate alignment and effective-type rules. None of these operations extend an object’s lifetime or permit access after free.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  uint32_t source = UINT32_C(0x12345678), copy = 0;\n  unsigned char bytes[sizeof source];\n  memcpy(bytes, &source, sizeof bytes);\n  memcpy(&copy, bytes, sizeof copy);\n  printf(\"roundtrip=%d bytes=%zu\\n\", copy == source, sizeof bytes);\n  return 0;\n}\n",
        "expected": "roundtrip=1 bytes=4",
        "walkthrough": "On the supported eight-bit-byte targets, uint32_t occupies four bytes. The test compares restored value rather than assuming a host byte order.",
        "pitfall": "A byte-for-byte native representation round trip is not a portable external file encoding.",
        "question": "Why avoid casting this arbitrary byte array to uint32_t *?",
        "choices": [
          "memcpy cannot copy integer values",
          "Alignment and object-type requirements may not be satisfied"
        ],
        "answer": 1,
        "why": "memcpy transfers representation bytes without requiring a misaligned typed access.",
        "tryit": "Replace a raw pointer cast in a decoder with explicit byte assembly and test it with unaligned input offsets.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "Optimizers may transform valid programs while preserving their required observable behavior. They need not preserve a guessed result after undefined behavior.",
        "explanation": "The fixture uses unsigned fixed-width arithmetic with a defined wrap result and a bounded representable sum. Compile it at multiple optimization levels and compare those outputs. If a different program changes behavior under optimization, audit its language contracts, races, and uninitialized state before treating the difference as an optimizer bug.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  uint32_t x = UINT32_MAX;\n  x += UINT32_C(1);\n  unsigned sum = 0;\n  for (unsigned i = 1; i <= 4; ++i)\n    sum += i;\n  printf(\"wrapped=%u sum=%u\\n\", (unsigned)x, sum);\n  return 0;\n}\n",
        "expected": "wrapped=0 sum=10",
        "walkthrough": "The required result remains zero and ten under valid optimizing transformations. The example is compiled with optimization enabled, not a deliberately invalid aliasing trick.",
        "pitfall": "Turning optimization off can hide a defect without fixing it.",
        "question": "What should be checked first after an optimization-sensitive failure?",
        "choices": [
          "Lifetime, bounds, aliasing, initialization, and synchronization",
          "Whether -O0 appears to work"
        ],
        "answer": 0,
        "why": "A valid source contract is the basis for expecting preserved behavior.",
        "tryit": "Compile with GCC and Clang at -O0 and -O2, then run the same independent fixtures.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-O2"
        ]
      },
      "4": {
        "intro": "Before evaluating a mixed-type expression, determine the promoted operand types. A negative signed value can become a large unsigned value before comparison.",
        "explanation": "For operands of type int and unsigned int, the usual arithmetic conversions convert the int operand to unsigned int. Thus the mathematical comparison −1 < 1 differs from its mixed-type C counterpart. The program makes that conversion explicit so strict compiler warnings remain enabled. For index validation, first reject negatives, then compare in an unsigned type that can represent both nonnegative operands. Small integer types are promoted too: uint8_t operands commonly add as int, so a later narrowing cast is a separate operation.",
        "code": "#include <stdio.h>\n#include <stdbool.h>\n#include <limits.h>\n#include <stdint.h>\n#include <stddef.h>\n\n\nint main(void) {\n    int negative=-1;unsigned limit=1;\n    unsigned converted=(unsigned)negative;\n    bool mathematical_less=negative<0||(uintmax_t)negative<(uintmax_t)limit;\n    size_t count=3;bool valid_index=negative>=0&&(uintmax_t)negative<(uintmax_t)count;\n    uint8_t a=250,b=10;int promoted=a+b;\n    printf(\"converted_less=%d mathematical_less=%d valid_index=%d\\n\",converted<limit,mathematical_less,valid_index);\n    printf(\"promoted_sum=%d narrowed_sum=%u\\n\",promoted,(unsigned)(uint8_t)promoted);\n    return 0;\n}\n",
        "expected": "converted_less=0 mathematical_less=1 valid_index=0\npromoted_sum=260 narrowed_sum=4",
        "walkthrough": "Converting −1 to unsigned produces UINT_MAX, which is not less than one. The guarded mathematical comparison correctly says a negative integer is smaller than an unsigned nonnegative value, while the index check rejects it. The two uint8_t operands promote to int and sum to 260; casting that result to uint8_t then reduces it modulo 256 to four.",
        "pitfall": "Casting a negative index to size_t does not validate it. Also, signed/unsigned rules depend on rank and representability; a wider signed type can sometimes represent every value of the unsigned operand.",
        "question": "On these targets, what is the type of the sum of two uint8_t operands?",
        "choices": [
          "uint8_t, so addition itself must wrap at 255",
          "int after integer promotion"
        ],
        "answer": 1,
        "why": "An int can represent every uint8_t value on the supported targets, so both operands promote to int before addition.",
        "tryit": "Compare indices −1, 0, count−1, and count with the guarded index predicate. Then predict and run uint8_t sums around 255 before and after narrowing.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "A cast asks for a conversion; it does not promise that the converted value retains the original meaning. Validate a destination’s range before narrowing.",
        "explanation": "Converting an integer to an unsigned type reduces it modulo that type’s range. In the course’s C17 baseline, an out-of-range conversion to a signed integer type instead has an implementation-defined result or can raise an implementation-defined signal. C23 changes integer conversion rules, but wrapping still may violate the application’s intent. Signed arithmetic overflow remains undefined: conversion rules do not make overflowing signed arithmetic valid. This helper accepts only values in SCHAR_MIN..SCHAR_MAX, assigns after validation, and leaves the output unchanged on rejection. Exact-width uint8_t is an explicit supported-target requirement.",
        "code": "#include <stdio.h>\n#include <stdbool.h>\n#include <limits.h>\n#include <stdint.h>\n#include <stddef.h>\n\nbool to_signed_char(int value,signed char *out){\n    if(value<SCHAR_MIN||value>SCHAR_MAX)return false;\n    *out=(signed char)value;return true;\n}\n\nint main(void) {\n    _Static_assert(CHAR_BIT==8,\"This fixture requires eight-bit bytes\");\n    signed char out=7;bool accepted=to_signed_char(130,&out);\n    printf(\"unsigned_narrow=%u signed_rejected=%d output=%d\\n\",(unsigned)(uint8_t)260,!accepted,(int)out);\n    bool low=to_signed_char(SCHAR_MIN,&out),high=to_signed_char(SCHAR_MAX,&out);\n    printf(\"endpoints_accepted=%d\\n\",low&&high);\n    return 0;\n}\n",
        "expected": "unsigned_narrow=4 signed_rejected=1 output=7\nendpoints_accepted=1",
        "walkthrough": "The unsigned conversion is defined and yields four. The signed conversion of 130 is never attempted on these eight-bit-byte targets: the guard rejects it and retains seven. Both representable signed endpoints are accepted. The example does not assume a particular implementation-defined out-of-range signed result.",
        "pitfall": "Checking whether a value fits after casting it checks the already changed value. Unsigned-to-signed, integer-to-floating, and floating-to-integer conversions also have distinct rules; the integer narrowing rule is not a universal conversion policy.",
        "question": "When should a range check for a narrowing conversion run?",
        "choices": [
          "Before converting, using the original value",
          "After converting, using only the narrowed value"
        ],
        "answer": 0,
        "why": "The original information may be lost or the conversion may already have triggered an invalid or implementation-defined result.",
        "tryit": "Test SCHAR_MIN−1, SCHAR_MIN, SCHAR_MAX, and SCHAR_MAX+1 on the supported targets. Require the destination to retain its earlier value after every rejection.",
        "input": "",
        "runtime": "browser"
      },
      "6": {
        "intro": "Reject an unrepresentable signed result before evaluating the operation. Checking for wrap after signed overflow is too late.",
        "explanation": "The helpers compare operands against safe rearrangements of INT_MIN and INT_MAX. Addition and subtraction split by the second operand’s sign. Multiplication splits by both signs and avoids dividing by zero through short-circuit conditions. Every guard calculation is itself representable, including the most-negative operand. Callers supply a valid int output object; rejection leaves it unchanged. These are portable C17 checks, not reliance on a compiler’s observed wrap behavior or a cast to a merely assumed wider type.",
        "code": "#include <stdio.h>\n#include <stdbool.h>\n#include <limits.h>\n#include <stdint.h>\n#include <stddef.h>\n\nbool checked_add(int a,int b,int *out){\n    if((b>0&&a>INT_MAX-b)||(b<0&&a<INT_MIN-b))return false;\n    *out=a+b;return true;\n}\nbool checked_subtract(int a,int b,int *out){\n    if((b>0&&a<INT_MIN+b)||(b<0&&a>INT_MAX+b))return false;\n    *out=a-b;return true;\n}\nbool checked_multiply(int a,int b,int *out){\n    if(a>0){if((b>0&&a>INT_MAX/b)||(b<0&&b<INT_MIN/a))return false;}\n    else if(a<0){if((b>0&&a<INT_MIN/b)||(b<0&&a<INT_MAX/b))return false;}\n    *out=a*b;return true;\n}\n\nint main(void) {\n    int value=77;bool added=checked_add(INT_MAX,1,&value);\n    printf(\"add_rejected=%d preserved=%d\\n\",!added,value==77);\n    bool subtracted=checked_subtract(INT_MIN,1,&value);\n    printf(\"subtract_rejected=%d preserved=%d\\n\",!subtracted,value==77);\n    bool multiplied=checked_multiply(-7,6,&value);\n    printf(\"multiply_accepted=%d result=%d\\n\",multiplied,value);\n    return 0;\n}\n",
        "expected": "add_rejected=1 preserved=1\nsubtract_rejected=1 preserved=1\nmultiply_accepted=1 result=-42",
        "walkthrough": "INT_MAX+1 and INT_MIN−1 are rejected without evaluation, retaining the sentinel 77. The valid product −42 is then stored. The sign branches also handle multiplication by zero without dividing by zero. Boundary tests must cover all operand-sign combinations, not only two positive operands.",
        "pitfall": "A test such as a+b<a may itself already execute undefined signed overflow. A larger integer type is useful only when its range is actually sufficient for the operands and intermediate result.",
        "question": "Can a signed-overflow check safely evaluate a+b first and inspect the result?",
        "choices": [
          "Yes, if the result is stored immediately",
          "No, the guard must run before the overflowing expression"
        ],
        "answer": 1,
        "why": "Undefined behavior has already occurred once the unrepresentable signed operation is evaluated.",
        "tryit": "Attempt the checked-arithmetic chapter exercise. Add tests for both endpoints, zero, all sign combinations, and failed operations retaining an existing output value.",
        "input": "",
        "runtime": "browser"
      },
      "7": {
        "intro": "Zero is not the only dangerous divisor. On two’s-complement targets, INT_MIN / -1 and -INT_MIN also require an unrepresentable positive result.",
        "explanation": "C17 integer division truncates toward zero, and a nonzero remainder has the dividend’s sign. Division or remainder by zero is invalid. If the quotient is not representable, both / and % have undefined behavior, even when the mathematical remainder would be zero. Negating INT_MIN is invalid when its positive counterpart exceeds INT_MAX. The guards use value < -INT_MAX, which is itself safe and respects C17 implementations with a symmetric signed range; the supplied native and Wasm targets have an asymmetric two’s-complement range. The division helper borrows two distinct live int output objects and writes neither on rejection.",
        "code": "#include <stdio.h>\n#include <stdbool.h>\n#include <limits.h>\n#include <stdint.h>\n#include <stddef.h>\n\nbool checked_negate(int value,int *out){\n    if(value < -INT_MAX)return false;\n    *out=-value;return true;\n}\nbool checked_divrem(int a,int b,int *quotient,int *remainder){\n    if(b==0||(b==-1&&a < -INT_MAX))return false;\n    int q=a/b,r=a%b;\n    *quotient=q;*remainder=r;return true;\n}\n\nint main(void) {\n    int quotient=77,remainder=88,negated=99;\n    bool zero=checked_divrem(7,0,&quotient,&remainder);\n    bool edge=checked_divrem(INT_MIN,-1,&quotient,&remainder);\n    bool negation=checked_negate(INT_MIN,&negated);\n    printf(\"zero_rejected=%d min_div_rejected=%d min_negate_rejected=%d\\n\",!zero,!edge,!negation);\n    if(!checked_divrem(-7,3,&quotient,&remainder))return 1;\n    printf(\"quotient=%d remainder=%d\\n\",quotient,remainder);\n    return 0;\n}\n",
        "expected": "zero_rejected=1 min_div_rejected=1 min_negate_rejected=1\nquotient=-2 remainder=-1",
        "walkthrough": "All three hazardous cases are rejected on the supported two’s-complement targets. The valid division produces quotient −2 and remainder −1: −7 = (−2)·3 + (−1). No demonstration deliberately performs an undefined negation, division, or remainder.",
        "pitfall": "Replacing division with remainder does not make the INT_MIN/-1 case safe. Also, abs(INT_MIN) has the same representability problem when the positive result cannot fit in int.",
        "question": "On these targets, is INT_MIN % -1 valid just because the mathematical remainder is zero?",
        "choices": [
          "No: the unrepresentable quotient also makes % invalid",
          "Yes: only division can overflow"
        ],
        "answer": 0,
        "why": "C defines both operations in terms of a representable quotient; the exceptional pair invalidates both.",
        "tryit": "Test ±7 with divisors ±3 and verify the quotient/remainder identity. Then test zero and the extreme divisor pair without evaluating a rejected operation.",
        "input": "",
        "runtime": "browser"
      },
      "8": {
        "intro": "Floating-point arithmetic approximates many real-number operations. A type with more precision still cannot represent every decimal fraction exactly.",
        "explanation": "This native experiment explicitly requires binary64 double and round-to-nearest. It adds stored approximations of 0.1 and 0.2, prints enough digits to reveal their result, and compares with a combined absolute/relative tolerance. Absolute tolerance matters near zero; relative tolerance scales with magnitude. The small nearly_equal helper rejects nonfinite values and restricts its domain so its own subtraction and multiplication cannot overflow. A tolerance is an application error budget, not a universal replacement for equality or a sorting comparator. The repository command links the native math library with -lm; headers alone do not provide that linker step on Linux.",
        "code": "#include <stdio.h>\n#include <stdbool.h>\n#include <limits.h>\n#include <stdint.h>\n#include <stddef.h>\n#include <math.h>\n#include <float.h>\n#include <fenv.h>\n_Static_assert(FLT_RADIX==2&&DBL_MANT_DIG==53&&DBL_MAX_EXP==1024,\n               \"This native demonstration requires binary64 double\");\n\nbool nearly_equal(double a,double b,double absolute,double relative){\n    if(!isfinite(a)||!isfinite(b)||!isfinite(absolute)||!isfinite(relative)||\n       absolute<0.0||relative<0.0)return false;\n    /* Domain for this teaching helper: finite |a|,|b|,relative <= 1. */\n    if(fabs(a)>1.0||fabs(b)>1.0||relative>1.0)return false;\n    double scale=fmax(fabs(a),fabs(b));\n    return fabs(a-b)<=fmax(absolute,relative*scale);\n}\n\nint main(void) {\n    int previous=fegetround();if(previous<0||fesetround(FE_TONEAREST)!=0)return 1;\n    volatile double a=0.1,b=0.2,big=0x1p53,one=1.0;\n    double sum=a+b;double lost=(big+one)-big;\n    printf(\"sum=%.17g exact=%d close=%d\\n\",sum,sum==0.3,nearly_equal(sum,0.3,1e-15,1e-12));\n    printf(\"small_increment_lost=%d\\n\",lost==0.0);\n    if(fesetround(previous)!=0)return 1;\n    return 0;\n}\n",
        "expected": "sum=0.30000000000000004 exact=0 close=1\nsmall_increment_lost=1",
        "walkthrough": "The stored sum differs from the stored 0.3 value but falls inside the stated tolerance. At 2^53, adding one rounds back to the same binary64 value under round-to-nearest, so subtracting the large value returns zero. Printing more decimal places exposes approximation; it does not restore lost information.",
        "pitfall": "Near-equality is generally not transitive and must not define qsort ordering. The safe domain of this helper is deliberately narrower than all finite doubles; a general-purpose comparison must handle overflow in its own calculations.",
        "question": "Should one fixed epsilon be used for every magnitude and application?",
        "choices": [
          "Yes, DBL_EPSILON is a universal error allowance",
          "No, choose absolute/relative tolerances from the problem’s error budget"
        ],
        "answer": 1,
        "why": "DBL_EPSILON describes spacing near one, not every accumulated error or acceptable application difference.",
        "tryit": "Change the increment near 2^53, compare numbers near zero, and vary each tolerance independently. Predict which error budget accepts each result before running.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-lm"
        ]
      },
      "9": {
        "intro": "A floating-point result can be finite, infinite, or NaN on the supported IEEE-style targets. Test the category you require rather than relying on ordinary comparisons.",
        "explanation": "The example obtains special values from the standard NAN and INFINITY macros, not from invalid integer arithmetic or an assumed floating divide-by-zero extension. A quiet NaN is unordered: comparisons such as x==x are false, so x==NAN is not a NaN test. Use isnan, isinf, and isfinite. strtod accepts spellings such as nan and inf; a database field that requires finite numbers must reject them explicitly. This strict parser also rejects ERANGE, no conversion, and trailing input before assigning its output.",
        "code": "#include <stdio.h>\n#include <stdbool.h>\n#include <limits.h>\n#include <stdint.h>\n#include <stddef.h>\n#include <math.h>\n#include <float.h>\n#include <fenv.h>\n_Static_assert(FLT_RADIX==2&&DBL_MANT_DIG==53&&DBL_MAX_EXP==1024,\n               \"This native demonstration requires binary64 double\");\n#include <stdlib.h>\n#include <errno.h>\n#if !defined(NAN)||!defined(INFINITY)\n#error \"This example requires NaN and infinity support\"\n#endif\n\nbool parse_finite(const char *text,double *out){\n    char *end;errno=0;double value=strtod(text,&end);\n    if(end==text||*end!='\\0'||errno==ERANGE||!isfinite(value))return false;\n    *out=value;return true;\n}\n\nint main(void) {\n    double quiet=NAN,infinite=INFINITY,value=7.0;\n    printf(\"nan_self_equal=%d nan_classified=%d infinity_classified=%d\\n\",quiet==quiet,isnan(quiet)!=0,isinf(infinite)!=0);\n    bool bad=parse_finite(\"nan\",&value);printf(\"nan_rejected=%d preserved=%d\\n\",!bad,value==7.0);\n    bool good=parse_finite(\"-1.25\",&value);printf(\"finite_accepted=%d value=%.2f\\n\",good,value);\n    return 0;\n}\n",
        "expected": "nan_self_equal=0 nan_classified=1 infinity_classified=1\nnan_rejected=1 preserved=1\nfinite_accepted=1 value=-1.25",
        "walkthrough": "The classification macros return nonzero for the matching category. Rejecting nan retains the earlier value seven; the valid finite literal then replaces it with −1.25. Parse success is not the same as meeting a finite-only schema or fitting a later integer conversion.",
        "pitfall": "A check such as value < minimum || value > maximum can miss NaN because both ordered comparisons are false. Do not compile these classification examples with -ffast-math, whose assumptions can invalidate NaN/infinity reasoning.",
        "question": "Which check establishes a finite value for a finite-only field?",
        "choices": [
          "isfinite(value)",
          "value == value, which also accepts infinity"
        ],
        "answer": 0,
        "why": "Self-equality excludes quiet NaN but still permits infinities; isfinite excludes both categories.",
        "tryit": "Test inf, -inf, nan, 1e9999, empty input, and a valid prefix followed by junk. Confirm rejected parses preserve the output and report the intended error category.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-lm"
        ]
      },
      "10": {
        "intro": "Floating-point underflow is a loss of tiny-magnitude range or precision, not unsigned integer wraparound. Gradual subnormals can extend the range below the smallest normal value.",
        "explanation": "DBL_MIN is the smallest positive normal double, not the most negative value and not the smallest positive subnormal. On the explicitly required binary64 target with gradual underflow, nextafter(0,1) produces the smallest positive representable value. This experiment uses specified math-library functions to scale values, establishes round-to-nearest, and classifies results. A sufficiently small result rounds to zero; subnormals are finite but have less relative precision. errno and floating exceptions have math_errhandling-dependent contracts, so classification and application policy must not assume every implementation reports them identically.",
        "code": "#include <stdio.h>\n#include <stdbool.h>\n#include <limits.h>\n#include <stdint.h>\n#include <stddef.h>\n#include <math.h>\n#include <float.h>\n#include <fenv.h>\n_Static_assert(FLT_RADIX==2&&DBL_MANT_DIG==53&&DBL_MAX_EXP==1024,\n               \"This native demonstration requires binary64 double\");\n#include <errno.h>\n\n\nint main(void) {\n    _Static_assert(DBL_HAS_SUBNORM==1,\"This fixture requires gradual subnormals\");\n    int previous=fegetround();if(previous<0||fesetround(FE_TONEAREST)!=0)return 1;\n    double below_normal=scalbn(DBL_MIN,-1);\n    double smallest=nextafter(0.0,1.0);errno=0;\n    volatile double source=smallest;double lost=scalbn(source,-1);\n    printf(\"below_min_is_subnormal=%d smallest_positive=%d\\n\",fpclassify(below_normal)==FP_SUBNORMAL,smallest>0.0);\n    printf(\"scaled_to_zero=%d finite_subnormal=%d\\n\",lost==0.0,isfinite(below_normal)!=0);\n    if(fesetround(previous)!=0)return 1;\n    return 0;\n}\n",
        "expected": "below_min_is_subnormal=1 smallest_positive=1\nscaled_to_zero=1 finite_subnormal=1",
        "walkthrough": "Half of DBL_MIN remains a finite subnormal on these targets. Halving the smallest subnormal through scalbn rounds to zero under the chosen rounding mode. The value does not wrap to a large positive number. This example intentionally checks portable classification interfaces under a stated floating-format contract instead of asserting one exact errno or exception-flag result.",
        "pitfall": "A finite check alone does not detect every underflow because a tiny result may be a finite subnormal or zero. Decide whether tiny values are acceptable; rejecting every ERANGE in a parser is one strict policy, not the only valid numerical policy.",
        "question": "What does DBL_MIN describe?",
        "choices": [
          "The most negative finite double",
          "The smallest positive normal double"
        ],
        "answer": 1,
        "why": "Use -DBL_MAX for the negative finite endpoint; subnormal values may exist between zero and DBL_MIN.",
        "tryit": "Compare scalbn(DBL_MIN,-1), nextafter(0,1), and further halvings. Then test a strict strtod parser with 1e-9999 and decide whether your application should reject or retain tiny finite values.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-lm"
        ]
      }
    },
    "practicePlan": {
      "goal": "Audit numeric assumptions and implement a checked arithmetic interface with boundary and rejection tests.",
      "tasks": [
        "Implement the checked-arithmetic exercise and preserve the output object after rejection.",
        "Test endpoints, all operand signs, zero divisors, the exceptional quotient, and narrowing limits.",
        "Run the floating-point probes in Codespaces and document target, rounding mode, finite-value policy, and tolerance assumptions."
      ],
      "checks": [
        "Compare integer results against an independent arbitrary-precision oracle before accepting a boundary result.",
        "Verify that rejected operations never evaluate invalid arithmetic and do not change caller output.",
        "Check finite values, NaN/infinity rejection, and subnormal/zero classification under the stated floating target contract."
      ],
      "example": "c-guarantees-10"
    },
    "practice": "arithmetic"
  },
  "portable-c": {
    "intro": "State the target requirements and isolate host APIs from portable C data and algorithms.",
    "outcomes": [
      "Separate standard-library operations from POSIX facilities.",
      "Encode fixed-width bytes independently of native layout.",
      "Detect facilities and document native versus WASI limits."
    ],
    "topics": {
      "1": {
        "intro": "The C standard library and an operating-system API are different portability layers. POSIX facilities require a POSIX target and their own contracts.",
        "explanation": "This native example uses clock_gettime with CLOCK_MONOTONIC, exposed through the POSIX feature-test macro before any headers. It checks both calls and compares timestamps without claiming a measurable workload duration. A different host needs an adapter or another supported API; ISO C alone does not require this exact interface.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <time.h>\n\nint main(void) {\n  struct timespec a, b;\n  if (clock_gettime(CLOCK_MONOTONIC, &a) || clock_gettime(CLOCK_MONOTONIC, &b))\n    return 1;\n  printf(\"clock_read=1 ordered=%d\\n\",\n         b.tv_sec > a.tv_sec ||\n             (b.tv_sec == a.tv_sec && b.tv_nsec >= a.tv_nsec));\n  return 0;\n}\n",
        "expected": "clock_read=1 ordered=1",
        "walkthrough": "Both reads succeed on the Codespaces Linux target. Two adjacent observations are used only for an ordering property, not a performance claim.",
        "pitfall": "A POSIX feature macro requests declarations; it does not make the API exist on every platform.",
        "question": "Does ISO C require CLOCK_MONOTONIC?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "It belongs to a host API with a narrower platform contract.",
        "tryit": "Define a small clock abstraction and test its Linux implementation separately from algorithmic counters.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "Fixed-width types simplify an external protocol only when their availability and byte-size requirements are stated. Endianness still needs explicit encoding.",
        "explanation": "The byte codec extracts and assembles little-endian uint32_t values instead of writing native objects. Exact-width types are optional on some C implementations; this course’s supported targets provide uint32_t and eight-bit bytes. Schema and format compatibility also depend on string encoding, version rules, and validation, not only on integer width.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\n\nint main(void) {\n  unsigned char bytes[4];\n  put32(bytes, UINT32_C(0x01020304));\n  printf(\"bytes=%u,%u,%u,%u value_ok=%d\\n\", (unsigned)bytes[0], (unsigned)bytes[1], (unsigned)bytes[2],\n         (unsigned)bytes[3], get32(bytes) == UINT32_C(0x01020304));\n  return 0;\n}\n",
        "expected": "bytes=4,3,2,1 value_ok=1",
        "walkthrough": "The byte order is identical on little- and big-endian supported hosts because the encoder defines it.",
        "pitfall": "Using uint32_t inside a raw dumped struct does not remove padding or byte-order assumptions.",
        "question": "Does a fixed-width field alone make raw structs portable files?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "Layout, padding, byte order, and other representation choices remain.",
        "tryit": "Decode independently specified bytes and test all integer extremes without consulting sizeof(Row).",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "Conditional compilation should expose a clear capability decision and preserve a tested baseline path. Avoid silently enabling partially supported features.",
        "explanation": "C11 atomics can be unavailable when an implementation defines __STDC_NO_ATOMICS__. This probe rejects that unsupported target explicitly before including stdatomic.h. The fixture uses an atomic object only through atomic operations. More advanced optional facilities should be tested with compile and link probes, not guessed from a platform name.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#if defined(__STDC_NO_ATOMICS__)\n#error \"This example requires standard atomics\"\n#endif\n#include <stdatomic.h>\n\nint main(void) {\n  atomic_uint value;\n  atomic_init(&value, 0);\n  atomic_fetch_add(&value, 1);\n  printf(\"atomic_probe=%u\\n\", atomic_load(&value));\n  return 0;\n}\n",
        "expected": "atomic_probe=1",
        "walkthrough": "The Codespaces toolchains provide this facility. A clean probe result establishes this example’s needs, not lock freedom for every atomic type.",
        "pitfall": "An atomic operation need not be implemented without locks; lock freedom is a separate capability.",
        "question": "Does atomic support guarantee every atomic type is lock-free?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "The standard permits implementations with internal synchronization.",
        "tryit": "Add a probe for atomic_is_lock_free and report its result as a platform property rather than a fixed course expectation.",
        "input": "",
        "runtime": "native"
      },
      "4": {
        "intro": "WebAssembly/WASI is a host contract, not an emulation of every native operating-system facility. Algorithmic C can be portable while system integrations differ.",
        "explanation": "This native example reports its compilation target using a target macro. The course’s Wasm toolchain provides a limited older WASI runtime, not native pthreads, sockets, arbitrary host filesystem access, or sanitizer runtimes. Keep portable encoders and data structures separate from adapters for persistence, threads, and process facilities.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n#if defined(__wasi__)\n  puts(\"target=WASI host_adapter_required\");\n#else\n  puts(\"target=native host_adapter_required\");\n#endif\n  return 0;\n}\n",
        "expected": "target=native host_adapter_required",
        "walkthrough": "Codespaces executes the native path. Merely changing the target triple cannot supply a missing host integration.",
        "pitfall": "Browser reading availability and browser execution support are separate product capabilities.",
        "question": "Can every native POSIX program run unchanged in the current page runner?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "The runner exposes a restricted host API and toolchain.",
        "tryit": "List every OS dependency in your assembled database and place each behind an explicit platform adapter.",
        "input": "",
        "runtime": "native"
      }
    },
    "practicePlan": {
      "goal": "Compare GCC and Clang builds and inspect platform-dependent properties.",
      "tasks": [
        "State the target requirements and isolate host APIs from portable C data and algorithms.",
        "List every OS dependency in your assembled database and place each behind an explicit platform adapter.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "portable-c-4"
    }
  },
  "hardening-tinydb": {
    "intro": "Audit the teaching database against its declared targets and build evidence for bounds, format, and resource guarantees.",
    "outcomes": [
      "Replace hidden size and representation assumptions with checked contracts.",
      "Test format-version rejection and state preservation.",
      "Run strict multi-compiler and sanitizer checks."
    ],
    "topics": {
      "1": {
        "intro": "An assumption audit checks where input sizes, arithmetic ranges, alignment, and lifetimes cross API boundaries.",
        "explanation": "For an array allocation, validate count≤SIZE_MAX/element_size before multiplication. Also define a zero-element policy and who owns the result. The fixture rejects an impossible int-array size without attempting memory exhaustion. Similar checks belong in page offsets, slot lengths, result buffers, and log record counts.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  size_t count = SIZE_MAX;\n  bool rejected = count > SIZE_MAX / sizeof(int);\n  printf(\"oversize_rejected=%d\\n\", rejected);\n  return 0;\n}\n",
        "expected": "oversize_rejected=1",
        "walkthrough": "On the supported targets sizeof(int)>1, so the requested count cannot fit a byte size. The operating system is not asked to perform a huge allocation.",
        "pitfall": "A NULL check after an already overflowing multiplication does not repair the requested size.",
        "question": "When must multiplication overflow be checked?",
        "choices": [
          "Before multiplying",
          "Only after malloc fails"
        ],
        "answer": 0,
        "why": "An overflowed size may request a small allocation and later cause an out-of-bounds write.",
        "tryit": "Audit every size calculation in the pager, index, parser, and vector with a stated maximum.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "Version checks are part of the decoder’s public contract. Unknown formats must not partially replace existing data.",
        "explanation": "The fixture writes a header with an unsupported version and confirms rejection. A compatibility suite should include known valid older fixtures, unsupported future versions, reserved-bit violations, and size mismatches. A migration must preserve a verified old file until the new file is safely published under the target platform’s rules.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\n\nint main(void) {\n  FILE *f = tmpfile();\n  if (!f)\n    return 1;\n  unsigned char header[8] = {0x54, 0x44, 0x42, 0x31, 99, 40, 0, 0};\n  if (fwrite(header, 1, 8, f) != 8 || fseek(f, 0, SEEK_SET)) {\n    fclose(f);\n    return 1;\n  }\n  Table live = {0};\n  insert_row(&live, (Row){9, \"Keep\", 0});\n  bool rejected = !load(f, &live);\n  if (fclose(f) != 0)\n    return 1;\n  printf(\"rejected=%d retained=%u\\n\", rejected, (unsigned)live.rows[0].id);\n  return 0;\n}\n",
        "expected": "rejected=1 retained=9",
        "walkthrough": "The decoder leaves the existing key nine untouched. A version number is checked before row-count-driven reads.",
        "pitfall": "A new writer should not overwrite the only old-format file before migration success is established.",
        "question": "What is the live-state result after unknown-version rejection?",
        "choices": [
          "A partially decoded replacement",
          "The previous state remains"
        ],
        "answer": 1,
        "why": "The loader commits its temporary state only after full validation.",
        "tryit": "Add version fixtures to your release suite and document the intended upgrade and downgrade policy.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "Compilers provide complementary diagnostics. Keep the same language baseline and fixtures when comparing their builds.",
        "explanation": "The example exercises a bounded decoded record with explicit byte assembly and a typed output. Run it with CC=gcc and CC=clang, both with strict warnings. Agreement is useful evidence, not proof of freedom from undefined behavior: both compilers can compile the same invalid source without a diagnostic when the language does not require one.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\n\nint main(void) {\n  unsigned char bytes[ROW_BYTES];\n  Row source = {7, \"Ada\", 90}, copy = {0};\n  if (!encode_row(bytes, &source) || !decode_row(bytes, sizeof bytes, &copy) ||\n      copy.id != 7 || strcmp(copy.name, \"Ada\"))\n    return 1;\n  puts(\"strict compiler fixture passed\");\n  return 0;\n}\n",
        "expected": "strict compiler fixture passed",
        "walkthrough": "The repository commands compile with C17, warnings, and warnings-as-errors, then check the documented output.",
        "pitfall": "Suppressing a warning globally just to make a second compiler pass may hide a real contract problem.",
        "question": "Does agreement between two compilers prove valid C?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "Undiagnosed undefined behavior remains possible.",
        "tryit": "Run make example EXAMPLE=hardening-tinydb-3 CC=clang and compare diagnostics with the GCC command.",
        "input": "",
        "runtime": "native"
      },
      "4": {
        "intro": "Sanitizers observe executed behavior and catch selected invalid operations. Combine them with strict builds, input validation, and independent expectations.",
        "explanation": "The fixture passes a deliberately short record to the decoder and verifies that it is rejected before bytes are accessed or output is assigned. Run with SANITIZE=1 to add AddressSanitizer and UndefinedBehaviorSanitizer in native builds. ThreadSanitizer is a separate tool for shared-memory concurrency and may depend on runtime/kernel support.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\n\nint main(void) {\n  unsigned char bytes[3] = {0};\n  Row out = {9, \"Keep\", 1};\n  bool rejected = !decode_row(bytes, sizeof bytes, &out);\n  printf(\"short_rejected=%d output_preserved=%d\\n\", rejected,\n         out.id == 9 && strcmp(out.name, \"Keep\") == 0);\n  return 0;\n}\n",
        "expected": "short_rejected=1 output_preserved=1",
        "walkthrough": "Length rejection occurs before get32 reads an ID. The original output object remains valid and unchanged.",
        "pitfall": "A clean sanitizer run does not explore unexecuted paths or establish crash durability.",
        "question": "What does a clean sanitizer run establish?",
        "choices": [
          "All possible inputs are correct",
          "No selected violation was detected on exercised paths"
        ],
        "answer": 1,
        "why": "The scope is the actual instrumentation and executions.",
        "tryit": "Run this example with SANITIZE=1, then add short inputs at every length below the full record size.",
        "input": "",
        "runtime": "native"
      }
    },
    "practicePlan": {
      "goal": "Run the TinyDB baseline under stricter compiler and sanitizer checks.",
      "tasks": [
        "Audit the teaching database against its declared targets and build evidence for bounds, format, and resource guarantees.",
        "Run this example with SANITIZE=1, then add short inputs at every length below the full record size.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "hardening-tinydb-4"
    }
  }
};
