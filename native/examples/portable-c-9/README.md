# Stream errors, EOF, and saved positions

Complete native example, ready to edit and run in Codespaces or locally.

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

