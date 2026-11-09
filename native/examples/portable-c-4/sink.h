#ifndef CF_SINK_H
#define CF_SINK_H
#include <stdbool.h>
#include <stddef.h>
typedef struct { bool (*write)(void *, const unsigned char *, size_t); void *context; } ByteSink;
bool emit_header(const ByteSink *sink);
bool file_write(void *context, const unsigned char *bytes, size_t size);
#endif
