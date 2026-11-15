# A portable core and explicit host adapters

Complete native example, ready to edit and run in Codespaces or locally.

## 33.4 A portable core and explicit host adapters

Separate portable data operations from the host that stores their bytes. A small interface makes dependencies and unsupported guarantees visible.

The core below emits four specified bytes through a ByteSink interface. It knows nothing about FILE, paths, file descriptors, native handles, or durability. The ISO C adapter checks fwrite, while main checks flush, repositioning, the read, and close. A future POSIX or Win32 adapter can implement a stronger publication contract without leaking those APIs into the codec. Name the guarantee carefully: buffered stream acceptance is not a claim that a record survives power loss.

### Keep the portable rules behind an explicit host boundary

The same data contract can have different storage adapters.

A portable core defines encoding, validation, and data-operation rules. It calls an explicit host interface for storage and environment-dependent behavior. Separate adapters implement that interface for native files, browser storage, or a test fixture. Each adapter must document its actual failure and durability guarantees.

Adapters do not make every OS API portable; their contracts must be implemented and tested for each target.

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

### References and help

- [C reference: functions](https://en.cppreference.com/w/c/language/functions.html) — Read declarations, parameter types, and the rules for calling functions.
- [C reference: input/output](https://en.cppreference.com/w/c/io.html) — Compare stream modes, positioning, error indicators, and formatted I/O.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-4
```

