# Chapter 33: Portable files, text, and platform interfaces

Part 7: Writing portable C. Teaching baseline: C17.

Write portable file handling, text processing, and parsing code, and put operating-system services behind explicit interfaces. State which targets, encodings, and filesystem behaviors the project supports.

## Outcomes

- Distinguish ISO C, POSIX, Win32, and Linux-specific contracts.
- Specify byte widths, byte order, file modes, and filename policy explicitly.
- Handle line endings, byte encodings, locale, bounded records, and numeric conversion.
- Check stream errors and use stream positions without assuming text byte offsets.
- Compile and link capability probes, isolate host services, and test the same fixtures on Linux, macOS, and Windows.

## 33.1 Standard library versus operating-system APIs

Know which contract an API belongs to before calling it. Portable C is a language-and-library baseline, not a promise that every operating system offers the same services.

ISO C includes streams such as fopen/fread, string processing, allocation, time interfaces, and the limited signal() facility. POSIX adds facilities such as fork, sigaction, and clock_gettime; Win32 has different process, handle, and synchronization interfaces. ioctl requests are device/platform specific, /proc is a host-specific pseudo-filesystem, and shared-memory APIs and guarantees depend on the platform. Keep parsing and byte codecs independent of those services. This example uses only ISO C streams and checks each operation; tmpfile can still fail because a hosted library operation can depend on permissions or resources.

### main.c

```c
#include <stdio.h>

int main(void) {
    FILE *file = tmpfile();
    if (!file) return 1;
    int ok = fputs("portable\n", file) >= 0 && fflush(file) == 0 && fseek(file, 0, SEEK_SET) == 0;
    char line[32];
    if (ok) ok = fgets(line, sizeof line, file) != NULL;
    if (fclose(file) != 0) ok = 0;
    if (!ok) return 1;
    printf("%s", line);
    return 0;
}
```

Output:

```text
portable
```

The temporary stream receives one line and is repositioned before reading. Every path after a successful open closes the stream. The language interface is portable; successful access is still something the program checks.

**Watch for:** ISO C signal() exists, but POSIX signal masks, delivery rules, process groups, and signal-safe operations are additional contracts. Do not label all signal handling either universally available or universally Linux-only.

**Check:** Which dependency belongs outside a portable parser?

1. An explicit byte buffer and its length
2. Reading Linux /proc to discover process state

<details><summary>Answer</summary>

Reading Linux /proc to discover process state. The parser can operate on supplied bytes without depending on a particular host filesystem layout.

</details>

**Try:** Inventory the APIs in your TinyDB build. Label each ISO C, POSIX, Win32, or another target-specific contract, and identify its failure policy.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-1
```

## 33.2 Fixed-width types, endianness, and binary compatibility

Fixed-width types simplify an external protocol only when their availability and byte-size requirements are stated. Endianness still needs explicit encoding.

The byte codec extracts and assembles little-endian uint32_t values instead of writing native objects. Exact-width types are optional on some C implementations; this course’s supported targets provide uint32_t and eight-bit bytes. Schema and format compatibility also depend on string encoding, version rules, and validation, not only on integer width. State these requirements at the format boundary with compile-time checks. sizeof a struct includes padding, and sizeof(long), pointer width, alignment, and host byte order are not a portable file specification. Use fixed numeric magic bytes rather than assuming the execution character set defines an external encoding.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

_Static_assert(CHAR_BIT == 8, "This file format uses octets");

enum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };
void put32(unsigned char *out, uint32_t value) {
  for (unsigned i = 0; i < 4; ++i)
    out[i] = (unsigned char)(value >> (8 * i));
}
uint32_t get32(const unsigned char *in) {
  uint32_t value = 0;
  for (unsigned i = 0; i < 4; ++i)
    value |= (uint32_t)in[i] << (8 * i);
  return value;
}

int main(void) {
  unsigned char bytes[4];
  put32(bytes, UINT32_C(0x01020304));
  printf("bytes=%u,%u,%u,%u value_ok=%d\n", (unsigned)bytes[0], (unsigned)bytes[1], (unsigned)bytes[2],
         (unsigned)bytes[3], get32(bytes) == UINT32_C(0x01020304));
  return 0;
}
```

Output:

```text
bytes=4,3,2,1 value_ok=1
```

The byte order is identical on little- and big-endian supported hosts because the encoder defines it.

**Watch for:** Using uint32_t inside a raw dumped struct does not remove padding or byte-order assumptions.

