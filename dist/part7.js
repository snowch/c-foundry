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
    "intro": "Write portable file handling, text processing, and parsing code, and put operating-system services behind explicit interfaces. State which targets, encodings, and filesystem behaviors the project supports.",
    "outcomes": [
      "Distinguish ISO C, POSIX, Win32, and Linux-specific contracts.",
      "Specify byte widths, byte order, file modes, and filename policy explicitly.",
      "Handle line endings, byte encodings, locale, bounded records, and numeric conversion.",
      "Check stream errors and use stream positions without assuming text byte offsets.",
      "Compile and link capability probes, isolate host services, and test the same fixtures on Linux, macOS, and Windows."
    ],
    "topics": {
      "1": {
        "intro": "Know which contract an API belongs to before calling it. Portable C is a language-and-library baseline, not a promise that every operating system offers the same services.",
        "explanation": "ISO C includes streams such as fopen/fread, string processing, allocation, time interfaces, and the limited signal() facility. POSIX adds facilities such as fork, sigaction, and clock_gettime; Win32 has different process, handle, and synchronization interfaces. ioctl requests are device/platform specific, /proc is a host-specific pseudo-filesystem, and shared-memory APIs and guarantees depend on the platform. Keep parsing and byte codecs independent of those services. This example uses only ISO C streams and checks each operation; tmpfile can still fail because a hosted library operation can depend on permissions or resources.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    FILE *file = tmpfile();\n    if (!file) return 1;\n    int ok = fputs(\"portable\\n\", file) >= 0 && fflush(file) == 0 && fseek(file, 0, SEEK_SET) == 0;\n    char line[32];\n    if (ok) ok = fgets(line, sizeof line, file) != NULL;\n    if (fclose(file) != 0) ok = 0;\n    if (!ok) return 1;\n    printf(\"%s\", line);\n    return 0;\n}\n",
        "expected": "portable",
        "walkthrough": "The temporary stream receives one line and is repositioned before reading. Every path after a successful open closes the stream. The language interface is portable; successful access is still something the program checks.",
        "pitfall": "ISO C signal() exists, but POSIX signal masks, delivery rules, process groups, and signal-safe operations are additional contracts. Do not label all signal handling either universally available or universally Linux-only.",
        "question": "Which dependency belongs outside a portable parser?",
        "choices": [
          "An explicit byte buffer and its length",
          "Reading Linux /proc to discover process state"
        ],
        "answer": 1,
        "why": "The parser can operate on supplied bytes without depending on a particular host filesystem layout.",
        "tryit": "Inventory the APIs in your TinyDB build. Label each ISO C, POSIX, Win32, or another target-specific contract, and identify its failure policy.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "Fixed-width types simplify an external protocol only when their availability and byte-size requirements are stated. Endianness still needs explicit encoding.",
        "explanation": "The byte codec extracts and assembles little-endian uint32_t values instead of writing native objects. Exact-width types are optional on some C implementations; this course’s supported targets provide uint32_t and eight-bit bytes. Schema and format compatibility also depend on string encoding, version rules, and validation, not only on integer width. State these requirements at the format boundary with compile-time checks. sizeof a struct includes padding, and sizeof(long), pointer width, alignment, and host byte order are not a portable file specification. Use fixed numeric magic bytes rather than assuming the execution character set defines an external encoding.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n_Static_assert(CHAR_BIT == 8, \"This file format uses octets\");\n\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\n\nint main(void) {\n  unsigned char bytes[4];\n  put32(bytes, UINT32_C(0x01020304));\n  printf(\"bytes=%u,%u,%u,%u value_ok=%d\\n\", (unsigned)bytes[0], (unsigned)bytes[1], (unsigned)bytes[2],\n         (unsigned)bytes[3], get32(bytes) == UINT32_C(0x01020304));\n  return 0;\n}\n",
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
        "intro": "Probe the facility you need with the selected compiler and libraries. A platform name or accepted language-mode flag does not establish that an API can be linked.",
        "explanation": "The build chooses CF_HAVE_MONOTONIC only after compiling and linking a clock_gettime/CLOCK_MONOTONIC probe. A conservative build defaults to zero and reports the service as unconfigured. Defining _POSIX_C_SOURCE before headers requests the POSIX declarations; it does not create an implementation. The check-portability runner exercises both the default path and the detected path. When monotonic timing is required, an unavailable result must remain unavailable: wall-clock time is not a semantics-preserving replacement.",
        "code": "#ifndef CF_HAVE_MONOTONIC\n#define CF_HAVE_MONOTONIC 0\n#endif\n#if CF_HAVE_MONOTONIC\n#define _POSIX_C_SOURCE 200809L\n#include <time.h>\n#endif\n#include <stdio.h>\n\nint main(void) {\n#if CF_HAVE_MONOTONIC\n    struct timespec now;\n    if (clock_gettime(CLOCK_MONOTONIC, &now) != 0) return 1;\n#endif\n    printf(\"monotonic_configured=%d\\n\", CF_HAVE_MONOTONIC);\n    return 0;\n}\n",
        "expected": "monotonic_configured=0",
        "walkthrough": "The normal example does not guess a platform capability. The portability runner records a compile/link result and passes the resulting macro explicitly when testing the other branch. A successful API probe still requires runtime errors to be handled.",
        "pitfall": "Compiler identity is not an API test. Cross-compilation may support compile/link probes while being unable to run the target binary, so separate configuration evidence from target execution evidence.",
        "question": "If the monotonic-clock probe fails, what is an honest fallback?",
        "choices": [
          "Report that the required service is unavailable",
          "Silently return a wall-clock value and promise monotonicity"
        ],
        "answer": 0,
        "why": "A fallback may preserve a contract or explicitly report unsupported behavior; it must not silently change the meaning.",
        "tryit": "Run python3 tools/check_portability.py --compiler gcc and inspect the capability report. Compare the result with Windows MSVC in the Actions matrix.",
        "input": "",
        "runtime": "native"
      },
      "4": {
        "intro": "Separate portable data operations from the host that stores their bytes. A small interface makes dependencies and unsupported guarantees visible.",
        "explanation": "The core below emits four specified bytes through a ByteSink interface. It knows nothing about FILE, paths, file descriptors, native handles, or durability. The ISO C adapter checks fwrite, while main checks flush, repositioning, the read, and close. A future POSIX or Win32 adapter can implement a stronger publication contract without leaking those APIs into the codec. Name the guarantee carefully: buffered stream acceptance is not a claim that a record survives power loss.",
        "code": "#include \"sink.h\"\n#include <stdio.h>\n\nint main(void) {\n    FILE *file = tmpfile();\n    if (!file) return 1;\n    ByteSink sink = {file_write, file};\n    int ok = emit_header(&sink) && fflush(file) == 0 && fseek(file, 0, SEEK_SET) == 0;\n    unsigned char bytes[4];\n    size_t n = ok ? fread(bytes, 1, sizeof bytes, file) : 0;\n    if (fclose(file) != 0) ok = 0;\n    if (!ok || n != sizeof bytes || bytes[0] != 0x54 || bytes[3] != 0x31) return 1;\n    printf(\"portable_bytes=%zu\\n\", n);\n    return 0;\n}\n",
        "expected": "portable_bytes=4",
        "walkthrough": "The same core can send bytes to another implementation of the callback. This fixture exercises a real temporary binary stream and confirms its contents without putting stdio in the core module.",
        "pitfall": "An adapter should report its actual capabilities. A function named durable_save implemented only with fflush would hide a portability and correctness defect.",
        "question": "Which component should decide how a file is replaced on a particular OS?",
        "choices": [
          "The platform adapter with a documented replacement contract",
          "The byte encoder by assuming rename has identical semantics everywhere"
        ],
        "answer": 0,
        "why": "Replacement semantics belong to the filesystem boundary; portable byte serialization can remain independent.",
        "tryit": "Add a rejecting ByteSink and verify that emit_header reports failure. Then sketch separate POSIX and Win32 publication adapters without claiming they offer identical crash guarantees.",
        "input": "",
        "runtime": "native",
        "files": {
          "main.c": "#include \"sink.h\"\n#include <stdio.h>\n\nint main(void) {\n    FILE *file = tmpfile();\n    if (!file) return 1;\n    ByteSink sink = {file_write, file};\n    int ok = emit_header(&sink) && fflush(file) == 0 && fseek(file, 0, SEEK_SET) == 0;\n    unsigned char bytes[4];\n    size_t n = ok ? fread(bytes, 1, sizeof bytes, file) : 0;\n    if (fclose(file) != 0) ok = 0;\n    if (!ok || n != sizeof bytes || bytes[0] != 0x54 || bytes[3] != 0x31) return 1;\n    printf(\"portable_bytes=%zu\\n\", n);\n    return 0;\n}\n",
          "sink.h": "#ifndef CF_SINK_H\n#define CF_SINK_H\n#include <stdbool.h>\n#include <stddef.h>\ntypedef struct { bool (*write)(void *, const unsigned char *, size_t); void *context; } ByteSink;\nbool emit_header(const ByteSink *sink);\nbool file_write(void *context, const unsigned char *bytes, size_t size);\n#endif\n",
          "core.c": "#include \"sink.h\"\nbool emit_header(const ByteSink *sink) {\n    static const unsigned char bytes[] = {0x54, 0x44, 0x42, 0x31};\n    return sink->write(sink->context, bytes, sizeof bytes);\n}\n",
          "host.c": "#include \"sink.h\"\n#include <stdio.h>\nbool file_write(void *context, const unsigned char *bytes, size_t size) {\n    FILE *file = context;\n    return fwrite(bytes, 1, size, file) == size;\n}\n"
        }
      },
      "5": {
        "intro": "Choose text mode for logical text and binary mode for specified bytes. Treat line-ending normalization as an explicit input policy.",
        "explanation": "Text streams may translate the host representation of a newline. A text-stream position is not necessarily a byte count, and the physical file need not have one byte for each character written. Use rb/wb for a byte-defined database format. When reading byte-defined text from binary input, a parser can explicitly accept LF and CRLF as terminators. The helper accepts a complete bounded record, strips one trailing LF and its preceding CR, and leaves a lone trailing CR unchanged; deciding whether that lone CR is allowed belongs to the input grammar.",
        "code": "#include <stdio.h>\n#include <string.h>\n\nsize_t strip_line_ending(char *text, size_t n) {\n    if (n && text[n-1] == '\\n') {\n        --n;\n        if (n && text[n-1] == '\\r') --n;\n    }\n    text[n] = 0;\n    return n;\n}\nint main(void) {\n    char lf[] = \"Ada\\n\", crlf[] = \"Ada\\r\\n\", lone[] = \"Ada\\r\";\n    size_t a = strip_line_ending(lf, strlen(lf));\n    size_t b = strip_line_ending(crlf, strlen(crlf));\n    size_t d = strip_line_ending(lone, strlen(lone));\n    printf(\"lf=%zu crlf=%zu equal=%d lone_cr=%zu\\n\", a, b, strcmp(lf, crlf) == 0, d);\n    return 0;\n}\n",
        "expected": "lf=3 crlf=3 equal=1 lone_cr=4",
        "walkthrough": "Both supported terminators produce the same three-character record. The lone CR remains part of a four-byte payload. The caller owns an array with space for text[n]; this helper does not establish that fgets supplied an entire untruncated record.",
        "pitfall": "Never strip all trailing whitespace from a field unless the grammar permits losing those characters. A buffer ending without LF may be the final complete record or only a prefix of a long line.",
        "question": "Which mode preserves a byte-defined database file on Windows as well as Unix?",
        "choices": [
          "Binary mode, such as rb and wb",
          "Text mode because a newline always occupies one byte"
        ],
        "answer": 0,
        "why": "Binary mode avoids text-stream translations; the format still needs explicit widths, encoding, and validation.",
        "tryit": "Add empty, CRLF-only, final-record-without-newline, and truncated-buffer cases. State separately how your parser rejects an incomplete record.",
        "input": "",
        "runtime": "native"
      },
      "6": {
        "intro": "A path is interpreted by a host, not by the C language alone. Define filename policy and let callers supply locations instead of baking in Linux conventions.",
        "explanation": "Absolute path syntax, separators, case sensitivity, Unicode path APIs, reserved names, symlinks, and path length limits vary by filesystem and host configuration. Even Windows and macOS have configurable case behavior. strcmp comparing two names does not establish that the filesystem treats them as different files. The example constructs a bounded relative path for a documented Unix-like adapter and checks snprintf truncation; another adapter can use its host rules. The audit project uses an even narrower common ASCII basename policy, including Windows device-name exclusions, to make its supported set testable.",
        "code": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    char path[32];\n    int n = snprintf(path, sizeof path, \"%s/%s\", \"data\", \"people.tdb\");\n    if (n < 0 || (size_t)n >= sizeof path) return 1;\n    char short_path[4];\n    int rejected = strlen(path) >= sizeof short_path;\n    if (!rejected) {\n        int short_n = snprintf(short_path, sizeof short_path, \"%s\", path);\n        rejected = short_n < 0 || (size_t)short_n >= sizeof short_path;\n    }\n    printf(\"path=%s truncated_rejected=%d names_differ=%d\\n\", path, rejected, strcmp(\"Data.tdb\", \"data.tdb\") != 0);\n    return 0;\n}\n",
        "expected": "path=data/people.tdb truncated_rejected=1 names_differ=1",
        "walkthrough": "The short destination cannot hold the constructed path and is rejected. The final comparison concerns C strings only; the program does not claim that two differently cased names identify distinct files.",
        "pitfall": "FILENAME_MAX is not a universal promise that every possible path fits. Never treat a lexical basename whitelist as a sandbox against a hostile directory, symlinks, or concurrent filesystem changes.",
        "question": "Does strcmp(\"Data.tdb\", \"data.tdb\") != 0 prove two distinct files exist?",
        "choices": [
          "Yes, C string comparison defines filesystem identity",
          "No, filesystem case and identity rules are a separate contract"
        ],
        "answer": 1,
        "why": "Names can compare differently while referring to the same object on a case-insensitive filesystem.",
        "tryit": "Run the audit project’s filename-policy tests for CON.txt, COM1.tdb, traversal, trailing dots, and a valid basename; document which otherwise valid OS names the project intentionally excludes.",
        "input": "",
        "runtime": "native"
      },
      "7": {
        "intro": "Distinguish bytes, encoded characters, and locale-dependent classification. Make the external text encoding part of the format.",
        "explanation": "A char may be signed, and passing a negative value other than EOF to isalpha, isspace, or toupper has undefined behavior. Convert a byte through unsigned char before classification. The C locale is available on hosted implementations, while installed locale names differ by host; a named UTF-8 locale is not universally present. This example sets the C locale and counts ASCII letters in a known UTF-8 byte sequence. Applying byte-wise ctype does not decode a multibyte character, perform Unicode case folding, or count user-perceived characters. UTF-8 validation and a byte-length limit are separate policies in the audit codec.",
        "code": "#include <ctype.h>\n#include <locale.h>\n#include <stdio.h>\n\nint main(void) {\n    if (!setlocale(LC_CTYPE, \"C\")) return 1;\n    const unsigned char text[] = {0x43, 0x68, 0x6c, 0x6f, 0xc3, 0xa9};\n    size_t letters = 0;\n    for (size_t i = 0; i < sizeof text; ++i)\n        if (isalpha((unsigned char)text[i])) ++letters;\n    printf(\"utf8_bytes=%zu ascii_letters=%zu\\n\", sizeof text, letters);\n    return 0;\n}\n",
        "expected": "utf8_bytes=6 ascii_letters=4",
        "walkthrough": "Chloé occupies six UTF-8 bytes. In the C locale the four ASCII letters are classified as alphabetic; the two encoding bytes for é are not a decoded character for this byte-wise operation. The supported hosts use ASCII-compatible execution character sets.",
        "pitfall": "Strlen counts bytes before a zero terminator, not Unicode characters. Setting a process-global locale also affects other library calls and needs coordination in threaded programs.",
        "question": "What does casting to unsigned char before isalpha accomplish?",
        "choices": [
          "It makes any byte a valid classification argument",
          "It turns each UTF-8 byte into a complete Unicode character"
        ],
        "answer": 0,
        "why": "The cast satisfies the ctype argument requirement. It does not implement Unicode decoding.",
        "tryit": "Compare the byte length of an ASCII name and a multibyte name, and test invalid UTF-8 rejection separately from name length and locale classification.",
        "input": "",
        "runtime": "native"
      },
      "8": {
        "intro": "Parse a bounded decimal field with a stated grammar, range checks, and full consumption. Do not use a conversion’s numeric result as its success indicator.",
        "explanation": "strtoumax accepts optional signs and leading whitespace; this protocol does not. Validate every input character as a decimal digit, copy only a bounded field into a terminated temporary buffer, clear errno, convert in base ten, reject ERANGE, check the end pointer, and check the uint32_t limit before narrowing. The output parameter changes only after every check. This accepts exactly decimal digits with leading zeros permitted. It does not infer whether a surrounding line was truncated: the framing layer must establish the complete field first.",
        "code": "#include <errno.h>\n#include <inttypes.h>\n#include <stdbool.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nbool parse_id(const char *text, size_t n, uint32_t *out) {\n    if (!n || n > 32) return false;\n    for (size_t i = 0; i < n; ++i) if (text[i] < '0' || text[i] > '9') return false;\n    char buffer[33]; memcpy(buffer, text, n); buffer[n] = 0;\n    errno = 0; char *end;\n    uintmax_t value = strtoumax(buffer, &end, 10);\n    if (errno == ERANGE || end != buffer + n || value > UINT32_MAX) return false;\n    *out = (uint32_t)value; return true;\n}\nint main(void) {\n    uint32_t value = 7;\n    int maximum = parse_id(\"4294967295\", 10, &value);\n    printf(\"maximum=%d value=%\" PRIu32 \"\\n\", maximum, value);\n    value = 7;\n    int rejected = !parse_id(\"4294967296\", 10, &value);\n    printf(\"overflow_rejected=%d retained=%\" PRIu32 \" sign_rejected=%d\\n\", rejected, value, !parse_id(\"-1\", 2, &value));\n    return 0;\n}\n",
        "expected": "maximum=1 value=4294967295\noverflow_rejected=1 retained=7 sign_rejected=1",
        "walkthrough": "The largest uint32_t is accepted without assuming the width of unsigned long. The next integer is rejected before conversion to uint32_t, and both range and sign rejection preserve the previous output value.",
        "pitfall": "Atoi cannot distinguish a valid zero from a conversion failure and does not provide a safe overflow policy. Checking errno without checking consumption and the destination range is also incomplete.",
        "question": "Why check value against UINT32_MAX after strtoumax succeeds?",
        "choices": [
          "The conversion type may have a wider range than the destination",
          "Successful conversion automatically validates every narrower type"
        ],
        "answer": 0,
        "why": "Conversion success establishes a uintmax_t value, not that it fits the database field.",
        "tryit": "Add zero, empty input, plus/minus signs, whitespace, a suffix, embedded zero bytes, leading zeros, and an extremely long number; verify output preservation for every rejection.",
        "input": "",
        "runtime": "native"
      },
      "9": {
        "intro": "Distinguish EOF from an I/O error, and treat a text-stream position as a saved cookie rather than an arithmetic byte offset.",
        "explanation": "Keep fgetc’s result in int so it can represent every unsigned-char value and EOF. After the read loop stops, use ferror to distinguish an error from clean end-of-file. For text streams, use fgetpos/fsetpos to revisit a saved position; do not assume that subtracting ftell values counts physical bytes. C also restricts which fseek offsets are meaningful on text streams. Switching an update stream between writing and reading requires the relevant flush or positioning operation. The example uses tmpfile’s binary update stream but demonstrates opaque position saving that also avoids assumptions about fpos_t’s representation.",
        "code": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    FILE *file = tmpfile();\n    if (!file) return 1;\n    int ok = fputs(\"Ada\\nGrace\\n\", file) >= 0 && fflush(file) == 0 && fseek(file, 0, SEEK_SET) == 0;\n    char first[16], second[16], again[16]; fpos_t position;\n    if (ok) ok = fgets(first, sizeof first, file) != NULL && fgetpos(file, &position) == 0 && fgets(second, sizeof second, file) != NULL;\n    if (ok) ok = fsetpos(file, &position) == 0 && fgets(again, sizeof again, file) != NULL;\n    int ch; if (ok) while ((ch = fgetc(file)) != EOF) { }\n    if (ok) ok = !ferror(file);\n    if (fclose(file) != 0) ok = 0;\n    if (!ok) return 1;\n    printf(\"revisited=%d clean_eof=1\\n\", strcmp(second, again) == 0);\n    return 0;\n}\n",
        "expected": "revisited=1 clean_eof=1",
        "walkthrough": "The saved position is restored without interpreting fpos_t as an integer. The read loop checks errors before closing. This verifies a completed stream operation; it does not establish a large-file offset range or persistence guarantee.",
        "pitfall": "Feof predicts nothing about the next read: it is set only after a read reaches EOF. Also, ISO C fseek uses long; very large database files may need a wider, platform-specific seek adapter.",
        "question": "What is the portable way to reuse a text-stream position?",
        "choices": [
          "Save and restore it with fgetpos/fsetpos",
          "Subtract arbitrary text-mode offsets and treat the result as byte length"
        ],
        "answer": 0,
        "why": "The position representation can carry implementation-specific stream state and need not be an arithmetic byte offset.",
        "tryit": "Add a final line without a newline, test a failed open, and audit the code paths that check read, write, flush, reposition, and close errors.",
        "input": "",
        "runtime": "native"
      }
    },
    "practicePlan": {
      "goal": "Build portable file and text interfaces, then test their contracts across operating systems.",
      "tasks": [
        "Define filename, text-encoding, line-framing, and error contracts before adding host adapters.",
        "Add rejecting and short-write sinks without changing the portable codec.",
        "Compile and link actual capability probes, and test both configured and conservative paths.",
        "Run the shared fixtures on Linux GCC/Clang, macOS Clang, and Windows MSVC."
      ],
      "checks": [
        "Reject truncation, malformed numeric fields, unsupported capabilities, and invalid encodings without changing live output.",
        "Explain the difference between C string equality and filesystem identity, and between flushing and durable publication.",
        "Use python3 tools/check_portability.py --compiler gcc to run the native cross-platform acceptance suite."
      ],
      "example": "portable-c-9"
    }
  },
  "hardening-tinydb": {
    "intro": "Turn a portability claim into a contract and testable evidence. Audit the real TinyDB CLI, then build a small codec-and-file slice whose database bytes can be exchanged across supported hosts.",
    "outcomes": [
      "Record language, integer, encoding, filename, file-mode, and resource assumptions.",
      "Keep portable encode/decode logic independent of filesystem operations.",
      "Verify exact bytes and rejection preservation using independent fixtures.",
      "Build the same audited target with GCC, Clang, and MSVC across Linux, macOS, and Windows.",
      "Distinguish file compatibility from atomic replacement, crash durability, locking, and concurrent-writer support."
    ],
    "topics": {
      "1": {
        "intro": "An assumption audit checks where input sizes, arithmetic ranges, alignment, and lifetimes cross API boundaries.",
        "explanation": "For an array allocation, validate count≤SIZE_MAX/element_size before multiplication. Also define a zero-element policy and who owns the result. The fixture rejects an impossible int-array size without attempting memory exhaustion. Similar checks belong in page offsets, slot lengths, result buffers, and log record counts. Include sizeof(long), size_t and printf formats, char signedness, execution character set, eight-bit-byte requirements, optional exact-width types, and alignment in the audit. Record each as guaranteed by C17, required of supported targets, validated at an input boundary, or delegated to a host adapter. A compiler accepting the source does not discharge the remaining assumptions.",
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
        "explanation": "The fixture writes a header with an unsupported version and confirms rejection. A compatibility suite should include known valid older fixtures, unsupported future versions, reserved-bit violations, and size mismatches. A migration must preserve a verified old file until the new file is safely published under the target platform’s rules. The audit target also requires canonical zero padding and valid UTF-8 names. Its eight-row limit is explicit; the CLI supports 128, so files outside the shared subset are rejected rather than silently truncated. Exact fixture bytes catch a shared encoder/decoder mistake that a round trip alone misses.",
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
        "explanation": "The example exercises a bounded decoded record with explicit byte assembly and a typed output. Run it with CC=gcc and CC=clang, both with strict warnings. Agreement is useful evidence, not proof of freedom from undefined behavior: both compilers can compile the same invalid source without a diagnostic when the language does not require one. The new portability workflow uses Linux GCC and Clang, macOS Clang, and Windows MSVC in C17 mode. Each host consumes and produces the same known database bytes, and a second job on every host reads artifacts from all producers. This checks the audited slice, not every POSIX, threaded, or Linux-specific example in the course.",
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
        "tryit": "Run python3 tools/check_portability.py --compiler gcc, inspect all four Actions matrix entries, and distinguish compiler diagnostics from operating-system coverage.",
        "input": "",
        "runtime": "native"
      },
      "4": {
        "intro": "Sanitizers observe executed behavior and catch selected invalid operations. Combine them with strict builds, input validation, and independent expectations.",
        "explanation": "The fixture passes a deliberately short record to the decoder and verifies that it is rejected before bytes are accessed or output is assigned. Run with SANITIZE=1 to add AddressSanitizer and UndefinedBehaviorSanitizer in native builds. ThreadSanitizer is a separate tool for shared-memory concurrency and may depend on runtime/kernel support. A clean sanitizer run does not prove encoding compatibility, correct row identity, filesystem case behavior, or safe replacement of an existing file. Keep exact-byte, invalid-input, and failure-preservation assertions in the portability suite. The audit adapter deliberately creates new files exclusively; it does not claim portable atomic replacement.",
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
      },
      "5": {
        "intro": "Finish with a concrete audit: publish the supported assumptions, compile a portable codec and file adapter separately, and verify database files produced by other hosts.",
        "explanation": "The native/portability target implements a bounded TDB1 codec with no FILE, path, locale, or operating-system calls in its core. Its separate ISO C adapter uses binary streams and exclusive creation of a new, restricted ASCII basename. The format requires uint32_t, eight-bit bytes, and UTF-8 row names; the target also explicitly requires an ASCII-compatible execution character set. The suite validates a known fixture, every truncated prefix, malformed headers, duplicate IDs, invalid names, and unchanged outputs on codec rejection. Each OS reads the same binary fixture and exports artifacts that all other matrix hosts must validate and copy byte-for-byte.",
        "code": "#include \"portable.h\"\n#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    PortTable table; memset(&table, 0, sizeof table);\n    table.count = 2; table.rows[0].id = 1; table.rows[0].score = 90;\n    table.rows[1].id = 2; table.rows[1].score = 80;\n    strcpy(table.rows[0].name, \"Ada\"); strcpy(table.rows[1].name, \"Grace\");\n    unsigned char bytes[PORT_BYTES]; size_t size = 0;\n    if (!port_encode(&table, bytes, sizeof bytes, &size) || !port_write_new(\"audit-output.tdb\", bytes, size)) return 1;\n    printf(\"rows=%zu bytes=%zu\\n\", table.count, size);\n    return 0;\n}\n",
        "expected": "rows=2 bytes=88",
        "walkthrough": "The worked example exports the two-row Ada/Grace fixture into a new file. Run make check-portability for the independent oracle and API checks, including control-valued bytes that would reveal text-mode translation. The complete audit guide lists concrete gaps in the larger CLI: rename replacement differs between POSIX and Windows, narrow fopen is not a universal Unicode path API, and neither fflush nor a successful rename alone is a cross-platform crash-durability contract.",
        "pitfall": "This is an audited portability slice, not a claim that all course components or the complete database run unchanged on every host. The C17 exclusive-create adapter refuses existing destinations; it never implements replacement by deleting the old file first.",
        "question": "Which result establishes the strongest file-compatibility evidence here?",
        "choices": [
          "Only a same-process encode/decode round trip",
          "Every tested host validates and copies files from all producers against an independent byte fixture"
        ],
        "answer": 1,
        "why": "Independent fixtures catch shared codec mistakes, and cross-host artifact exchange exercises differences that a same-host round trip cannot reveal.",
        "tryit": "Run the audit, extend its assumptions table, and design a separately tested replacement interface for your target OS. Add failure injection before claiming stronger publication guarantees.",
        "input": "",
        "runtime": "native",
        "files": {
          "main.c": "#include \"portable.h\"\n#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    PortTable table; memset(&table, 0, sizeof table);\n    table.count = 2; table.rows[0].id = 1; table.rows[0].score = 90;\n    table.rows[1].id = 2; table.rows[1].score = 80;\n    strcpy(table.rows[0].name, \"Ada\"); strcpy(table.rows[1].name, \"Grace\");\n    unsigned char bytes[PORT_BYTES]; size_t size = 0;\n    if (!port_encode(&table, bytes, sizeof bytes, &size) || !port_write_new(\"audit-output.tdb\", bytes, size)) return 1;\n    printf(\"rows=%zu bytes=%zu\\n\", table.count, size);\n    return 0;\n}\n",
          "portable.h": "#ifndef CF_PORTABLE_H\n#define CF_PORTABLE_H\n#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#if !defined(UINT32_MAX) || CHAR_BIT != 8\n#error \"TDB1 requires uint32_t and eight-bit bytes\"\n#endif\n\n_Static_assert('A' == 0x41 && 'a' == 0x61 && '0' == 0x30, \"This target requires ASCII-compatible execution characters\");\n\nenum { PORT_CAPACITY = 8, PORT_BYTES = 8 + PORT_CAPACITY * 40 };\ntypedef struct { uint32_t id; char name[32]; uint32_t score; } PortRow;\ntypedef struct { PortRow rows[PORT_CAPACITY]; size_t count; } PortTable;\n/* Decode commits only on success. Encode preserves output and length on failure.\n * Pointers designate live, suitably sized, nonoverlapping objects. */\nbool port_decode(const unsigned char *bytes, size_t size, PortTable *out);\nbool port_encode(const PortTable *table, unsigned char *bytes, size_t capacity, size_t *size);\n/* Host boundary: restricted ASCII basename, binary streams, exclusive new file.\n * No overwrite, replacement, locking, fsync, or crash-durability promise. */\nbool port_name(const char *name);\nbool port_read(const char *name, unsigned char *bytes, size_t capacity, size_t *size);\nbool port_write_new(const char *name, const unsigned char *bytes, size_t size);\n#endif\n",
          "codec.c": "/* Portable core: no filesystem, process, locale, or native-layout dependency. */\n#include \"portable.h\"\n#include <string.h>\n\nstatic uint32_t get32(const unsigned char *bytes) {\n    uint32_t value = 0;\n    for (unsigned i = 0; i < 4; ++i) value |= (uint32_t)bytes[i] << (8 * i);\n    return value;\n}\nstatic void put32(unsigned char *bytes, uint32_t value) {\n    for (unsigned i = 0; i < 4; ++i) bytes[i] = (unsigned char)(value >> (8 * i));\n}\nstatic bool name_ok(const char name[32]) {\n    const unsigned char *p = (const unsigned char *)name;\n    const char *end = memchr(name, 0, 32);\n    if (!end || end == name) return false;\n    size_t n = (size_t)(end - name);\n    for (size_t i = n; i < 32; ++i) if (p[i] != 0) return false;\n    for (size_t i = 0; i < n;) {\n        unsigned char ch = p[i];\n        if (ch < 32 || ch == 127) return false;\n        if (ch < 128) { ++i; continue; }\n        size_t width = ch >= 0xc2 && ch <= 0xdf ? 2 : ch >= 0xe0 && ch <= 0xef ? 3 : ch >= 0xf0 && ch <= 0xf4 ? 4 : 0;\n        if (!width || width > n - i) return false;\n        for (size_t j = 1; j < width; ++j) if ((p[i+j] & 0xc0) != 0x80) return false;\n        if ((ch == 0xe0 && p[i+1] < 0xa0) || (ch == 0xed && p[i+1] >= 0xa0) ||\n            (ch == 0xf0 && p[i+1] < 0x90) || (ch == 0xf4 && p[i+1] >= 0x90)) return false;\n        i += width;\n    }\n    return true;\n}\nstatic bool table_ok(const PortTable *table) {\n    if (table->count > PORT_CAPACITY) return false;\n    for (size_t i = 0; i < table->count; ++i) {\n        if (!table->rows[i].id || !name_ok(table->rows[i].name)) return false;\n        for (size_t j = 0; j < i; ++j) if (table->rows[j].id == table->rows[i].id) return false;\n    }\n    return true;\n}\nbool port_encode(const PortTable *table, unsigned char *bytes, size_t capacity, size_t *size) {\n    if (!table_ok(table)) return false;\n    size_t n = 8 + table->count * 40;\n    if (capacity < n) return false;\n    unsigned char next[PORT_BYTES] = {0x54, 0x44, 0x42, 0x31, 1, 40, 0, 0};\n    next[6] = (unsigned char)table->count;\n    for (size_t i = 0; i < table->count; ++i) {\n        unsigned char *row = next + 8 + i * 40;\n        put32(row, table->rows[i].id);\n        memcpy(row + 4, table->rows[i].name, 32);\n        put32(row + 36, table->rows[i].score);\n    }\n    memcpy(bytes, next, n); *size = n;\n    return true;\n}\nbool port_decode(const unsigned char *bytes, size_t size, PortTable *out) {\n    static const unsigned char magic[] = {0x54, 0x44, 0x42, 0x31};\n    if (size < 8 || memcmp(bytes, magic, 4) != 0 || bytes[4] != 1 || bytes[5] != 40 ||\n        bytes[6] > PORT_CAPACITY || bytes[7] != 0 || size != 8 + (size_t)bytes[6] * 40) return false;\n    PortTable next; memset(&next, 0, sizeof next); next.count = bytes[6];\n    for (size_t i = 0; i < next.count; ++i) {\n        const unsigned char *row = bytes + 8 + i * 40;\n        next.rows[i].id = get32(row);\n        memcpy(next.rows[i].name, row + 4, 32);\n        next.rows[i].score = get32(row + 36);\n    }\n    if (!table_ok(&next)) return false;\n    *out = next; return true;\n}\n",
          "files.c": "/* ISO C file adapter. The restricted filename policy is deliberately narrower\n * than any supported OS. Relative ASCII basenames avoid a claim of Unicode\n * path portability through narrow fopen APIs. */\n#include \"portable.h\"\n#include <stdio.h>\n#include <string.h>\n\nbool port_name(const char *name) {\n    size_t n = strlen(name);\n    if (!n || n > 64 || name[0] == '.' || name[n-1] == '.') return false;\n    char stem[65]; size_t used = 0;\n    for (size_t i = 0; i < n; ++i) {\n        unsigned char c = (unsigned char)name[i];\n        if (!((c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a) ||\n              (c >= 0x30 && c <= 0x39) || c == 0x2d || c == 0x2e || c == 0x5f)) return false;\n        if (used == i && c != 0x2e) stem[used++] = (char)(c >= 0x61 && c <= 0x7a ? c - 32 : c);\n    }\n    stem[used] = 0;\n    if (strcmp(stem, \"CON\") == 0 || strcmp(stem, \"PRN\") == 0 || strcmp(stem, \"AUX\") == 0 || strcmp(stem, \"NUL\") == 0) return false;\n    if (used == 4 && (memcmp(stem, \"COM\", 3) == 0 || memcmp(stem, \"LPT\", 3) == 0) && stem[3] >= '1' && stem[3] <= '9') return false;\n    return true;\n}\nbool port_read(const char *name, unsigned char *bytes, size_t capacity, size_t *size) {\n    if (!port_name(name)) return false;\n    FILE *file = fopen(name, \"rb\");\n    if (!file) return false;\n    size_t n = fread(bytes, 1, capacity, file);\n    bool ok = !ferror(file) && fgetc(file) == EOF && !ferror(file);\n    if (fclose(file) != 0) ok = false;\n    if (ok) *size = n;\n    return ok;\n}\nbool port_write_new(const char *name, const unsigned char *bytes, size_t size) {\n    if (!port_name(name)) return false;\n    FILE *file = fopen(name, \"wbx\");\n    if (!file) return false;\n    bool ok = fwrite(bytes, 1, size, file) == size;\n    if (fflush(file) != 0) ok = false;\n    if (fclose(file) != 0) ok = false;\n    if (!ok) (void)remove(name);\n    return ok;\n}\n"
        },
        "artifact": {
          "href": "assets/tinydb-sample.tdb",
          "label": "Download the shared two-row TDB1 fixture"
        }
      }
    },
    "practicePlan": {
      "goal": "Audit TinyDB assumptions, separate its codec from file access, and exchange validated database files across Linux, macOS, and Windows.",
      "tasks": [
        "Complete the assumptions and platform-dependency table in native/portability/README.md for your assembled database.",
        "Keep the codec and parsers independent of FILE, paths, processes, signals, and locks.",
        "Run the same fixture suite across Linux, macOS, and Windows, and inspect the exchanged artifacts.",
        "Design and test host-specific replacement/durability adapters before integrating them into the full CLI."
      ],
      "checks": [
        "Use make check-portability locally or python tools/check_portability.py --compiler cl from an MSVC developer terminal.",
        "Verify exact binary bytes, every truncated prefix, duplicate IDs, invalid UTF-8, rejection preservation, and existing-destination refusal.",
        "Distinguish tested targets and the audited eight-row subset from unsupported formats, Unicode path handling, power-loss durability, and concurrent access."
      ],
      "example": "hardening-tinydb-5",
      "command": "make check-portability",
      "workspace": "native/portability"
    }
  }
};
