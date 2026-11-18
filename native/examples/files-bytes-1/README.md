# Text and binary file I/O

Complete native example, ready to edit and run in Codespaces or locally.

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

**Try:** Edit the example in your native checkout. In native/examples/files-bytes-1/main.c, add another fgets after printf and print whether it returned NULL alongside feof(file) and ferror(file). Repeat the terminal run. What separates an exhausted file from a read error?

### References and help

- [C reference: fread](https://en.cppreference.com/w/c/io/fread.html) — Check the difference between bytes and complete elements, and detect short reads.
- [C reference: input/output](https://en.cppreference.com/w/c/io.html) — Compare stream modes, positioning, error indicators, and formatted I/O.
- [C reference: ferror](https://en.cppreference.com/w/c/io/ferror.html) — Distinguish a stream error from ordinary end-of-file.

**Use the documentation (optional):** How can fread return fewer complete elements than requested, and how do you distinguish EOF from an I/O error?

<details><summary>Compare your answer</summary>

Both EOF and an I/O error can cause a short read. Inspect the stream’s feof and ferror indicators; do not treat every short read as ordinary EOF.

</details>

Native source: `native/examples/files-bytes-1/`. The command below builds that source and prints its output in the terminal. Run from the repository root:

```sh
make example EXAMPLE=files-bytes-1 RUN_ONLY=1
```

Remove RUN_ONLY=1 to compare the starter with its original output.

