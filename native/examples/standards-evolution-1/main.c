#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  printf("C17_or_later=%d C11_or_later=%d\n", __STDC_VERSION__ >= 201710L,
         __STDC_VERSION__ >= 201112L);
  return 0;
}
