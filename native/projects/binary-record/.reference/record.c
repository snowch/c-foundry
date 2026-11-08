#include "record.h"
#include <limits.h>
_Static_assert(CHAR_BIT == 8, "This file format requires eight-bit bytes");

bool record_encode(unsigned char *out, size_t capacity, Record row) {
    if (!out || capacity < RECORD_BYTES) return false;
    out[0] = 0x43; out[1] = 0x46; out[2] = 1; out[3] = 0;
    for (unsigned i = 0; i < 4; ++i) out[4 + i] = (unsigned char)(row.id >> (8 * i));
    out[8] = (unsigned char)row.score;
    out[9] = (unsigned char)(row.score >> 8);
    return true;
}

bool record_decode(const unsigned char *bytes, size_t length, Record *out) {
    if (!bytes || !out || length != RECORD_BYTES || bytes[0] != 0x43 || bytes[1] != 0x46 ||
        bytes[2] != 1 || bytes[3] != 0) return false;
    Record row = {0, 0};
    for (unsigned i = 0; i < 4; ++i) row.id |= (uint32_t)bytes[4 + i] << (8 * i);
    row.score = (uint16_t)((uint16_t)bytes[8] | ((uint16_t)bytes[9] << 8));
    *out = row;
    return true;
}
