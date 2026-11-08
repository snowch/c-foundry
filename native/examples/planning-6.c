#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  struct Person {
    int id;
    const char *name;
  } people[] = {{1, "Ada"}, {2, "Grace"}};
  struct Order {
    int person, total;
  } orders[] = {{2, 50}, {1, 20}, {1, 30}};
  unsigned pairs = 0;
  for (size_t i = 0; i < 2; ++i)
    for (size_t j = 0; j < 3; ++j) {
      ++pairs;
      if (people[i].id == orders[j].person)
        printf("%s %d\n", people[i].name, orders[j].total);
    }
  printf("pairs=%u\n", pairs);
  return 0;
}
