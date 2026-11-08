# Chapter 5: Arrays and strings

Part 1: Learn the language. Teaching baseline: C17.

Represent collections and text without losing track of bounds. Finish Part 1 by processing one line of input with an explicit buffer size and a clear definition of a word.

## Outcomes

- Traverse an array using its element count without stepping outside it.
- Distinguish string length, terminator, and destination capacity.
- Read a bounded line and count ASCII characters and whitespace-delimited words.

## 5.1 Array indexing and bounds

An array stores a fixed number of elements of one type in contiguous storage. Its valid indexes begin at zero and stop one before its element count.

An array of five ints has valid indexes 0 through 4. Accessing element 5 is outside the array, even if the program appears to continue. C does not automatically check these bounds. When the actual array declaration is in scope, sizeof array divided by sizeof array[0] gives its element count. That technique does not recover a count from a function parameter that has adjusted to a pointer; pass lengths explicitly when Part 2 introduces those interfaces.

### main.c

```c
#include <stdio.h>

int main(void) {
    int values[] = {1, 2, 3, 4, 5};
    size_t count = sizeof values / sizeof values[0];
    int total = 0;
    for (size_t i = 0; i < count; i++) {
        total += values[i];
    }
    printf("%d\n", total);
    return 0;
}
```

Output:

```text
15
```

The initializer determines a five-element array. sizeof reports sizes in bytes and produces size_t, a standard unsigned size type. The loop uses i < count, so it visits each element once without reaching the invalid index count. The total fits in int for these particular data values.

**Watch for:** An out-of-bounds read is not a legitimate way to inspect what happens to be nearby. It has undefined behavior. When debugging, inspect both the index and the length that is supposed to constrain it.

**Check:** What is the last valid index of this five-element array?

1. 4
2. 5
3. 6

<details><summary>Answer</summary>

4. The first element is at zero, so the last valid index is count - 1.

</details>

**Try:** Change the initializer to three values and confirm that count and the loop adapt without a hardcoded bound.

Run from the repository root:

```sh
make example EXAMPLE=arrays-strings-1
```

## 5.2 Character arrays and zero termination

A C string is a sequence of characters terminated by a zero byte. A character array can hold a string, but an arbitrary character array is not automatically terminated.

The initializer `char word[] = "cat";` reserves four elements: c, a, t, and the terminating zero. `strlen` counts characters before the first zero; sizeof word reports the storage size of this declared array. strlen requires a valid terminated string and may otherwise read outside the object. String length and available buffer capacity are different quantities that must be tracked deliberately.

### main.c

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char word[] = "cat";
    printf("length=%zu capacity=%zu\n", strlen(word), sizeof word);
    return 0;
}
```

Output:

```text
length=3 capacity=4
```

strlen returns 3 because the terminator is not part of the text. sizeof reports 4 bytes because the char array includes it. %zu is the printf conversion for size_t. Replacing the first character with a zero would make the string empty while leaving the array’s capacity unchanged.

**Watch for:** The literal '\0' is the zero character used as a terminator; '0' is the printable digit character. Confusing them changes the contents and can leave a buffer unterminated.

**Check:** How much room is required to store the string "cat" including its terminator?

1. 3 chars
2. 4 chars

<details><summary>Answer</summary>

4 chars. Three text characters plus one zero terminator require four char elements.

</details>

**Try:** Set word[1] to '\0'. Predict strlen and sizeof before running the edited example.

Run from the repository root:

```sh
make example EXAMPLE=arrays-strings-2
```

## 5.3 Reading lines with fgets

Reading a complete line is often more useful than reading a whitespace-delimited word. fgets accepts a destination buffer and its capacity, limiting how much it writes.

With a positive capacity of at least two, fgets reads at most capacity minus one characters, keeps a newline if it fits, and appends a zero terminator on success. It returns NULL when it cannot return a string, such as end-of-input before any characters. It can also return a partial line when the buffer fills first. Check its result before using the buffer, and do not assume every successful call consumed a whole logical line.

### main.c

```c
#include <stdio.h>

int main(void) {
    char line[32];
    if (fgets(line, sizeof line, stdin) == NULL) {
        puts("no line");
        return 0;
    }
    printf("Read: %s", line);
    return 0;
}
```

Input: `Ada Lovelace`

Output:

```text
Read: Ada Lovelace
```

The sample input contains a space, which fgets retains. Because it also retains the trailing newline, printf does not add a second one. The result check avoids reading uninitialized line contents when no input exists. The capacity here is a small fixed array size, which fits the int parameter expected by fgets.

**Watch for:** Truncation needs an explicit policy: reject a long line, collect its remaining pieces, or intentionally work on chunks. This example reads one chunk; it is not a complete line-reading library.

**Check:** Can a successful fgets call return only part of a long line?

1. Yes
2. No

<details><summary>Answer</summary>

Yes. The capacity bounds each read. A long logical line can need more than one read.

</details>

**Try:** Try an empty Input panel, then a line longer than 31 characters. Observe success, EOF, and the capacity limit.

Run from the repository root:

```sh
make example EXAMPLE=arrays-strings-3
```

## 5.4 String comparison, copying, and parsing

String operations need both a valid terminator and an understanding of destination capacity. Use library functions according to their contracts rather than assuming the names imply safety.

`strcmp` compares string contents and promises a negative, zero, or positive result. The == operator does not compare string contents. A copy also needs enough destination capacity, including the terminator. snprintf reports how many characters it would have written, so a result at least as large as the capacity signals truncation. For numeric text, strtol supplies both a long result and the location where conversion stopped. That location is stored in a pointer named end; Part 2 explains the address mechanics. Here, follow the library contract to detect empty conversions, unwanted suffixes, and range failures.

### main.c

```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <errno.h>
#include <limits.h>

