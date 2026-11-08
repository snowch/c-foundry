# Chapter 2: Values, types, and expressions

Part 1: Learn the language. Teaching baseline: C17.

Learn what your data can represent, how expressions are evaluated, and when conversions change the result. These rules are the foundation of reliable arithmetic in every later project.

## Outcomes

- Choose and initialize basic C17 types with matching printf formats.
- Predict integer division, precedence, and casts before executing.
- Distinguish defined unsigned wrap from undefined signed overflow.

## 2.1 Integers, floating-point numbers, characters, and Boolean values

A type determines the values an object can represent and the operations that make sense for it. Choose a type from the meaning and range of the data, rather than assuming every number should be an int.

`int` represents whole numbers, while `double` represents floating-point approximations. `char` is an integer type used for character-sized storage; a character literal such as `'A'` uses single quotes. In C17, include `<stdbool.h>` to use `bool`, `true`, and `false`. Integer widths and plain-char signedness are implementation choices within the standard’s requirements. Do not assume one compiler’s sizes describe all C platforms. The language also provides short, long, long long, and unsigned integer variants, and float and long double for other floating-point ranges or precision. This introduction uses double for fractional calculations. A float argument to printf is promoted to double; scanf follows different format rules, so do not transfer printf formats to input functions without checking their contracts.

### main.c

```c
#include <stdio.h>
#include <stdbool.h>

int main(void) {
    int count = 7;
    double distance = 2.5;
    char letter = 'A';
    bool ready = true;
    printf("%d %.1f %c %d\n", count, distance, letter, ready);
    return 0;
}
```

Output:

```text
7 2.5 A 1
```

The formats match the arguments: %d for int, %.1f for a double printed with one fractional digit, and %c for a character value. The bool value is promoted to int when passed to printf and prints as 1. Floating-point values generally cannot represent every decimal fraction exactly; formatting is a presentation choice, not a change to stored precision.

**Watch for:** The format string does not convert an incorrectly typed argument into the expected type. For example, passing a double to %d is not a safe shortcut.

**Check:** Which format is appropriate for printing a double with one decimal place?

1. %d
2. %.1f
3. %c

<details><summary>Answer</summary>

%.1f. The f conversion expects a double; .1 requests one digit after the decimal point.

</details>

**Try:** Change the values and predict the complete line before you run the example.

Run from the repository root:

```sh
make example EXAMPLE=values-1
```

## 2.2 Variables, initialization, and constants

A variable is a named object whose stored value may change. Initialization gives it a starting value at its declaration. A later assignment replaces the value it holds.

Declare and initialize small local variables near their first use. An uninitialized automatic int has an indeterminate value; do not read it before assigning a valid value. `const` expresses that an object should not be modified through that declaration. It helps document intent and lets the compiler reject accidental writes. In C, a const-qualified object is not automatically an integer constant expression in every context; that distinction matters later for array bounds and declarations.

### main.c

```c
#include <stdio.h>

int main(void) {
    const int unit_price = 7;
    int quantity = 3;
    int total = unit_price * quantity;
    quantity = 4;
    printf("%d %d\n", total, quantity);
    return 0;
}
```

Output:

```text
21 4
```

total is calculated when its initializer runs. It stores 21; it is not a formula that automatically tracks quantity. Assigning 4 to quantity changes that object only. The later printf therefore prints the old calculated total and the new quantity. To update total, evaluate the multiplication and assign again.

**Watch for:** Use = for assignment. It stores a value and is different from ==, which compares values. A statement such as total = quantity changes total, even if the names suggest a calculation.

**Check:** After quantity changes to 4, does total automatically become 28?

1. Yes
2. No

<details><summary>Answer</summary>

No. An initializer is evaluated once at that point in execution. C does not maintain spreadsheet-like dependencies.

</details>

**Try:** Recalculate total after changing quantity. Check that the first number now becomes 28.

Run from the repository root:

```sh
make example EXAMPLE=values-2
```

## 2.3 Operators and precedence

An expression combines values and operators to compute a result. Parentheses make grouping explicit; they are often clearer than expecting a reader to remember every precedence rule.

Multiplication, division, and remainder bind more tightly than addition and subtraction. When both operands of division are integers, the result is an integer truncated toward zero: 7 / 2 is 3. The remainder operator % works on integers; for these positive operands, 7 % 2 is 1. Division by zero is invalid. Evaluation order is a separate issue from precedence: grouping does not generally tell you the order in which unrelated function calls or side effects are evaluated.

### main.c

```c
#include <stdio.h>

int main(void) {
    printf("%d %d\n", 7 / 2, 7 % 2);
    printf("%d %d\n", 2 + 3 * 4, (2 + 3) * 4);
    return 0;
}
```

Output:

```text
3 1
14 20
```

