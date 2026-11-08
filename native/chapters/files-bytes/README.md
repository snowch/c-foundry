# Chapter 10: Files, bytes, and reliable C

Part 2: Understand memory and practical C. Teaching baseline: C17.

Move from in-memory objects to explicitly encoded bytes. Check stream operations, investigate invariants with native tools, and finish with a documented record format.

## Outcomes

- Manage FILE resources and distinguish buffering from durability.
- Use unsigned masks and explicit endian encoding.
- Validate a binary record format with fixtures, malformed input, and native diagnostics.

## 10.1 Text and binary file I/O

A FILE stream combines an underlying resource with buffering and state. Opening a stream creates a cleanup obligation even when a later operation fails.

Check open, read, write, positioning, and close results according to their contracts. Text and binary modes can differ across platforms; use rb and wb for a binary format. This temporary update stream demonstrates writing and then repositioning before reading. Reaching EOF and encountering an I/O error are different conditions; use feof and ferror to distinguish them when a read stops.

### main.c

```c
#include <stdio.h>

int main(void) {
    FILE *file = tmpfile();
    if (!file) return 1;
    if (fputs("Ada\n", file) == EOF || fflush(file) != 0 ||
        fseek(file, 0, SEEK_SET) != 0) { fclose(file); return 1; }
    char line[16];
    if (!fgets(line, sizeof line, file)) { fclose(file); return 1; }
    printf("%s", line);
    if (fclose(file) != 0) return 1;
    return 0;
}
```

Output:

```text
Ada
```

tmpfile creates a temporary binary update stream. The program checks the write, flushes buffered data, seeks back to the start, and reads the line. fclose releases the stream and removes its temporary file. Every path after a successful open attempts to close it.

**Watch for:** Successful fprintf or fwrite can mean bytes reached a library buffer, not that they are durable on storage. Durability needs platform-specific guarantees discussed with the database log.

**Check:** Does a buffered successful write alone prove crash durability?

1. Yes
2. No

<details><summary>Answer</summary>

No. Buffering and persistence are different stages; even flush is not a universal crash-durability guarantee.

</details>

**Try:** Inspect feof and ferror after deliberately attempting another read at end-of-file.

Run from the repository root:

```sh
make example EXAMPLE=files-bytes-1
```

## 10.2 Fixed-width integers, bitwise operations, and masks

Bitwise operators manipulate the representation of unsigned values. Use them to define flags and packed fields deliberately, with shifts constrained to the type’s width.

OR sets mask bits, AND selects them, XOR toggles them, and complement inverts them. Fixed-width uint32_t is available on our target platforms; its existence is a format requirement, not a promise for every imaginable C implementation. Use a suitably typed unsigned left operand for shifts and keep the shift count below the width. inttypes.h supplies portable printf format macros for fixed-width types.

### main.c

```c
#include <stdio.h>
#include <stdint.h>
#include <inttypes.h>

int main(void) {
    uint32_t flags = 0;
    flags |= UINT32_C(1) << 2;
    flags |= UINT32_C(1) << 5;
    flags &= ~(UINT32_C(1) << 2);
    printf("hex=%" PRIx32 " bit2=%d bit5=%d\n", flags,
           (flags & (UINT32_C(1) << 2)) != 0,
           (flags & (UINT32_C(1) << 5)) != 0);
    return 0;
}
```

Output:

```text
hex=20 bit2=0 bit5=1
```

The program first sets bits 2 and 5, then clears only bit 2 with an inverted mask. The remaining value is hexadecimal 20, meaning bit 5 is set. The two comparisons turn selected bit fields into ordinary truth values for printing.

**Watch for:** Shifting by a negative count or by a count at least as large as the promoted operand’s width is undefined. Bitwise & also does not short-circuit like logical &&.

**Check:** Which operation clears the selected bit while preserving the others?

1. flags &= ~mask
2. flags = ~mask

<details><summary>Answer</summary>

flags &= ~mask. The AND limits the change to bits selected by the inverted mask.

</details>

**Try:** Add a third flag and toggle it twice with XOR; verify that the original flags are restored.

Run from the repository root:

```sh
make example EXAMPLE=files-bytes-2
```

## 10.3 Endianness and explicit serialization

Serialization defines a byte representation independently of an object’s in-memory layout. Pick a byte order and widths explicitly, and make the decoder validate the format before constructing values.

