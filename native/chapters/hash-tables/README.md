# Chapter 18: Hash tables

Part 4: Build data structures in C. Teaching baseline: C17.

Resolve collisions explicitly, preserve probe chains on deletion, and connect expected costs to load and hashing assumptions.

## Outcomes

- Implement lookup, insertion, and tombstone deletion.
- Rehash live entries when capacity changes.
- Build a bounded word-frequency index.

## 18.1 Hash functions for integers and strings

A hash maps a key to a bucket; equality still decides whether two keys are the same. Collisions are normal.

The integer fixture uses remainder with a power-of-two-sized table to make collisions easy to see. It is deliberately not a robust adversarial integer hash. The string helper consumes unsigned bytes with a 32-bit FNV-style recurrence. Equal strings must hash equally, while different strings may share a hash or bucket. Keep hashing and key equality consistent.

### main.c

```c
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

int main(void) {
  printf("bucket1=%zu bucket9=%zu same_text=%d\n", bucket(1), bucket(9),
         hash_text("cat") == hash_text("cat"));
  return 0;
}
```

Output:

```text
bucket1=1 bucket9=1 same_text=1
```

Keys one and nine collide in bucket one but remain distinct keys. Lookup must examine candidates rather than treating the bucket number as identity.

**Watch for:** A noncryptographic hash is not a security boundary against deliberately chosen inputs.

**Check:** Can different keys share a bucket?

1. Yes
2. No

<details><summary>Answer</summary>

Yes. A finite bucket set generally has fewer positions than possible keys.

</details>

**Try:** Find three integer keys that collide and test that all three remain independently retrievable.

Run from the repository root:

```sh
make example EXAMPLE=hash-tables-1
```

## 18.2 Separate chaining and open addressing

Separate chaining stores multiple entries in a bucket’s list; open addressing searches alternate slots within the table.

The fixture demonstrates linear probing: after a collision, try the next slot modulo capacity. Lookup follows the same sequence as insertion. Chaining instead follows links from a bucket head and can keep entries outside the bucket array. Both require a clear policy for duplicates, allocation failure, and key ownership.

### main.c

```c
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

int main(void) {
  Slot table[HCAP] = {0};
  put(table, 1, 10);
  put(table, 9, 90);
  printf("one=%d nine=%d missing=%d\n", lookup(table, 1), lookup(table, 9),
         lookup(table, 17));
  return 0;
}
```

Output:

```text
one=1 nine=2 missing=-1
```

The second key lands in slot two. The empty slot after that terminates an unsuccessful probe for 17.

**Watch for:** Inserting with one probe sequence and searching with another makes stored entries unreachable.

**Check:** Why must lookup continue past the first occupied nonmatching slot?

1. The first bucket cannot contain valid data
2. A colliding key may be farther along the probe chain

<details><summary>Answer</summary>

A colliding key may be farther along the probe chain. An occupied slot is evidence to continue, not evidence of absence.

</details>

**Try:** Implement the same fixture with bucket-linked chains and compare ownership and memory layout.

Run from the repository root:

```sh
make example EXAMPLE=hash-tables-2
```

## 18.3 Collisions, load factor, and resizing

Load factor measures live entries divided by bucket capacity. Open-addressed tables need spare empty slots for short probes.

Resizing means allocating a new empty table and recomputing every live entry’s bucket under the new capacity. Copying slots at their old indices is not sufficient when the modulus changes. The small fixture shows how capacity changes a key’s home bucket; a complete rehash must preserve all key/value pairs and leave the old owner intact on allocation failure.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
  unsigned keys[] = {1, 9, 17};
  for (size_t i = 0; i < 3; ++i)
    printf("key=%u old=%u new=%u\n", keys[i], keys[i] % 8, keys[i] % 16);
  return 0;
}
```

Output:

```text
key=1 old=1 new=1
key=9 old=1 new=9
key=17 old=1 new=1
```

Key nine changes its home bucket when capacity doubles. Collisions may remain after growth, so the new insertion routine must still resolve them.

**Watch for:** Load factor alone does not describe clustering; a poor hash can create long probes even at low load.

**Check:** Should a resize copy slots to the same indices?

1. No, reinsert live entries under the new capacity
2. Yes, capacity does not affect hash placement

<details><summary>Answer</summary>

No, reinsert live entries under the new capacity. The bucket calculation depends on table capacity.

</details>

**Try:** Implement rehash into a temporary allocation, then swap owners only after every live entry is inserted.

Run from the repository root:

```sh
make example EXAMPLE=hash-tables-3
```

## 18.4 Deletion and tombstones

Deletion must preserve the evidence that lookup should continue. A tombstone means formerly occupied, not never used.

An empty slot can end a probe because insertion would have stopped there. A deleted slot cannot: a later colliding key may depend on passing it. Mark deletion DEAD and allow insertion to reuse it after checking the entire existing-key lookup, preventing duplicate keys from being accidentally created.

### main.c

```c
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

