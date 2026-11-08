#define _POSIX_C_SOURCE 200809L
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

int main(void) {
  struct timespec a, b;
  if (clock_gettime(CLOCK_MONOTONIC, &a) || clock_gettime(CLOCK_MONOTONIC, &b))
    return 1;
  printf("clock_read=1 ordered=%d\n",
         b.tv_sec > a.tv_sec ||
             (b.tv_sec == a.tv_sec && b.tv_nsec >= a.tv_nsec));
  return 0;
}
