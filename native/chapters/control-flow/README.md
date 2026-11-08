# Chapter 3: Decisions and repetition

Part 1: Learn the language. Teaching baseline: C17.

Turn a sequence of statements into decisions and repetitions. Finish with a bounded-input guessing game that can reject a bad guess and terminate deliberately.

## Outcomes

- Trace branch conditions and short-circuit guards.
- Explain loop initialization, condition, update, break, and continue.
- Handle successful conversion, invalid input, and EOF in the supplied scaffold.

## 3.1 if, else, and switch

A decision chooses which statements run. In a condition, zero is false and a nonzero scalar value is true. A comparison usually expresses that decision more clearly than relying on an unexplained number.

`if` executes a statement or block when its condition is true. An else branch handles the alternative. Use braces even for short branches while learning: they keep later edits unambiguous. `switch` selects among integer-valued cases. A break exits the switch; without it, execution may continue into the following case. Use default for the unmatched case when that is meaningful.

### main.c

```c
#include <stdio.h>

int main(void) {
    int score = 72;
    if (score >= 50) {
        puts("pass");
    } else {
        puts("retry");
    }
    int command = 2;
    switch (command) {
        case 1: puts("start"); break;
        case 2: puts("stop"); break;
        default: puts("unknown"); break;
    }
    return 0;
}
```

Output:

```text
pass
stop
```

The comparison 72 >= 50 is true, so only the pass branch runs. The switch then selects case 2 and prints stop. Its break leaves the switch. A switch is not a loop: the cases describe alternatives within that one selection, not repeated iterations.

**Watch for:** A single = assigns rather than compares. In addition, forgetting break can create unintended fallthrough. Both mistakes may compile; understanding the control flow is still necessary.

**Check:** Which branch runs when score is exactly 50?

1. pass
2. retry

<details><summary>Answer</summary>

pass. The >= comparison includes equality. Boundary values belong in your tests.

</details>

**Try:** Change score to 49 and command to an unmatched value. Predict both output lines.

Run from the repository root:

```sh
make example EXAMPLE=control-flow-1
```

## 3.2 Logical expressions and short-circuit evaluation

Logical operators combine conditions. Use && for both conditions, || for either condition, and ! to invert a truth value. Write the comparisons explicitly so the code reads like the rule.

C evaluates the left operand of && first and evaluates the right operand only if the left is true. For ||, the right operand is evaluated only if the left is false. This short-circuit behavior can protect a later operation: check that a divisor is nonzero before dividing. To test whether x is between two limits, write `x > 0 && x < 10`; the mathematical-looking `0 < x < 10` does not mean the same thing in C.

### main.c

```c
#include <stdio.h>

int main(void) {
    int divisor = 0;
    int numerator = 10;
    if (divisor != 0 && numerator / divisor > 2) {
        puts("large quotient");
    } else {
        puts("not evaluated or too small");
    }
    return 0;
}
```

Output:

```text
not evaluated or too small
```

The first comparison is false, so the division is not evaluated. The program therefore avoids dividing by zero. Reversing the operands would remove that protection. The order here is a language guarantee of &&, unlike the general evaluation-order questions raised by ordinary arithmetic expressions.

**Watch for:** The bitwise operators & and | do not provide the same short-circuit rule. They have useful roles in bit manipulation, but should not replace && and || in these guards.

**Check:** Does the division run when divisor is zero in this example?

1. Yes
2. No

<details><summary>Answer</summary>

No. The false left operand of && skips its right operand.

</details>

**Try:** Try divisor = 2 and then divisor = 5. Explain why one reaches the true branch and the other does not.

Run from the repository root:

```sh
make example EXAMPLE=control-flow-2
```

## 3.3 while, do, and for

A loop repeats work while a condition permits it. Identify the initial state, continuation condition, update, and body before reasoning about its output.

A for loop gathers initialization, condition, and update in one place. Its condition is tested before each iteration. A while loop also tests before its body, while do–while tests afterward and therefore runs the body at least once. Track a small example by hand: record the loop variable before the body, the output, and its next value. Make sure the loop can progress toward termination.

### main.c

```c
#include <stdio.h>

int main(void) {
    for (int i = 0; i < 3; i++) {
        printf("%d\n", i);
    }
    int remaining = 2;
    while (remaining > 0) {
        remaining--;
    }
    printf("remaining=%d\n", remaining);
    return 0;
}
```

