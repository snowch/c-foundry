#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  int id;
  unsigned age;
  bool valid, dirty;
  int value;
} Frame;
typedef struct {
  Frame frames[2];
  unsigned clock, reads, writes;
} Cache;
int *fetch(Cache *c, int id) {
  size_t victim = 0;
  for (size_t i = 0; i < 2; ++i)
    if (c->frames[i].valid && c->frames[i].id == id) {
      c->frames[i].age = ++c->clock;
      return &c->frames[i].value;
    }
  for (size_t i = 0; i < 2; ++i)
    if (!c->frames[i].valid) {
      victim = i;
      break;
    } else if (c->frames[i].age < c->frames[victim].age)
      victim = i;
  Frame *f = &c->frames[victim];
  if (f->valid && f->dirty)
    ++c->writes;
  *f = (Frame){id, ++c->clock, true, false, id * 10};
  ++c->reads;
  return &f->value;
}

int main(void) {
  Cache c = {0};
  fetch(&c, 1);
  fetch(&c, 2);
  fetch(&c, 1);
  fetch(&c, 3);
  printf("reads=%u writes=%u cached1=%d\n", c.reads, c.writes,
         c.frames[0].id == 1 || c.frames[1].id == 1);
  return 0;
}
