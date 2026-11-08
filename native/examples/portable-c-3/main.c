#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#if defined(__STDC_NO_ATOMICS__)
#error "This example requires standard atomics"
#endif
#include <stdatomic.h>

int main(void) {
  atomic_uint value;
  atomic_init(&value, 0);
  atomic_fetch_add(&value, 1);
  printf("atomic_probe=%u\n", atomic_load(&value));
  return 0;
}
