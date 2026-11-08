#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { TABLE_CAP = 8 };
typedef struct {
  uint32_t id;
  char name[32];
  uint32_t score;
} Row;
typedef struct {
  Row rows[TABLE_CAP];
  size_t count;
} Table;
typedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;
int find_row(const Table *t, uint32_t id) {
  for (size_t i = 0; i < t->count; ++i)
    if (t->rows[i].id == id)
      return (int)i;
  return -1;
}
Status insert_row(Table *t, Row row) {
  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)
    return INVALID;
  if (find_row(t, row.id) >= 0)
    return DUPLICATE;
  if (t->count == TABLE_CAP)
    return FULL;
  t->rows[t->count++] = row;
  return OK;
}
Status update_score(Table *t, uint32_t id, uint32_t score) {
  int i = find_row(t, id);
  if (i < 0)
    return MISSING;
  t->rows[i].score = score;
  return OK;
}
Status delete_row(Table *t, uint32_t id) {
  int i = find_row(t, id);
  if (i < 0)
    return MISSING;
  for (size_t j = (size_t)i + 1; j < t->count; ++j)
    t->rows[j - 1] = t->rows[j];
  --t->count;
  return OK;
}
void display(const Table *t) {
  for (size_t i = 0; i < t->count; ++i)
    printf("%u | %s | %u\n", (unsigned)t->rows[i].id, t->rows[i].name,
           (unsigned)t->rows[i].score);
}
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
  Row *separate[8] = {0};
  unsigned calls = 0;
  for (size_t i = 0; i < 8; ++i) {
    separate[i] = malloc(sizeof *separate[i]);
    ++calls;
    if (!separate[i]) {
      for (size_t j = 0; j < i; ++j)
        free(separate[j]);
      return 1;
    }
  }
  Row *pool = malloc(8 * sizeof *pool);
  if (!pool) {
    for (size_t i = 0; i < 8; ++i)
      free(separate[i]);
    return 1;
  }
  Cache c = {0};
  fetch(&c, 1);
  fetch(&c, 2);
  fetch(&c, 1);
  printf("individual_allocations=%u pooled_allocations=1 cache_reads=%u\n",
         calls, c.reads);
  for (size_t i = 0; i < 8; ++i)
    free(separate[i]);
  free(pool);
  return 0;
}
