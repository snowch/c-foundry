#include "sink.h"
bool emit_header(const ByteSink *sink) {
    static const unsigned char bytes[] = {0x54, 0x44, 0x42, 0x31};
    return sink->write(sink->context, bytes, sizeof bytes);
}