Output:

```text
0
1
2
remaining=0
```

The for body sees i equal to 0, 1, and 2. After the update makes it 3, the condition is false. The while loop subtracts one twice and stops at zero. Neither loop executes its body after its condition has become false. This is why < n and <= n often differ by one iteration.

**Watch for:** An empty body caused by a stray semicolon, or an update that never approaches the stopping condition, can create an unintended loop. Stop code is available if an experiment fails to terminate.

**Check:** How many times does the for body run?

1. 2
2. 3
3. 4

<details><summary>Answer</summary>

3. The values 0, 1, and 2 satisfy i < 3.

</details>

**Try:** Rewrite the countdown using for. Keep the output and final value the same.

Run from the repository root:

```sh
make example EXAMPLE=control-flow-3
```

## 3.4 break and continue

break and continue change the ordinary path through a loop. Use them when they make a termination or skip rule clearer; avoid using them to hide a complicated set of conditions.

break leaves the nearest enclosing loop or switch. continue skips the rest of the current loop iteration. In a for loop, continue proceeds to the update expression and then tests the condition again. In a while loop, it returns directly to the condition, so a necessary update below continue would be skipped. Trace these paths separately when debugging.

### main.c

```c
#include <stdio.h>

int main(void) {
    for (int i = 0; i < 7; i++) {
        if (i == 2) continue;
        if (i == 5) break;
        printf("%d\n", i);
    }
    return 0;
}
```

Output:

```text
0
1
3
4
```

At i = 2, continue skips printf but the for update still increments i. At i = 5, break exits before printing and before another iteration. The values 5 and 6 are never printed. A break inside a switch nested in a loop would leave that switch rather than automatically leaving the loop.

**Watch for:** Always ask which construct is nearest. Also, a continue can bypass cleanup or other work later in a loop body; resource handling becomes important when allocations and files are introduced.

**Check:** Which value causes this loop to finish early?

1. 2
2. 5
3. 7

<details><summary>Answer</summary>

5. 2 skips one iteration; 5 triggers break and ends the loop.

</details>

**Try:** Move the break condition to i == 4. Predict which final value disappears from the output.

Run from the repository root:

```sh
make example EXAMPLE=control-flow-4
```

## 3.5 Number guessing and input validation

A useful small project combines decisions, repetition, and a clear input contract. Our number-guessing game keeps a fixed target and tells the player whether a valid guess is too low, too high, or correct.

The Input panel supplies a sequence before execution. In this scaffold, `scanf("%d", &guess)` returns 1 when it stores one integer, 0 for a nonmatching token, and EOF when input ends before a conversion. The ampersand supplies the destination address; pointers are explained in Part 2. For this exercise, integer tokens are between −1000 and 1000. This bound matters: %d is not a safe parser for arbitrarily large numbers. Later text-input lessons explain how to handle buffers and prepare for checked parsing.

### main.c

```c
#include <stdio.h>

int main(void) {
    int guess;
    int result = scanf("%d", &guess);
    if (result != 1) {
        puts("invalid input");
    } else if (guess < 1 || guess > 10) {
        puts("out of range");
    } else if (guess == 7) {
        puts("correct");
    } else {
        puts("try again");
    }
    return 0;
}
```

Input: `7`

Output:

```text
correct
```

With the sample input 7, conversion succeeds, the range check permits the guess, and equality selects correct. This example handles one guess. The chapter exercise extends it to repeated guesses and handles end-of-input separately. Validate a converted value before using it in a calculation or array access.

**Watch for:** Do not assume reading input always succeeds. Inspect the conversion result before reading guess; otherwise you could read an uninitialized value. Real untrusted numeric input requires range-checked text parsing beyond this bounded exercise.

**Check:** If scanf returns 0, is it valid to use guess as though a number was read?

1. Yes
2. No

<details><summary>Answer</summary>

No. No assignment was made by that failed conversion. Handle the failure before using the destination.

</details>

**Try:** Open the guessing-game exercise and add the loop, range checks, and higher/lower responses.

Run from the repository root:

```sh
make example EXAMPLE=control-flow-5
```

## Chapter practice

Edit `native/exercises/guess.c`.

```sh
make exercise EXERCISE=guess
```

Chapter workspace command: `make chapter CHAPTER=control-flow`.

Generated from dist/part1.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/control-flow
