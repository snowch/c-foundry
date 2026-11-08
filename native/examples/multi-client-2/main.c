#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  unsigned owner;
  bool active;
  int committed, working;
} SessionDB;
bool tx_begin(SessionDB *db, unsigned session) {
  if (!session || db->active)
    return false;
  db->owner = session;
  db->working = db->committed;
  db->active = true;
  return true;
}
bool tx_set(SessionDB *db, unsigned session, int value) {
  if (!db->active || db->owner != session)
    return false;
  db->working = value;
  return true;
}
bool tx_commit(SessionDB *db, unsigned session) {
  if (!db->active || db->owner != session)
    return false;
  db->committed = db->working;
  db->active = false;
  db->owner = 0;
  return true;
}

int main(void) {
  SessionDB db = {0};
  tx_begin(&db, 1);
  tx_set(&db, 1, 42);
  bool wrong = tx_commit(&db, 2);
  bool right = tx_commit(&db, 1);
  printf("other_rejected=%d owner_committed=%d value=%d\n", !wrong, right,
         db.committed);
  return 0;
}
