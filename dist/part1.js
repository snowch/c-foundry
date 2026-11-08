window.PART_ONE = {
  "first-program": {
    "intro": "Write, run, and diagnose a complete C program. You will learn which parts of the source are declarations, statements, and output, and what the browser runner does with them.",
    "outcomes": [
      "Trace source through compilation, linking, and execution.",
      "Write a valid main and format a short output message.",
      "Use diagnostics to fix a missing-semicolon error and export a file."
    ],
    "practice": "hello",
    "topics": {
      "1": {
        "intro": "A C source file is a description of a program. The computer cannot run that text directly: a compiler translates it, and a linker combines the translated code with the support it needs.",
        "explanation": "In this course the file is called <code>main.c</code>. Preprocessing handles directives such as <code>#include</code>. Compilation checks the language rules and produces object code; linking resolves references such as a call to <code>printf</code>. On a Linux system, the result is a native executable. In this page, Clang and the linker produce a WebAssembly module that the browser can execute. These stages explain why a successful edit is not yet a running program.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    printf(\"Hello, C!\\n\");\n    return 0;\n}\n",
        "expected": "Hello, C!",
        "walkthrough": "The header declares printf so the compiler can check its use. The call asks the runtime to write a line. The final return ends main successfully. The browser lab performs the compile, link, and run stages when you choose Run code; you do not need to install a compiler for Part 1.",
        "pitfall": "A compiler error prevents the new program from running. A runtime error happens after compilation and linking have succeeded. Treat these as different points in the process.",
        "question": "Which stage resolves a reference to a library function such as printf?",
        "choices": [
          "Editing",
          "Linking",
          "Running"
        ],
        "answer": 1,
        "why": "The linker connects translated code with the functions and support it references.",
        "tryit": "Change the greeting, run the program, and check that the console reflects the new text.",
        "input": ""
      },
      "2": {
        "intro": "Execution begins in main for the small hosted C programs in this course. Read the function body from its opening brace to its closing brace: statements normally execute in order.",
        "explanation": "<code>int main(void)</code> says that main returns an integer status and takes no arguments. The braces delimit its body. An expression statement such as a function call ends in a semicolon. A <code>//</code> comment continues to the end of its line; a <code>/* ... */</code> comment can span several lines. Comments help a reader understand intent but do not execute. Function definitions and return values get a fuller treatment in Chapter 4.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    // Print two messages, in order.\n    printf(\"First\\n\");\n    printf(\"Second\\n\");\n    return 0;\n}\n",
        "expected": "First\nSecond",
        "walkthrough": "The first printf completes before the second call is reached. Each string contains a newline, so the two calls produce two lines. Returning 0 tells the environment that the program completed successfully. It is a status, not a request to print the number zero.",
        "pitfall": "Braces group statements; semicolons terminate many statements. A missing semicolon can cause an error on the following line, where the compiler finally notices the problem.",
        "question": "Does return 0 print a zero in the console?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "Returning a status and writing output are separate operations.",
        "tryit": "Swap the two printf statements. Predict the new order before running.",
        "input": ""
      },
      "3": {
        "intro": "printf writes formatted text. The first argument is a format string: ordinary characters are printed, while conversion specifications describe how to print later arguments.",
        "explanation": "A string literal uses double quotes. Within it, <code>\\n</code> represents a newline, <code>\\t</code> a tab, <code>\\\\</code> a backslash, and <code>\\\"</code> a double quote. The specification <code>%d</code> expects an int; <code>%%</code> prints a literal percent sign and consumes no argument. The order and types of arguments must match the format. Chapter 2 introduces additional types and their formats.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    printf(\"Count: %d\\n\", 3);\n    printf(\"Progress: 100%%\\n\");\n    return 0;\n}\n",
        "expected": "Count: 3\nProgress: 100%",
        "walkthrough": "The first call substitutes 3 for %d and then starts a new line. The second prints a percent sign from %%. A newline is part of the output string; it does not come automatically from printf. Incorrect format/argument combinations can cause undefined behavior, so read format warnings carefully.",
        "pitfall": "Writing /n uses a forward slash and the letter n. It is not the newline escape. Also, avoid using user-provided text as the format string; print text through a suitable fixed format instead.",
        "question": "What does printf(\"%d%%\", 25) print?",
        "choices": [
          "25%",
          "25%%",
          "%d%"
        ],
        "answer": 0,
        "why": "The %d consumes 25; %% contributes one literal percent sign.",
        "tryit": "Print two labeled integer values on separate lines. Include a literal percent sign in one line.",
        "input": ""
      },
      "4": {
        "intro": "A diagnostic is evidence about where the compiler became unable to understand or accept your source. Read the first error, inspect its location, and make one small correction before compiling again.",
        "explanation": "Consider <code>printf(\"Hello\")</code> followed by <code>return 0;</code>. The call is missing its semicolon. The compiler may point at return because that is where it discovers the previous statement was not terminated. Warnings describe suspicious constructs that a compiler may still translate. Keep warnings visible: a successful build does not establish correct behavior. Linking failures, such as an undefined function reference, belong to a later stage.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    printf(\"Hello\\n\");\n    return 0;\n}\n",
        "expected": "Hello",
        "walkthrough": "This is the corrected program. Remove the semicolon after printf in the editor and run it to observe a real compiler diagnostic. Restore the semicolon and rerun. If several errors appear, start at the first; later messages can be consequences of the same initial mistake. Exact diagnostic wording depends on compiler version.",
        "pitfall": "Do not change a large number of lines to silence a list of errors. A small edit-and-recompile cycle makes it easier to connect a cause with its effect.",
        "question": "The compiler points at return, but the preceding printf has no semicolon. What should you inspect first?",
        "choices": [
          "The preceding statement",
          "The browser storage",
          "The output font"
        ],
        "answer": 0,
        "why": "The reported location is where parsing failed, which can follow the actual mistake.",
        "tryit": "Create the missing-semicolon error, read it, fix it, and explain why its location may be one line later.",
        "input": ""
      },
      "5": {
        "intro": "The browser lab is a C environment with a limited operating-system interface. It is useful to know what belongs to the C language, what belongs to the runtime, and what the page itself provides.",
        "explanation": "The editor contains source. Run code compiles and executes it in a worker so the page remains responsive. Console shows program output and diagnostics. Input supplies text before execution; it is not an interactive terminal that waits for you to type midway through the run. Later exercises will read it. Check output compares observable results with practice cases. It does not prove that an algorithm is appropriate or memory is managed correctly.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    printf(\"This program runs in the browser.\\n\");\n    return 0;\n}\n",
        "expected": "This program runs in the browser.",
        "walkthrough": "This program needs only standard output. A Wasm module is generated and executed locally. Your edited source can be saved in this browser, but a program’s temporary files do not become permanent course data. Use Export for a copy you can keep or move to Codespaces. Stop terminates the running worker, including a program stuck in a loop.",
        "pitfall": "Native Linux processes, sockets, and C threads are not supplied by this lab. Chapters that need those capabilities identify Codespaces as their execution environment; they are still readable on a tablet.",
        "question": "When should you supply input for the current browser runner?",
        "choices": [
          "Before pressing Run code",
          "Only after the program asks in Console"
        ],
        "answer": 0,
        "why": "The runner passes the Input text at the start. It does not offer an interactive stdin prompt.",
        "tryit": "Open the chapter’s greeting exercise. Edit, run, check, and export your first C file.",
        "input": ""
      }
    }
  },
  "values": {
    "intro": "Learn what your data can represent, how expressions are evaluated, and when conversions change the result. These rules are the foundation of reliable arithmetic in every later project.",
    "outcomes": [
      "Choose and initialize basic C17 types with matching printf formats.",
      "Predict integer division, precedence, and casts before executing.",
      "Distinguish defined unsigned wrap from undefined signed overflow."
    ],
    "practice": "numbers",
    "topics": {
      "1": {
        "intro": "A type determines the values an object can represent and the operations that make sense for it. Choose a type from the meaning and range of the data, rather than assuming every number should be an int.",
        "explanation": "<code>int</code> represents whole numbers, while <code>double</code> represents floating-point approximations. <code>char</code> is an integer type used for character-sized storage; a character literal such as <code>'A'</code> uses single quotes. In C17, include <code>&lt;stdbool.h&gt;</code> to use <code>bool</code>, <code>true</code>, and <code>false</code>. Integer widths and plain-char signedness are implementation choices within the standard’s requirements. Do not assume one compiler’s sizes describe all C platforms. The language also provides short, long, long long, and unsigned integer variants, and float and long double for other floating-point ranges or precision. This introduction uses double for fractional calculations. A float argument to printf is promoted to double; scanf follows different format rules, so do not transfer printf formats to input functions without checking their contracts.",
        "code": "#include <stdio.h>\n#include <stdbool.h>\n\nint main(void) {\n    int count = 7;\n    double distance = 2.5;\n    char letter = 'A';\n    bool ready = true;\n    printf(\"%d %.1f %c %d\\n\", count, distance, letter, ready);\n    return 0;\n}\n",
        "expected": "7 2.5 A 1",
        "walkthrough": "The formats match the arguments: %d for int, %.1f for a double printed with one fractional digit, and %c for a character value. The bool value is promoted to int when passed to printf and prints as 1. Floating-point values generally cannot represent every decimal fraction exactly; formatting is a presentation choice, not a change to stored precision.",
        "pitfall": "The format string does not convert an incorrectly typed argument into the expected type. For example, passing a double to %d is not a safe shortcut.",
        "question": "Which format is appropriate for printing a double with one decimal place?",
        "choices": [
          "%d",
          "%.1f",
          "%c"
        ],
        "answer": 1,
        "why": "The f conversion expects a double; .1 requests one digit after the decimal point.",
        "tryit": "Change the values and predict the complete line before you run the example.",
        "input": ""
      },
      "2": {
        "intro": "A variable is a named object whose stored value may change. Initialization gives it a starting value at its declaration. A later assignment replaces the value it holds.",
        "explanation": "Declare and initialize small local variables near their first use. An uninitialized automatic int has an indeterminate value; do not read it before assigning a valid value. <code>const</code> expresses that an object should not be modified through that declaration. It helps document intent and lets the compiler reject accidental writes. In C, a const-qualified object is not automatically an integer constant expression in every context; that distinction matters later for array bounds and declarations.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    const int unit_price = 7;\n    int quantity = 3;\n    int total = unit_price * quantity;\n    quantity = 4;\n    printf(\"%d %d\\n\", total, quantity);\n    return 0;\n}\n",
        "expected": "21 4",
        "walkthrough": "total is calculated when its initializer runs. It stores 21; it is not a formula that automatically tracks quantity. Assigning 4 to quantity changes that object only. The later printf therefore prints the old calculated total and the new quantity. To update total, evaluate the multiplication and assign again.",
        "pitfall": "Use = for assignment. It stores a value and is different from ==, which compares values. A statement such as total = quantity changes total, even if the names suggest a calculation.",
        "question": "After quantity changes to 4, does total automatically become 28?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "An initializer is evaluated once at that point in execution. C does not maintain spreadsheet-like dependencies.",
        "tryit": "Recalculate total after changing quantity. Check that the first number now becomes 28.",
        "input": ""
      },
      "3": {
        "intro": "An expression combines values and operators to compute a result. Parentheses make grouping explicit; they are often clearer than expecting a reader to remember every precedence rule.",
        "explanation": "Multiplication, division, and remainder bind more tightly than addition and subtraction. When both operands of division are integers, the result is an integer truncated toward zero: 7 / 2 is 3. The remainder operator % works on integers; for these positive operands, 7 % 2 is 1. Division by zero is invalid. Evaluation order is a separate issue from precedence: grouping does not generally tell you the order in which unrelated function calls or side effects are evaluated.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    printf(\"%d %d\\n\", 7 / 2, 7 % 2);\n    printf(\"%d %d\\n\", 2 + 3 * 4, (2 + 3) * 4);\n    return 0;\n}\n",
        "expected": "3 1\n14 20",
        "walkthrough": "The first line divides seven into two groups with one left over. On the second line, multiplication happens within the higher-precedence subexpression, yielding 14. Parentheses change the grouping to add first and yield 20. To obtain a fractional quotient, make a division operand floating point before division, as the next topic shows.",
        "pitfall": "Avoid expressions that modify and read the same object in unsequenced ways. Write separate, simple statements instead of clever chains of increments and assignments.",
        "question": "What is the value of (2 + 3) * 4?",
        "choices": [
          "14",
          "20",
          "24"
        ],
        "answer": 1,
        "why": "Parentheses group the addition, producing 5 before the multiplication produces 20.",
        "tryit": "Add expressions for 9 / 4 and 9 % 4. Explain each result rather than only matching the output.",
        "input": ""
      },
      "4": {
        "intro": "C converts values when types differ, but the point at which a conversion happens matters. Converting a completed integer result cannot recover a fraction that integer division already discarded.",
        "explanation": "In a mixed expression involving double and an ordinary integer, the integer can be converted to double before arithmetic. A cast explicitly requests a conversion. Thus <code>(double)7 / 2</code> performs floating-point division, whereas <code>(double)(7 / 2)</code> first computes the integer quotient. Smaller integer types commonly undergo integer promotion in expressions. Signed/unsigned combinations have additional conversion rules, so avoid mixing them casually when testing ranges.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    double fractional = (double)7 / 2;\n    double truncated = 7 / 2;\n    printf(\"%.1f %.1f\\n\", fractional, truncated);\n    return 0;\n}\n",
        "expected": "3.5 3.0",
        "walkthrough": "fractional receives 3.5 because conversion happens before division. truncated receives the double value 3.0 because the integer expression has already produced 3. Changing the receiving variable’s type does not change how the right-hand expression was evaluated. Cast at a specific, justified boundary rather than scattering casts to suppress warnings.",
        "pitfall": "A cast is not proof that a value fits. Converting a floating-point value outside the representable range of an integer type is not a valid way to clamp it. Validate the range before converting.",
        "question": "Which expression preserves the fractional part of seven divided by two?",
        "choices": [
          "(double)(7 / 2)",
          "(double)7 / 2"
        ],
        "answer": 1,
        "why": "The second expression converts an operand before division; the first converts an already truncated quotient.",
        "tryit": "Rewrite fractional using 7.0 instead of a cast. Explain why the result is unchanged.",
        "input": ""
      },
      "5": {
        "intro": "C’s numeric types have finite ranges. Correct code distinguishes unsigned arithmetic, which wraps modulo its type’s range, from signed overflow, whose behavior is undefined.",
        "explanation": "Use <code>&lt;limits.h&gt;</code> for bounds such as INT_MAX, INT_MIN, and UINT_MAX. Do not assume int is exactly 32 bits merely because this browser target uses that size. A signed addition must be checked before it overflows, not afterward. Unsigned wrap is defined, but it can still be a bug in sizes or indexes. Floating-point types have separate limits and precision characteristics described by <code>&lt;float.h&gt;</code>.",
        "code": "#include <stdio.h>\n#include <limits.h>\n\nint main(void) {\n    unsigned int value = 0;\n    value -= 1;\n    printf(\"%d\\n\", value == UINT_MAX);\n    return 0;\n}\n",
        "expected": "1",
        "walkthrough": "Subtracting one from unsigned zero wraps to UINT_MAX. The comparison is true, so printf prints 1. This is a defined unsigned operation. Replacing value with a signed int and deliberately overflowing its range would not be a comparable experiment: a particular output would provide no guarantee about that invalid program.",
        "pitfall": "Do not use an observed wraparound result from signed overflow as evidence of a language rule. Optimizers can assume undefined signed overflow does not occur. Later portability chapters revisit these guarantees in depth.",
        "question": "Is overflowing a signed int guaranteed to wrap?",
        "choices": [
          "Yes, on every C implementation",
          "No; signed overflow has undefined behavior"
        ],
        "answer": 1,
        "why": "Unsigned arithmetic has defined modular behavior. Ordinary signed overflow does not.",
        "tryit": "Use the chapter’s numeric-expression exercise to practice type choice and conversion without invoking overflow.",
        "input": ""
      }
    }
  },
  "control-flow": {
    "intro": "Turn a sequence of statements into decisions and repetitions. Finish with a bounded-input guessing game that can reject a bad guess and terminate deliberately.",
    "outcomes": [
      "Trace branch conditions and short-circuit guards.",
      "Explain loop initialization, condition, update, break, and continue.",
      "Handle successful conversion, invalid input, and EOF in the supplied scaffold."
    ],
    "practice": "guess",
    "topics": {
      "1": {
        "intro": "A decision chooses which statements run. In a condition, zero is false and a nonzero scalar value is true. A comparison usually expresses that decision more clearly than relying on an unexplained number.",
        "explanation": "<code>if</code> executes a statement or block when its condition is true. An else branch handles the alternative. Use braces even for short branches while learning: they keep later edits unambiguous. <code>switch</code> selects among integer-valued cases. A break exits the switch; without it, execution may continue into the following case. Use default for the unmatched case when that is meaningful.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    int score = 72;\n    if (score >= 50) {\n        puts(\"pass\");\n    } else {\n        puts(\"retry\");\n    }\n    int command = 2;\n    switch (command) {\n        case 1: puts(\"start\"); break;\n        case 2: puts(\"stop\"); break;\n        default: puts(\"unknown\"); break;\n    }\n    return 0;\n}\n",
        "expected": "pass\nstop",
        "walkthrough": "The comparison 72 >= 50 is true, so only the pass branch runs. The switch then selects case 2 and prints stop. Its break leaves the switch. A switch is not a loop: the cases describe alternatives within that one selection, not repeated iterations.",
        "pitfall": "A single = assigns rather than compares. In addition, forgetting break can create unintended fallthrough. Both mistakes may compile; understanding the control flow is still necessary.",
        "question": "Which branch runs when score is exactly 50?",
        "choices": [
          "pass",
          "retry"
        ],
        "answer": 0,
        "why": "The >= comparison includes equality. Boundary values belong in your tests.",
        "tryit": "Change score to 49 and command to an unmatched value. Predict both output lines.",
        "input": ""
      },
      "2": {
        "intro": "Logical operators combine conditions. Use && for both conditions, || for either condition, and ! to invert a truth value. Write the comparisons explicitly so the code reads like the rule.",
        "explanation": "C evaluates the left operand of && first and evaluates the right operand only if the left is true. For ||, the right operand is evaluated only if the left is false. This short-circuit behavior can protect a later operation: check that a divisor is nonzero before dividing. To test whether x is between two limits, write <code>x > 0 && x < 10</code>; the mathematical-looking <code>0 < x < 10</code> does not mean the same thing in C.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    int divisor = 0;\n    int numerator = 10;\n    if (divisor != 0 && numerator / divisor > 2) {\n        puts(\"large quotient\");\n    } else {\n        puts(\"not evaluated or too small\");\n    }\n    return 0;\n}\n",
        "expected": "not evaluated or too small",
        "walkthrough": "The first comparison is false, so the division is not evaluated. The program therefore avoids dividing by zero. Reversing the operands would remove that protection. The order here is a language guarantee of &&, unlike the general evaluation-order questions raised by ordinary arithmetic expressions.",
        "pitfall": "The bitwise operators & and | do not provide the same short-circuit rule. They have useful roles in bit manipulation, but should not replace && and || in these guards.",
        "question": "Does the division run when divisor is zero in this example?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "The false left operand of && skips its right operand.",
        "tryit": "Try divisor = 2 and then divisor = 5. Explain why one reaches the true branch and the other does not.",
        "input": ""
      },
      "3": {
        "intro": "A loop repeats work while a condition permits it. Identify the initial state, continuation condition, update, and body before reasoning about its output.",
        "explanation": "A for loop gathers initialization, condition, and update in one place. Its condition is tested before each iteration. A while loop also tests before its body, while do–while tests afterward and therefore runs the body at least once. Track a small example by hand: record the loop variable before the body, the output, and its next value. Make sure the loop can progress toward termination.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    for (int i = 0; i < 3; i++) {\n        printf(\"%d\\n\", i);\n    }\n    int remaining = 2;\n    while (remaining > 0) {\n        remaining--;\n    }\n    printf(\"remaining=%d\\n\", remaining);\n    return 0;\n}\n",
        "expected": "0\n1\n2\nremaining=0",
        "walkthrough": "The for body sees i equal to 0, 1, and 2. After the update makes it 3, the condition is false. The while loop subtracts one twice and stops at zero. Neither loop executes its body after its condition has become false. This is why < n and <= n often differ by one iteration.",
        "pitfall": "An empty body caused by a stray semicolon, or an update that never approaches the stopping condition, can create an unintended loop. Stop code is available if an experiment fails to terminate.",
        "question": "How many times does the for body run?",
        "choices": [
          "2",
          "3",
          "4"
        ],
        "answer": 1,
        "why": "The values 0, 1, and 2 satisfy i < 3.",
        "tryit": "Rewrite the countdown using for. Keep the output and final value the same.",
        "input": ""
      },
      "4": {
        "intro": "break and continue change the ordinary path through a loop. Use them when they make a termination or skip rule clearer; avoid using them to hide a complicated set of conditions.",
        "explanation": "break leaves the nearest enclosing loop or switch. continue skips the rest of the current loop iteration. In a for loop, continue proceeds to the update expression and then tests the condition again. In a while loop, it returns directly to the condition, so a necessary update below continue would be skipped. Trace these paths separately when debugging.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    for (int i = 0; i < 7; i++) {\n        if (i == 2) continue;\n        if (i == 5) break;\n        printf(\"%d\\n\", i);\n    }\n    return 0;\n}\n",
        "expected": "0\n1\n3\n4",
        "walkthrough": "At i = 2, continue skips printf but the for update still increments i. At i = 5, break exits before printing and before another iteration. The values 5 and 6 are never printed. A break inside a switch nested in a loop would leave that switch rather than automatically leaving the loop.",
        "pitfall": "Always ask which construct is nearest. Also, a continue can bypass cleanup or other work later in a loop body; resource handling becomes important when allocations and files are introduced.",
        "question": "Which value causes this loop to finish early?",
        "choices": [
          "2",
          "5",
          "7"
        ],
        "answer": 1,
        "why": "2 skips one iteration; 5 triggers break and ends the loop.",
        "tryit": "Move the break condition to i == 4. Predict which final value disappears from the output.",
        "input": ""
      },
      "5": {
        "intro": "A useful small project combines decisions, repetition, and a clear input contract. Our number-guessing game keeps a fixed target and tells the player whether a valid guess is too low, too high, or correct.",
        "explanation": "The Input panel supplies a sequence before execution. In this scaffold, <code>scanf(\"%d\", &guess)</code> returns 1 when it stores one integer, 0 for a nonmatching token, and EOF when input ends before a conversion. The ampersand supplies the destination address; pointers are explained in Part 2. For this exercise, integer tokens are between −1000 and 1000. This bound matters: %d is not a safe parser for arbitrarily large numbers. Later text-input lessons explain how to handle buffers and prepare for checked parsing.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    int guess;\n    int result = scanf(\"%d\", &guess);\n    if (result != 1) {\n        puts(\"invalid input\");\n    } else if (guess < 1 || guess > 10) {\n        puts(\"out of range\");\n    } else if (guess == 7) {\n        puts(\"correct\");\n    } else {\n        puts(\"try again\");\n    }\n    return 0;\n}\n",
        "expected": "correct",
        "walkthrough": "With the sample input 7, conversion succeeds, the range check permits the guess, and equality selects correct. This example handles one guess. The chapter exercise extends it to repeated guesses and handles end-of-input separately. Validate a converted value before using it in a calculation or array access.",
        "pitfall": "Do not assume reading input always succeeds. Inspect the conversion result before reading guess; otherwise you could read an uninitialized value. Real untrusted numeric input requires range-checked text parsing beyond this bounded exercise.",
        "question": "If scanf returns 0, is it valid to use guess as though a number was read?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "No assignment was made by that failed conversion. Handle the failure before using the destination.",
        "tryit": "Open the guessing-game exercise and add the loop, range checks, and higher/lower responses.",
        "input": "7"
      }
    }
  },
  "functions": {
    "intro": "Give computations names and interfaces. Learn how calls pass values, how local state behaves, and how to test a function separately from input and output.",
    "outcomes": [
      "Write a prototype, definition, and call with a clear return value.",
      "Explain parameter copies, local scope, and persistent static storage.",
      "Decompose and test small computations using representative boundaries."
    ],
    "practice": "functions",
    "topics": {
      "1": {
        "intro": "A function packages a computation behind a name, parameter list, and return type. Calling it supplies argument values; execution enters its body and later returns to the caller.",
        "explanation": "A definition includes the body. A declaration or prototype describes the interface so a caller can be checked before the definition is encountered. In <code>int twice(int value)</code>, value is a parameter local to the function and the result type is int. The call <code>twice(21)</code> supplies 21 as an argument. A return expression computes the value delivered to the caller. Write void in the parameter list of a C17 function that accepts no arguments.",
        "code": "#include <stdio.h>\n\nint twice(int value) {\n    return value * 2;\n}\n\nint main(void) {\n    printf(\"%d\\n\", twice(21));\n    return 0;\n}\n",
        "expected": "42",
        "walkthrough": "The argument 21 initializes the parameter value. The body computes 42 and returns it. That return value becomes the argument passed to printf. Defining twice above main also declares it before the call; in a larger file, a prototype can appear first and the definition later.",
        "pitfall": "A return type is a contract. A function that promises an int must provide an appropriate result on every normal path where its caller uses that result. Compiler warnings help detect missing returns.",
        "question": "What is the value of twice(4)?",
        "choices": [
          "4",
          "8",
          "It prints 4 itself"
        ],
        "answer": 1,
        "why": "The function returns 4 * 2. It does not print; printf in the caller handles output.",
        "tryit": "Add a prototype above main and move the definition below main without changing the result.",
        "input": ""
      },
      "2": {
        "intro": "C passes arguments by value: a parameter receives a value of its own. Assigning to that parameter does not replace the caller’s variable.",
        "explanation": "Think of the call as initializing a new local parameter from the argument. The parameter and the caller’s object then have separate identities. If a caller needs a computed result, return it and assign it explicitly. Later, pointers let functions access objects through addresses, but those pointer arguments are also passed by value. That is an extension of this rule, not an exception to it.",
        "code": "#include <stdio.h>\n\nint add_one(int value) {\n    value++;\n    return value;\n}\n\nint main(void) {\n    int original = 10;\n    int result = add_one(original);\n    printf(\"%d %d\\n\", original, result);\n    return 0;\n}\n",
        "expected": "10 11",
        "walkthrough": "value begins at 10 inside add_one, then becomes 11. original in main remains 10. result receives the returned 11. If you instead want original to hold 11, write original = add_one(original). This makes the data flow visible at the call site.",
        "pitfall": "Matching variable names do not create shared storage. A local variable or parameter named original in another function would still be a separate object.",
        "question": "Does value++ change original in this example?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "The increment changes the parameter copy. Only the returned result is given back.",
        "tryit": "Assign the return directly into original, then compare the output with the original example.",
        "input": ""
      },
      "3": {
        "intro": "Scope determines where a name can be used. Lifetime determines when its object exists. These ideas are related, but they answer different questions.",
        "explanation": "An automatic local object normally exists for the execution of its block. A static local object keeps its stored value for the entire program while its name remains local to that scope. A name declared in an inner block can hide a name from an outer block, which is called shadowing. Use distinct names when hiding would confuse a reader. File-scope objects and linkage receive a fuller treatment in the multi-file chapter.",
        "code": "#include <stdio.h>\n\nint next_count(void) {\n    static int count = 0;\n    count++;\n    return count;\n}\n\nint main(void) {\n    printf(\"%d\\n\", next_count());\n    printf(\"%d\\n\", next_count());\n    return 0;\n}\n",
        "expected": "1\n2",
        "walkthrough": "The static object count is initialized once and survives the first return. The second call therefore increments 1 to 2. If count were an ordinary local initialized to zero on each call, both calls would return 1. Persistent state can be useful, but it makes calls depend on history and can later require synchronization.",
        "pitfall": "Do not return the address of an ordinary local variable for later use: its lifetime ends when the relevant block exits. Part 2 makes that memory rule concrete with pointer examples.",
        "question": "If static is removed, what does the second call return?",
        "choices": [
          "1",
          "2",
          "3"
        ],
        "answer": 0,
        "why": "The automatic local is initialized to zero again on each call.",
        "tryit": "Compare the two versions and explain the difference without changing the call sites.",
        "input": ""
      },
      "4": {
        "intro": "Decomposition separates a program into pieces with clear responsibilities. Begin with a computation that accepts values and returns a result, keeping input and printing outside it.",
        "explanation": "A rectangle calculator can separate area from perimeter. Each function then has a small contract: nonnegative, suitably bounded dimensions enter, and a numeric result comes back. main can validate input, call the functions, and format the result. This is easier to reason about than a helper that reads input, changes unrelated state, calculates, and prints all at once. Splitting into functions is useful when it clarifies an interface, not merely to make every function tiny.",
        "code": "#include <stdio.h>\n\nint area(int width, int height) {\n    return width * height;\n}\n\nint perimeter(int width, int height) {\n    return 2 * (width + height);\n}\n\nint main(void) {\n    int width = 3, height = 4;\n    printf(\"area=%d perimeter=%d\\n\",\n           area(width, height), perimeter(width, height));\n    return 0;\n}\n",
        "expected": "area=12 perimeter=14",
        "walkthrough": "The two helper calls depend only on their parameters and do not change shared state, so their unspecified argument evaluation order is harmless here. Both results are ready when printf formats them. In the chapter exercise, dimensions are restricted to 1 through 100 so the integer operations stay comfortably within the required range.",
        "pitfall": "A function name should reveal its result or effect. Also document input constraints: moving a multiplication into a helper does not remove its overflow risks.",
        "question": "Which responsibility belongs in main for this design?",
        "choices": [
          "Formatting the final output",
          "Making area read from stdin"
        ],
        "answer": 0,
        "why": "Keeping I/O at the boundary leaves the computation easy to call and test independently.",
        "tryit": "Implement the chapter calculator exercise, then add perimeter as a second independent function.",
        "input": ""
      },
      "5": {
        "intro": "Testing a function means checking its result against its contract for representative inputs. Include ordinary cases and the boundaries where a condition changes behavior.",
        "explanation": "For a maximum-of-two function, try a first argument that is larger, a second argument that is larger, and equal arguments. Negative values and zero exercise cases that positive-only checks miss. <code>assert</code> from <code>&lt;assert.h&gt;</code> checks a programmer expectation while assertions are enabled. It is not a replacement for validating external input, and compiling with NDEBUG removes assertions. Never put required side effects into an assertion.",
        "code": "#include <stdio.h>\n#include <assert.h>\n\nint maximum(int a, int b) {\n    if (a > b) return a;\n    return b;\n}\n\nint main(void) {\n    assert(maximum(5, 2) == 5);\n    assert(maximum(-3, 0) == 0);\n    assert(maximum(4, 4) == 4);\n    puts(\"checks passed\");\n    return 0;\n}\n",
        "expected": "checks passed",
        "walkthrough": "All calls are pure computations. An incorrect result would stop the assertion-enabled program at the failed expectation. The final line is reached only after the checks pass. These three tests are useful evidence, not a proof for every possible pair of ints. The function’s two return paths also need to be understood.",
        "pitfall": "An output check can pass even when the intended technique was not used. Combine tests with an explanation of the control flow and constraints, rather than treating a green result as the whole learning goal.",
        "question": "Why should a required increment not be written inside assert?",
        "choices": [
          "Assertions can be removed by NDEBUG",
          "assert always runs twice"
        ],
        "answer": 0,
        "why": "Removing assertions must not remove behavior the program needs.",
        "tryit": "Add tests where both inputs are negative and where the first input is zero.",
        "input": ""
      }
    }
  },
  "arrays-strings": {
    "intro": "Represent collections and text without losing track of bounds. Finish Part 1 by processing one line of input with an explicit buffer size and a clear definition of a word.",
    "outcomes": [
      "Traverse an array using its element count without stepping outside it.",
      "Distinguish string length, terminator, and destination capacity.",
      "Read a bounded line and count ASCII characters and whitespace-delimited words."
    ],
    "practice": "textstats",
    "topics": {
      "1": {
        "intro": "An array stores a fixed number of elements of one type in contiguous storage. Its valid indexes begin at zero and stop one before its element count.",
        "explanation": "An array of five ints has valid indexes 0 through 4. Accessing element 5 is outside the array, even if the program appears to continue. C does not automatically check these bounds. When the actual array declaration is in scope, sizeof array divided by sizeof array[0] gives its element count. That technique does not recover a count from a function parameter that has adjusted to a pointer; pass lengths explicitly when Part 2 introduces those interfaces.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    int values[] = {1, 2, 3, 4, 5};\n    size_t count = sizeof values / sizeof values[0];\n    int total = 0;\n    for (size_t i = 0; i < count; i++) {\n        total += values[i];\n    }\n    printf(\"%d\\n\", total);\n    return 0;\n}\n",
        "expected": "15",
        "walkthrough": "The initializer determines a five-element array. sizeof reports sizes in bytes and produces size_t, a standard unsigned size type. The loop uses i < count, so it visits each element once without reaching the invalid index count. The total fits in int for these particular data values.",
        "pitfall": "An out-of-bounds read is not a legitimate way to inspect what happens to be nearby. It has undefined behavior. When debugging, inspect both the index and the length that is supposed to constrain it.",
        "question": "What is the last valid index of this five-element array?",
        "choices": [
          "4",
          "5",
          "6"
        ],
        "answer": 0,
        "why": "The first element is at zero, so the last valid index is count - 1.",
        "tryit": "Change the initializer to three values and confirm that count and the loop adapt without a hardcoded bound.",
        "input": ""
      },
      "2": {
        "intro": "A C string is a sequence of characters terminated by a zero byte. A character array can hold a string, but an arbitrary character array is not automatically terminated.",
        "explanation": "The initializer <code>char word[] = \"cat\";</code> reserves four elements: c, a, t, and the terminating zero. <code>strlen</code> counts characters before the first zero; sizeof word reports the storage size of this declared array. strlen requires a valid terminated string and may otherwise read outside the object. String length and available buffer capacity are different quantities that must be tracked deliberately.",
        "code": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    char word[] = \"cat\";\n    printf(\"length=%zu capacity=%zu\\n\", strlen(word), sizeof word);\n    return 0;\n}\n",
        "expected": "length=3 capacity=4",
        "walkthrough": "strlen returns 3 because the terminator is not part of the text. sizeof reports 4 bytes because the char array includes it. %zu is the printf conversion for size_t. Replacing the first character with a zero would make the string empty while leaving the array’s capacity unchanged.",
        "pitfall": "The literal '\\0' is the zero character used as a terminator; '0' is the printable digit character. Confusing them changes the contents and can leave a buffer unterminated.",
        "question": "How much room is required to store the string \"cat\" including its terminator?",
        "choices": [
          "3 chars",
          "4 chars"
        ],
        "answer": 1,
        "why": "Three text characters plus one zero terminator require four char elements.",
        "tryit": "Set word[1] to '\\0'. Predict strlen and sizeof before running the edited example.",
        "input": ""
      },
      "3": {
        "intro": "Reading a complete line is often more useful than reading a whitespace-delimited word. fgets accepts a destination buffer and its capacity, limiting how much it writes.",
        "explanation": "With a positive capacity of at least two, fgets reads at most capacity minus one characters, keeps a newline if it fits, and appends a zero terminator on success. It returns NULL when it cannot return a string, such as end-of-input before any characters. It can also return a partial line when the buffer fills first. Check its result before using the buffer, and do not assume every successful call consumed a whole logical line.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    char line[32];\n    if (fgets(line, sizeof line, stdin) == NULL) {\n        puts(\"no line\");\n        return 0;\n    }\n    printf(\"Read: %s\", line);\n    return 0;\n}\n",
        "expected": "Read: Ada Lovelace",
        "walkthrough": "The sample input contains a space, which fgets retains. Because it also retains the trailing newline, printf does not add a second one. The result check avoids reading uninitialized line contents when no input exists. The capacity here is a small fixed array size, which fits the int parameter expected by fgets.",
        "pitfall": "Truncation needs an explicit policy: reject a long line, collect its remaining pieces, or intentionally work on chunks. This example reads one chunk; it is not a complete line-reading library.",
        "question": "Can a successful fgets call return only part of a long line?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 0,
        "why": "The capacity bounds each read. A long logical line can need more than one read.",
        "tryit": "Try an empty Input panel, then a line longer than 31 characters. Observe success, EOF, and the capacity limit.",
        "input": "Ada Lovelace\n"
      },
      "4": {
        "intro": "String operations need both a valid terminator and an understanding of destination capacity. Use library functions according to their contracts rather than assuming the names imply safety.",
        "explanation": "<code>strcmp</code> compares string contents and promises a negative, zero, or positive result. The == operator does not compare string contents. A copy also needs enough destination capacity, including the terminator. snprintf reports how many characters it would have written, so a result at least as large as the capacity signals truncation. For numeric text, strtol supplies both a long result and the location where conversion stopped. That location is stored in a pointer named end; Part 2 explains the address mechanics. Here, follow the library contract to detect empty conversions, unwanted suffixes, and range failures.",
        "code": "#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\n#include <errno.h>\n#include <limits.h>\n\nint main(void) {\n    char copy[8];\n    int written = snprintf(copy, sizeof copy, \"%s\", \"Ada\");\n    if (written < 0 || (size_t)written >= sizeof copy) {\n        puts(\"copy did not fit\");\n        return 0;\n    }\n    printf(\"same=%d copy=%s\\n\", strcmp(copy, \"Ada\") == 0, copy);\n\n    char text[] = \"42\";\n    char *end;\n    errno = 0;\n    long parsed = strtol(text, &end, 10);\n    if (errno == ERANGE || end == text || *end != '\\0' ||\n        parsed < INT_MIN || parsed > INT_MAX) {\n        puts(\"invalid integer\");\n    } else {\n        printf(\"number=%d\\n\", (int)parsed);\n    }\n    return 0;\n}\n",
        "expected": "same=1 copy=Ada\nnumber=42",
        "walkthrough": "Ada fits in eight chars including its terminator, so the copy and comparison succeed. For the numeric text, reset errno before calling strtol with base 10. ERANGE signals a long-range failure. end == text means no conversion occurred, while *end != '\\0' rejects an unconsumed suffix. Finally, check the int range before casting. Leading whitespace is accepted by strtol; this example deliberately rejects trailing whitespace or any other suffix. The address notation is introduced here as library scaffolding and developed fully in Part 2.",
        "pitfall": "A successful prefix conversion is not necessarily a valid whole input: \"42x\" begins with a number but fails this parser’s policy. Do not replace these checks with atoi, which does not provide the same error information. Likewise, a bounded copy can still truncate meaningful text, and strcmp need not return exactly -1 or 1.",
        "question": "What does strcmp(a, b) == 0 mean for two valid strings?",
        "choices": [
          "They have equal contents",
          "They use the same storage address"
        ],
        "answer": 0,
        "why": "strcmp compares the characters, not whether both expressions designate the same array.",
        "tryit": "Change text to \"42x\", an empty string, and a number too large for long. Explain which checks reject them. Then make the copied name too long for the destination.",
        "input": ""
      },
      "5": {
        "intro": "The chapter project counts characters and words in the first line of input. Define those words precisely before writing the loop: otherwise output disagreements may come from an unclear specification rather than a faulty implementation.",
        "explanation": "For this exercise, input is ASCII and the first line contains at most 127 bytes. Count every byte before a newline as a character, including spaces and tabs. A word is a maximal run of non-whitespace characters. Keep a Boolean in_word flag: when a non-whitespace character arrives while the flag is false, a new word begins. A whitespace character clears the flag. Passing an unsigned-char value to isspace avoids invalid negative char arguments.",
        "code": "#include <stdio.h>\n#include <stdbool.h>\n#include <ctype.h>\n\nint main(void) {\n    char line[128];\n    int words = 0;\n    bool in_word = false;\n    if (fgets(line, sizeof line, stdin) != NULL) {\n        for (size_t i = 0; line[i] != '\\0' && line[i] != '\\n'; i++) {\n            if (isspace((unsigned char)line[i])) {\n                in_word = false;\n            } else if (!in_word) {\n                words++;\n                in_word = true;\n            }\n        }\n    }\n    printf(\"words=%d\\n\", words);\n    return 0;\n}\n",
        "expected": "words=3",
        "walkthrough": "For C is fun, each first letter after a boundary increases the word count; letters later in the same word do not. Multiple adjacent spaces therefore do not create extra words. The example counts words only. Your exercise adds a character counter while keeping the newline excluded. Test an empty input, whitespace-only input, and repeated spaces.",
        "pitfall": "This is byte-oriented ASCII processing, not a Unicode word segmenter. A long line is read only up to the buffer limit; the exercise’s contract avoids that truncation case, while a later robust input library must handle it.",
        "question": "How many words does \"  C   lab  \" contain under this definition?",
        "choices": [
          "2",
          "3",
          "Every space creates a word"
        ],
        "answer": 0,
        "why": "Only transitions from whitespace to non-whitespace start a word.",
        "tryit": "Open the text-statistics exercise and implement both counters. Explain the purpose of the in_word flag.",
        "input": "C is fun\n"
      }
    }
  }
};