int main(void) {
  Slot table[HCAP] = {0};
  put(table, 1, 10);
  put(table, 9, 90);
  erase(table, 1);
  printf("removed=%d survivor=%d tombstone=%u\n", lookup(table, 1),
         lookup(table, 9), table[1].state);
  return 0;
}
```

Output:

```text
removed=-1 survivor=2 tombstone=2
```

Key nine remains reachable through the deleted first slot. Replacing that state with EMPTY would break this lookup.

**Watch for:** Accumulated tombstones can make probes long even when few entries remain live; periodic rehashing removes them.

**Check:** Can lookup stop at a tombstone?

1. Yes
2. No

<details><summary>Answer</summary>

No. A collision chain may continue beyond a deleted entry.

</details>

**Try:** Insert key 17 after the deletion and verify both slot reuse and key nine’s survival.

Run from the repository root:

```sh
make example EXAMPLE=hash-tables-4
```

## 18.5 Average versus worst-case complexity

Hash-table complexity depends on hashing assumptions, load, and collision policy. Expected constant time is not an unconditional worst-case guarantee.

With a suitable distribution and bounded load, expected lookup and insertion can be O(1). A set of colliding keys can require Θ(n) probes for one operation; resizing also costs Θ(n) occasionally. The fixture constructs a collision cluster and counts occupied positions before the first empty slot to expose the mechanism.

### main.c

```c
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

int main(void) {
  Slot table[HCAP] = {0};
  put(table, 1, 1);
  put(table, 9, 2);
  put(table, 17, 3);
  size_t probes = 0;
  for (size_t k = 0; k < HCAP; ++k) {
    ++probes;
    if (table[(1 + k) % HCAP].state == EMPTY)
      break;
  }
  printf("absent_probes=%zu\n", probes);
  return 0;
}
```

Output:

```text
absent_probes=4
```

An absent colliding key examines three live entries and then an empty slot. The probe count grows with cluster length.

**Watch for:** A benchmark using uniformly distributed keys does not test chosen-collision behavior.

**Check:** What can one worst-case lookup cost?

1. Θ(n)
2. Always exactly one probe

<details><summary>Answer</summary>

Θ(n). Collision resolution may examine a linear number of entries.

</details>

**Try:** Compare probe counts for clustered keys and distinct home buckets at the same load.

Run from the repository root:

```sh
make example EXAMPLE=hash-tables-5
```

## 18.6 A word-frequency index

A frequency index combines token identity, collision resolution, and a count update. Borrowed keys need a lifetime contract.

The example receives already tokenized immutable string literals and borrows them for the table’s lifetime. increment either establishes a new entry or updates an equal key. It rejects a full table; a production counter also checks count overflow and owns copies of tokens whose source buffers may change. Tokenization and case normalization are deliberately separate policies.

### main.c

```c
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
```

Output:

```text
red=3 blue=1 absent=0
```

Three red tokens update one entry rather than creating duplicate key slots. The absent key returns zero frequency.

**Watch for:** Storing pointers into a reused input line makes previously inserted words change underneath the table.

**Check:** When is borrowing these keys valid?

1. Whenever the pointer is non-null
2. While their immutable storage outlives the table

<details><summary>Answer</summary>

While their immutable storage outlives the table. A valid address today does not establish its future lifetime.

</details>

**Try:** Read bounded tokens, allocate owned copies for new words, and free all owners when the index is destroyed.

Run from the repository root:

```sh
make example EXAMPLE=hash-tables-6
```

## Build it yourself

Build a hash table that remains correct through collisions and resizing.

1. Resolve collisions explicitly, preserve probe chains on deletion, and connect expected costs to load and hashing assumptions.
2. Read bounded tokens, allocate owned copies for new words, and free all owners when the index is destroyed.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=hash-tables-6
```

Chapter workspace command: `make chapter CHAPTER=hash-tables`.

Generated from dist/part4.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/hash-tables
