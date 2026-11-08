#include "record.h"

bool record_encode(unsigned char *out, size_t capacity, Record row) {
    (void)out; (void)capacity; (void)row;
    /* TODO: magic 43 46, version 01, reserved 00, ID LE32, score LE16. */
    return false;
}

bool record_decode(const unsigned char *bytes, size_t length, Record *out) {
    (void)bytes; (void)length; (void)out;
    /* TODO: validate everything before committing an output record. */
    return false;
}