**Check:** Does a fixed-width field alone make raw structs portable files?

1. Yes
2. No

<details><summary>Answer</summary>

No. Layout, padding, byte order, and other representation choices remain.

</details>

**Try:** Decode independently specified bytes and test all integer extremes without consulting sizeof(Row).

Run from the repository root:

```sh
make example EXAMPLE=portable-c-2
```

## 33.3 Feature detection and conditional compilation

Probe the facility you need with the selected compiler and libraries. A platform name or accepted language-mode flag does not establish that an API can be linked.

The build chooses CF_HAVE_MONOTONIC only after compiling and linking a clock_gettime/CLOCK_MONOTONIC probe. A conservative build defaults to zero and reports the service as unconfigured. Defining _POSIX_C_SOURCE before headers requests the POSIX declarations; it does not create an implementation. The check-portability runner exercises both the default path and the detected path. When monotonic timing is required, an unavailable result must remain unavailable: wall-clock time is not a semantics-preserving replacement.

### main.c

```c
#ifndef CF_HAVE_MONOTONIC
#define CF_HAVE_MONOTONIC 0
#endif
#if CF_HAVE_MONOTONIC
#define _POSIX_C_SOURCE 200809L
#include <time.h>
#endif
#include <stdio.h>

int main(void) {
#if CF_HAVE_MONOTONIC
    struct timespec now;
    if (clock_gettime(CLOCK_MONOTONIC, &now) != 0) return 1;
#endif
    printf("monotonic_configured=%d\n", CF_HAVE_MONOTONIC);
    return 0;
}
```

Output:

```text
monotonic_configured=0
```

The normal example does not guess a platform capability. The portability runner records a compile/link result and passes the resulting macro explicitly when testing the other branch. A successful API probe still requires runtime errors to be handled.

**Watch for:** Compiler identity is not an API test. Cross-compilation may support compile/link probes while being unable to run the target binary, so separate configuration evidence from target execution evidence.

**Check:** If the monotonic-clock probe fails, what is an honest fallback?

1. Report that the required service is unavailable
2. Silently return a wall-clock value and promise monotonicity

<details><summary>Answer</summary>

Report that the required service is unavailable. A fallback may preserve a contract or explicitly report unsupported behavior; it must not silently change the meaning.

</details>

**Try:** Run python3 tools/check_portability.py --compiler gcc and inspect the capability report. Compare the result with Windows MSVC in the Actions matrix.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-3
```

## 33.4 A portable core and explicit host adapters

Separate portable data operations from the host that stores their bytes. A small interface makes dependencies and unsupported guarantees visible.

The core below emits four specified bytes through a ByteSink interface. It knows nothing about FILE, paths, file descriptors, native handles, or durability. The ISO C adapter checks fwrite, while main checks flush, repositioning, the read, and close. A future POSIX or Win32 adapter can implement a stronger publication contract without leaking those APIs into the codec. Name the guarantee carefully: buffered stream acceptance is not a claim that a record survives power loss.

### main.c

```c
#include "sink.h"
#include <stdio.h>

int main(void) {
    FILE *file = tmpfile();
    if (!file) return 1;
    ByteSink sink = {file_write, file};
    int ok = emit_header(&sink) && fflush(file) == 0 && fseek(file, 0, SEEK_SET) == 0;
    unsigned char bytes[4];
    size_t n = ok ? fread(bytes, 1, sizeof bytes, file) : 0;
    if (fclose(file) != 0) ok = 0;
    if (!ok || n != sizeof bytes || bytes[0] != 0x54 || bytes[3] != 0x31) return 1;
    printf("portable_bytes=%zu\n", n);
    return 0;
}
```

### sink.h

```c
#ifndef CF_SINK_H
#define CF_SINK_H
#include <stdbool.h>
#include <stddef.h>
typedef struct { bool (*write)(void *, const unsigned char *, size_t); void *context; } ByteSink;
bool emit_header(const ByteSink *sink);
bool file_write(void *context, const unsigned char *bytes, size_t size);
#endif
```

### core.c

```c
#include "sink.h"
bool emit_header(const ByteSink *sink) {
    static const unsigned char bytes[] = {0x54, 0x44, 0x42, 0x31};
    return sink->write(sink->context, bytes, sizeof bytes);
}
```

### host.c

```c
#include "sink.h"
#include <stdio.h>
bool file_write(void *context, const unsigned char *bytes, size_t size) {
    FILE *file = context;
    return fwrite(bytes, 1, size, file) == size;
}
```

Output:

```text
portable_bytes=4
```

The same core can send bytes to another implementation of the callback. This fixture exercises a real temporary binary stream and confirms its contents without putting stdio in the core module.

**Watch for:** An adapter should report its actual capabilities. A function named durable_save implemented only with fflush would hide a portability and correctness defect.

**Check:** Which component should decide how a file is replaced on a particular OS?

1. The platform adapter with a documented replacement contract
2. The byte encoder by assuming rename has identical semantics everywhere

<details><summary>Answer</summary>

The platform adapter with a documented replacement contract. Replacement semantics belong to the filesystem boundary; portable byte serialization can remain independent.

</details>

**Try:** Add a rejecting ByteSink and verify that emit_header reports failure. Then sketch separate POSIX and Win32 publication adapters without claiming they offer identical crash guarantees.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-4
```

