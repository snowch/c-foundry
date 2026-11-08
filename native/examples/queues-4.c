#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

bool balanced(const char *s) {
  char stack[32];
  size_t n = 0;
  for (; *s; ++s) {
    if (*s == '(' || *s == '[') {
      if (n == sizeof stack)
        return false;
      stack[n++] = *s;
    } else if (*s == ')' || *s == ']') {
      if (!n)
        return false;
      char open = stack[--n];
      if ((*s == ')' && open != '(') || (*s == ']' && open != '['))
        return false;
    }
  }
  return n == 0;
}

int main(void) {
  printf("balanced=%d crossed=%d\n", balanced("([])"), balanced("([)]"));
  return 0;
}
