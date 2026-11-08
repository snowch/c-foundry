#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#if defined(__STDC_NO_THREADS__)
#error "C11 threads required for this example"
#endif
#include <threads.h>

int standard_worker(void *unused) {
  (void)unused;
  return 42;
}

int main(void) {
  thrd_t thread;
  int result = 0;
  if (thrd_create(&thread, standard_worker, NULL) != thrd_success ||
      thrd_join(thread, &result) != thrd_success)
    return 1;
  printf("joined_result=%d\n", result);
  return 0;
}
