#include "sink.h"
#include <stdio.h>
bool file_write(void *context, const unsigned char *bytes, size_t size) {
    FILE *file = context;
    return fwrite(bytes, 1, size, file) == size;
}