## 33.5 Text and binary streams, LF and CRLF

Choose text mode for logical text and binary mode for specified bytes. Treat line-ending normalization as an explicit input policy.

Text streams may translate the host representation of a newline. A text-stream position is not necessarily a byte count, and the physical file need not have one byte for each character written. Use rb/wb for a byte-defined database format. When reading byte-defined text from binary input, a parser can explicitly accept LF and CRLF as terminators. The helper accepts a complete bounded record, strips one trailing LF and its preceding CR, and leaves a lone trailing CR unchanged; deciding whether that lone CR is allowed belongs to the input grammar.

### main.c

```c
#include <stdio.h>
#include <string.h>

size_t strip_line_ending(char *text, size_t n) {
    if (n && text[n-1] == '\n') {
        --n;
        if (n && text[n-1] == '\r') --n;
    }
    text[n] = 0;
    return n;
}
int main(void) {
    char lf[] = "Ada\n", crlf[] = "Ada\r\n", lone[] = "Ada\r";
    size_t a = strip_line_ending(lf, strlen(lf));
    size_t b = strip_line_ending(crlf, strlen(crlf));
    size_t d = strip_line_ending(lone, strlen(lone));
    printf("lf=%zu crlf=%zu equal=%d lone_cr=%zu\n", a, b, strcmp(lf, crlf) == 0, d);
    return 0;
}
```

Output:

```text
lf=3 crlf=3 equal=1 lone_cr=4
```

Both supported terminators produce the same three-character record. The lone CR remains part of a four-byte payload. The caller owns an array with space for text[n]; this helper does not establish that fgets supplied an entire untruncated record.

**Watch for:** Never strip all trailing whitespace from a field unless the grammar permits losing those characters. A buffer ending without LF may be the final complete record or only a prefix of a long line.

**Check:** Which mode preserves a byte-defined database file on Windows as well as Unix?

1. Binary mode, such as rb and wb
2. Text mode because a newline always occupies one byte

<details><summary>Answer</summary>

Binary mode, such as rb and wb. Binary mode avoids text-stream translations; the format still needs explicit widths, encoding, and validation.

</details>

**Try:** Add empty, CRLF-only, final-record-without-newline, and truncated-buffer cases. State separately how your parser rejects an incomplete record.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-5
```

## 33.6 Paths, filenames, case, and bounded construction

A path is interpreted by a host, not by the C language alone. Define filename policy and let callers supply locations instead of baking in Linux conventions.

Absolute path syntax, separators, case sensitivity, Unicode path APIs, reserved names, symlinks, and path length limits vary by filesystem and host configuration. Even Windows and macOS have configurable case behavior. strcmp comparing two names does not establish that the filesystem treats them as different files. The example constructs a bounded relative path for a documented Unix-like adapter and checks snprintf truncation; another adapter can use its host rules. The audit project uses an even narrower common ASCII basename policy, including Windows device-name exclusions, to make its supported set testable.

### main.c

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char path[32];
    int n = snprintf(path, sizeof path, "%s/%s", "data", "people.tdb");
    if (n < 0 || (size_t)n >= sizeof path) return 1;
    char short_path[4];
    int rejected = strlen(path) >= sizeof short_path;
    if (!rejected) {
        int short_n = snprintf(short_path, sizeof short_path, "%s", path);
        rejected = short_n < 0 || (size_t)short_n >= sizeof short_path;
    }
    printf("path=%s truncated_rejected=%d names_differ=%d\n", path, rejected, strcmp("Data.tdb", "data.tdb") != 0);
    return 0;
}
```

Output:

```text
path=data/people.tdb truncated_rejected=1 names_differ=1
```