This format requires eight-bit bytes and a uint32_t. Encoding extracts the low-order byte first, defining little-endian order regardless of the host’s native order. Decoding casts each byte to uint32_t before shifting so the shift is performed in an appropriate unsigned type. A production decoder must also verify the available length before indexing its input.

### main.c

```c
#include <stdio.h>
#include <stdint.h>
#include <limits.h>

int main(void) {
    if (CHAR_BIT != 8) return 1;
    uint32_t value = UINT32_C(0x12345678);
    unsigned char bytes[4];
    for (unsigned i = 0; i < 4; i++) bytes[i] = (unsigned char)(value >> (8 * i));
    uint32_t decoded = (uint32_t)bytes[0] | ((uint32_t)bytes[1] << 8) |
                       ((uint32_t)bytes[2] << 16) | ((uint32_t)bytes[3] << 24);
    printf("%02x %02x %02x %02x\nround trip=%d\n",
           (unsigned)bytes[0], (unsigned)bytes[1],
           (unsigned)bytes[2], (unsigned)bytes[3], decoded == value);
    return 0;
}
```

Output:

```text
78 56 34 12
round trip=1
```

The hexadecimal value becomes four specified bytes, then the decoder reconstructs the original value from them. A machine with another host byte order would use the same extraction rules. There is no unaligned cast from a byte buffer to a uint32_t pointer.

**Watch for:** Writing a raw struct bakes in padding and representation assumptions. Casting the input buffer to an integer pointer can also violate alignment or aliasing rules.

**Check:** What establishes the file’s byte order here?

1. The explicit extraction and reconstruction rules
2. The host’s native layout

<details><summary>Answer</summary>

The explicit extraction and reconstruction rules. The representation is specified by the algorithm rather than a raw memory dump.

</details>

**Try:** Try zero and the largest uint32_t, checking round trips without changing the byte order.

Run from the repository root:

```sh
make example EXAMPLE=files-bytes-3
```

## 10.4 Undefined behavior, assertions, and debugging

Undefined behavior is a broken language contract, not a particular error message. A program can appear to work while reading a dead object or crossing an array boundary.

Validate external inputs before use, and use assertions to document internal invariants while developing. A debugger can show values, call stacks, and control flow, but an observed run cannot turn an invalid operation into a guarantee. Build with debug information and warnings. Keep required behavior outside assert, because NDEBUG can remove assertions. The example’s caller explicitly validates the index before calling the helper.

### main.c

```c
#include <stdio.h>
#include <assert.h>

int at(const int *values, size_t count, size_t index) {
    assert(values != NULL);
    assert(index < count);
    return values[index];
}

int main(void) {
    const int values[] = {4, 8, 12};
    size_t index = 2;
    if (index >= 3) return 1;
    printf("%d\n", at(values, 3, index));
    return 0;
}
```

Output:

```text
12
```

The runtime guard protects the external boundary, while the assertions express assumptions inside at. The program accesses a live array element. To investigate in Codespaces, build with -g, set a breakpoint in at using GDB, and inspect values, count, and index before continuing.

**Watch for:** A dangling pointer is not safe because its address is non-null. Likewise, changing optimization settings may expose a bug, but does not make undefined behavior valid at another setting.

**Check:** Should an assertion be the only validation of untrusted input?

1. Yes
2. No

<details><summary>Answer</summary>

No. Assertions can disappear; external input still needs a runtime error-handling policy.

</details>

**Try:** Use GDB on the example and inspect the valid index rather than deliberately executing an out-of-bounds access.

Run from the repository root:

```sh
make example EXAMPLE=files-bytes-4
```

## 10.5 Testing, sanitizers, portability, and browser runtime limits

Combine tests with compiler diagnostics, sanitizers, and portability checks. Each tool detects a different set of mistakes; none is a proof that a program is correct.

The copy helper requires valid nonoverlapping source and destination objects and a terminated source. It rejects text that cannot fit including the terminator. Test both the boundary that fits and the first value that does not. AddressSanitizer helps detect many invalid memory accesses, and UndefinedBehaviorSanitizer detects selected invalid operations. Use them on native builds: the page’s Wasm runner is not providing these native sanitizer runtimes.

### main.c

```c
#include <stdio.h>
#include <string.h>
#include <stdbool.h>

bool copy_checked(char *destination, size_t capacity, const char *source) {
    size_t length = strlen(source);
    if (length >= capacity) return false;
    memcpy(destination, source, length + 1);
    return true;
}

int main(void) {
    char small[4];
    printf("short=%s\n", copy_checked(small, sizeof small, "Ada") ? "ok" : "rejected");
    printf("too-long=%s\n", copy_checked(small, sizeof small, "Grace") ? "ok" : "rejected");
    return 0;
}
```

