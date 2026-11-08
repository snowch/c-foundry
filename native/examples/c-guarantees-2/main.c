#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  uint32_t source = UINT32_C(0x12345678), copy = 0;
  unsigned char bytes[sizeof source];
  memcpy(bytes, &source, sizeof bytes);
  memcpy(&copy, bytes, sizeof copy);
  printf("roundtrip=%d bytes=%zu\n", copy == source, sizeof bytes);
  return 0;
}