int main(void) {
    char copy[8];
    int written = snprintf(copy, sizeof copy, "%s", "Ada");
    if (written < 0 || (size_t)written >= sizeof copy) {
        puts("copy did not fit");
        return 0;
    }
    printf("same=%d copy=%s\n", strcmp(copy, "Ada") == 0, copy);

    char text[] = "42";
    char *end;
    errno = 0;
    long parsed = strtol(text, &end, 10);
    if (errno == ERANGE || end == text || *end != '\0' ||
        parsed < INT_MIN || parsed > INT_MAX) {
        puts("invalid integer");
    } else {
        printf("number=%d\n", (int)parsed);
    }
    return 0;
}
```

Output:

```text
same=1 copy=Ada
number=42
```

Ada fits in eight chars including its terminator, so the copy and comparison succeed. For the numeric text, reset errno before calling strtol with base 10. ERANGE signals a long-range failure. end == text means no conversion occurred, while *end != '\0' rejects an unconsumed suffix. Finally, check the int range before casting. Leading whitespace is accepted by strtol; this example deliberately rejects trailing whitespace or any other suffix. The address notation is introduced here as library scaffolding and developed fully in Part 2.

**Watch for:** A successful prefix conversion is not necessarily a valid whole input: "42x" begins with a number but fails this parser’s policy. Do not replace these checks with atoi, which does not provide the same error information. Likewise, a bounded copy can still truncate meaningful text, and strcmp need not return exactly -1 or 1.

**Check:** What does strcmp(a, b) == 0 mean for two valid strings?

1. They have equal contents
2. They use the same storage address

<details><summary>Answer</summary>

They have equal contents. strcmp compares the characters, not whether both expressions designate the same array.

</details>

**Try:** Change text to "42x", an empty string, and a number too large for long. Explain which checks reject them. Then make the copied name too long for the destination.

Run from the repository root:

```sh
make example EXAMPLE=arrays-strings-4
```

## 5.5 Text statistics and word counting

The chapter project counts characters and words in the first line of input. Define those words precisely before writing the loop: otherwise output disagreements may come from an unclear specification rather than a faulty implementation.

For this exercise, input is ASCII and the first line contains at most 127 bytes. Count every byte before a newline as a character, including spaces and tabs. A word is a maximal run of non-whitespace characters. Keep a Boolean in_word flag: when a non-whitespace character arrives while the flag is false, a new word begins. A whitespace character clears the flag. Passing an unsigned-char value to isspace avoids invalid negative char arguments.

### main.c

```c
#include <stdio.h>
#include <stdbool.h>
#include <ctype.h>

int main(void) {
    char line[128];
    int words = 0;
    bool in_word = false;
    if (fgets(line, sizeof line, stdin) != NULL) {
        for (size_t i = 0; line[i] != '\0' && line[i] != '\n'; i++) {
            if (isspace((unsigned char)line[i])) {
                in_word = false;
            } else if (!in_word) {
                words++;
                in_word = true;
            }
        }
    }
    printf("words=%d\n", words);
    return 0;
}
```

Input: `C is fun`

Output:

```text
words=3
```

For C is fun, each first letter after a boundary increases the word count; letters later in the same word do not. Multiple adjacent spaces therefore do not create extra words. The example counts words only. Your exercise adds a character counter while keeping the newline excluded. Test an empty input, whitespace-only input, and repeated spaces.

**Watch for:** This is byte-oriented ASCII processing, not a Unicode word segmenter. A long line is read only up to the buffer limit; the exercise’s contract avoids that truncation case, while a later robust input library must handle it.

**Check:** How many words does "  C   lab  " contain under this definition?

1. 2
2. 3
3. Every space creates a word

<details><summary>Answer</summary>

2. Only transitions from whitespace to non-whitespace start a word.

</details>

**Try:** Open the text-statistics exercise and implement both counters. Explain the purpose of the in_word flag.

Run from the repository root:

```sh
make example EXAMPLE=arrays-strings-5
```

## Chapter practice

Edit `native/exercises/textstats.c`.

```sh
make exercise EXERCISE=textstats
```

Chapter workspace command: `make chapter CHAPTER=arrays-strings`.

Generated from dist/part1.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/arrays-strings
