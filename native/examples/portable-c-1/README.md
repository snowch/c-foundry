# Standard library versus operating-system APIs

Complete Linux example, ready to edit and run in the browser terminal.

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

**Try:** Edit the example in Browser Linux.  In native/examples/portable-c-1/main.c, replace portable with still portable inside the fputs string. Repeat the terminal run. Which operation puts the text in the stream and which retrieves it? Identify the ISO C functions used by this fixture.

### References and help

Offline C manuals: run `python3 tools/man.py 3 printf` at the repository root, or use [the bundled manual reader](https://snowch.github.io/c-foundry/#/manual). Browser Linux also provides `man 3 printf` and `man -k keyword`.

- [C reference: input/output](https://en.cppreference.com/w/c/io.html) (online) — Compare stream modes, positioning, error indicators, and formatted I/O.
- [C reference: fopen](https://en.cppreference.com/w/c/io/fopen.html) (online) — Read text/binary modes, creation behavior, and the failure result.
- [C reference: fread](https://en.cppreference.com/w/c/io/fread.html) (online) — Check the difference between bytes and complete elements, and detect short reads.

Native source: `native/examples/portable-c-1/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=portable-c-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