The first line divides seven into two groups with one left over. On the second line, multiplication happens within the higher-precedence subexpression, yielding 14. Parentheses change the grouping to add first and yield 20. To obtain a fractional quotient, make a division operand floating point before division, as the next topic shows.

**Watch for:** Avoid expressions that modify and read the same object in unsequenced ways. Write separate, simple statements instead of clever chains of increments and assignments.

**Check:** What is the value of (2 + 3) * 4?

1. 14
2. 20
3. 24

<details><summary>Answer</summary>

20. Parentheses group the addition, producing 5 before the multiplication produces 20.

</details>

**Try:** Add expressions for 9 / 4 and 9 % 4. Explain each result rather than only matching the output.

Run from the repository root:

```sh
make example EXAMPLE=values-3
```

## 2.4 Conversions, casts, and integer promotions

C converts values when types differ, but the point at which a conversion happens matters. Converting a completed integer result cannot recover a fraction that integer division already discarded.

In a mixed expression involving double and an ordinary integer, the integer can be converted to double before arithmetic. A cast explicitly requests a conversion. Thus `(double)7 / 2` performs floating-point division, whereas `(double)(7 / 2)` first computes the integer quotient. Smaller integer types commonly undergo integer promotion in expressions. Signed/unsigned combinations have additional conversion rules, so avoid mixing them casually when testing ranges. Part 7’s numeric-boundary lessons revisit promotions and signed/unsigned comparisons with checked interfaces after functions and pointers have been introduced.

### main.c

```c
#include <stdio.h>

int main(void) {
    double fractional = (double)7 / 2;
    double truncated = 7 / 2;
    printf("%.1f %.1f\n", fractional, truncated);
    return 0;
}
```

Output:

```text
3.5 3.0
```

fractional receives 3.5 because conversion happens before division. truncated receives the double value 3.0 because the integer expression has already produced 3. Changing the receiving variable’s type does not change how the right-hand expression was evaluated. Cast at a specific, justified boundary rather than scattering casts to suppress warnings.

**Watch for:** A cast is not proof that a value fits. Converting a floating-point value outside the representable range of an integer type is not a valid way to clamp it. Validate the range before converting.

**Check:** Which expression preserves the fractional part of seven divided by two?

1. (double)(7 / 2)
2. (double)7 / 2

<details><summary>Answer</summary>

(double)7 / 2. The second expression converts an operand before division; the first converts an already truncated quotient.

</details>

**Try:** Rewrite fractional using 7.0 instead of a cast. Explain why the result is unchanged.

Run from the repository root:

```sh
make example EXAMPLE=values-4
```

## 2.5 Integer ranges, signed overflow, and unsigned arithmetic

C’s numeric types have finite ranges. Correct code distinguishes unsigned arithmetic, which wraps modulo its type’s range, from signed overflow, whose behavior is undefined.

Use `<limits.h>` for bounds such as INT_MAX, INT_MIN, and UINT_MAX. Do not assume int is exactly 32 bits merely because this browser target uses that size. A signed addition must be checked before it overflows, not afterward. Unsigned wrap is defined, but it can still be a bug in sizes or indexes. Floating-point types have separate limits and precision characteristics described by `<float.h>`. Part 7’s What C guarantees chapter extends this introduction with checked arithmetic, exceptional division and negation, rounding, NaN/infinity, and underflow.

### main.c

```c
#include <stdio.h>
#include <limits.h>

int main(void) {
    unsigned int value = 0;
    value -= 1;
    printf("%d\n", value == UINT_MAX);
    return 0;
}
```

Output:

```text
1
```

Subtracting one from unsigned zero wraps to UINT_MAX. The comparison is true, so printf prints 1. This is a defined unsigned operation. Replacing value with a signed int and deliberately overflowing its range would not be a comparable experiment: a particular output would provide no guarantee about that invalid program.

**Watch for:** Do not use an observed wraparound result from signed overflow as evidence of a language rule. Optimizers can assume undefined signed overflow does not occur. Later portability chapters revisit these guarantees in depth.

**Check:** Is overflowing a signed int guaranteed to wrap?

1. Yes, on every C implementation
2. No; signed overflow has undefined behavior

<details><summary>Answer</summary>

No; signed overflow has undefined behavior. Unsigned arithmetic has defined modular behavior. Ordinary signed overflow does not.

</details>

**Try:** Use the chapter’s numeric-expression exercise to practice type choice and conversion without invoking overflow.

Run from the repository root:

```sh
make example EXAMPLE=values-5
```

## Chapter practice

Edit `native/exercises/numbers.c`, then run:

```sh
make exercise EXERCISE=numbers
```

Chapter workspace command: `make chapter CHAPTER=values`.

Generated from dist/part1.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/values