The short destination cannot hold the constructed path and is rejected. The final comparison concerns C strings only; the program does not claim that two differently cased names identify distinct files.

**Watch for:** FILENAME_MAX is not a universal promise that every possible path fits. Never treat a lexical basename whitelist as a sandbox against a hostile directory, symlinks, or concurrent filesystem changes.

**Check:** Does strcmp("Data.tdb", "data.tdb") != 0 prove two distinct files exist?

1. Yes, C string comparison defines filesystem identity
2. No, filesystem case and identity rules are a separate contract

<details><summary>Answer</summary>

No, filesystem case and identity rules are a separate contract. Names can compare differently while referring to the same object on a case-insensitive filesystem.

</details>

**Try:** Run the audit project’s filename-policy tests for CON.txt, COM1.tdb, traversal, trailing dots, and a valid basename; document which otherwise valid OS names the project intentionally excludes.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-6
```

## 33.7 Encodings, locale, and safe byte classification

Distinguish bytes, encoded characters, and locale-dependent classification. Make the external text encoding part of the format.

A char may be signed, and passing a negative value other than EOF to isalpha, isspace, or toupper has undefined behavior. Convert a byte through unsigned char before classification. The C locale is available on hosted implementations, while installed locale names differ by host; a named UTF-8 locale is not universally present. This example sets the C locale and counts ASCII letters in a known UTF-8 byte sequence. Applying byte-wise ctype does not decode a multibyte character, perform Unicode case folding, or count user-perceived characters. UTF-8 validation and a byte-length limit are separate policies in the audit codec.

### main.c

```c
#include <ctype.h>
#include <locale.h>
#include <stdio.h>

int main(void) {
    if (!setlocale(LC_CTYPE, "C")) return 1;
    const unsigned char text[] = {0x43, 0x68, 0x6c, 0x6f, 0xc3, 0xa9};
    size_t letters = 0;
    for (size_t i = 0; i < sizeof text; ++i)
        if (isalpha((unsigned char)text[i])) ++letters;
    printf("utf8_bytes=%zu ascii_letters=%zu\n", sizeof text, letters);
    return 0;
}
```

Output:

```text
utf8_bytes=6 ascii_letters=4
```

Chloé occupies six UTF-8 bytes. In the C locale the four ASCII letters are classified as alphabetic; the two encoding bytes for é are not a decoded character for this byte-wise operation. The supported hosts use ASCII-compatible execution character sets.

**Watch for:** Strlen counts bytes before a zero terminator, not Unicode characters. Setting a process-global locale also affects other library calls and needs coordination in threaded programs.

**Check:** What does casting to unsigned char before isalpha accomplish?

1. It makes any byte a valid classification argument
2. It turns each UTF-8 byte into a complete Unicode character

<details><summary>Answer</summary>

It makes any byte a valid classification argument. The cast satisfies the ctype argument requirement. It does not implement Unicode decoding.

</details>

**Try:** Compare the byte length of an ASCII name and a multibyte name, and test invalid UTF-8 rejection separately from name length and locale classification.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-7
```

## 33.8 Bounded records and reliable numeric parsing

Parse a bounded decimal field with a stated grammar, range checks, and full consumption. Do not use a conversion’s numeric result as its success indicator.

strtoumax accepts optional signs and leading whitespace; this protocol does not. Validate every input character as a decimal digit, copy only a bounded field into a terminated temporary buffer, clear errno, convert in base ten, reject ERANGE, check the end pointer, and check the uint32_t limit before narrowing. The output parameter changes only after every check. This accepts exactly decimal digits with leading zeros permitted. It does not infer whether a surrounding line was truncated: the framing layer must establish the complete field first.

### main.c

```c
#include <errno.h>
#include <inttypes.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

bool parse_id(const char *text, size_t n, uint32_t *out) {
    if (!n || n > 32) return false;
    for (size_t i = 0; i < n; ++i) if (text[i] < '0' || text[i] > '9') return false;
    char buffer[33]; memcpy(buffer, text, n); buffer[n] = 0;
    errno = 0; char *end;
    uintmax_t value = strtoumax(buffer, &end, 10);
    if (errno == ERANGE || end != buffer + n || value > UINT32_MAX) return false;
    *out = (uint32_t)value; return true;
}
int main(void) {
    uint32_t value = 7;
    int maximum = parse_id("4294967295", 10, &value);
    printf("maximum=%d value=%" PRIu32 "\n", maximum, value);
    value = 7;
    int rejected = !parse_id("4294967296", 10, &value);
    printf("overflow_rejected=%d retained=%" PRIu32 " sign_rejected=%d\n", rejected, value, !parse_id("-1", 2, &value));
    return 0;
}
```

