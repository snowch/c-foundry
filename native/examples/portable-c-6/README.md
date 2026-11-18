# Paths, filenames, case, and bounded construction

Complete native example, ready to edit and run in Codespaces or locally.

## 33.6 Paths, filenames, case, and bounded construction

A path is interpreted by a host, not by the C language alone. Define filename policy and let callers supply locations instead of baking in Linux conventions.

Also editable and runnable inline in the browser course. Run this probe with the browser’s fixed C17 toolchain. Its results describe that target only. Use the native command and setup guide for other compilers, language modes, optimization flags, and sanitizer checks.

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

**Try:** [Try this edit in the browser](https://snowch.github.io/c-foundry/#/chapter/portable-c/6). In main.c, replace people.tdb with people-2.tdb in the first snprintf. Run code and compare path= and truncated_rejected=. Why does the longer path fit the primary buffer while the small-buffer check still rejects it?

### References and help

- [C reference: input/output](https://en.cppreference.com/w/c/io.html) — Compare stream modes, positioning, error indicators, and formatted I/O.
- [C reference: strcmp](https://en.cppreference.com/w/c/string/byte/strcmp.html) — Check the meaning of negative, zero, and positive results.
- [C reference: fixed-width integers](https://en.cppreference.com/w/c/types/integer.html) — Check when exact-width types exist and which format macros match them.

Native source: `native/examples/portable-c-6/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=portable-c-6 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

