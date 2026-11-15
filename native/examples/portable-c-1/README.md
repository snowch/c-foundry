# Standard library versus operating-system APIs

Complete native example, ready to edit and run in Codespaces or locally.

## 33.1 Standard library versus operating-system APIs

Know which contract an API belongs to before calling it. Portable C is a language-and-library baseline, not a promise that every operating system offers the same services.

ISO C includes streams such as fopen/fread, string processing, allocation, time interfaces, and the limited signal() facility. POSIX adds facilities such as fork, sigaction, and clock_gettime; Win32 has different process, handle, and synchronization interfaces. ioctl requests are device/platform specific, /proc is a host-specific pseudo-filesystem, and shared-memory APIs and guarantees depend on the platform. Keep parsing and byte codecs independent of those services. This example uses only ISO C streams and checks each operation; tmpfile can still fail because a hosted library operation can depend on permissions or resources.

### Keep the portable rules behind an explicit host boundary

The same data contract can have different storage adapters.

A portable core defines encoding, validation, and data-operation rules. It calls an explicit host interface for storage and environment-dependent behavior. Separate adapters implement that interface for native files, browser storage, or a test fixture. Each adapter must document its actual failure and durability guarantees.

Adapters do not make every OS API portable; their contracts must be implemented and tested for each target.

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

### References and help

- [C reference: input/output](https://en.cppreference.com/w/c/io.html) — Compare stream modes, positioning, error indicators, and formatted I/O.
- [C reference: fopen](https://en.cppreference.com/w/c/io/fopen.html) — Read text/binary modes, creation behavior, and the failure result.
- [C reference: fread](https://en.cppreference.com/w/c/io/fread.html) — Check the difference between bytes and complete elements, and detect short reads.

Run from the repository root:

```sh
make example EXAMPLE=portable-c-1
```

