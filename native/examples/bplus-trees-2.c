#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { LEAF_MAX = 4, LEAF_POOL = 8 };
typedef struct Leaf {
  int key[LEAF_MAX], value[LEAF_MAX];
  size_t n;
  bool used;
  struct Leaf *next;
} Leaf;
typedef struct {
  Leaf pages[LEAF_POOL];
  Leaf *child[LEAF_POOL];
  size_t n;
} BTree;
void tree_init(BTree *t) {
  memset(t, 0, sizeof *t);
  t->n = 1;
  t->pages[0].used = true;
  t->child[0] = &t->pages[0];
}
size_t route(const BTree *t, int key) {
  size_t i = 0;
  while (i + 1 < t->n && t->child[i + 1]->key[0] <= key)
    ++i;
  return i;
}
bool tree_find(const BTree *t, int key, int *out) {
  const Leaf *p = t->child[route(t, key)];
  for (size_t i = 0; i < p->n; ++i)
    if (p->key[i] == key) {
      *out = p->value[i];
      return true;
    }
  return false;
}
bool tree_put(BTree *t, int key, int value) {
  size_t at = route(t, key);
  Leaf *p = t->child[at];
  int old;
  if (tree_find(t, key, &old))
    return false;
  if (p->n < LEAF_MAX) {
    size_t i = p->n++;
    while (i && p->key[i - 1] > key) {
      p->key[i] = p->key[i - 1];
      p->value[i] = p->value[i - 1];
      --i;
    }
    p->key[i] = key;
    p->value[i] = value;
    return true;
  }
  if (t->n == LEAF_POOL)
    return false;
  Leaf *right = NULL;
  for (size_t i = 0; i < LEAF_POOL; ++i)
    if (!t->pages[i].used) {
      right = &t->pages[i];
      break;
    }
  if (!right)
    return false;
  int keys[5], values[5];
  size_t j = 0;
  bool added = false;
  for (size_t i = 0; i < 5; ++i) {
    if (!added && (j == p->n || key < p->key[j])) {
      keys[i] = key;
      values[i] = value;
      added = true;
    } else {
      keys[i] = p->key[j];
      values[i] = p->value[j++];
    }
  }
  *right = (Leaf){0};
  right->used = true;
  p->n = 2;
  right->n = 3;
  for (size_t i = 0; i < 2; ++i) {
    p->key[i] = keys[i];
    p->value[i] = values[i];
  }
  for (size_t i = 0; i < 3; ++i) {
    right->key[i] = keys[i + 2];
    right->value[i] = values[i + 2];
  }
  right->next = p->next;
  p->next = right;
  for (size_t i = t->n; i > at + 1; --i)
    t->child[i] = t->child[i - 1];
  t->child[at + 1] = right;
  ++t->n;
  return true;
}
bool tree_erase(BTree *t, int key) {
  size_t at = route(t, key);
  Leaf *p = t->child[at];
  size_t pos = 0;
  while (pos < p->n && p->key[pos] != key)
    ++pos;
  if (pos == p->n)
    return false;
  for (size_t i = pos + 1; i < p->n; ++i) {
    p->key[i - 1] = p->key[i];
    p->value[i - 1] = p->value[i];
  }
  --p->n;
  if (t->n == 1 || p->n >= 2)
    return true;
  Leaf *left = at ? t->child[at - 1] : NULL,
       *right = at + 1 < t->n ? t->child[at + 1] : NULL;
  if (left && left->n > 2) {
    for (size_t i = p->n; i > 0; --i) {
      p->key[i] = p->key[i - 1];
      p->value[i] = p->value[i - 1];
    }
    --left->n;
    p->key[0] = left->key[left->n];
    p->value[0] = left->value[left->n];
    ++p->n;
    return true;
  }
  if (right && right->n > 2) {
    p->key[p->n] = right->key[0];
    p->value[p->n++] = right->value[0];
    for (size_t i = 1; i < right->n; ++i) {
      right->key[i - 1] = right->key[i];
      right->value[i - 1] = right->value[i];
    }
    --right->n;
    return true;
  }
  size_t removed;
  if (left) {
    for (size_t i = 0; i < p->n; ++i) {
      left->key[left->n] = p->key[i];
      left->value[left->n++] = p->value[i];
    }
    left->next = p->next;
    p->used = false;
    removed = at;
  } else {
    for (size_t i = 0; i < right->n; ++i) {
      p->key[p->n] = right->key[i];
      p->value[p->n++] = right->value[i];
    }
    p->next = right->next;
    right->used = false;
    removed = at + 1;
  }
  for (size_t i = removed + 1; i < t->n; ++i)
    t->child[i - 1] = t->child[i];
  --t->n;
  return true;
}
void range(const BTree *t, int lo, int hi) {
  const Leaf *p = t->child[route(t, lo)];
  for (; p; p = p->next)
    for (size_t i = 0; i < p->n; ++i) {
      if (p->key[i] >= hi)
        return;
      if (p->key[i] >= lo)
        printf("%d ", p->key[i]);
    }
  puts("");
}

int main(void) {
  BTree t;
  tree_init(&t);
  for (int key = 1; key <= 7; ++key)
    if (!tree_put(&t, key, key * 10))
      return 1;
  for (size_t i = 0; i < t.n; ++i)
    printf("leaf%zu min=%d count=%zu\n", i, t.child[i]->key[0], t.child[i]->n);
  return 0;
}
