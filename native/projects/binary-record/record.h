#ifndef RECORD_H
#define RECORD_H
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

enum { RECORD_BYTES = 10 };
typedef struct { uint32_t id; uint16_t score; } Record;
/* Eight-bit bytes required. Encode writes ten bytes when capacity permits. */
bool record_encode(unsigned char *out, size_t capacity, Record row);
/* Decode requires exactly ten valid bytes; on failure, *out is unchanged. */
bool record_decode(const unsigned char *bytes, size_t length, Record *out);
#endif