Output:

```text
short=ok
too-long=rejected
```

Ada needs exactly four chars with its terminator and fits. Grace does not, so the helper returns without copying it. In Codespaces, run this example with SANITIZE=1 and compare GCC and Clang builds. Keep a passing test distinct from evidence about paths that have not executed.

**Watch for:** Sanitizers have coverage and platform limits. They do not generally prove ownership, absence of logical errors, or race freedom; concurrency needs additional tools and reasoning.

**Check:** Does a sanitizer-clean run prove there are no bugs?

1. Yes
2. No

<details><summary>Answer</summary>

No. It checks the executed behavior for the classes of problems that sanitizer can detect.

</details>

**Try:** Run make example EXAMPLE=files-bytes-5 SANITIZE=1, then add a destination-capacity boundary case.

Run from the repository root:

```sh
make example EXAMPLE=files-bytes-5
```

## 10.6 A portable binary record format

A portable record format starts with a written specification and a decoder that rejects malformed input. An exact-size record is a useful first step before the database introduces pages and variable-length values.

Our ten-byte format is: bytes 0–1 ASCII C and F, byte 2 version 1, byte 3 reserved zero, bytes 4–7 a little-endian uint32_t ID, and bytes 8–9 a little-endian uint16_t score. The API requires non-null pointers to valid objects, and eight-bit bytes. The decoder checks the length before inspecting fields and commits its output only after validation. IDs and scores may span their entire unsigned type ranges.

### main.c

```c
#include <stdio.h>
#include <stdint.h>
#include <inttypes.h>
#include <stdbool.h>
#include <limits.h>

typedef struct { uint32_t id; uint16_t score; } Record;

void encode(unsigned char out[10], Record row) {
    out[0] = 0x43; out[1] = 0x46; out[2] = 1; out[3] = 0;
    for (unsigned i = 0; i < 4; i++) out[4 + i] = (unsigned char)(row.id >> (i * 8));
    out[8] = (unsigned char)row.score;
    out[9] = (unsigned char)(row.score >> 8);
}

bool decode(const unsigned char *bytes, size_t length, Record *out) {
    if (length != 10 || bytes[0] != 0x43 || bytes[1] != 0x46 ||
        bytes[2] != 1 || bytes[3] != 0) return false;
    Record row = {0, 0};
    for (unsigned i = 0; i < 4; i++) row.id |= (uint32_t)bytes[4 + i] << (i * 8);
    row.score = (uint16_t)((uint16_t)bytes[8] | ((uint16_t)bytes[9] << 8));
    *out = row;
    return true;
}

int main(void) {
    if (CHAR_BIT != 8) return 1;
    Record original = {513, 90}, restored;
    unsigned char bytes[10];
    encode(bytes, original);
    if (!decode(bytes, sizeof bytes, &restored)) return 1;
    printf("id=%" PRIu32 " score=%" PRIu16 "\n", restored.id, restored.score);
    bytes[2] = 2;
    printf("bad version=%d\n", !decode(bytes, sizeof bytes, &restored));
    return 0;
}
```

Output:

```text
id=513 score=90
bad version=1
```

The first round trip restores the two fields without copying struct padding. Changing the version byte makes decoding fail. The chapter project moves the encoder and decoder behind a header and tests exact bytes, truncation, unknown versions, and an actual temporary-file round trip.

**Watch for:** Do not silently accept a format version you cannot interpret. Also, a round trip alone can miss a shared mistake in encoder and decoder, so test against independently specified byte fixtures.

**Check:** Why test a known byte fixture as well as a round trip?

1. Encoder and decoder could share the same mistake
2. Round trips never exercise decoding

<details><summary>Answer</summary>

Encoder and decoder could share the same mistake. A fixed independently defined representation catches errors that two mutually consistent functions can hide.

</details>

**Try:** Implement the native binary-record project and explain every byte in its test fixture.

Run from the repository root:

```sh
make example EXAMPLE=files-bytes-6
```

## 10.7 Optional lab: Debugging C with GDB

Investigate a reproducible logical bug using breakpoints, stepping, variables, call stacks, and a watchpoint. Read here; run the optional lab in Codespaces or local Linux.

A useful debugging loop is: reproduce a failure, state the expected behavior, form one hypothesis, observe the running program, make a source fix, and add a regression test. GDB supplies observations; it does not decide whether the behavior meets your contract. This starter should sum 4, 8, and 12 to 24, but prints 20 without any deliberate invalid memory access. The lab builds with `-g -O0` so source locations and variables are easier to follow. Browser-only learners can skip the native session and continue to algorithms.

