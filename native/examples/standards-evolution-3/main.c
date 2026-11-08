#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
#if defined(__STDC_VERSION__) && __STDC_VERSION__ >= 202311L
  puts("mode=C23 feature_probe_required");
#else
  puts("mode=C17 fallback_selected");
#endif
  return 0;
}
