# Chapter 8: Structured data

Part 2: Understand memory and practical C. Teaching baseline: C17.

Represent related values and relationships with structs, enums, and tagged unions. Separate logical records from their layout, and document borrowed pointers into collections.

## Outcomes

- Choose fields, tags, and ownership rules for records.
- Inspect padding without treating memory layout as a file format.
- Find and update records while respecting collection lifetime.

## 8.1 Structs, initialization, and member access

A struct groups fields into one object with a defined type. Each field has a name and type, so a record can express more meaning than parallel arrays with matching indexes.

Use the dot operator on a struct object and the arrow operator on a pointer to one. A designated initializer names the fields being initialized; omitted fields receive zero initialization in this aggregate initializer. Assignment between compatible structs copies their members, including embedded arrays. That copy is not a deep copy of separately allocated objects reached through pointer members.

### main.c

```c
#include <stdio.h>

struct Row { int id; char name[32]; };

int main(void) {
    struct Row row = {.id = 1, .name = "Ada"};
    struct Row copy = row;
    copy.id = 2;
    printf("%d | %s\n%d | %s\n", row.id, row.name, copy.id, copy.name);
    return 0;
}
```

Output:

```text
1 | Ada
2 | Ada
```

row and copy have distinct embedded name arrays. Updating copy.id leaves row.id unchanged. No heap storage is involved, so neither object needs free. If name were a char * instead, struct assignment would copy that pointer value rather than allocate another string.

**Watch for:** Do not assume that copying a struct containing owning pointers creates independent ownership. You need an explicit clone or transfer policy for those members.

**Check:** Does struct assignment automatically duplicate a heap string reached by a pointer member?

1. Yes
2. No

<details><summary>Answer</summary>

No. Pointer members are copied as values; the pointed-to allocation is not duplicated.

</details>

**Try:** Change a character in copy.name and confirm that row.name remains unchanged.

Run from the repository root:

```sh
make example EXAMPLE=structured-data-1
```

## 8.2 typedef, enums, and tagged unions

An enum gives meaningful names to integer choices. A union stores alternatives in overlapping storage. A tagged union combines them so the program knows which alternative it may interpret.

Maintain an invariant connecting the tag to the union member you most recently established. A switch on the tag selects the appropriate interpretation. typedef can give the whole record a concise type name, but it does not create lifetime management. In this example, the text member borrows a string literal whose lifetime covers the program; an owned heap string would need a different cleanup rule.

### main.c

```c
#include <stdio.h>

typedef enum { NUMBER, TEXT } Kind;
typedef struct {
    Kind kind;
    union { int number; const char *text; } data;
} Value;

void show(Value value) {
    switch (value.kind) {
        case NUMBER: printf("number=%d\n", value.data.number); break;
        case TEXT: printf("text=%s\n", value.data.text); break;
    }
}

int main(void) {
    Value value = {.kind = NUMBER, .data.number = 7};
    show(value);
    value.kind = TEXT;
    value.data.text = "Ada";
    show(value);
    return 0;
}
```

Output:

```text
number=7
text=Ada
```

The first value establishes the number alternative. Before the second call, both tag and text member are updated. show therefore follows the matching branch each time. The union reuses storage; it is not a record holding both independent payloads simultaneously.

**Watch for:** Reading another union member to guess a different representation is not a portable serialization strategy. Keep the tag and payload consistent instead.

**Check:** What tells show which union member to use?

1. The tag
2. The size of the union

<details><summary>Answer</summary>

The tag. The program’s invariant associates each Kind value with an established payload member.

</details>

**Try:** Add a third enum case with a suitable payload and update every switch handling it.

Run from the repository root:

```sh
make example EXAMPLE=structured-data-2
```

## 8.3 Padding, alignment, and sizeof

A struct’s size may include padding between members and at its end. Its layout meets alignment requirements, but a particular arrangement is not a portable file format.

sizeof reports the storage required for an object of that type, including padding. offsetof from stddef.h reports a member’s byte offset, and _Alignof reports a type’s alignment requirement in C11 and later. Use these for inspection or deliberate low-level interfaces, not to hardcode one machine’s layout into a persistent format. A file format should specify byte order and field widths independently.

### main.c

```c
#include <stdio.h>
#include <stddef.h>

typedef struct { char flag; int count; } Row;

int main(void) {
    printf("fields fit=%d\n", sizeof(Row) >= sizeof(char) + sizeof(int));
    printf("count aligned=%d\n", offsetof(Row, count) % _Alignof(int) == 0);
    return 0;
}
```

Output:

