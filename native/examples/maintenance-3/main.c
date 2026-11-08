#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { PSIZE = 64, MAX_SLOTS = 8 };
typedef struct {
  unsigned char bytes[PSIZE];
  size_t offset[MAX_SLOTS], length[MAX_SLOTS], count, free_end;
} Page;
void page_init(Page *p) {
  memset(p, 0, sizeof *p);
  p->free_end = PSIZE;
}
bool page_insert(Page *p, const unsigned char *data, size_t n, size_t *slot) {
  if (!n || p->count == MAX_SLOTS || n > p->free_end)
    return false;
  size_t i = p->count;
  p->free_end -= n;
  memcpy(p->bytes + p->free_end, data, n);
  p->offset[i] = p->free_end;
  p->length[i] = n;
  ++p->count;
  *slot = i;
  return true;
}
bool page_read(const Page *p, size_t slot, const unsigned char **data,
               size_t *length) {
  if (slot >= p->count || !p->length[slot] || p->offset[slot] > PSIZE ||
      p->length[slot] > PSIZE - p->offset[slot])
    return false;
  *data = p->bytes + p->offset[slot];
  *length = p->length[slot];
  return true;
}
bool page_delete(Page *p, size_t slot) {
  if (slot >= p->count || !p->length[slot])
    return false;
  p->length[slot] = 0;
  return true;
}
void compact(Page *p) {
  Page next;
  page_init(&next);
  next.count = p->count;
  for (size_t i = 0; i < p->count; ++i)
    if (p->length[i]) {
      next.free_end -= p->length[i];
      next.offset[i] = next.free_end;
      next.length[i] = p->length[i];
      memcpy(next.bytes + next.free_end, p->bytes + p->offset[i], p->length[i]);
    }
  *p = next;
}
bool page_valid(const Page *p) {
  if (p->count > MAX_SLOTS || p->free_end > PSIZE)
    return false;
  for (size_t i = 0; i < p->count; ++i) {
    if (!p->length[i])
      continue;
    if (p->offset[i] < p->free_end || p->offset[i] > PSIZE ||
        p->length[i] > PSIZE - p->offset[i])
      return false;
    for (size_t j = 0; j < i; ++j)
      if (p->length[j]) {
        if (p->offset[j] > PSIZE || p->length[j] > PSIZE - p->offset[j])
          return false;
        size_t end_i = p->offset[i] + p->length[i],
               end_j = p->offset[j] + p->length[j];
        if (p->offset[i] < end_j && p->offset[j] < end_i)
          return false;
      }
  }
  return true;
}

int main(void) {
  Page p;
  page_init(&p);
  size_t a, b;
  page_insert(&p, (const unsigned char *)"Ada", 3, &a);
  page_insert(&p, (const unsigned char *)"Ken", 3, &b);
  bool good = page_valid(&p);
  Page bad = p;
  bad.offset[b] = bad.offset[a];
  printf("valid=%d overlap_rejected=%d\n", good, !page_valid(&bad));
  return 0;
}
