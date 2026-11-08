#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { HCAP = 8, EMPTY = 0, LIVE = 1, DEAD = 2 };
typedef struct {
  int key, value;
  unsigned state;
} Slot;
size_t bucket(int key) { return (unsigned)key % HCAP; }
int lookup(const Slot *table, int key) {
  for (size_t k = 0; k < HCAP; ++k) {
    size_t i = (bucket(key) + k) % HCAP;
    if (table[i].state == EMPTY)
      return -1;
    if (table[i].state == LIVE && table[i].key == key)
      return (int)i;
  }
  return -1;
}
bool put(Slot *table, int key, int value) {
  int existing = lookup(table, key);
  if (existing >= 0) {
    table[existing].value = value;
    return true;
  }
  for (size_t k = 0; k < HCAP; ++k) {
    size_t i = (bucket(key) + k) % HCAP;
    if (table[i].state != LIVE) {
      table[i] = (Slot){key, value, LIVE};
      return true;
    }
  }
  return false;
}
bool erase(Slot *table, int key) {
  int i = lookup(table, key);
  if (i < 0)
    return false;
  table[i].state = DEAD;
  return true;
}
uint32_t hash_text(const char *s) {
  uint32_t h = UINT32_C(2166136261);
  for (; *s; ++s) {
    h ^= (unsigned char)*s;
    h *= UINT32_C(16777619);
  }
  return h;
}
typedef struct {
  const char *word;
  unsigned count;
} Word;
bool increment(Word *table, const char *word) {
  size_t first = hash_text(word) % HCAP;
  for (size_t k = 0; k < HCAP; ++k) {
    Word *slot = &table[(first + k) % HCAP];
    if (!slot->word) {
      *slot = (Word){word, 1};
      return true;
    }
    if (strcmp(slot->word, word) == 0) {
      ++slot->count;
      return true;
    }
  }
  return false;
}
unsigned frequency(const Word *table, const char *word) {
  size_t first = hash_text(word) % HCAP;
  for (size_t k = 0; k < HCAP; ++k) {
    const Word *slot = &table[(first + k) % HCAP];
    if (!slot->word)
      return 0;
    if (strcmp(slot->word, word) == 0)
      return slot->count;
  }
  return 0;
}

int main(void) {
  Word table[HCAP] = {0};
  const char *tokens[] = {"red", "blue", "red", "green", "red"};
  for (size_t i = 0; i < 5; ++i)
    if (!increment(table, tokens[i]))
      return 1;
  printf("red=%u blue=%u absent=%u\n", frequency(table, "red"),
         frequency(table, "blue"), frequency(table, "black"));
  return 0;
}