```text
fields fit=1
count aligned=1
```

The checks describe properties instead of assuming a particular number of padding bytes. On the course toolchains, the int member is placed at a suitably aligned offset. You can additionally print sizeof(Row) and offsetof(Row, count) to inspect a concrete platform, while remembering those numeric results are not universal C guarantees.

**Watch for:** memcmp over an entire struct can compare padding rather than just logical field values. Likewise, fwrite(&row, sizeof row, 1, file) exposes layout and representation assumptions.

**Check:** Does sizeof(Row) necessarily equal the sum of its field sizes?

1. Yes
2. No

<details><summary>Answer</summary>

No. Padding can make the complete object larger.

</details>

**Try:** Reorder the fields and print actual sizes and offsets. Keep those observations separate from your file-format design.

Run from the repository root:

```sh
make example EXAMPLE=structured-data-3
```

## 8.4 Pointers to structs and linked objects

A struct can contain a pointer to another object of the same type. This lets objects represent relationships, but each relationship needs a clear ownership and lifetime policy.

A self-referential type uses a pointer because an object cannot contain an infinitely nested instance of itself by value. Here, a two-node chain owns both allocations. During cleanup, save the next pointer before freeing the current node. A pointer borrowed from a node is not usable after that node is released. Later data-structure chapters develop insertion and deletion algorithms on this foundation.

### main.c

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct Node { int value; struct Node *next; } Node;

int main(void) {
    Node *first = malloc(sizeof *first);
    Node *second = malloc(sizeof *second);
    if (!first || !second) { free(first); free(second); return 1; }
    *first = (Node){.value = 1, .next = second};
    *second = (Node){.value = 2, .next = NULL};
    printf("sum=%d\n", first->value + first->next->value);
    while (first) {
        Node *next = first->next;
        free(first);
        first = next;
    }
    return 0;
}
```

Output:

```text
sum=3
```

The arrows follow pointers to live Node objects. The cleanup loop remembers the successor while the current node is still alive, frees the current allocation, then advances using the saved pointer. The failure path also releases whichever allocation succeeded, since free(NULL) is permitted.

**Watch for:** Reading first->next after free(first) is a use-after-free, even if the old bytes seem unchanged. Save what cleanup needs before ending the object’s lifetime.

**Check:** When must the loop read the next pointer?

1. Before freeing the current node
2. After freeing the current node

<details><summary>Answer</summary>

Before freeing the current node. Accessing a member requires the current node to still be alive.

</details>

**Try:** Add a third node, update the sum, and ensure the same cleanup loop releases every allocation.

Run from the repository root:

```sh
make example EXAMPLE=structured-data-4
```

## 8.5 An in-memory record collection

A collection interface should make lookup success, failure, and mutation explicit. Returning a borrowed pointer can be convenient while the collection remains in place and alive.

The helper searches only the supplied count of initialized rows and returns either a row address or NULL. Its caller checks the result before modifying a field. The embedded name storage remains owned by each row. If the table were dynamically resized, a previously returned row pointer could become invalid; a larger interface must document that invalidation rule.

### main.c

```c
#include <stdio.h>

typedef struct { int id; char name[32]; int score; } Row;

Row *find(Row *rows, size_t count, int id) {
    for (size_t i = 0; i < count; i++) {
        if (rows[i].id == id) return &rows[i];
    }
    return NULL;
}

int main(void) {
    Row rows[] = {{1, "Ada", 80}, {2, "Grace", 90}};
    Row *found = find(rows, 2, 2);
    if (found) found->score = 99;
    printf("%s %d\n", rows[1].name, rows[1].score);
    return 0;
}
```

Output:

```text
Grace 99
```

The returned address reaches the second element. Updating found->score therefore updates rows[1]. The pointer is borrowed, so the caller does not free it. With an unknown ID, find returns NULL and the conditional prevents a dereference.

**Watch for:** Passing capacity instead of initialized count could expose uninitialized rows. Also, a successful lookup does not justify keeping its pointer past the collection’s lifetime or a relocation.

**Check:** Should the caller free the pointer returned from this stack-array lookup?

1. Yes
2. No

<details><summary>Answer</summary>

No. It designates an element inside an existing array, not an independently owned allocation.

</details>

**Try:** Implement the record-update project and test an absent ID and an overlong name.

Run from the repository root:

```sh
make example EXAMPLE=structured-data-5
```

## Chapter practice

Edit `native/exercises/records.c`.

```sh
make exercise EXERCISE=records
```

Chapter workspace command: `make chapter CHAPTER=structured-data`.

Generated from dist/part2.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/structured-data
