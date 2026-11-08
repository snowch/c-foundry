#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

bool evaluate(const char *s, int *out) {
  int stack[32];
  size_t n = 0;
  for (; *s; ++s) {
    if (*s == ' ')
      continue;
    if (*s >= '0' && *s <= '9') {
      if (n == 32)
        return false;
      stack[n++] = *s - '0';
    } else {
      if (n < 2 || (*s != '+' && *s != '-'))
        return false;
      int right = stack[--n], left = stack[--n];
      if (*s == '+') {
        if ((right > 0 && left > INT_MAX - right) ||
            (right < 0 && left < INT_MIN - right)) return false;
        stack[n++] = left + right;
      } else {
        if ((right > 0 && left < INT_MIN + right) ||
            (right < 0 && left > INT_MAX + right)) return false;
        stack[n++] = left - right;
      }
    }
  }
  if (n != 1)
    return false;
  *out = stack[0];
  return true;
}

int main(void) {
  int value;
  bool ok = evaluate("8 3 - 2 +", &value);
  printf("ok=%d result=%d\n", ok, value);
  return 0;
}
