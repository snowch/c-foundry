window.LESSONS = [
  {
    "id": "hello",
    "section": 0,
    "title": "Your first C program",
    "time": "8 min",
    "tag": "The starting line",
    "concept": "A small program. A new way to think.",
    "body": "C gives you a close view of how a computer works. Start with a program that prints a message. Every program in this lab starts in <code>main</code>; <code>printf</code> writes text to standard output.",
    "detail": "<code>#include &lt;stdio.h&gt;</code> declares the input and output functions. The <code>\\n</code> escape starts a new line. Returning <code>0</code> from main signals success.",
    "task": "Replace the message with <code>Hello, C!</code>, then run your program. Use Check output to complete the lesson.",
    "hint": "Keep the quotation marks and the semicolon: printf(\"Hello, C!\\n\");",
    "code": "#include <stdio.h>\n\nint main(void) {\n    // Make your first change here.\n    printf(\"Hello, world!\\n\");\n    return 0;\n}\n",
    "solution": "#include <stdio.h>\n\nint main(void) {\n    printf(\"Hello, C!\\n\");\n    return 0;\n}\n",
    "input": "",
    "tests": [
      {
        "name": "Print the greeting",
        "input": "",
        "expected": "Hello, C!"
      }
    ]
  },
  {
    "id": "loops",
    "section": 0,
    "title": "Variables & loops",
    "time": "12 min",
    "tag": "Make it repeat",
    "concept": "Let a loop do the counting.",
    "body": "Variables hold values. A <code>for</code> loop repeats a block while its condition is true. Here, read a positive integer and add every integer from 1 through that number.",
    "detail": "Initialize an accumulator to zero. A loop has three parts: initialization, condition, and update. <code>scanf(\"%d\", &n)</code> writes the input into n; the ampersand supplies its address.",
    "task": "Implement <code>sum_to(n)</code>. For input 5, your program should print 15. Inputs are between 0 and 1,000.",
    "hint": "Start total at 0. Loop with i = 1; i <= n; i++ and add i to total.",
    "code": "#include <stdio.h>\n\nint sum_to(int n) {\n    int total = 0;\n    // TODO: add the integers from 1 to n.\n    return total;\n}\n\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 1;\n    printf(\"%d\\n\", sum_to(n));\n    return 0;\n}\n",
    "solution": "#include <stdio.h>\n\nint sum_to(int n) {\n    int total = 0;\n    for (int i = 1; i <= n; i++) {\n        total += i;\n    }\n    return total;\n}\n\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 1;\n    printf(\"%d\\n\", sum_to(n));\n    return 0;\n}\n",
    "input": "5",
    "tests": [
      {
        "name": "Five integers",
        "input": "5",
        "expected": "15"
      },
      {
        "name": "Empty sum",
        "input": "0",
        "expected": "0"
      },
      {
        "name": "One hundred integers",
        "input": "100",
        "expected": "5050"
      }
    ]
  },
  {
    "id": "pointers",
    "section": 0,
    "title": "Pointers & memory",
    "time": "15 min",
    "tag": "Follow the address",
    "concept": "Change a value through its address.",
    "body": "A pointer stores a memory address. <code>&x</code> gets the address of x, and <code>*p</code> accesses the value at the address stored in p. This lets a function change its caller’s variables.",
    "detail": "C passes arguments by value—even pointers. The copied pointer still points to the original object. Use a temporary variable so neither value gets lost during a swap.",
    "task": "Implement <code>swap</code> using pointers. The two input numbers should be printed in reverse order.",
    "hint": "Save *a in a temporary integer, assign *b to *a, then assign the saved value to *b.",
    "code": "#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n    // TODO: exchange the values at these addresses.\n}\n\nint main(void) {\n    int a, b;\n    if (scanf(\"%d %d\", &a, &b) != 2) return 1;\n    swap(&a, &b);\n    printf(\"%d %d\\n\", a, b);\n    return 0;\n}\n",
    "solution": "#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n    int temp = *a;\n    *a = *b;\n    *b = temp;\n}\n\nint main(void) {\n    int a, b;\n    if (scanf(\"%d %d\", &a, &b) != 2) return 1;\n    swap(&a, &b);\n    printf(\"%d %d\\n\", a, b);\n    return 0;\n}\n",
    "input": "10 42",
    "tests": [
      {
        "name": "Two different values",
        "input": "10 42",
        "expected": "42 10"
      },
      {
        "name": "Negative values",
        "input": "-7 3",
        "expected": "3 -7"
      },
      {
        "name": "Equal values",
        "input": "8 8",
        "expected": "8 8"
      }
    ]
  },
  {
    "id": "heap",
    "section": 0,
    "title": "Allocate & release",
    "time": "18 min",
    "tag": "Own your memory",
    "concept": "Make room for data at runtime.",
    "body": "When the size of an array is only known at runtime, allocate storage on the heap with <code>malloc</code>. Check for failure and release the storage with <code>free</code> when you are done.",
    "detail": "Allocate <code>n * sizeof *values</code> bytes. The allocated contents are initially uninitialized, so fill each element before reading it. Never access the array after calling free.",
    "task": "Allocate an array, fill it with the squares of 1 through n, print those squares, and free the allocation. Inputs are between 1 and 100.",
    "hint": "Use int *values = malloc(n * sizeof *values); check !values, fill values[i] = (i+1)*(i+1), then free(values).",
    "code": "#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1 || n < 1 || n > 100) return 1;\n    int *values = NULL; // TODO: allocate n integers.\n    if (!values) return 1;\n    for (int i = 0; i < n; i++) {\n        values[i] = 0; // TODO: calculate the square.\n        printf(\"%s%d\", i ? \" \" : \"\", values[i]);\n    }\n    printf(\"\\n\");\n    // TODO: release the allocation.\n    return 0;\n}\n",
    "solution": "#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    int n;\n    if (scanf(\"%d\", &n) != 1 || n < 1 || n > 100) return 1;\n    int *values = malloc(n * sizeof *values);\n    if (!values) return 1;\n    for (int i = 0; i < n; i++) {\n        values[i] = (i + 1) * (i + 1);\n        printf(\"%s%d\", i ? \" \" : \"\", values[i]);\n    }\n    printf(\"\\n\");\n    free(values);\n    return 0;\n}\n",
    "input": "5",
    "tests": [
      {
        "name": "Five squares",
        "input": "5",
        "expected": "1 4 9 16 25"
      },
      {
        "name": "One square",
        "input": "1",
        "expected": "1"
      },
      {
        "name": "Three squares",
        "input": "3",
        "expected": "1 4 9"
      }
    ]
  },
  {
    "id": "search",
    "section": 1,
    "title": "Binary search",
    "time": "20 min",
    "tag": "Divide the problem",
    "concept": "Find an answer in fewer steps.",
    "body": "Binary search repeatedly halves a sorted search interval. Compare the middle value with your target, then discard the half that cannot contain it. Its time complexity is <code>O(log n)</code>.",
    "detail": "Track inclusive bounds lo and hi. Calculate <code>mid = lo + (hi - lo) / 2</code>. Always shrink the interval, and return -1 if it becomes empty. An unsorted array breaks this algorithm’s assumptions. Halving n repeatedly takes about log₂(n) steps, giving O(log n) worst-case time. The iterative version uses O(1) extra space.",
    "task": "Search the fixed sorted array and return the target’s zero-based index, or -1 if it is absent.",
    "hint": "While lo <= hi, compare a[mid] to target. Move lo to mid+1 or hi to mid-1, or return mid.",
    "code": "#include <stdio.h>\n\nint search(const int *a, int n, int target) {\n    // TODO: implement binary search.\n    return -1;\n}\n\nint main(void) {\n    int a[] = {2, 5, 8, 12, 16, 23, 38, 56};\n    int target;\n    if (scanf(\"%d\", &target) != 1) return 1;\n    printf(\"%d\\n\", search(a, 8, target));\n    return 0;\n}\n",
    "solution": "#include <stdio.h>\n\nint search(const int *a, int n, int target) {\n    int lo = 0, hi = n - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (a[mid] == target) return mid;\n        if (a[mid] < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return -1;\n}\n\nint main(void) {\n    int a[] = {2, 5, 8, 12, 16, 23, 38, 56};\n    int target;\n    if (scanf(\"%d\", &target) != 1) return 1;\n    printf(\"%d\\n\", search(a, 8, target));\n    return 0;\n}\n",
    "input": "23",
    "tests": [
      {
        "name": "Middle value",
        "input": "23",
        "expected": "5"
      },
      {
        "name": "First element",
        "input": "2",
        "expected": "0"
      },
      {
        "name": "Last element",
        "input": "56",
        "expected": "7"
      },
      {
        "name": "Missing value",
        "input": "13",
        "expected": "-1"
      }
    ]
  },
  {
    "id": "sort",
    "section": 1,
    "title": "Insertion sort",
    "time": "20 min",
    "tag": "Put things in order",
    "concept": "Grow a sorted prefix, one item at a time.",
    "body": "Insertion sort takes the next element and moves it left until it belongs in the sorted prefix. It is a useful starting point for reasoning about invariants and algorithm complexity.",
    "detail": "Before iteration i, elements 0 through i-1 are sorted. Save a[i] as the key, shift larger elements right, and insert the key. In reverse order, the shifts add up to 1 + 2 + … + (n−1), giving <code>O(n²)</code> worst-case time. Already sorted input needs <code>O(n)</code> time. Extra space is <code>O(1)</code>.",
    "task": "Implement an in-place insertion sort. Input contains a count (1–32), followed by that many integers.",
    "hint": "For each i from 1, save the key; while j >= 0 and a[j] > key, shift a[j] right and decrement j. Put key at a[j+1].",
    "code": "#include <stdio.h>\n\nvoid sort(int *a, int n) {\n    // TODO: sort a in ascending order.\n}\n\nint main(void) {\n    int n, a[32];\n    if (scanf(\"%d\", &n) != 1 || n < 1 || n > 32) return 1;\n    for (int i = 0; i < n; i++)\n        if (scanf(\"%d\", &a[i]) != 1) return 1;\n    sort(a, n);\n    for (int i = 0; i < n; i++)\n        printf(\"%s%d\", i ? \" \" : \"\", a[i]);\n    printf(\"\\n\");\n    return 0;\n}\n",
    "solution": "#include <stdio.h>\n\nvoid sort(int *a, int n) {\n    for (int i = 1; i < n; i++) {\n        int key = a[i];\n        int j = i - 1;\n        while (j >= 0 && a[j] > key) {\n            a[j + 1] = a[j];\n            j--;\n        }\n        a[j + 1] = key;\n    }\n}\n\nint main(void) {\n    int n, a[32];\n    if (scanf(\"%d\", &n) != 1 || n < 1 || n > 32) return 1;\n    for (int i = 0; i < n; i++)\n        if (scanf(\"%d\", &a[i]) != 1) return 1;\n    sort(a, n);\n    for (int i = 0; i < n; i++)\n        printf(\"%s%d\", i ? \" \" : \"\", a[i]);\n    printf(\"\\n\");\n    return 0;\n}\n",
    "input": "5\n9 2 7 1 5",
    "tests": [
      {
        "name": "Unsorted input",
        "input": "5 9 2 7 1 5",
        "expected": "1 2 5 7 9"
      },
      {
        "name": "Duplicates and negatives",
        "input": "5 3 -1 3 0 -1",
        "expected": "-1 -1 0 3 3"
      },
      {
        "name": "One element",
        "input": "1 8",
        "expected": "8"
      }
    ]
  },
  {
    "id": "rows",
    "section": 2,
    "title": "Your first database row",
    "time": "15 min",
    "tag": "Start building TinyDB",
    "concept": "Give your data a shape.",
    "body": "A database starts with a representation for its data. In C, a <code>struct</code> groups related fields. Our first row has an integer ID and space for a short name.",
    "detail": "The array <code>char name[32]</code> has room for 31 characters plus the terminating zero. The <code>%31s</code> width prevents scanf from overflowing it. This first version accepts one-word names.",
    "task": "Read an ID and name into a Row, then print it as <code>1 | Ada</code>. Use the struct fields in your output.",
    "hint": "Use scanf(\"%d %31s\", &row.id, row.name), then printf(\"%d | %s\\n\", row.id, row.name).",
    "code": "#include <stdio.h>\n\ntypedef struct {\n    int id;\n    char name[32];\n} Row;\n\nint main(void) {\n    Row row = {0, \"\"};\n    // TODO: read the two fields from stdin.\n    printf(\"%d | %s\\n\", row.id, row.name);\n    return 0;\n}\n",
    "solution": "#include <stdio.h>\n\ntypedef struct {\n    int id;\n    char name[32];\n} Row;\n\nint main(void) {\n    Row row = {0, \"\"};\n    if (scanf(\"%d %31s\", &row.id, row.name) != 2) return 1;\n    printf(\"%d | %s\\n\", row.id, row.name);\n    return 0;\n}\n",
    "input": "1 Ada",
    "tests": [
      {
        "name": "First row",
        "input": "1 Ada",
        "expected": "1 | Ada"
      },
      {
        "name": "Another row",
        "input": "42 Grace",
        "expected": "42 | Grace"
      }
    ]
  },
  {
    "id": "query",
    "section": 2,
    "title": "Insert & query rows",
    "time": "30 min",
    "tag": "A database that answers",
    "concept": "Turn a collection of rows into a tiny database.",
    "body": "This working command loop supports <code>insert ID NAME</code> and <code>select ID</code>. Rows live in a fixed-capacity table. Your job is to implement a linear scan to find a row by ID.",
    "detail": "The program guards capacity and rejects duplicate IDs. A linear scan costs <code>O(n)</code> per lookup. Later, an index can reduce lookup work. The table is in memory and starts empty on every run; it is not a persistent SQL database yet.",
    "task": "Complete <code>find_row</code> so select returns a matching row and missing IDs print <code>not found</code>. Return the array index, or -1.",
    "hint": "Loop from 0 to count-1. If rows[i].id equals id, return i. After the loop, return -1.",
    "code": "#include <stdio.h>\n#include <string.h>\n\ntypedef struct { int id; char name[32]; } Row;\nRow rows[32];\nint count = 0;\n\nint find_row(int id) {\n    // TODO: find the row index for this ID.\n    return -1;\n}\n\nint main(void) {\n    char command[16];\n    int id;\n    while (scanf(\"%15s %d\", command, &id) == 2) {\n        if (strcmp(command, \"insert\") == 0) {\n            char name[32];\n            if (scanf(\"%31s\", name) != 1) return 1;\n            if (find_row(id) >= 0) { puts(\"duplicate id\"); continue; }\n            if (count == 32) { puts(\"table full\"); continue; }\n            rows[count].id = id;\n            strcpy(rows[count++].name, name);\n            puts(\"inserted\");\n        } else if (strcmp(command, \"select\") == 0) {\n            int i = find_row(id);\n            if (i < 0) puts(\"not found\");\n            else printf(\"%d | %s\\n\", rows[i].id, rows[i].name);\n        } else puts(\"unknown command\");\n    }\n    return 0;\n}\n",
    "input": "insert 1 Ada\ninsert 2 Grace\nselect 2\nselect 99",
    "tests": [
      {
        "name": "Insert and select",
        "input": "insert 1 Ada\nselect 1",
        "expected": "inserted\n1 | Ada"
      },
      {
        "name": "Missing row",
        "input": "select 99",
        "expected": "not found"
      },
      {
        "name": "Reject duplicate IDs",
        "input": "insert 1 Ada\ninsert 1 Grace\nselect 1",
        "expected": "inserted\nduplicate id\n1 | Ada"
      },
      {
        "name": "Find a later row",
        "input": "insert 1 Ada\ninsert 2 Grace\nselect 2",
        "expected": "inserted\ninserted\n2 | Grace"
      }
    ],
    "solution": "#include <stdio.h>\n#include <string.h>\n\ntypedef struct { int id; char name[32]; } Row;\nRow rows[32];\nint count = 0;\n\nint find_row(int id) {\n    for (int i = 0; i < count; i++) {\n        if (rows[i].id == id) return i;\n    }\n    return -1;\n}\n\nint main(void) {\n    char command[16];\n    int id;\n    while (scanf(\"%15s %d\", command, &id) == 2) {\n        if (strcmp(command, \"insert\") == 0) {\n            char name[32];\n            if (scanf(\"%31s\", name) != 1) return 1;\n            if (find_row(id) >= 0) { puts(\"duplicate id\"); continue; }\n            if (count == 32) { puts(\"table full\"); continue; }\n            rows[count].id = id;\n            strcpy(rows[count++].name, name);\n            puts(\"inserted\");\n        } else if (strcmp(command, \"select\") == 0) {\n            int i = find_row(id);\n            if (i < 0) puts(\"not found\");\n            else printf(\"%d | %s\\n\", rows[i].id, rows[i].name);\n        } else puts(\"unknown command\");\n    }\n    return 0;\n}\n"
  },
  {
    "id": "numbers",
    "section": 0,
    "title": "Calculate a total and a share",
    "chapterId": "values",
    "time": "15–25 min",
    "tag": "Part 1 practice",
    "concept": "Calculate 4 items at 7 units each, then split that total equally between 8 people.",
    "body": "Use the declared values to calculate an integer total and a fractional share. The supplied printf already has the appropriate formats.",
    "detail": "Integer division happens before assignment. Convert an operand before dividing if the fractional part is needed.",
    "task": "Calculate 4 items at 7 units each, then split that total equally between 8 people. Print the total and share using the supplied printf.",
    "hint": "Use multiplication for total. For share, convert total to double before division.",
    "code": "#include <stdio.h>\n\nint main(void) {\n    const int unit_price = 7;\n    int quantity = 4;\n    int total = 0;     // TODO: calculate the total.\n    double share = 0;  // TODO: split total equally between 8 people.\n    printf(\"%d %.1f\\n\", total, share);\n    return 0;\n}\n",
    "solution": "#include <stdio.h>\n\nint main(void) {\n    const int unit_price = 7;\n    int quantity = 4;\n    int total = unit_price * quantity;\n    double share = (double)total / 8;\n    printf(\"%d %.1f\\n\", total, share);\n    return 0;\n}\n",
    "input": "",
    "tests": [
      {
        "name": "Integer total and fractional share",
        "input": "",
        "expected": "28 3.5"
      }
    ],
    "assessment": "Explain why assigning total / 8 to a double would still lose the fraction. Change quantity and reason about the new result; the fixed output check covers the original values only.",
    "example": {
      "code": "int total = 3 * 7;\ndouble share = (double)total / 2;",
      "html": "<p>Example with three items and two people:</p><pre>total = 21\nshare = 10.5</pre>",
      "question": "What is the value of 7 / 2 when both operands are ints?",
      "choices": [
        "3",
        "3.5"
      ],
      "answer": 0,
      "why": "Integer division truncates the fractional part before any later assignment."
    }
  },
  {
    "id": "guess",
    "section": 0,
    "title": "Build a guessing game",
    "chapterId": "control-flow",
    "time": "15–25 min",
    "tag": "Part 1 practice",
    "concept": "For a valid guess below 7, print higher; above 7, print lower.",
    "body": "Combine branches and a loop. The target is 7; guesses from 1 through 10 are valid. The input scaffold handles conversion, range rejection, and end-of-input.",
    "detail": "For this exercise integer tokens are restricted to −1000 through 1000. The numeric scanf scaffold is not a parser for arbitrary-size untrusted numbers. Input is supplied before running, not typed interactively.",
    "task": "For a valid guess below 7, print higher; above 7, print lower. For 7, print correct and stop. Keep the supplied out-of-range, invalid-input, and EOF handling.",
    "hint": "Use if / else if / else. Only the correct branch should break out of the loop.",
    "code": "#include <stdio.h>\n\nint main(void) {\n    int guess;\n    for (;;) {\n        int result = scanf(\"%d\", &guess);\n        if (result == EOF) { puts(\"no more guesses\"); break; }\n        if (result != 1) { puts(\"invalid input\"); break; }\n        if (guess < 1 || guess > 10) { puts(\"out of range\"); continue; }\n        // TODO: compare guess with 7 and keep reading until correct.\n        puts(\"not implemented\");\n        break;\n    }\n    return 0;\n}\n",
    "solution": "#include <stdio.h>\n\nint main(void) {\n    int guess;\n    for (;;) {\n        int result = scanf(\"%d\", &guess);\n        if (result == EOF) { puts(\"no more guesses\"); break; }\n        if (result != 1) { puts(\"invalid input\"); break; }\n        if (guess < 1 || guess > 10) { puts(\"out of range\"); continue; }\n        if (guess < 7) {\n            puts(\"higher\");\n        } else if (guess > 7) {\n            puts(\"lower\");\n        } else {\n            puts(\"correct\");\n            break;\n        }\n    }\n    return 0;\n}\n",
    "input": "2 9 7",
    "tests": [
      {
        "name": "Higher, lower, correct",
        "input": "2 9 7",
        "expected": "higher\nlower\ncorrect"
      },
      {
        "name": "Correct first guess",
        "input": "7 1",
        "expected": "correct"
      },
      {
        "name": "Range checks then correct",
        "input": "0 11 7",
        "expected": "out of range\nout of range\ncorrect"
      },
      {
        "name": "End of input",
        "input": "2",
        "expected": "higher\nno more guesses"
      },
      {
        "name": "No guesses",
        "input": "",
        "expected": "no more guesses"
      },
      {
        "name": "Invalid token",
        "input": "x",
        "expected": "invalid input"
      },
      {
        "name": "Range boundaries",
        "input": "1 10 7",
        "expected": "higher\nlower\ncorrect"
      }
    ],
    "assessment": "Explain why an out-of-range guess uses continue while a correct guess uses break. Trace where the next input read occurs.",
    "example": {
      "code": "int guess = 9;\nif (guess > 7) puts(\"lower\");",
      "html": "<p>For guess 9, the target is lower:</p><pre>lower</pre>",
      "question": "Which statement ends the loop after the correct guess?",
      "choices": [
        "continue",
        "break"
      ],
      "answer": 1,
      "why": "break leaves the loop. continue starts another iteration."
    }
  },
  {
    "id": "functions",
    "section": 0,
    "title": "Build a rectangle calculator",
    "chapterId": "functions",
    "time": "15–25 min",
    "tag": "Part 1 practice",
    "concept": "Implement area and perimeter.",
    "body": "Write two computations that take dimensions as arguments and return results. main owns input validation and output; the helpers should not read or print.",
    "detail": "Valid dimensions are between 1 and 100. For the input scaffold, integer tokens are bounded to −1000 through 1000. Invalid or missing dimensions produce invalid.",
    "task": "Implement area and perimeter. Print area first, then perimeter, using the supplied main.",
    "hint": "Area is width * height. Perimeter is twice the sum of the two dimensions.",
    "code": "#include <stdio.h>\n\nint area(int width, int height) {\n    // TODO: return the rectangle area.\n    return 0;\n}\n\nint perimeter(int width, int height) {\n    // TODO: return the rectangle perimeter.\n    return 0;\n}\n\nint main(void) {\n    int width, height;\n    if (scanf(\"%d %d\", &width, &height) != 2 ||\n        width < 1 || width > 100 || height < 1 || height > 100) {\n        puts(\"invalid\");\n        return 0;\n    }\n    printf(\"%d %d\\n\", area(width, height), perimeter(width, height));\n    return 0;\n}\n",
    "solution": "#include <stdio.h>\n\nint area(int width, int height) {\n    return width * height;\n}\n\nint perimeter(int width, int height) {\n    return 2 * (width + height);\n}\n\nint main(void) {\n    int width, height;\n    if (scanf(\"%d %d\", &width, &height) != 2 ||\n        width < 1 || width > 100 || height < 1 || height > 100) {\n        puts(\"invalid\");\n        return 0;\n    }\n    printf(\"%d %d\\n\", area(width, height), perimeter(width, height));\n    return 0;\n}\n",
    "input": "3 4",
    "tests": [
      {
        "name": "Rectangle",
        "input": "3 4",
        "expected": "12 14"
      },
      {
        "name": "Smallest dimensions",
        "input": "1 1",
        "expected": "1 4"
      },
      {
        "name": "Largest dimensions",
        "input": "100 100",
        "expected": "10000 400"
      },
      {
        "name": "Unequal sides",
        "input": "2 9",
        "expected": "18 22"
      },
      {
        "name": "Invalid dimension",
        "input": "0 4",
        "expected": "invalid"
      },
      {
        "name": "Missing input",
        "input": "",
        "expected": "invalid"
      }
    ],
    "assessment": "Explain why these functions do not need access to stdin or stdout. Give one test for each boundary of the input contract.",
    "example": {
      "code": "int area(int width, int height) {\n    return width * height;\n}",
      "html": "<p>For width 2 and height 5:</p><pre>area(2, 5) → 10</pre>",
      "question": "What does changing a parameter inside a helper change?",
      "choices": [
        "That parameter copy",
        "The caller’s variable automatically"
      ],
      "answer": 0,
      "why": "Arguments are passed by value. The parameter has a value of its own."
    }
  },
  {
    "id": "textstats",
    "section": 0,
    "title": "Count characters and words",
    "chapterId": "arrays-strings",
    "time": "15–25 min",
    "tag": "Part 1 practice",
    "concept": "Implement the two counters inside the loop.",
    "body": "Process the first ASCII input line, at most 127 bytes before its newline. Count characters including spaces and tabs, but exclude the newline. Count each maximal non-whitespace run as one word.",
    "detail": "An empty input has zero characters and zero words. This exercise counts bytes, not Unicode characters, and does not assemble lines longer than the buffer. Cast each character to unsigned char before passing it to isspace.",
    "task": "Implement the two counters inside the loop. Print characters first and words second, using the supplied printf.",
    "hint": "Increment characters for every loop iteration. Whitespace clears in_word; a non-whitespace character starts a word only when in_word was false.",
    "code": "#include <stdio.h>\n#include <stdbool.h>\n#include <ctype.h>\n\nint main(void) {\n    char line[128];\n    int characters = 0, words = 0;\n    bool in_word = false;\n    if (fgets(line, sizeof line, stdin) != NULL) {\n        for (size_t i = 0; line[i] != '\\0' && line[i] != '\\n'; i++) {\n            // TODO: count this character and detect the start of a word.\n        }\n    }\n    printf(\"%d %d\\n\", characters, words);\n    return 0;\n}\n",
    "solution": "#include <stdio.h>\n#include <stdbool.h>\n#include <ctype.h>\n\nint main(void) {\n    char line[128];\n    int characters = 0, words = 0;\n    bool in_word = false;\n    if (fgets(line, sizeof line, stdin) != NULL) {\n        for (size_t i = 0; line[i] != '\\0' && line[i] != '\\n'; i++) {\n            characters++;\n            if (isspace((unsigned char)line[i])) {\n                in_word = false;\n            } else if (!in_word) {\n                words++;\n                in_word = true;\n            }\n        }\n    }\n    printf(\"%d %d\\n\", characters, words);\n    return 0;\n}\n",
    "input": "C is fun\n",
    "tests": [
      {
        "name": "Three words",
        "input": "C is fun\n",
        "expected": "8 3"
      },
      {
        "name": "Repeated and edge spaces",
        "input": "  hi  C  \n",
        "expected": "9 2"
      },
      {
        "name": "Tab separators",
        "input": "\tC\tlab\n",
        "expected": "6 2"
      },
      {
        "name": "Whitespace only",
        "input": " \t \n",
        "expected": "3 0"
      },
      {
        "name": "Empty input",
        "input": "",
        "expected": "0 0"
      },
      {
        "name": "Line without final newline",
        "input": "abc",
        "expected": "3 1"
      }
    ],
    "assessment": "Explain why repeated whitespace does not add words and why the cast before isspace matters. Describe the buffer-length and ASCII limits.",
    "example": {
      "code": "// C is fun\n// Characters: C, space, i, s, space, f, u, n\n// Word starts: C, i, f",
      "html": "<pre>characters = 8\nwords = 3</pre>",
      "question": "Does every space increase the word count?",
      "choices": [
        "Yes",
        "No"
      ],
      "answer": 1,
      "why": "Words begin when a non-whitespace character follows the start of input or a whitespace run."
    }
  },
  {
    "id": "grow",
    "section": 0,
    "chapterId": "allocation",
    "title": "Build a growable int array",
    "time": "25 min",
    "tag": "Part 2 practice",
    "concept": "Keep length, capacity, and ownership separate.",
    "body": "Implement push for an int buffer. Grow when the initialized length reaches capacity, and preserve the original owner if allocation fails.",
    "detail": "The supplied parser accepts one integer from 0 through 16. The array starts empty. The caller supplies valid pointer arguments and releases its allocation on success or failure.",
    "task": "Complete push so the program builds the values 1 through the requested count. Use checked capacity arithmetic and a temporary realloc result. Do not change length on a failed push.",
    "hint": "When full, grow capacity from zero to 4, then double it with overflow checks. After successful growth, replace the owner. Finally store through (*values)[*length] and increment length.",
    "code": "#include <stdio.h>\n#include <stdlib.h>\n#include <stdbool.h>\n#include <stdint.h>\n#include <errno.h>\n#include <string.h>\n\nbool push(int **values, size_t *length, size_t *capacity, int value) {\n    (void)values; (void)length; (void)capacity; (void)value;\n    // TODO: grow safely if full, then store value and increase length.\n    return false;\n}\n\nint main(void) {\n    char line[64], *end;\n    if (!fgets(line, sizeof line, stdin)) { puts(\"invalid\"); return 0; }\n    line[strcspn(line, \"\\r\\n\")] = '\\0';\n    errno = 0;\n    long count = strtol(line, &end, 10);\n    if (errno == ERANGE || end == line || *end != '\\0' || count < 0 || count > 16) {\n        puts(\"invalid\"); return 0;\n    }\n    int *values = NULL;\n    size_t length = 0, capacity = 0;\n    for (long i = 0; i < count; i++) {\n        if (!push(&values, &length, &capacity, (int)i + 1)) {\n            free(values); puts(\"allocation failed\"); return 0;\n        }\n    }\n    printf(\"%zu |\", length);\n    for (size_t i = 0; i < length; i++) printf(\" %d\", values[i]);\n    puts(\"\");\n    free(values);\n    return 0;\n}\n",
    "solution": "#include <stdio.h>\n#include <stdlib.h>\n#include <stdbool.h>\n#include <stdint.h>\n#include <errno.h>\n#include <string.h>\n\nbool push(int **values, size_t *length, size_t *capacity, int value) {\n    if (*length == *capacity) {\n        if (*capacity > SIZE_MAX / 2) return false;\n        size_t next = *capacity ? *capacity * 2 : 4;\n        if (next > SIZE_MAX / sizeof **values) return false;\n        int *grown = realloc(*values, next * sizeof **values);\n        if (!grown) return false;\n        *values = grown;\n        *capacity = next;\n    }\n    (*values)[(*length)++] = value;\n    return true;\n}\n\nint main(void) {\n    char line[64], *end;\n    if (!fgets(line, sizeof line, stdin)) { puts(\"invalid\"); return 0; }\n    line[strcspn(line, \"\\r\\n\")] = '\\0';\n    errno = 0;\n    long count = strtol(line, &end, 10);\n    if (errno == ERANGE || end == line || *end != '\\0' || count < 0 || count > 16) {\n        puts(\"invalid\"); return 0;\n    }\n    int *values = NULL;\n    size_t length = 0, capacity = 0;\n    for (long i = 0; i < count; i++) {\n        if (!push(&values, &length, &capacity, (int)i + 1)) {\n            free(values); puts(\"allocation failed\"); return 0;\n        }\n    }\n    printf(\"%zu |\", length);\n    for (size_t i = 0; i < length; i++) printf(\" %d\", values[i]);\n    puts(\"\");\n    free(values);\n    return 0;\n}\n",
    "input": "5",
    "tests": [
      {
        "name": "Empty",
        "input": "0",
        "expected": "0 |"
      },
      {
        "name": "One value",
        "input": "1",
        "expected": "1 | 1"
      },
      {
        "name": "Grow past initial capacity",
        "input": "5",
        "expected": "5 | 1 2 3 4 5"
      },
      {
        "name": "Two growth boundaries",
        "input": "12",
        "expected": "12 | 1 2 3 4 5 6 7 8 9 10 11 12"
      },
      {
        "name": "Upper bound",
        "input": "16",
        "expected": "16 | 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16"
      },
      {
        "name": "Outside range",
        "input": "17",
        "expected": "invalid"
      },
      {
        "name": "Malformed count",
        "input": "abc",
        "expected": "invalid"
      },
      {
        "name": "Trailing junk",
        "input": "5x",
        "expected": "invalid"
      }
    ],
    "assessment": "Output checks do not prove ownership or exercise allocator failure. Review the temporary realloc owner, overflow checks, cleanup paths, and length/capacity invariant.",
    "example": {
      "code": "// Push into an empty buffer.\n// Grow capacity to 4, store 1, then set length to 1.",
      "html": "<pre>length=1\ncapacity=4\nvalues[0]=1</pre>",
      "question": "Does unused capacity contain initialized logical elements?",
      "choices": [
        "Yes",
        "No"
      ],
      "answer": 1,
      "why": "Length counts initialized elements; capacity is only reserved storage."
    }
  },
  {
    "id": "records",
    "section": 0,
    "chapterId": "structured-data",
    "title": "Update a record collection",
    "time": "25 min",
    "tag": "Part 2 practice",
    "concept": "Use an explicit status and a bounded embedded string.",
    "body": "Find a row by ID and replace its name without overflowing the embedded 32-char array. Return distinct results for success, a missing ID, and an invalid name.",
    "detail": "The input scaffold reads a positive int ID on the first line and a name on the second. Input lines are at most 63 bytes. A valid name contains 1–31 bytes; it can contain spaces. The supplied collection contains IDs 1, 2, and 3.",
    "task": "Implement update_name. Reject an empty or overlong name before modifying any row, then find the ID and copy the name including its terminator. Leave the collection unchanged on failure.",
    "hint": "Compare strlen(name) with sizeof rows[0].name. After finding the matching index, memcpy the checked length plus one and return UPDATED.",
    "code": "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <errno.h>\n#include <limits.h>\n\ntypedef struct { int id; char name[32]; } Row;\ntypedef enum { UPDATED, NOT_FOUND, BAD_NAME } Result;\n\nResult update_name(Row *rows, size_t count, int id, const char *name) {\n    (void)rows; (void)count; (void)id; (void)name;\n    // TODO: validate the name, find the ID, and copy the complete string.\n    return NOT_FOUND;\n}\n\nint main(void) {\n    Row rows[] = {{1, \"Ada\"}, {2, \"Grace\"}, {3, \"Linus\"}};\n    char id_line[64], name[64], *end;\n    if (!fgets(id_line, sizeof id_line, stdin)) { puts(\"invalid id\"); return 0; }\n    id_line[strcspn(id_line, \"\\r\\n\")] = '\\0';\n    errno = 0;\n    long id = strtol(id_line, &end, 10);\n    if (errno == ERANGE || end == id_line || *end != '\\0' || id < 1 || id > INT_MAX) {\n        puts(\"invalid id\"); return 0;\n    }\n    if (!fgets(name, sizeof name, stdin)) { puts(\"invalid name\"); return 0; }\n    name[strcspn(name, \"\\r\\n\")] = '\\0';\n    Result result = update_name(rows, 3, (int)id, name);\n    if (result == BAD_NAME) puts(\"invalid name\");\n    else if (result == NOT_FOUND) puts(\"not found\");\n    else {\n        for (size_t i = 0; i < 3; i++) {\n            if (rows[i].id == id) printf(\"%d | %s\\n\", rows[i].id, rows[i].name);\n        }\n    }\n    return 0;\n}\n",
    "solution": "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <errno.h>\n#include <limits.h>\n\ntypedef struct { int id; char name[32]; } Row;\ntypedef enum { UPDATED, NOT_FOUND, BAD_NAME } Result;\n\nResult update_name(Row *rows, size_t count, int id, const char *name) {\n    if (!name || strlen(name) == 0 || strlen(name) >= sizeof rows[0].name) return BAD_NAME;\n    for (size_t i = 0; i < count; i++) {\n        if (rows[i].id == id) {\n            memcpy(rows[i].name, name, strlen(name) + 1);\n            return UPDATED;\n        }\n    }\n    return NOT_FOUND;\n}\n\nint main(void) {\n    Row rows[] = {{1, \"Ada\"}, {2, \"Grace\"}, {3, \"Linus\"}};\n    char id_line[64], name[64], *end;\n    if (!fgets(id_line, sizeof id_line, stdin)) { puts(\"invalid id\"); return 0; }\n    id_line[strcspn(id_line, \"\\r\\n\")] = '\\0';\n    errno = 0;\n    long id = strtol(id_line, &end, 10);\n    if (errno == ERANGE || end == id_line || *end != '\\0' || id < 1 || id > INT_MAX) {\n        puts(\"invalid id\"); return 0;\n    }\n    if (!fgets(name, sizeof name, stdin)) { puts(\"invalid name\"); return 0; }\n    name[strcspn(name, \"\\r\\n\")] = '\\0';\n    Result result = update_name(rows, 3, (int)id, name);\n    if (result == BAD_NAME) puts(\"invalid name\");\n    else if (result == NOT_FOUND) puts(\"not found\");\n    else {\n        for (size_t i = 0; i < 3; i++) {\n            if (rows[i].id == id) printf(\"%d | %s\\n\", rows[i].id, rows[i].name);\n        }\n    }\n    return 0;\n}\n",
    "input": "2\nGrace Hopper\n",
    "tests": [
      {
        "name": "Matching row",
        "input": "2\nGrace Hopper\n",
        "expected": "2 | Grace Hopper"
      },
      {
        "name": "First row",
        "input": "1\nAda Lovelace\n",
        "expected": "1 | Ada Lovelace"
      },
      {
        "name": "Absent ID",
        "input": "99\nSomeone\n",
        "expected": "not found"
      },
      {
        "name": "Empty name",
        "input": "2\n\n",
        "expected": "invalid name"
      },
      {
        "name": "Maximum name",
        "input": "3\nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n",
        "expected": "3 | xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      },
      {
        "name": "Name too long",
        "input": "3\nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n",
        "expected": "invalid name"
      },
      {
        "name": "Bad ID",
        "input": "bad\nName\n",
        "expected": "invalid id"
      }
    ],
    "assessment": "Explain the embedded string’s capacity and why the terminator is included in the copy. Output checks alone do not establish that every failure leaves the collection unchanged.",
    "example": {
      "code": "// Row 2 before: {2, \"Grace\"}\n// After a validated copy: {2, \"Grace Hopper\"}",
      "html": "<pre>2 | Grace Hopper</pre>",
      "question": "Does a name of 32 text characters fit in char name[32] as a C string?",
      "choices": [
        "Yes",
        "No"
      ],
      "answer": 1,
      "why": "The zero terminator needs a further element; at most 31 text chars fit."
    }
  },
  {
    "id": "arithmetic",
    "section": 0,
    "chapterId": "c-guarantees",
    "title": "Build a checked integer calculator",
    "time": "35 min",
    "tag": "Numeric boundaries",
    "concept": "Reject unrepresentable results before evaluating them.",
    "body": "Implement calculate for +, -, *, /, and %. It accepts int operands and a valid output pointer. Return false for zero divisors, an unrepresentable quotient or result, and unknown operations. Leave the output unchanged on every rejection.",
    "detail": "The scaffold reads an operator and two integer lines using checked strtol parsing. Fixtures use the 32-bit int range of the supported native and Wasm targets. Your implementation should derive guards from INT_MIN and INT_MAX rather than hardcoded bounds. A successful guard must itself avoid invalid arithmetic.",
    "task": "Implement the five operations. Guard addition, subtraction, and all product-sign combinations before evaluating them. Reject the exceptional INT_MIN/-1 quotient and remainder when the positive result cannot fit. Use return values to distinguish rejection from a legitimate zero.",
    "hint": "For addition, compare a against INT_MAX-b or INT_MIN-b only in the corresponding safe sign branch. Split multiplication by operand signs. For / and %, test zero and an unrepresentable quotient first; % shares the exceptional quotient rule.",
    "code": "#include <stdio.h>\n#include <stdlib.h>\n#include <stdbool.h>\n#include <string.h>\n#include <errno.h>\n#include <limits.h>\n\nbool calculate(char operation,int a,int b,int *out){\n    (void)operation;(void)a;(void)b;(void)out;\n    // TODO: reject an invalid result before evaluating the arithmetic.\n    return false;\n}\n\nbool read_integer(int *out){\n    char line[64],*end;\n    if(!fgets(line,sizeof line,stdin)||(!strchr(line,'\\n')&&!feof(stdin)))return false;\n    line[strcspn(line,\"\\r\\n\")]=0;errno=0;long value=strtol(line,&end,10);\n    if(errno==ERANGE||end==line||*end||value<INT_MIN||value>INT_MAX)return false;\n    *out=(int)value;return true;\n}\nint main(void){\n    char operation[16];int a,b,result=0;\n    if(!fgets(operation,sizeof operation,stdin)){puts(\"invalid\");return 0;}\n    operation[strcspn(operation,\"\\r\\n\")]=0;\n    if(strlen(operation)!=1||!strchr(\"+-*/%\",operation[0])||!read_integer(&a)||!read_integer(&b)){\n        puts(\"invalid\");return 0;\n    }\n    if(calculate(operation[0],a,b,&result))printf(\"result=%d\\n\",result);\n    else puts(\"rejected\");\n    return 0;\n}\n",
    "solution": "#include <stdio.h>\n#include <stdlib.h>\n#include <stdbool.h>\n#include <string.h>\n#include <errno.h>\n#include <limits.h>\n\nbool checked_add(int a,int b,int *out){\n    if((b>0&&a>INT_MAX-b)||(b<0&&a<INT_MIN-b))return false;\n    *out=a+b;return true;\n}\nbool checked_subtract(int a,int b,int *out){\n    if((b>0&&a<INT_MIN+b)||(b<0&&a>INT_MAX+b))return false;\n    *out=a-b;return true;\n}\nbool checked_multiply(int a,int b,int *out){\n    if(a>0){if((b>0&&a>INT_MAX/b)||(b<0&&b<INT_MIN/a))return false;}\n    else if(a<0){if((b>0&&a<INT_MIN/b)||(b<0&&a<INT_MAX/b))return false;}\n    *out=a*b;return true;\n}\nbool checked_negate(int value,int *out){\n    if(value < -INT_MAX)return false;\n    *out=-value;return true;\n}\nbool checked_divrem(int a,int b,int *quotient,int *remainder){\n    if(b==0||(b==-1&&a < -INT_MAX))return false;\n    int q=a/b,r=a%b;\n    *quotient=q;*remainder=r;return true;\n}\nbool calculate(char operation,int a,int b,int *out){\n    switch(operation){\n        case '+':return checked_add(a,b,out);\n        case '-':return checked_subtract(a,b,out);\n        case '*':return checked_multiply(a,b,out);\n        case '/':case '%':{\n            int quotient,remainder;\n            if(!checked_divrem(a,b,&quotient,&remainder))return false;\n            *out=operation=='/'?quotient:remainder;return true;\n        }\n        default:return false;\n    }\n}\n\nbool read_integer(int *out){\n    char line[64],*end;\n    if(!fgets(line,sizeof line,stdin)||(!strchr(line,'\\n')&&!feof(stdin)))return false;\n    line[strcspn(line,\"\\r\\n\")]=0;errno=0;long value=strtol(line,&end,10);\n    if(errno==ERANGE||end==line||*end||value<INT_MIN||value>INT_MAX)return false;\n    *out=(int)value;return true;\n}\nint main(void){\n    char operation[16];int a,b,result=0;\n    if(!fgets(operation,sizeof operation,stdin)){puts(\"invalid\");return 0;}\n    operation[strcspn(operation,\"\\r\\n\")]=0;\n    if(strlen(operation)!=1||!strchr(\"+-*/%\",operation[0])||!read_integer(&a)||!read_integer(&b)){\n        puts(\"invalid\");return 0;\n    }\n    if(calculate(operation[0],a,b,&result))printf(\"result=%d\\n\",result);\n    else puts(\"rejected\");\n    return 0;\n}\n",
    "input": "*\n-7\n6",
    "tests": [
      {
        "name": "Addition endpoint",
        "input": "+\n2147483647\n0",
        "expected": "result=2147483647"
      },
      {
        "name": "Positive addition overflow",
        "input": "+\n2147483647\n1",
        "expected": "rejected"
      },
      {
        "name": "Negative addition overflow",
        "input": "+\n-2147483648\n-1",
        "expected": "rejected"
      },
      {
        "name": "Mixed-sign sum",
        "input": "+\n-2147483648\n2147483647",
        "expected": "result=-1"
      },
      {
        "name": "Subtraction below minimum",
        "input": "-\n-2147483648\n1",
        "expected": "rejected"
      },
      {
        "name": "Subtraction above maximum",
        "input": "-\n2147483647\n-1",
        "expected": "rejected"
      },
      {
        "name": "Subtract minimum from itself",
        "input": "-\n-2147483648\n-2147483648",
        "expected": "result=0"
      },
      {
        "name": "Product at maximum",
        "input": "*\n2147483647\n1",
        "expected": "result=2147483647"
      },
      {
        "name": "Positive product fits",
        "input": "*\n46340\n46340",
        "expected": "result=2147395600"
      },
      {
        "name": "Positive product overflows",
        "input": "*\n46341\n46341",
        "expected": "rejected"
      },
      {
        "name": "Negative product fits",
        "input": "*\n-46340\n46340",
        "expected": "result=-2147395600"
      },
      {
        "name": "Negative product overflows",
        "input": "*\n-46341\n46341",
        "expected": "rejected"
      },
      {
        "name": "Both-negative product overflows",
        "input": "*\n-2147483648\n-1",
        "expected": "rejected"
      },
      {
        "name": "Zero product",
        "input": "*\n-2147483648\n0",
        "expected": "result=0"
      },
      {
        "name": "Truncating quotient",
        "input": "/\n7\n-3",
        "expected": "result=-2"
      },
      {
        "name": "Minimum divided by one",
        "input": "/\n-2147483648\n1",
        "expected": "result=-2147483648"
      },
      {
        "name": "Exceptional quotient",
        "input": "/\n-2147483648\n-1",
        "expected": "rejected"
      },
      {
        "name": "Zero divisor",
        "input": "/\n7\n0",
        "expected": "rejected"
      },
      {
        "name": "Dividend-signed remainder",
        "input": "%\n-7\n3",
        "expected": "result=-1"
      },
      {
        "name": "Exceptional remainder",
        "input": "%\n-2147483648\n-1",
        "expected": "rejected"
      },
      {
        "name": "Remainder by zero",
        "input": "%\n7\n0",
        "expected": "rejected"
      },
      {
        "name": "Malformed number",
        "input": "+\n1x\n2",
        "expected": "invalid"
      },
      {
        "name": "Number out of range",
        "input": "+\n2147483648\n0",
        "expected": "invalid"
      },
      {
        "name": "Unknown operator",
        "input": "?\n1\n2",
        "expected": "invalid"
      }
    ],
    "assessment": "Output checks exercise supported-target boundaries but do not prove the absence of undefined behavior. Review each guard’s own arithmetic and output preservation. Native oracle checks additionally compare cross-products with arbitrary-precision results under sanitizers.",
    "example": {
      "code": "// Safe subtraction keeps the check before the operation.\n// For b > 0: reject if a < INT_MIN + b.\n// Only then evaluate a - b.",
      "html": "<pre>INT_MIN - 1 → rejected\n7 - 3 → result=4</pre>",
      "question": "May a rejected calculation overwrite its output?",
      "choices": [
        "No; keep the earlier value",
        "Yes; the Boolean result makes any overwrite harmless"
      ],
      "answer": 0,
      "why": "The documented interface preserves its caller’s output on rejection."
    }
  }
];

window.SECTIONS = [
  {
    "title": "The language",
    "subtitle": "Think in C",
    "icon": "01",
    "description": "From your first printf to pointers and memory ownership.",
    "topics": "Types · operators · control flow · functions · arrays · strings · pointers · allocation"
  },
  {
    "title": "The algorithms",
    "subtitle": "Make it efficient",
    "icon": "02",
    "description": "Learn to reason about correctness, complexity, and data.",
    "topics": "Big O · time & space · searching · sorting · recursion · lists · stacks · queues · hashes · trees · graphs"
  },
  {
    "title": "The database",
    "subtitle": "Build something real",
    "icon": "03",
    "description": "Bring it all together, one database feature at a time.",
    "topics": "Structs · parsing · tables · binary files · pages · indexes · query execution · transactions"
  }
];
