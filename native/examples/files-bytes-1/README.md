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

**Try:** Inspect feof and ferror after deliberately attempting another read at end-of-file.

Run from the repository root:

```sh
make example EXAMPLE=files-bytes-1
```

