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