Output:

```text
maximum=1 value=4294967295
overflow_rejected=1 retained=7 sign_rejected=1
```

The largest uint32_t is accepted without assuming the width of unsigned long. The next integer is rejected before conversion to uint32_t, and both range and sign rejection preserve the previous output value.

**Watch for:** Atoi cannot distinguish a valid zero from a conversion failure and does not provide a safe overflow policy. Checking errno without checking consumption and the destination range is also incomplete.

**Check:** Why check value against UINT32_MAX after strtoumax succeeds?

1. The conversion type may have a wider range than the destination
2. Successful conversion automatically validates every narrower type

<details><summary>Answer</summary>

The conversion type may have a wider range than the destination. Conversion success establishes a uintmax_t value, not that it fits the database field.

</details>

**Try:** Add zero, empty input, plus/minus signs, whitespace, a suffix, embedded zero bytes, leading zeros, and an extremely long number; verify output preservation for every rejection.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-8
```

## 33.9 Stream errors, EOF, and saved positions

Distinguish EOF from an I/O error, and treat a text-stream position as a saved cookie rather than an arithmetic byte offset.

Keep fgetc’s result in int so it can represent every unsigned-char value and EOF. After the read loop stops, use ferror to distinguish an error from clean end-of-file. For text streams, use fgetpos/fsetpos to revisit a saved position; do not assume that subtracting ftell values counts physical bytes. C also restricts which fseek offsets are meaningful on text streams. Switching an update stream between writing and reading requires the relevant flush or positioning operation. The example uses tmpfile’s binary update stream but demonstrates opaque position saving that also avoids assumptions about fpos_t’s representation.

### main.c

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    FILE *file = tmpfile();
    if (!file) return 1;
    int ok = fputs("Ada\nGrace\n", file) >= 0 && fflush(file) == 0 && fseek(file, 0, SEEK_SET) == 0;
    char first[16], second[16], again[16]; fpos_t position;
    if (ok) ok = fgets(first, sizeof first, file) != NULL && fgetpos(file, &position) == 0 && fgets(second, sizeof second, file) != NULL;
    if (ok) ok = fsetpos(file, &position) == 0 && fgets(again, sizeof again, file) != NULL;
    int ch; if (ok) while ((ch = fgetc(file)) != EOF) { }
    if (ok) ok = !ferror(file);
    if (fclose(file) != 0) ok = 0;
    if (!ok) return 1;
    printf("revisited=%d clean_eof=1\n", strcmp(second, again) == 0);
    return 0;
}
```

Output:

```text
revisited=1 clean_eof=1
```

The saved position is restored without interpreting fpos_t as an integer. The read loop checks errors before closing. This verifies a completed stream operation; it does not establish a large-file offset range or persistence guarantee.

**Watch for:** Feof predicts nothing about the next read: it is set only after a read reaches EOF. Also, ISO C fseek uses long; very large database files may need a wider, platform-specific seek adapter.

**Check:** What is the portable way to reuse a text-stream position?

1. Save and restore it with fgetpos/fsetpos
2. Subtract arbitrary text-mode offsets and treat the result as byte length

<details><summary>Answer</summary>

Save and restore it with fgetpos/fsetpos. The position representation can carry implementation-specific stream state and need not be an arithmetic byte offset.

</details>

**Try:** Add a final line without a newline, test a failed open, and audit the code paths that check read, write, flush, reposition, and close errors.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-9
```

## Build it yourself

Build portable file and text interfaces, then test their contracts across operating systems.

1. Define filename, text-encoding, line-framing, and error contracts before adding host adapters.
2. Add rejecting and short-write sinks without changing the portable codec.
3. Compile and link actual capability probes, and test both configured and conservative paths.
4. Run the shared fixtures on Linux GCC/Clang, macOS Clang, and Windows MSVC.

### Check your work

- Reject truncation, malformed numeric fields, unsupported capabilities, and invalid encodings without changing live output.
- Explain the difference between C string equality and filesystem identity, and between flushing and durable publication.
- Use python3 tools/check_portability.py --compiler gcc to run the native cross-platform acceptance suite.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=portable-c-9
```

Chapter workspace command: `make chapter CHAPTER=portable-c`.

Generated from dist/part7.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/portable-c
