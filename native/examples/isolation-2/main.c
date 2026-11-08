#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  int value;
  unsigned version;
} Versioned;
bool compare_commit(Versioned *db, unsigned observed, int value) {
  if (db->version != observed)
    return false;
  db->value = value;
  ++db->version;
  return true;
}

int main(void) {
  Versioned db = {10, 1};
  unsigned first = db.version, second = db.version;
  bool a = compare_commit(&db, first, 11), b = compare_commit(&db, second, 12);
  printf("first=%d stale_rejected=%d value=%d version=%u\n", a, !b, db.value,
         db.version);
  return 0;
}
