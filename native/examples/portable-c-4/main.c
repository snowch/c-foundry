#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
#if defined(__wasi__)
  puts("target=WASI host_adapter_required");
#else
  puts("target=native host_adapter_required");
#endif
  return 0;
}