## Optional GDB lab: investigate, repair, verify (optional)

Run in Codespaces or local Linux with GDB; the browser CLI does not provide GDB. Starter checks initially fail on purpose. Guide and editable source: `native/debugging/basics`.

```sh
make debug-lab LAB=basics
```

### Reproduce and state a hypothesis

The editable copy is native/debugging/basics/main.c. The check command initially fails; expected totals are 24, 7, 0, and -2. Write down which input you suspect is skipped.

```text
make debug-lab LAB=basics
make debug-check LAB=basics
```

### Open real GDB

Run this in the Codespaces or local Linux terminal, not the browser CLI. GDB stops inside sum_values before the total initializer.

```text
make debug-gdb LAB=basics
```

### Observe the call and the first write

At the (gdb) prompt, run these one at a time. count is 3, the array is {4, 8, 12}, and the first change to total is 0 → 8 with i = 1. The software watchpoint works without hardware watchpoint slots.

```text
list
info args
print count
print *values@count
backtrace
next
print total
set can-use-hw-watchpoints 0
watch total
step
continue
print i
```

### Practice stepping and call frames

next steps over calls; step can enter them; Disable this session’s watchpoint 2 before using finish to run until the selected function returns. backtrace shows the call chain, and frame 1 selects the caller. Observe variables only while their scope exists. Quit GDB before rebuilding.

```text
disable 2
finish
backtrace
quit
```

### Repair the source and keep the regression

Edit the starter and rebuild. All four cases must pass. Add another bounded case and record the symptom, hypothesis, observation, source fix, and test.

```text
make debug-check LAB=basics
```

<details><summary>Hint and separate reference</summary>

Compare the first visited index with the array’s first element. After trying, the separate reference is available with make debug-check LAB=basics REFERENCE=1. A reference pass does not grade the student copy.

</details>

### main.c

```c
/* Deliberately faulty lab starter. All accesses stay within the array. */
#include <stddef.h>
#include <stdio.h>
#include <string.h>

/* The caller supplies a live array and values whose sum fits in int. */
int sum_values(const int *values, size_t count) {
    int total = 0;
    for (size_t i = 1; i < count; ++i) {
        total += values[i];
    }
    return total;
}

int main(int argc, char **argv) {
    const int ordinary[] = {4, 8, 12};
    const int single[] = {7};
    const int negative[] = {-5, 2, 1};
    const int *values = ordinary;
    size_t count = sizeof ordinary / sizeof ordinary[0];
    if (argc > 1 && strcmp(argv[1], "single") == 0) {
        values = single;
        count = 1;
    } else if (argc > 1 && strcmp(argv[1], "empty") == 0) {
        count = 0;
    } else if (argc > 1 && strcmp(argv[1], "negative") == 0) {
        values = negative;
        count = sizeof negative / sizeof negative[0];
    }
    int result = sum_values(values, count);
    printf("total=%d\n", result);
    return 0;
}
```

Output:

```text
total=20
```

This is the intentionally faulty starter: the loop begins at element 1 and skips element 0. The original-output command confirms the reproducible value 20; it does not check a repair. Use the separate debug-check command to require 24 and exercise single, empty, and negative inputs.

**Watch for:** A watchpoint reports a value change; it does not prove that the right value was written. Changing a variable inside GDB repairs only the current execution. Save a source fix, rebuild, and rerun the independent checks. Native GDB is not running inside the browser Wasm workspace.

**Check:** You use GDB to set total to 24 and the output becomes correct. What still needs doing?

1. Mark the defect fixed because this run passed
2. Fix the source, rebuild, and add a regression test

<details><summary>Answer</summary>

Fix the source, rebuild, and add a regression test. The debugger changed one live process. The faulty loop remains in the source until you edit it and verify the rebuilt program.

</details>

**Try:** Use the optional guided GDB session in this lesson, repair the editable starter, and run all four regression cases. Explain why the empty-array case passed even before the fix.

Run from the repository root:

```sh
make example EXAMPLE=files-bytes-7
```

## Chapter practice

Complete the TODOs in `native/projects/binary-record`. Initial failure is expected; see the project README.

```sh
make project PROJECT=binary-record
```

Chapter workspace command: `make chapter CHAPTER=files-bytes`.

Generated from dist/part2.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/files-bytes
