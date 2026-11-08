#include "record.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#define REQUIRE(condition) do { if (!(condition)) { fprintf(stderr, "FAIL line %d: %s\n", __LINE__, #condition); exit(1); } } while (0)

int main(void) {
    const unsigned char fixture[RECORD_BYTES] = {0x43,0x46,1,0,1,2,0,0,90,0};
    unsigned char bytes[RECORD_BYTES];
    Record row = {513,90}, result = {7,8};
    REQUIRE(record_encode(bytes, sizeof bytes, row));
    REQUIRE(memcmp(bytes, fixture, sizeof bytes) == 0);
    REQUIRE(record_decode(fixture, sizeof fixture, &result));
    REQUIRE(result.id == 513 && result.score == 90);
    result = (Record){7,8};
    REQUIRE(!record_decode(bytes, 9, &result));
    REQUIRE(result.id == 7 && result.score == 8);
    REQUIRE(!record_encode(bytes, 9, row));
    REQUIRE(!record_decode(NULL, 10, &result));
    REQUIRE(!record_decode(bytes, 10, NULL));
    REQUIRE(!record_encode(NULL, 10, row));
    for (unsigned i = 0; i < 4; ++i) {
        memcpy(bytes, fixture, sizeof bytes);
        bytes[i] ^= 0x10;
        REQUIRE(!record_decode(bytes, sizeof bytes, &result));
        REQUIRE(result.id == 7 && result.score == 8);
    }
    unsigned char extra[11] = {0};
    memcpy(extra, fixture, sizeof fixture);
    REQUIRE(!record_decode(extra, sizeof extra, &result));
    Record edge = {UINT32_MAX, UINT16_MAX};
    REQUIRE(record_encode(bytes, sizeof bytes, edge));
    REQUIRE(record_decode(bytes, sizeof bytes, &result));
    REQUIRE(result.id == edge.id && result.score == edge.score);
    FILE *file = tmpfile();
    REQUIRE(file != NULL);
    REQUIRE(fwrite(fixture, 1, sizeof fixture, file) == sizeof fixture);
    REQUIRE(fflush(file) == 0);
    REQUIRE(fseek(file, 0, SEEK_SET) == 0);
    REQUIRE(fread(bytes, 1, sizeof bytes, file) == sizeof bytes);
    REQUIRE(fgetc(file) == EOF && !ferror(file));
    REQUIRE(fclose(file) == 0);
    REQUIRE(record_decode(bytes, sizeof bytes, &result));
    REQUIRE(result.id == 513 && result.score == 90);
    puts("PASS binary-record: fixture, round trip, length, header, unchanged failure, limits, file I/O");
    return 0;
}