(() => {
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  for(const chapter of COURSE.chapters.filter(c=>c.part===0)) {
    for(const topic of chapter.topics) {
      const content=PART_ONE[chapter.id].topics[topic.id];
      LESSONS.push({
        id:`example-${chapter.id}-${topic.id}`,isExample:true,chapterId:chapter.id,topicId:topic.id,section:0,
        title:topic.title,time:'Worked example',tag:'Part 1',concept:'Read, run, and change a complete program.',
        body:content.intro,detail:`This is an ungraded worked example. <a href="#/chapter/${chapter.id}/${topic.id}">Return to its explanation and question</a>.`,
        task:content.tryit,hint:'Run the unchanged example first. Change one thing at a time, predict the result, then run again.',
        code:content.code,solution:content.code,input:content.input,tests:[{name:'Original example output',input:content.input,expected:content.expected}],
        assessment:'Checking an example compares it with the original output; it does not add to practice progress.',
        example:{code:content.code,html:'<pre>'+escape(content.expected)+'</pre>',question:content.question,choices:content.choices,answer:content.answer,why:content.why}
      });
    }
  }
  function render(chapter,topic) {
    const content=PART_ONE[chapter.id];
    const header=`<a href="${topic?'#/chapter/'+chapter.id:'#/course'}">← ${topic?escape(chapter.title):'Complete course'}</a><p class="eyebrow">Part 1 · Chapter ${chapter.number}${topic?'.'+topic.id:''}</p><h1 tabindex="-1">${escape(topic?topic.title:chapter.title)}</h1>`;
    if(!topic) return header+`<p class="lesson-deck">${escape(content.intro)}</p><h2>What you will learn</h2><ul>${content.outcomes.map(s=>'<li>'+escape(s)+'</li>').join('')}</ul><h2>Read in order</h2><ol class="topic-list">${chapter.topics.map(t=>`<li><a href="#/chapter/${chapter.id}/${t.id}">${escape(t.title)}</a></li>`).join('')}</ol><section class="chapter-practice"><h2>Put it into practice</h2><p>Finish the topics, then build the chapter project. Output checks are one source of evidence; also explain the decisions behind your code.</p><a class="primary-link" href="#/lesson/${content.practice}">${escape(LESSONS.find(l=>l.id===content.practice).title)} →</a></section><p class="supporting">C17 is the teaching baseline. Part 1 runs in the browser; native tools are optional. <a href="#/setup">Execution and setup guide</a>.</p><nav class="page-navigation"><a href="#/chapter/${chapter.id}/1">Start the chapter →</a>${chapter.number>1?`<a href="#/chapter/${COURSE.chapters[chapter.number-2].id}">Previous chapter</a>`:''}</nav>`;
    const t=content.topics[topic.id],i=chapter.topics.indexOf(topic),next=chapter.topics[i+1],prev=chapter.topics[i-1],nextChapter=COURSE.chapters[chapter.number];
    return header+`<article class="topic-content"><p class="lesson-deck">${escape(t.intro)}</p><p>${t.explanation}</p><section class="worked-example"><h2>Worked example</h2><p class="example-note">Edit and run here. Your changes are saved; Reset restores the original.</p><div id="inline-editor-host"></div><details class="original-output"><summary>Expected output of the original program</summary><pre>${escape(t.expected)}</pre></details><p class="example-walkthrough"><strong>Original program:</strong> ${t.walkthrough}</p><h3>Try a change</h3><p>${escape(t.tryit)}</p></section><h2>Watch for this</h2><p>${t.pitfall}</p><section class="prediction"><h2>Check your understanding</h2><fieldset><legend>${escape(t.question)}</legend>${t.choices.map((s,j)=>`<label><input type="radio" name="topic-check" value="${j}"> ${escape(s)}</label>`).join('')}</fieldset><button data-topic-check data-chapter="${chapter.id}" data-topic="${topic.id}">Check answer</button><p id="topic-feedback" role="status"></p></section>${!next?`<section class="chapter-practice"><h2>Chapter practice</h2><a class="primary-link" href="#/lesson/${content.practice}">${escape(LESSONS.find(l=>l.id===content.practice).title)} →</a></section>`:''}</article><nav class="page-navigation">${prev?`<a href="#/chapter/${chapter.id}/${prev.id}">← Previous topic</a>`:`<a href="#/chapter/${chapter.id}">← Chapter overview</a>`}${next?`<a href="#/chapter/${chapter.id}/${next.id}">Next topic →</a>`:nextChapter?`<a href="#/chapter/${nextChapter.id}">Next chapter →</a>`:'<a href="#/course">Course map →</a>'}</nav>`;
  }
  document.addEventListener('click',event=>{const b=event.target.closest('[data-topic-check]');if(!b)return;const t=PART_ONE[b.dataset.chapter].topics[b.dataset.topic],selected=document.querySelector('input[name="topic-check"]:checked');document.getElementById('topic-feedback').textContent=selected?`${Number(selected.value)===t.answer?'Correct.':'Not quite.'} ${t.why}`:'Choose an answer first.';});
  window.partOne={render};
})();
