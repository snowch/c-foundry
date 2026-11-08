window.PART_FOUR = {
  "lists": {
    "intro": "Choose a sequence representation by its operation costs, ownership rules, and access patterns.",
    "outcomes": [
      "Grow a vector without losing its owner on failure.",
      "Splice and remove linked nodes while preserving links.",
      "Explain iterator invalidation and locality tradeoffs."
    ],
    "topics": {
      "1": {
        "intro": "A vector keeps initialized length separate from allocated capacity. Spare capacity makes most appends inexpensive.",
        "explanation": "The append helper grows through a temporary owner, checks byte-size arithmetic, and updates the public state only after successful allocation. Doubling capacity gives O(1) amortized append over a sequence, although a growth operation copies or relocates Θ(n) elements. The caller frees the final allocation exactly once.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  int *data;\n  size_t length, capacity;\n} Vector;\nbool append(Vector *v, int x) {\n  if (v->length == v->capacity) {\n    size_t cap = v->capacity ? v->capacity * 2 : 2;\n    if (v->capacity > SIZE_MAX / 2 || cap > SIZE_MAX / sizeof *v->data)\n      return false;\n    int *next = realloc(v->data, cap * sizeof *next);\n    if (!next)\n      return false;\n    v->data = next;\n    v->capacity = cap;\n  }\n  v->data[v->length++] = x;\n  return true;\n}\n\nint main(void) {\n  Vector v = {0};\n  for (int i = 1; i <= 5; ++i)\n    if (!append(&v, i)) {\n      free(v.data);\n      return 1;\n    }\n  printf(\"length=%zu capacity=%zu last=%d\\n\", v.length, v.capacity, v.data[4]);\n  free(v.data);\n  return 0;\n}\n",
        "expected": "length=5 capacity=8 last=5",
        "walkthrough": "The capacities are two, four, and eight. Only the first five elements are initialized logical values.",
        "pitfall": "Pointers into the old allocation cannot be retained across a successful realloc.",
        "question": "May code read unused capacity as initialized elements?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "Capacity reserves storage; length defines which elements belong to the sequence.",
        "tryit": "Add pop and reserve operations, documenting what they do on an empty vector and failed allocation.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "A singly linked node names its successor; a doubly linked node also names its predecessor. The extra link supports different update costs.",
        "explanation": "The fixture uses stack-allocated nodes so link changes can be inspected without adding allocation code. link_after sets both sides of each relationship. In a doubly linked list, if x->next is y then y->previous should be x. Ownership is separate from connectivity: these borrowed nodes must not be freed by the linking helper.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct Node {\n  int value;\n  struct Node *next, *previous;\n} Node;\nvoid link_after(Node *a, Node *b) {\n  b->next = a->next;\n  b->previous = a;\n  if (a->next)\n    a->next->previous = b;\n  a->next = b;\n}\n\nint main(void) {\n  Node a = {1, NULL, NULL}, b = {2, NULL, NULL}, middle = {9, NULL, NULL};\n  link_after(&a, &b);\n  link_after(&a, &middle);\n  printf(\"forward=%d,%d,%d backward=%d\\n\", a.value, a.next->value,\n         a.next->next->value, b.previous->value);\n  return 0;\n}\n",
        "expected": "forward=1,9,2 backward=9",
        "walkthrough": "The new node is between a and b. Updating b.previous is essential; a forward-only walk would not reveal a stale backward link.",
        "pitfall": "A data structure can look correct in one traversal direction while violating another invariant.",
        "question": "Which link must also change when inserting before b?",
        "choices": [
          "Only the new node’s value",
          "b.previous"
        ],
        "answer": 1,
        "why": "Both neighboring relationships must agree.",
        "tryit": "Write an invariant checker that walks forward and verifies every backward link.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "Removal changes the owner of an incoming link. A pointer-to-pointer handles removing the head and an interior node with one pattern.",
        "explanation": "Walk the address of the link that reaches the current node. On a match, replace that link with the successor before freeing the node. The helper owns the heap nodes it removes. Traversal is O(n); unlinking is O(1) once the incoming link is known. Returning immediately prevents using the freed node.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct Node {\n  int value;\n  struct Node *next, *previous;\n} Node;\nvoid link_after(Node *a, Node *b) {\n  b->next = a->next;\n  b->previous = a;\n  if (a->next)\n    a->next->previous = b;\n  a->next = b;\n}\nbool remove_value(Node **head, int x) {\n  for (Node **link = head; *link; link = &(*link)->next)\n    if ((*link)->value == x) {\n      Node *old = *link;\n      *link = old->next;\n      free(old);\n      return true;\n    }\n  return false;\n}\n\nint main(void) {\n  Node *head = NULL;\n  for (int x = 3; x >= 1; --x) {\n    Node *n = malloc(sizeof *n);\n    if (!n) {\n      while (head) {\n        Node *next = head->next;\n        free(head);\n        head = next;\n      }\n      return 1;\n    }\n    *n = (Node){x, head, NULL};\n    head = n;\n  }\n  remove_value(&head, 2);\n  for (Node *n = head; n; n = n->next)\n    printf(\"%d \", n->value);\n  puts(\"\");\n  while (head) {\n    Node *next = head->next;\n    free(head);\n    head = next;\n  }\n  return 0;\n}\n",
        "expected": "1 3",
        "walkthrough": "The incoming link in node one is redirected to node three before node two is freed. Cleanup saves the successor while the current node is alive.",
        "pitfall": "This singly linked removal does not maintain previous links; do not reuse it as a doubly linked removal API.",
        "question": "What is redirected before freeing the removed node?",
        "choices": [
          "The incoming link",
          "The freed node’s value afterward"
        ],
        "answer": 0,
        "why": "No access to the node is valid after free.",
        "tryit": "Test removing the head, tail, only node, and a value that is absent.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "An iterator is a contract about which operations leave an access path valid. Capacity growth and node deletion have different invalidation rules.",
        "explanation": "Save a logical index rather than an element pointer when the next operation may relocate a vector. After a successful append, reacquire the pointer from the current allocation. A linked-node pointer may survive insertion elsewhere but becomes invalid when that node is freed. Neither representation permits a borrowed result to outlive its owner.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  int *data;\n  size_t length, capacity;\n} Vector;\nbool append(Vector *v, int x) {\n  if (v->length == v->capacity) {\n    size_t cap = v->capacity ? v->capacity * 2 : 2;\n    if (v->capacity > SIZE_MAX / 2 || cap > SIZE_MAX / sizeof *v->data)\n      return false;\n    int *next = realloc(v->data, cap * sizeof *next);\n    if (!next)\n      return false;\n    v->data = next;\n    v->capacity = cap;\n  }\n  v->data[v->length++] = x;\n  return true;\n}\n\nint main(void) {\n  Vector v = {0};\n  if (!append(&v, 10) || !append(&v, 20)) {\n    free(v.data);\n    return 1;\n  }\n  size_t selected = 1;\n  if (!append(&v, 30)) {\n    free(v.data);\n    return 1;\n  }\n  printf(\"reacquired=%d\\n\", v.data[selected]);\n  free(v.data);\n  return 0;\n}\n",
        "expected": "reacquired=20",
        "walkthrough": "The index still identifies the same logical element because this operation appends rather than inserting before it. The pointer is acquired only after possible growth.",
        "pitfall": "An index can also become stale after insertion or deletion changes logical positions.",
        "question": "Why is an index useful across this append?",
        "choices": [
          "Indices survive every possible edit",
          "It does not contain an address into the old allocation"
        ],
        "answer": 1,
        "why": "The guarantee is specific to append preserving earlier positions.",
        "tryit": "Document invalidation for append, insert, erase, and clear in both a vector and a list.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "Asymptotic operation counts do not capture every practical cost. Contiguous storage often improves cache locality while nodes carry pointer and allocator overhead.",
        "explanation": "A vector provides constant-time indexed access; locating the ith linked node requires following i links. Both full traversals are Θ(n), but pointer chasing and scattered allocations can change hardware behavior. The example counts logical link steps, not cache misses or timings. Avoid claiming a universal speed ratio from this model.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct Node {\n  int value;\n  struct Node *next, *previous;\n} Node;\nvoid link_after(Node *a, Node *b) {\n  b->next = a->next;\n  b->previous = a;\n  if (a->next)\n    a->next->previous = b;\n  a->next = b;\n}\n\nint main(void) {\n  Node nodes[] = {{4, NULL, NULL}, {5, NULL, NULL}, {6, NULL, NULL}};\n  nodes[0].next = &nodes[1];\n  nodes[1].next = &nodes[2];\n  Node *n = nodes;\n  size_t steps = 0;\n  while (steps < 2) {\n    n = n->next;\n    ++steps;\n  }\n  printf(\"value=%d link_steps=%zu indexed=%d\\n\", n->value, steps,\n         nodes[2].value);\n  return 0;\n}\n",
        "expected": "value=6 link_steps=2 indexed=6",
        "walkthrough": "Two successor traversals locate the third node. The indexed expression reaches its array element directly. These nodes happen to be contiguous; a general heap list need not be.",
        "pitfall": "The sample’s contiguous node array must not be presented as evidence about scattered heap allocation performance.",
        "question": "Which operation is O(1) for a vector but O(n) for a list?",
        "choices": [
          "Access by arbitrary index",
          "Visiting every value"
        ],
        "answer": 0,
        "why": "A list must follow links to find an index.",
        "tryit": "Choose a representation for mostly indexed reads and for frequent splices with known neighboring nodes; justify both choices.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practicePlan": {
      "goal": "Implement list operations and compare them with a dynamic array.",
      "tasks": [
        "Choose a sequence representation by its operation costs, ownership rules, and access patterns.",
        "Choose a representation for mostly indexed reads and for frequent splices with known neighboring nodes; justify both choices.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "lists-5"
    }
  },
  "queues": {
    "intro": "Define bounded stack and queue operations before using them to parse or schedule work.",
    "outcomes": [
      "Maintain head, count, and capacity invariants in a ring.",
      "Reject overflow and underflow without changing state.",
      "Apply stacks to matching and expression evaluation."
    ],
    "topics": {
      "1": {
        "intro": "A stack removes the most recently added value; a queue removes the oldest. The operation contract matters more than the container’s name.",
        "explanation": "An array-backed stack keeps its next free position in count. Push checks capacity before writing; pop checks count before decrementing and reading. A linked implementation avoids a fixed array limit but introduces allocation failure and node ownership. Both can implement constant-time push/pop when their required node locations are known.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  int stack[3], out;\n  size_t count = 0;\n  stack[count++] = 10;\n  stack[count++] = 20;\n  out = stack[--count];\n  printf(\"popped=%d remaining=%zu\\n\", out, count);\n  return 0;\n}\n",
        "expected": "popped=20 remaining=1",
        "walkthrough": "The small trusted fixture establishes both pushes before popping. A public interface must expose the capacity and empty checks rather than relying on the caller’s fixed sequence.",
        "pitfall": "Pre-decrementing an empty size_t wraps before any array bound can be checked.",
        "question": "Which item leaves a stack first?",
        "choices": [
          "The most recently pushed item",
          "The oldest item"
        ],
        "answer": 0,
        "why": "LIFO is the defining removal order.",
        "tryit": "Wrap this fixture in checked push and pop functions and test all empty/full boundaries.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "A circular queue reuses freed slots without shifting every remaining element. Keep a count to distinguish empty from full.",
        "explanation": "The next write is at (head+count)%capacity. Pop advances head modulo capacity. The invariant 0≤count≤capacity makes both operations bounded. This fixed small implementation cannot overflow the index addition; a general size_t ring must account for large-capacity arithmetic. Neither function provides thread synchronization.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { QCAP = 4 };\ntypedef struct {\n  int data[QCAP];\n  size_t head, count;\n} Queue;\nbool push(Queue *q, int x) {\n  if (q->count == QCAP)\n    return false;\n  q->data[(q->head + q->count) % QCAP] = x;\n  ++q->count;\n  return true;\n}\nbool pop(Queue *q, int *out) {\n  if (!q->count)\n    return false;\n  *out = q->data[q->head];\n  q->head = (q->head + 1) % QCAP;\n  --q->count;\n  return true;\n}\n\nint main(void) {\n  Queue q = {0};\n  int x;\n  push(&q, 1);\n  push(&q, 2);\n  pop(&q, &x);\n  push(&q, 3);\n  push(&q, 4);\n  push(&q, 5);\n  while (pop(&q, &x))\n    printf(\"%d \", x);\n  puts(\"\");\n  return 0;\n}\n",
        "expected": "2 3 4 5",
        "walkthrough": "The slot freed by removing one is reused after the tail wraps. FIFO order is independent of the physical slot numbering.",
        "pitfall": "A modulo expression does not by itself prevent writing when the queue is full.",
        "question": "What separates a full ring from an empty ring here?",
        "choices": [
          "The contents of the first array cell",
          "The count field"
        ],
        "answer": 1,
        "why": "Both states may have the same head and tail positions.",
        "tryit": "Print physical indices while wrapping, then compare them with the logical output order.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "A failed bounded operation should report failure and preserve the container’s state. Resizing is a separate policy.",
        "explanation": "The queue rejects a fifth item before modifying count or data. An empty pop leaves its output unchanged in this API. To resize a ring, copy values in logical order into a new allocation and reset head to zero only after success. A bounded queue can instead apply backpressure, a policy developed in the concurrency chapters.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { QCAP = 4 };\ntypedef struct {\n  int data[QCAP];\n  size_t head, count;\n} Queue;\nbool push(Queue *q, int x) {\n  if (q->count == QCAP)\n    return false;\n  q->data[(q->head + q->count) % QCAP] = x;\n  ++q->count;\n  return true;\n}\nbool pop(Queue *q, int *out) {\n  if (!q->count)\n    return false;\n  *out = q->data[q->head];\n  q->head = (q->head + 1) % QCAP;\n  --q->count;\n  return true;\n}\n\nint main(void) {\n  Queue q = {0};\n  int x = 99;\n  bool empty = pop(&q, &x);\n  for (int i = 0; i < 4; ++i)\n    push(&q, i);\n  bool full = push(&q, 8);\n  printf(\"empty_ok=%d output=%d full_ok=%d count=%zu\\n\", empty, x, full,\n         q.count);\n  return 0;\n}\n",
        "expected": "empty_ok=0 output=99 full_ok=0 count=4",
        "walkthrough": "Both rejected operations preserve their documented state. A false result is not a stored Boolean queue element.",
        "pitfall": "Silently overwriting the oldest item changes a reliable work queue into a lossy buffer.",
        "question": "What should a rejected push do to count?",
        "choices": [
          "Leave it unchanged",
          "Increment it and fix it later"
        ],
        "answer": 0,
        "why": "The capacity invariant must remain true when the operation returns.",
        "tryit": "Implement resize with failure preservation and verify FIFO order across a wrapped resize.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "Bracket matching uses a stack because the most recent unmatched opening bracket must close first.",
        "explanation": "Push opening brackets and compare each closing bracket with the top. Reject an unmatched close, the wrong bracket type, or leftover opens at the end. The fixed 32-entry stack rejects excess nesting rather than overflowing. This recognizer handles only bracket characters, not a complete C lexer with comments and string literals.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nbool balanced(const char *s) {\n  char stack[32];\n  size_t n = 0;\n  for (; *s; ++s) {\n    if (*s == '(' || *s == '[') {\n      if (n == sizeof stack)\n        return false;\n      stack[n++] = *s;\n    } else if (*s == ')' || *s == ']') {\n      if (!n)\n        return false;\n      char open = stack[--n];\n      if ((*s == ')' && open != '(') || (*s == ']' && open != '['))\n        return false;\n    }\n  }\n  return n == 0;\n}\n\nint main(void) {\n  printf(\"balanced=%d crossed=%d\\n\", balanced(\"([])\"), balanced(\"([)]\"));\n  return 0;\n}\n",
        "expected": "balanced=1 crossed=0",
        "walkthrough": "The crossed example has matching counts but violates nesting order, which the top-of-stack comparison detects.",
        "pitfall": "Counting opens and closes without their order cannot validate nesting.",
        "question": "Why does ([)] fail?",
        "choices": [
          "It contains too many brackets",
          "The first close does not match the most recent open"
        ],
        "answer": 1,
        "why": "The top is [ when ) arrives.",
        "tryit": "Test empty input, a lone closing bracket, an unfinished open, and nesting beyond capacity.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "Postfix expression evaluation consumes operands before an operator. A stack preserves the required evaluation order.",
        "explanation": "For a binary operator, pop the right operand and then the left. The example intentionally recognizes only single decimal digits and + or −, ignoring spaces. It rejects unknown characters, insufficient operands, excess stack depth, and extra final operands. It also checks signed arithmetic before each addition or subtraction; a bounded stack alone would not bound a long expression’s accumulated value.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nbool evaluate(const char *s, int *out) {\n  int stack[32];\n  size_t n = 0;\n  for (; *s; ++s) {\n    if (*s == ' ')\n      continue;\n    if (*s >= '0' && *s <= '9') {\n      if (n == 32)\n        return false;\n      stack[n++] = *s - '0';\n    } else {\n      if (n < 2 || (*s != '+' && *s != '-'))\n        return false;\n      int right = stack[--n], left = stack[--n];\n      if (*s == '+') {\n        if ((right > 0 && left > INT_MAX - right) ||\n            (right < 0 && left < INT_MIN - right)) return false;\n        stack[n++] = left + right;\n      } else {\n        if ((right > 0 && left < INT_MIN + right) ||\n            (right < 0 && left > INT_MAX + right)) return false;\n        stack[n++] = left - right;\n      }\n    }\n  }\n  if (n != 1)\n    return false;\n  *out = stack[0];\n  return true;\n}\n\nint main(void) {\n  int value;\n  bool ok = evaluate(\"8 3 - 2 +\", &value);\n  printf(\"ok=%d result=%d\\n\", ok, value);\n  return 0;\n}\n",
        "expected": "ok=1 result=7",
        "walkthrough": "The subtraction computes 8−3, followed by adding two. Reversing the two popped operands would change the subtraction.",
        "pitfall": "A parser for one-digit postfix tokens is not an infix or full numeric-expression parser.",
        "question": "Which operand is popped first?",
        "choices": [
          "The right operand",
          "The left operand"
        ],
        "answer": 0,
        "why": "The left operand was pushed earlier and lies below the right.",
        "tryit": "Extend tokenization to multi-digit integers and add checked arithmetic and division-by-zero handling.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practicePlan": {
      "goal": "Build a circular queue and use a stack to evaluate expressions.",
      "tasks": [
        "Define bounded stack and queue operations before using them to parse or schedule work.",
        "Extend tokenization to multi-digit integers and add checked arithmetic and division-by-zero handling.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "queues-5"
    }
  },
  "hash-tables": {
    "intro": "Resolve collisions explicitly, preserve probe chains on deletion, and connect expected costs to load and hashing assumptions.",
    "outcomes": [
      "Implement lookup, insertion, and tombstone deletion.",
      "Rehash live entries when capacity changes.",
      "Build a bounded word-frequency index."
    ],
    "topics": {
      "1": {
        "intro": "A hash maps a key to a bucket; equality still decides whether two keys are the same. Collisions are normal.",
        "explanation": "The integer fixture uses remainder with a power-of-two-sized table to make collisions easy to see. It is deliberately not a robust adversarial integer hash. The string helper consumes unsigned bytes with a 32-bit FNV-style recurrence. Equal strings must hash equally, while different strings may share a hash or bucket. Keep hashing and key equality consistent.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { HCAP = 8, EMPTY = 0, LIVE = 1, DEAD = 2 };\ntypedef struct {\n  int key, value;\n  unsigned state;\n} Slot;\nsize_t bucket(int key) { return (unsigned)key % HCAP; }\nint lookup(const Slot *table, int key) {\n  for (size_t k = 0; k < HCAP; ++k) {\n    size_t i = (bucket(key) + k) % HCAP;\n    if (table[i].state == EMPTY)\n      return -1;\n    if (table[i].state == LIVE && table[i].key == key)\n      return (int)i;\n  }\n  return -1;\n}\nbool put(Slot *table, int key, int value) {\n  int existing = lookup(table, key);\n  if (existing >= 0) {\n    table[existing].value = value;\n    return true;\n  }\n  for (size_t k = 0; k < HCAP; ++k) {\n    size_t i = (bucket(key) + k) % HCAP;\n    if (table[i].state != LIVE) {\n      table[i] = (Slot){key, value, LIVE};\n      return true;\n    }\n  }\n  return false;\n}\nbool erase(Slot *table, int key) {\n  int i = lookup(table, key);\n  if (i < 0)\n    return false;\n  table[i].state = DEAD;\n  return true;\n}\nuint32_t hash_text(const char *s) {\n  uint32_t h = UINT32_C(2166136261);\n  for (; *s; ++s) {\n    h ^= (unsigned char)*s;\n    h *= UINT32_C(16777619);\n  }\n  return h;\n}\n\nint main(void) {\n  printf(\"bucket1=%zu bucket9=%zu same_text=%d\\n\", bucket(1), bucket(9),\n         hash_text(\"cat\") == hash_text(\"cat\"));\n  return 0;\n}\n",
        "expected": "bucket1=1 bucket9=1 same_text=1",
        "walkthrough": "Keys one and nine collide in bucket one but remain distinct keys. Lookup must examine candidates rather than treating the bucket number as identity.",
        "pitfall": "A noncryptographic hash is not a security boundary against deliberately chosen inputs.",
        "question": "Can different keys share a bucket?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 0,
        "why": "A finite bucket set generally has fewer positions than possible keys.",
        "tryit": "Find three integer keys that collide and test that all three remain independently retrievable.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "Separate chaining stores multiple entries in a bucket’s list; open addressing searches alternate slots within the table.",
        "explanation": "The fixture demonstrates linear probing: after a collision, try the next slot modulo capacity. Lookup follows the same sequence as insertion. Chaining instead follows links from a bucket head and can keep entries outside the bucket array. Both require a clear policy for duplicates, allocation failure, and key ownership.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { HCAP = 8, EMPTY = 0, LIVE = 1, DEAD = 2 };\ntypedef struct {\n  int key, value;\n  unsigned state;\n} Slot;\nsize_t bucket(int key) { return (unsigned)key % HCAP; }\nint lookup(const Slot *table, int key) {\n  for (size_t k = 0; k < HCAP; ++k) {\n    size_t i = (bucket(key) + k) % HCAP;\n    if (table[i].state == EMPTY)\n      return -1;\n    if (table[i].state == LIVE && table[i].key == key)\n      return (int)i;\n  }\n  return -1;\n}\nbool put(Slot *table, int key, int value) {\n  int existing = lookup(table, key);\n  if (existing >= 0) {\n    table[existing].value = value;\n    return true;\n  }\n  for (size_t k = 0; k < HCAP; ++k) {\n    size_t i = (bucket(key) + k) % HCAP;\n    if (table[i].state != LIVE) {\n      table[i] = (Slot){key, value, LIVE};\n      return true;\n    }\n  }\n  return false;\n}\nbool erase(Slot *table, int key) {\n  int i = lookup(table, key);\n  if (i < 0)\n    return false;\n  table[i].state = DEAD;\n  return true;\n}\nuint32_t hash_text(const char *s) {\n  uint32_t h = UINT32_C(2166136261);\n  for (; *s; ++s) {\n    h ^= (unsigned char)*s;\n    h *= UINT32_C(16777619);\n  }\n  return h;\n}\n\nint main(void) {\n  Slot table[HCAP] = {0};\n  put(table, 1, 10);\n  put(table, 9, 90);\n  printf(\"one=%d nine=%d missing=%d\\n\", lookup(table, 1), lookup(table, 9),\n         lookup(table, 17));\n  return 0;\n}\n",
        "expected": "one=1 nine=2 missing=-1",
        "walkthrough": "The second key lands in slot two. The empty slot after that terminates an unsuccessful probe for 17.",
        "pitfall": "Inserting with one probe sequence and searching with another makes stored entries unreachable.",
        "question": "Why must lookup continue past the first occupied nonmatching slot?",
        "choices": [
          "The first bucket cannot contain valid data",
          "A colliding key may be farther along the probe chain"
        ],
        "answer": 1,
        "why": "An occupied slot is evidence to continue, not evidence of absence.",
        "tryit": "Implement the same fixture with bucket-linked chains and compare ownership and memory layout.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "Load factor measures live entries divided by bucket capacity. Open-addressed tables need spare empty slots for short probes.",
        "explanation": "Resizing means allocating a new empty table and recomputing every live entry’s bucket under the new capacity. Copying slots at their old indices is not sufficient when the modulus changes. The small fixture shows how capacity changes a key’s home bucket; a complete rehash must preserve all key/value pairs and leave the old owner intact on allocation failure.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  unsigned keys[] = {1, 9, 17};\n  for (size_t i = 0; i < 3; ++i)\n    printf(\"key=%u old=%u new=%u\\n\", keys[i], keys[i] % 8, keys[i] % 16);\n  return 0;\n}\n",
        "expected": "key=1 old=1 new=1\nkey=9 old=1 new=9\nkey=17 old=1 new=1",
        "walkthrough": "Key nine changes its home bucket when capacity doubles. Collisions may remain after growth, so the new insertion routine must still resolve them.",
        "pitfall": "Load factor alone does not describe clustering; a poor hash can create long probes even at low load.",
        "question": "Should a resize copy slots to the same indices?",
        "choices": [
          "No, reinsert live entries under the new capacity",
          "Yes, capacity does not affect hash placement"
        ],
        "answer": 0,
        "why": "The bucket calculation depends on table capacity.",
        "tryit": "Implement rehash into a temporary allocation, then swap owners only after every live entry is inserted.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "Deletion must preserve the evidence that lookup should continue. A tombstone means formerly occupied, not never used.",
        "explanation": "An empty slot can end a probe because insertion would have stopped there. A deleted slot cannot: a later colliding key may depend on passing it. Mark deletion DEAD and allow insertion to reuse it after checking the entire existing-key lookup, preventing duplicate keys from being accidentally created.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { HCAP = 8, EMPTY = 0, LIVE = 1, DEAD = 2 };\ntypedef struct {\n  int key, value;\n  unsigned state;\n} Slot;\nsize_t bucket(int key) { return (unsigned)key % HCAP; }\nint lookup(const Slot *table, int key) {\n  for (size_t k = 0; k < HCAP; ++k) {\n    size_t i = (bucket(key) + k) % HCAP;\n    if (table[i].state == EMPTY)\n      return -1;\n    if (table[i].state == LIVE && table[i].key == key)\n      return (int)i;\n  }\n  return -1;\n}\nbool put(Slot *table, int key, int value) {\n  int existing = lookup(table, key);\n  if (existing >= 0) {\n    table[existing].value = value;\n    return true;\n  }\n  for (size_t k = 0; k < HCAP; ++k) {\n    size_t i = (bucket(key) + k) % HCAP;\n    if (table[i].state != LIVE) {\n      table[i] = (Slot){key, value, LIVE};\n      return true;\n    }\n  }\n  return false;\n}\nbool erase(Slot *table, int key) {\n  int i = lookup(table, key);\n  if (i < 0)\n    return false;\n  table[i].state = DEAD;\n  return true;\n}\nuint32_t hash_text(const char *s) {\n  uint32_t h = UINT32_C(2166136261);\n  for (; *s; ++s) {\n    h ^= (unsigned char)*s;\n    h *= UINT32_C(16777619);\n  }\n  return h;\n}\n\nint main(void) {\n  Slot table[HCAP] = {0};\n  put(table, 1, 10);\n  put(table, 9, 90);\n  erase(table, 1);\n  printf(\"removed=%d survivor=%d tombstone=%u\\n\", lookup(table, 1),\n         lookup(table, 9), table[1].state);\n  return 0;\n}\n",
        "expected": "removed=-1 survivor=2 tombstone=2",
        "walkthrough": "Key nine remains reachable through the deleted first slot. Replacing that state with EMPTY would break this lookup.",
        "pitfall": "Accumulated tombstones can make probes long even when few entries remain live; periodic rehashing removes them.",
        "question": "Can lookup stop at a tombstone?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "A collision chain may continue beyond a deleted entry.",
        "tryit": "Insert key 17 after the deletion and verify both slot reuse and key nine’s survival.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "Hash-table complexity depends on hashing assumptions, load, and collision policy. Expected constant time is not an unconditional worst-case guarantee.",
        "explanation": "With a suitable distribution and bounded load, expected lookup and insertion can be O(1). A set of colliding keys can require Θ(n) probes for one operation; resizing also costs Θ(n) occasionally. The fixture constructs a collision cluster and counts occupied positions before the first empty slot to expose the mechanism.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { HCAP = 8, EMPTY = 0, LIVE = 1, DEAD = 2 };\ntypedef struct {\n  int key, value;\n  unsigned state;\n} Slot;\nsize_t bucket(int key) { return (unsigned)key % HCAP; }\nint lookup(const Slot *table, int key) {\n  for (size_t k = 0; k < HCAP; ++k) {\n    size_t i = (bucket(key) + k) % HCAP;\n    if (table[i].state == EMPTY)\n      return -1;\n    if (table[i].state == LIVE && table[i].key == key)\n      return (int)i;\n  }\n  return -1;\n}\nbool put(Slot *table, int key, int value) {\n  int existing = lookup(table, key);\n  if (existing >= 0) {\n    table[existing].value = value;\n    return true;\n  }\n  for (size_t k = 0; k < HCAP; ++k) {\n    size_t i = (bucket(key) + k) % HCAP;\n    if (table[i].state != LIVE) {\n      table[i] = (Slot){key, value, LIVE};\n      return true;\n    }\n  }\n  return false;\n}\nbool erase(Slot *table, int key) {\n  int i = lookup(table, key);\n  if (i < 0)\n    return false;\n  table[i].state = DEAD;\n  return true;\n}\nuint32_t hash_text(const char *s) {\n  uint32_t h = UINT32_C(2166136261);\n  for (; *s; ++s) {\n    h ^= (unsigned char)*s;\n    h *= UINT32_C(16777619);\n  }\n  return h;\n}\n\nint main(void) {\n  Slot table[HCAP] = {0};\n  put(table, 1, 1);\n  put(table, 9, 2);\n  put(table, 17, 3);\n  size_t probes = 0;\n  for (size_t k = 0; k < HCAP; ++k) {\n    ++probes;\n    if (table[(1 + k) % HCAP].state == EMPTY)\n      break;\n  }\n  printf(\"absent_probes=%zu\\n\", probes);\n  return 0;\n}\n",
        "expected": "absent_probes=4",
        "walkthrough": "An absent colliding key examines three live entries and then an empty slot. The probe count grows with cluster length.",
        "pitfall": "A benchmark using uniformly distributed keys does not test chosen-collision behavior.",
        "question": "What can one worst-case lookup cost?",
        "choices": [
          "Θ(n)",
          "Always exactly one probe"
        ],
        "answer": 0,
        "why": "Collision resolution may examine a linear number of entries.",
        "tryit": "Compare probe counts for clustered keys and distinct home buckets at the same load.",
        "input": "",
        "runtime": "browser"
      },
      "6": {
        "intro": "A frequency index combines token identity, collision resolution, and a count update. Borrowed keys need a lifetime contract.",
        "explanation": "The example receives already tokenized immutable string literals and borrows them for the table’s lifetime. increment either establishes a new entry or updates an equal key. It rejects a full table; a production counter also checks count overflow and owns copies of tokens whose source buffers may change. Tokenization and case normalization are deliberately separate policies.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { HCAP = 8, EMPTY = 0, LIVE = 1, DEAD = 2 };\ntypedef struct {\n  int key, value;\n  unsigned state;\n} Slot;\nsize_t bucket(int key) { return (unsigned)key % HCAP; }\nint lookup(const Slot *table, int key) {\n  for (size_t k = 0; k < HCAP; ++k) {\n    size_t i = (bucket(key) + k) % HCAP;\n    if (table[i].state == EMPTY)\n      return -1;\n    if (table[i].state == LIVE && table[i].key == key)\n      return (int)i;\n  }\n  return -1;\n}\nbool put(Slot *table, int key, int value) {\n  int existing = lookup(table, key);\n  if (existing >= 0) {\n    table[existing].value = value;\n    return true;\n  }\n  for (size_t k = 0; k < HCAP; ++k) {\n    size_t i = (bucket(key) + k) % HCAP;\n    if (table[i].state != LIVE) {\n      table[i] = (Slot){key, value, LIVE};\n      return true;\n    }\n  }\n  return false;\n}\nbool erase(Slot *table, int key) {\n  int i = lookup(table, key);\n  if (i < 0)\n    return false;\n  table[i].state = DEAD;\n  return true;\n}\nuint32_t hash_text(const char *s) {\n  uint32_t h = UINT32_C(2166136261);\n  for (; *s; ++s) {\n    h ^= (unsigned char)*s;\n    h *= UINT32_C(16777619);\n  }\n  return h;\n}\ntypedef struct {\n  const char *word;\n  unsigned count;\n} Word;\nbool increment(Word *table, const char *word) {\n  size_t first = hash_text(word) % HCAP;\n  for (size_t k = 0; k < HCAP; ++k) {\n    Word *slot = &table[(first + k) % HCAP];\n    if (!slot->word) {\n      *slot = (Word){word, 1};\n      return true;\n    }\n    if (strcmp(slot->word, word) == 0) {\n      ++slot->count;\n      return true;\n    }\n  }\n  return false;\n}\nunsigned frequency(const Word *table, const char *word) {\n  size_t first = hash_text(word) % HCAP;\n  for (size_t k = 0; k < HCAP; ++k) {\n    const Word *slot = &table[(first + k) % HCAP];\n    if (!slot->word)\n      return 0;\n    if (strcmp(slot->word, word) == 0)\n      return slot->count;\n  }\n  return 0;\n}\n\nint main(void) {\n  Word table[HCAP] = {0};\n  const char *tokens[] = {\"red\", \"blue\", \"red\", \"green\", \"red\"};\n  for (size_t i = 0; i < 5; ++i)\n    if (!increment(table, tokens[i]))\n      return 1;\n  printf(\"red=%u blue=%u absent=%u\\n\", frequency(table, \"red\"),\n         frequency(table, \"blue\"), frequency(table, \"black\"));\n  return 0;\n}\n",
        "expected": "red=3 blue=1 absent=0",
        "walkthrough": "Three red tokens update one entry rather than creating duplicate key slots. The absent key returns zero frequency.",
        "pitfall": "Storing pointers into a reused input line makes previously inserted words change underneath the table.",
        "question": "When is borrowing these keys valid?",
        "choices": [
          "Whenever the pointer is non-null",
          "While their immutable storage outlives the table"
        ],
        "answer": 1,
        "why": "A valid address today does not establish its future lifetime.",
        "tryit": "Read bounded tokens, allocate owned copies for new words, and free all owners when the index is destroyed.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practicePlan": {
      "goal": "Build a hash table that remains correct through collisions and resizing.",
      "tasks": [
        "Resolve collisions explicitly, preserve probe chains on deletion, and connect expected costs to load and hashing assumptions.",
        "Read bounded tokens, allocate owned copies for new words, and free all owners when the index is destroyed.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "hash-tables-6"
    }
  },
  "trees-heaps": {
    "intro": "Separate search-order invariants from shape and priority invariants. Keep both data and height metadata consistent.",
    "outcomes": [
      "Traverse a tree and preserve BST ordering.",
      "Restore balance with rotations.",
      "Use a heap to select the next priority."
    ],
    "topics": {
      "1": {
        "intro": "Traversal order describes when a parent is visited relative to its children. It does not require a particular memory layout.",
        "explanation": "Inorder visits left subtree, node, and right subtree. For a binary search tree with distinct keys, this produces ascending order. A plain binary tree without the ordering invariant does not promise sorted output. Traversal visits each node once and uses stack depth proportional to tree height.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct Node {\n  int key;\n  struct Node *left, *right;\n  int height;\n} Node;\nvoid inorder(const Node *n) {\n  if (!n)\n    return;\n  inorder(n->left);\n  printf(\"%d \", n->key);\n  inorder(n->right);\n}\nconst Node *find(const Node *n, int key) {\n  while (n && n->key != key)\n    n = key < n->key ? n->left : n->right;\n  return n;\n}\nint height(const Node *n) { return n ? n->height : 0; }\nint maximum(int a, int b) { return a > b ? a : b; }\nvoid refresh(Node *n) {\n  n->height = 1 + maximum(height(n->left), height(n->right));\n}\nNode *rotate_right(Node *root) {\n  Node *next = root->left;\n  root->left = next->right;\n  next->right = root;\n  refresh(root);\n  refresh(next);\n  return next;\n}\nNode *rotate_left(Node *root) {\n  Node *next = root->right;\n  root->right = next->left;\n  next->left = root;\n  refresh(root);\n  refresh(next);\n  return next;\n}\nNode *avl_insert(Node *root, Node *item) {\n  if (!root)\n    return item;\n  if (item->key < root->key)\n    root->left = avl_insert(root->left, item);\n  else if (item->key > root->key)\n    root->right = avl_insert(root->right, item);\n  else\n    return root;\n  refresh(root);\n  int balance = height(root->left) - height(root->right);\n  if (balance > 1) {\n    if (item->key > root->left->key)\n      root->left = rotate_left(root->left);\n    return rotate_right(root);\n  }\n  if (balance < -1) {\n    if (item->key < root->right->key)\n      root->right = rotate_right(root->right);\n    return rotate_left(root);\n  }\n  return root;\n}\n\nint main(void) {\n  Node a = {1, NULL, NULL, 1}, b = {3, NULL, NULL, 1}, root = {2, &a, &b, 2};\n  inorder(&root);\n  puts(\"\");\n  return 0;\n}\n",
        "expected": "1 2 3",
        "walkthrough": "The recursive calls print the left leaf, root, and right leaf. Child pointers borrow stack nodes that remain alive until traversal ends.",
        "pitfall": "Tree traversal must not assume that every non-null pointer belongs to a validated acyclic tree.",
        "question": "When is inorder output sorted?",
        "choices": [
          "When the BST ordering invariant holds",
          "For every binary tree"
        ],
        "answer": 0,
        "why": "The left and right subtree key constraints establish the sorted concatenation.",
        "tryit": "Print preorder and postorder for the same tree, then explain a use for each order.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "A binary search tree routes comparisons through its shape. Every left-subtree key is smaller and every right-subtree key is larger under this unique-key policy.",
        "explanation": "Search moves to one child after each comparison, using O(h) time for height h. The missing result is NULL and must be checked before dereferencing. Deleting a two-child node typically replaces its key with a successor or predecessor and then removes that replacement node while preserving ordering and ownership.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct Node {\n  int key;\n  struct Node *left, *right;\n  int height;\n} Node;\nvoid inorder(const Node *n) {\n  if (!n)\n    return;\n  inorder(n->left);\n  printf(\"%d \", n->key);\n  inorder(n->right);\n}\nconst Node *find(const Node *n, int key) {\n  while (n && n->key != key)\n    n = key < n->key ? n->left : n->right;\n  return n;\n}\nint height(const Node *n) { return n ? n->height : 0; }\nint maximum(int a, int b) { return a > b ? a : b; }\nvoid refresh(Node *n) {\n  n->height = 1 + maximum(height(n->left), height(n->right));\n}\nNode *rotate_right(Node *root) {\n  Node *next = root->left;\n  root->left = next->right;\n  next->right = root;\n  refresh(root);\n  refresh(next);\n  return next;\n}\nNode *rotate_left(Node *root) {\n  Node *next = root->right;\n  root->right = next->left;\n  next->left = root;\n  refresh(root);\n  refresh(next);\n  return next;\n}\nNode *avl_insert(Node *root, Node *item) {\n  if (!root)\n    return item;\n  if (item->key < root->key)\n    root->left = avl_insert(root->left, item);\n  else if (item->key > root->key)\n    root->right = avl_insert(root->right, item);\n  else\n    return root;\n  refresh(root);\n  int balance = height(root->left) - height(root->right);\n  if (balance > 1) {\n    if (item->key > root->left->key)\n      root->left = rotate_left(root->left);\n    return rotate_right(root);\n  }\n  if (balance < -1) {\n    if (item->key < root->right->key)\n      root->right = rotate_right(root->right);\n    return rotate_left(root);\n  }\n  return root;\n}\n\nint main(void) {\n  Node a = {1, NULL, NULL, 1}, b = {3, NULL, NULL, 1}, root = {2, &a, &b, 2};\n  printf(\"three=%d missing=%d\\n\", find(&root, 3) != NULL,\n         find(&root, 7) == NULL);\n  return 0;\n}\n",
        "expected": "three=1 missing=1",
        "walkthrough": "The lookup follows one right edge for three. Seven follows the right child and then reaches NULL.",
        "pitfall": "A BST is not automatically balanced, so its height need not be logarithmic.",
        "question": "What determines this lookup’s path length?",
        "choices": [
          "Only the key’s numeric magnitude",
          "Tree height"
        ],
        "answer": 1,
        "why": "Each step follows one level of the tree.",
        "tryit": "Implement deletion for a leaf and a one-child node before handling the two-child case.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "Insertion order can turn an ordinary BST into a chain. Balancing prevents the search path from growing linearly with the number of keys.",
        "explanation": "The fixture compares a three-node right chain with a balanced three-node tree. Both satisfy BST ordering and have the same inorder sequence, but maximum path lengths differ. For n sorted insertions into a naive BST, the final height is n; an AVL invariant keeps height O(log n).",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct Node {\n  int key;\n  struct Node *left, *right;\n  int height;\n} Node;\nvoid inorder(const Node *n) {\n  if (!n)\n    return;\n  inorder(n->left);\n  printf(\"%d \", n->key);\n  inorder(n->right);\n}\nconst Node *find(const Node *n, int key) {\n  while (n && n->key != key)\n    n = key < n->key ? n->left : n->right;\n  return n;\n}\nint height(const Node *n) { return n ? n->height : 0; }\nint maximum(int a, int b) { return a > b ? a : b; }\nvoid refresh(Node *n) {\n  n->height = 1 + maximum(height(n->left), height(n->right));\n}\nNode *rotate_right(Node *root) {\n  Node *next = root->left;\n  root->left = next->right;\n  next->right = root;\n  refresh(root);\n  refresh(next);\n  return next;\n}\nNode *rotate_left(Node *root) {\n  Node *next = root->right;\n  root->right = next->left;\n  next->left = root;\n  refresh(root);\n  refresh(next);\n  return next;\n}\nNode *avl_insert(Node *root, Node *item) {\n  if (!root)\n    return item;\n  if (item->key < root->key)\n    root->left = avl_insert(root->left, item);\n  else if (item->key > root->key)\n    root->right = avl_insert(root->right, item);\n  else\n    return root;\n  refresh(root);\n  int balance = height(root->left) - height(root->right);\n  if (balance > 1) {\n    if (item->key > root->left->key)\n      root->left = rotate_left(root->left);\n    return rotate_right(root);\n  }\n  if (balance < -1) {\n    if (item->key < root->right->key)\n      root->right = rotate_right(root->right);\n    return rotate_left(root);\n  }\n  return root;\n}\n\nint main(void) {\n  Node last = {3, NULL, NULL, 1}, middle = {2, NULL, &last, 2},\n       chain = {1, NULL, &middle, 3};\n  Node left = {1, NULL, NULL, 1}, right = {3, NULL, NULL, 1},\n       balanced = {2, &left, &right, 2};\n  printf(\"chain_height=%d balanced_height=%d\\n\", height(&chain),\n         height(&balanced));\n  return 0;\n}\n",
        "expected": "chain_height=3 balanced_height=2",
        "walkthrough": "The stored heights include the root level. Balanced shape reduces the longest route without changing key order.",
        "pitfall": "Testing only inorder output verifies order but does not verify balance or correct height metadata.",
        "question": "Can two correct BSTs have different lookup costs?",
        "choices": [
          "Yes, their shapes may differ",
          "No, ordering fixes the shape"
        ],
        "answer": 0,
        "why": "Ordering constrains key placement relative to ancestors, not one unique structure.",
        "tryit": "Build a naive BST from ascending keys and count comparisons for the final key.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "A rotation changes local shape while preserving the inorder sequence. An AVL insertion chooses rotations from height differences.",
        "explanation": "The implementation recursively inserts a borrowed fresh node, refreshes heights on the return path, and handles single or double rotations when the child-height difference exceeds one. Duplicate keys retain the existing node; ownership of a rejected node remains with the caller. This fixture uses an array of nodes rather than allocating them.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct Node {\n  int key;\n  struct Node *left, *right;\n  int height;\n} Node;\nvoid inorder(const Node *n) {\n  if (!n)\n    return;\n  inorder(n->left);\n  printf(\"%d \", n->key);\n  inorder(n->right);\n}\nconst Node *find(const Node *n, int key) {\n  while (n && n->key != key)\n    n = key < n->key ? n->left : n->right;\n  return n;\n}\nint height(const Node *n) { return n ? n->height : 0; }\nint maximum(int a, int b) { return a > b ? a : b; }\nvoid refresh(Node *n) {\n  n->height = 1 + maximum(height(n->left), height(n->right));\n}\nNode *rotate_right(Node *root) {\n  Node *next = root->left;\n  root->left = next->right;\n  next->right = root;\n  refresh(root);\n  refresh(next);\n  return next;\n}\nNode *rotate_left(Node *root) {\n  Node *next = root->right;\n  root->right = next->left;\n  next->left = root;\n  refresh(root);\n  refresh(next);\n  return next;\n}\nNode *avl_insert(Node *root, Node *item) {\n  if (!root)\n    return item;\n  if (item->key < root->key)\n    root->left = avl_insert(root->left, item);\n  else if (item->key > root->key)\n    root->right = avl_insert(root->right, item);\n  else\n    return root;\n  refresh(root);\n  int balance = height(root->left) - height(root->right);\n  if (balance > 1) {\n    if (item->key > root->left->key)\n      root->left = rotate_left(root->left);\n    return rotate_right(root);\n  }\n  if (balance < -1) {\n    if (item->key < root->right->key)\n      root->right = rotate_right(root->right);\n    return rotate_left(root);\n  }\n  return root;\n}\n\nint main(void) {\n  Node nodes[] = {{3, NULL, NULL, 1}, {1, NULL, NULL, 1}, {2, NULL, NULL, 1}};\n  Node *root = NULL;\n  for (size_t i = 0; i < 3; ++i)\n    root = avl_insert(root, &nodes[i]);\n  printf(\"root=%d height=%d order=\", root->key, root->height);\n  inorder(root);\n  puts(\"\");\n  return 0;\n}\n",
        "expected": "root=2 height=2 order=1 2 3",
        "walkthrough": "Inserting two creates a left-right imbalance at three. The two rotations promote two while preserving the inorder sequence.",
        "pitfall": "Fixing pointers but leaving stale heights can cause later insertions to choose incorrect rotations.",
        "question": "What must a rotation preserve?",
        "choices": [
          "Every node’s original parent",
          "The inorder key sequence"
        ],
        "answer": 1,
        "why": "Reparenting is the mechanism; ordering is the preserved invariant.",
        "tryit": "Exercise all four AVL imbalance cases and check both inorder output and every stored height.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "A min-heap promises that each parent is no greater than its children. It does not keep the entire array sorted.",
        "explanation": "Store a complete binary tree in an array. Parent and child indices follow from the shape, while push sifts upward and pop repairs downward after replacing the root. Both cost O(log n); reading the minimum is O(1). The bounded implementation rejects overflow and underflow, and callers check those results.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  int data[16];\n  size_t n;\n} Heap;\nbool heap_push(Heap *h, int x) {\n  if (h->n == 16)\n    return false;\n  size_t i = h->n++;\n  while (i && h->data[(i - 1) / 2] > x) {\n    h->data[i] = h->data[(i - 1) / 2];\n    i = (i - 1) / 2;\n  }\n  h->data[i] = x;\n  return true;\n}\nbool heap_pop(Heap *h, int *out) {\n  if (!h->n)\n    return false;\n  *out = h->data[0];\n  int x = h->data[--h->n];\n  if (!h->n)\n    return true;\n  size_t i = 0;\n  while (i * 2 + 1 < h->n) {\n    size_t child = i * 2 + 1;\n    if (child + 1 < h->n && h->data[child + 1] < h->data[child])\n      ++child;\n    if (h->data[child] >= x)\n      break;\n    h->data[i] = h->data[child];\n    i = child;\n  }\n  h->data[i] = x;\n  return true;\n}\n\nint main(void) {\n  Heap h = {0};\n  if (!heap_push(&h, 7) || !heap_push(&h, 2) || !heap_push(&h, 5))\n    return 1;\n  int x;\n  while (heap_pop(&h, &x))\n    printf(\"%d \", x);\n  puts(\"\");\n  return 0;\n}\n",
        "expected": "2 5 7",
        "walkthrough": "Repeated removal yields sorted priorities even though an arbitrary heap array position need not be globally ordered.",
        "pitfall": "Binary-searching a heap array assumes an ordering it does not provide.",
        "question": "Which element is guaranteed minimal?",
        "choices": [
          "The root",
          "Every leftmost array prefix"
        ],
        "answer": 0,
        "why": "Only the ancestor-to-descendant ordering invariant is required.",
        "tryit": "Test duplicates, an empty heap, full capacity, and alternating insertions and removals.",
        "input": "",
        "runtime": "browser"
      },
      "6": {
        "intro": "A priority scheduler orders pending work by a documented priority key. Equal-priority behavior needs an explicit tie-break if it matters.",
        "explanation": "This small scheduler encodes priority and insertion sequence into one bounded integer key, allowing the existing min-heap to break ties FIFO. The encoding is valid only for the stated fixture’s small values; a general scheduler should compare a struct with checked sequence handling. Scheduling priority does not imply that a task is safe to interrupt or run concurrently.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  int data[16];\n  size_t n;\n} Heap;\nbool heap_push(Heap *h, int x) {\n  if (h->n == 16)\n    return false;\n  size_t i = h->n++;\n  while (i && h->data[(i - 1) / 2] > x) {\n    h->data[i] = h->data[(i - 1) / 2];\n    i = (i - 1) / 2;\n  }\n  h->data[i] = x;\n  return true;\n}\nbool heap_pop(Heap *h, int *out) {\n  if (!h->n)\n    return false;\n  *out = h->data[0];\n  int x = h->data[--h->n];\n  if (!h->n)\n    return true;\n  size_t i = 0;\n  while (i * 2 + 1 < h->n) {\n    size_t child = i * 2 + 1;\n    if (child + 1 < h->n && h->data[child + 1] < h->data[child])\n      ++child;\n    if (h->data[child] >= x)\n      break;\n    h->data[i] = h->data[child];\n    i = child;\n  }\n  h->data[i] = x;\n  return true;\n}\n\nint main(void) {\n  Heap h = {0};\n  heap_push(&h, 20);\n  heap_push(&h, 11);\n  heap_push(&h, 12);\n  int x;\n  while (heap_pop(&h, &x))\n    printf(\"priority=%d sequence=%d\\n\", x / 10, x % 10);\n  return 0;\n}\n",
        "expected": "priority=1 sequence=1\npriority=1 sequence=2\npriority=2 sequence=0",
        "walkthrough": "The two priority-one tasks leave in sequence order, then priority two. The numeric encoding is a teaching shortcut, not an unbounded identifier format.",
        "pitfall": "Without aging or another fairness policy, continually arriving high-priority tasks can starve low-priority work.",
        "question": "Does a heap alone guarantee scheduler fairness?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "It implements the ordering rule, which may permit starvation.",
        "tryit": "Replace encoded integers with a Task struct and comparator, then add an explicit fairness policy.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practicePlan": {
      "goal": "Schedule tasks with a priority queue and investigate tree balance.",
      "tasks": [
        "Separate search-order invariants from shape and priority invariants. Keep both data and height metadata consistent.",
        "Replace encoded integers with a Task struct and comparator, then add an explicit fairness policy.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "trees-heaps-6"
    }
  },
  "graphs": {
    "intro": "Choose a graph representation, track discovery state, and match the route algorithm to the edge-weight contract.",
    "outcomes": [
      "Traverse without enqueuing the same vertex repeatedly.",
      "Detect components, cycles, and ordering constraints.",
      "Apply Dijkstra only to nonnegative weights."
    ],
    "topics": {
      "1": {
        "intro": "A graph representation determines which operations are cheap and how much memory is reserved.",
        "explanation": "A V×V adjacency matrix reserves Θ(V²) entries and tests one edge in O(1). An adjacency list uses Θ(V+E) storage and scans actual neighbors. This matrix fixture uses zero for absent edges, so it cannot represent a zero-weight edge; a more general format needs a separate presence flag or sentinel.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { V = 4, INF = 10000 };\nvoid bfs(const int edges[V][V], int start) {\n  bool seen[V] = {0};\n  int queue[V];\n  size_t head = 0, count = 0;\n  seen[start] = true;\n  queue[count++] = start;\n  while (head < count) {\n    int u = queue[head++];\n    printf(\"%d \", u);\n    for (int v = 0; v < V; ++v)\n      if (edges[u][v] && !seen[v]) {\n        seen[v] = true;\n        queue[count++] = v;\n      }\n  }\n  puts(\"\");\n}\nvoid dfs(const int edges[V][V], int u, bool *seen) {\n  seen[u] = true;\n  for (int v = 0; v < V; ++v)\n    if (edges[u][v] && !seen[v])\n      dfs(edges, v, seen);\n}\nvoid distances(const int edges[V][V], int start, int *dist) {\n  bool done[V] = {0};\n  for (int i = 0; i < V; ++i)\n    dist[i] = INF;\n  dist[start] = 0;\n  for (int step = 0; step < V; ++step) {\n    int u = -1;\n    for (int i = 0; i < V; ++i)\n      if (!done[i] && (u < 0 || dist[i] < dist[u]))\n        u = i;\n    if (u < 0 || dist[u] == INF)\n      break;\n    done[u] = true;\n    for (int v = 0; v < V; ++v)\n      if (edges[u][v] > 0 && dist[u] + edges[u][v] < dist[v])\n        dist[v] = dist[u] + edges[u][v];\n  }\n}\n\nint main(void) {\n  const int edges[V][V] = {\n      {0, 1, 1, 0}, {1, 0, 0, 0}, {1, 0, 0, 1}, {0, 0, 1, 0}};\n  size_t directed_entries = 0;\n  for (int u = 0; u < V; ++u)\n    for (int v = 0; v < V; ++v)\n      if (edges[u][v])\n        ++directed_entries;\n  printf(\"vertices=%d undirected_edges=%zu matrix_cells=%d\\n\", V,\n         directed_entries / 2, V * V);\n  return 0;\n}\n",
        "expected": "vertices=4 undirected_edges=3 matrix_cells=16",
        "walkthrough": "Each undirected edge appears twice in the symmetric matrix. Six stored adjacency entries describe three undirected edges.",
        "pitfall": "Dividing by two assumes symmetry and no special self-loop counting; it is not a generic directed-edge count.",
        "question": "Which representation is usually smaller for a sparse graph?",
        "choices": [
          "An adjacency list",
          "A full adjacency matrix"
        ],
        "answer": 0,
        "why": "It stores actual edges rather than every possible pair.",
        "tryit": "Represent the same graph as neighbor lists and compare neighbor-iteration work.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "BFS explores by edge distance using a queue; DFS follows one path at a time using recursion or a stack.",
        "explanation": "Mark a vertex discovered when adding it to the queue, not when removing it, so multiple incoming edges cannot enqueue it repeatedly. The queue then needs at most V entries. With adjacency lists, traversal is O(V+E); this matrix implementation scans V possible neighbors per visited vertex and is O(V²).",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { V = 4, INF = 10000 };\nvoid bfs(const int edges[V][V], int start) {\n  bool seen[V] = {0};\n  int queue[V];\n  size_t head = 0, count = 0;\n  seen[start] = true;\n  queue[count++] = start;\n  while (head < count) {\n    int u = queue[head++];\n    printf(\"%d \", u);\n    for (int v = 0; v < V; ++v)\n      if (edges[u][v] && !seen[v]) {\n        seen[v] = true;\n        queue[count++] = v;\n      }\n  }\n  puts(\"\");\n}\nvoid dfs(const int edges[V][V], int u, bool *seen) {\n  seen[u] = true;\n  for (int v = 0; v < V; ++v)\n    if (edges[u][v] && !seen[v])\n      dfs(edges, v, seen);\n}\nvoid distances(const int edges[V][V], int start, int *dist) {\n  bool done[V] = {0};\n  for (int i = 0; i < V; ++i)\n    dist[i] = INF;\n  dist[start] = 0;\n  for (int step = 0; step < V; ++step) {\n    int u = -1;\n    for (int i = 0; i < V; ++i)\n      if (!done[i] && (u < 0 || dist[i] < dist[u]))\n        u = i;\n    if (u < 0 || dist[u] == INF)\n      break;\n    done[u] = true;\n    for (int v = 0; v < V; ++v)\n      if (edges[u][v] > 0 && dist[u] + edges[u][v] < dist[v])\n        dist[v] = dist[u] + edges[u][v];\n  }\n}\n\nint main(void) {\n  const int edges[V][V] = {\n      {0, 1, 1, 0}, {1, 0, 0, 0}, {1, 0, 0, 1}, {0, 0, 1, 0}};\n  bfs(edges, 0);\n  return 0;\n}\n",
        "expected": "0 1 2 3",
        "walkthrough": "Vertices one and two are discovered from zero before three is discovered from two. Neighbor index order fixes the deterministic tie order.",
        "pitfall": "BFS minimizes edge count on unweighted graphs, not total cost on arbitrary weighted graphs.",
        "question": "When should this BFS mark a vertex seen?",
        "choices": [
          "Only after all its neighbors are processed",
          "When it is enqueued"
        ],
        "answer": 1,
        "why": "Early marking prevents duplicate pending copies.",
        "tryit": "Record parent and distance arrays, then reconstruct a minimum-edge path from zero to three.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "A disconnected graph needs a traversal from every still-unseen vertex. A cycle detector also needs to distinguish a parent edge from a new back edge.",
        "explanation": "The fixture counts undirected connected components with repeated DFS. An undirected cycle detector can track the traversal parent and report an edge to another already discovered vertex. Directed cycle detection needs a different rule, such as gray active-stack vertices; simply seeing any previously visited vertex is insufficient.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { V = 4, INF = 10000 };\nvoid bfs(const int edges[V][V], int start) {\n  bool seen[V] = {0};\n  int queue[V];\n  size_t head = 0, count = 0;\n  seen[start] = true;\n  queue[count++] = start;\n  while (head < count) {\n    int u = queue[head++];\n    printf(\"%d \", u);\n    for (int v = 0; v < V; ++v)\n      if (edges[u][v] && !seen[v]) {\n        seen[v] = true;\n        queue[count++] = v;\n      }\n  }\n  puts(\"\");\n}\nvoid dfs(const int edges[V][V], int u, bool *seen) {\n  seen[u] = true;\n  for (int v = 0; v < V; ++v)\n    if (edges[u][v] && !seen[v])\n      dfs(edges, v, seen);\n}\nvoid distances(const int edges[V][V], int start, int *dist) {\n  bool done[V] = {0};\n  for (int i = 0; i < V; ++i)\n    dist[i] = INF;\n  dist[start] = 0;\n  for (int step = 0; step < V; ++step) {\n    int u = -1;\n    for (int i = 0; i < V; ++i)\n      if (!done[i] && (u < 0 || dist[i] < dist[u]))\n        u = i;\n    if (u < 0 || dist[u] == INF)\n      break;\n    done[u] = true;\n    for (int v = 0; v < V; ++v)\n      if (edges[u][v] > 0 && dist[u] + edges[u][v] < dist[v])\n        dist[v] = dist[u] + edges[u][v];\n  }\n}\n\nint main(void) {\n  const int edges[V][V] = {\n      {0, 1, 0, 0}, {1, 0, 0, 0}, {0, 0, 0, 1}, {0, 0, 1, 0}};\n  bool seen[V] = {0};\n  unsigned components = 0;\n  for (int u = 0; u < V; ++u)\n    if (!seen[u]) {\n      ++components;\n      dfs(edges, u, seen);\n    }\n  printf(\"components=%u\\n\", components);\n  return 0;\n}\n",
        "expected": "components=2",
        "walkthrough": "A traversal from zero reaches one, and a separate traversal from two reaches three. An isolated vertex would form a component of size one.",
        "pitfall": "The edge back to a DFS node’s parent is expected in an undirected graph and is not by itself a cycle.",
        "question": "What starts a new component?",
        "choices": [
          "An unseen vertex after earlier traversals finish",
          "Every edge between two seen vertices"
        ],
        "answer": 0,
        "why": "A completed traversal already reached every vertex in its component.",
        "tryit": "Add an isolated vertex in a larger fixed graph and implement parent-aware cycle detection.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "A topological order places every prerequisite before its dependents. It exists only for a directed acyclic graph.",
        "explanation": "Kahn’s algorithm repeatedly removes a zero-indegree vertex and decrements its outgoing neighbors. If fewer than V vertices are emitted, a cycle prevents completion. The fixed array queue is safe because each vertex enters only when its indegree becomes zero, once. Different available zero-indegree choices can produce different valid orders.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  enum { V = 4 };\n  int edges[V][V] = {{0, 1, 1, 0}, {0, 0, 0, 1}, {0, 0, 0, 1}, {0, 0, 0, 0}},\n      degree[V] = {0}, queue[V];\n  size_t head = 0, n = 0;\n  for (int u = 0; u < V; ++u)\n    for (int v = 0; v < V; ++v)\n      degree[v] += edges[u][v];\n  for (int u = 0; u < V; ++u)\n    if (degree[u] == 0)\n      queue[n++] = u;\n  while (head < n) {\n    int u = queue[head++];\n    printf(\"%s%d\", head == 1 ? \"\" : \" \", u);\n    for (int v = 0; v < V; ++v)\n      if (edges[u][v] && --degree[v] == 0)\n        queue[n++] = v;\n  }\n  printf(\"\\nacyclic=%d\\n\", n == V);\n  return 0;\n}\n",
        "expected": "0 1 2 3\nacyclic=1",
        "walkthrough": "Zero enables one and two, which together enable three. All four vertices are emitted.",
        "pitfall": "Returning a partial ordering as a full solution hides cycles.",
        "question": "What indicates a cycle in this algorithm?",
        "choices": [
          "Two vertices are initially available",
          "Fewer than V emitted vertices"
        ],
        "answer": 1,
        "why": "A cycle retains positive indegrees after removable vertices are exhausted.",
        "tryit": "Add an edge from three to zero and check that the algorithm rejects the graph.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "Dijkstra finalizes the nearest unsettled vertex under a nonnegative-weight assumption. Negative edges invalidate that argument.",
        "explanation": "The matrix implementation scans for the next minimum, giving O(V²) time. Distances start at a sentinel larger than every possible path in this bounded fixture. Relaxation replaces a distance only when a shorter path is found. A general implementation must represent unreachable separately or check addition before combining path cost and weight.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { V = 4, INF = 10000 };\nvoid bfs(const int edges[V][V], int start) {\n  bool seen[V] = {0};\n  int queue[V];\n  size_t head = 0, count = 0;\n  seen[start] = true;\n  queue[count++] = start;\n  while (head < count) {\n    int u = queue[head++];\n    printf(\"%d \", u);\n    for (int v = 0; v < V; ++v)\n      if (edges[u][v] && !seen[v]) {\n        seen[v] = true;\n        queue[count++] = v;\n      }\n  }\n  puts(\"\");\n}\nvoid dfs(const int edges[V][V], int u, bool *seen) {\n  seen[u] = true;\n  for (int v = 0; v < V; ++v)\n    if (edges[u][v] && !seen[v])\n      dfs(edges, v, seen);\n}\nvoid distances(const int edges[V][V], int start, int *dist) {\n  bool done[V] = {0};\n  for (int i = 0; i < V; ++i)\n    dist[i] = INF;\n  dist[start] = 0;\n  for (int step = 0; step < V; ++step) {\n    int u = -1;\n    for (int i = 0; i < V; ++i)\n      if (!done[i] && (u < 0 || dist[i] < dist[u]))\n        u = i;\n    if (u < 0 || dist[u] == INF)\n      break;\n    done[u] = true;\n    for (int v = 0; v < V; ++v)\n      if (edges[u][v] > 0 && dist[u] + edges[u][v] < dist[v])\n        dist[v] = dist[u] + edges[u][v];\n  }\n}\n\nint main(void) {\n  const int edges[V][V] = {\n      {0, 1, 5, 0}, {0, 0, 2, 7}, {0, 0, 0, 1}, {0, 0, 0, 0}};\n  int dist[V];\n  distances(edges, 0, dist);\n  printf(\"distances=%d,%d,%d,%d\\n\", dist[0], dist[1], dist[2], dist[3]);\n  return 0;\n}\n",
        "expected": "distances=0,1,3,4",
        "walkthrough": "The best path to two goes through one, and the best path to three goes through two, totaling four.",
        "pitfall": "This representation excludes zero-weight edges; supporting them requires changing the edge-presence representation.",
        "question": "Can this algorithm safely accept arbitrary negative weights?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "A settled distance may later decrease through a negative edge, breaking the proof.",
        "tryit": "Record predecessors and verify the reconstructed path’s cost against its edge weights.",
        "input": "",
        "runtime": "browser"
      },
      "6": {
        "intro": "A heap can replace the linear minimum scan. A simple implementation inserts a new candidate whenever a shorter route is found.",
        "explanation": "The lazy-duplicate approach leaves older candidates in the heap and skips them when their stored distance differs from the current best. This avoids a decrease-key API but needs enough queue capacity or dynamic growth. With adjacency lists, the usual bound is O((V+E) log(V+E)); this teaching fixture still scans matrix rows, so it does not achieve the sparse-graph bound.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { V = 4, INF = 10000 };\nvoid bfs(const int edges[V][V], int start) {\n  bool seen[V] = {0};\n  int queue[V];\n  size_t head = 0, count = 0;\n  seen[start] = true;\n  queue[count++] = start;\n  while (head < count) {\n    int u = queue[head++];\n    printf(\"%d \", u);\n    for (int v = 0; v < V; ++v)\n      if (edges[u][v] && !seen[v]) {\n        seen[v] = true;\n        queue[count++] = v;\n      }\n  }\n  puts(\"\");\n}\nvoid dfs(const int edges[V][V], int u, bool *seen) {\n  seen[u] = true;\n  for (int v = 0; v < V; ++v)\n    if (edges[u][v] && !seen[v])\n      dfs(edges, v, seen);\n}\nvoid distances(const int edges[V][V], int start, int *dist) {\n  bool done[V] = {0};\n  for (int i = 0; i < V; ++i)\n    dist[i] = INF;\n  dist[start] = 0;\n  for (int step = 0; step < V; ++step) {\n    int u = -1;\n    for (int i = 0; i < V; ++i)\n      if (!done[i] && (u < 0 || dist[i] < dist[u]))\n        u = i;\n    if (u < 0 || dist[u] == INF)\n      break;\n    done[u] = true;\n    for (int v = 0; v < V; ++v)\n      if (edges[u][v] > 0 && dist[u] + edges[u][v] < dist[v])\n        dist[v] = dist[u] + edges[u][v];\n  }\n}\ntypedef struct {\n  int vertex, distance;\n} Pending;\ntypedef struct {\n  Pending a[32];\n  size_t n;\n} MinQueue;\nbool offer(MinQueue *q, Pending x) {\n  if (q->n == 32)\n    return false;\n  size_t i = q->n++;\n  while (i && q->a[(i - 1) / 2].distance > x.distance) {\n    q->a[i] = q->a[(i - 1) / 2];\n    i = (i - 1) / 2;\n  }\n  q->a[i] = x;\n  return true;\n}\nPending take(MinQueue *q) {\n  Pending result = q->a[0], x = q->a[--q->n];\n  if (!q->n)\n    return result;\n  size_t i = 0;\n  while (i * 2 + 1 < q->n) {\n    size_t child = i * 2 + 1;\n    if (child + 1 < q->n && q->a[child + 1].distance < q->a[child].distance)\n      ++child;\n    if (q->a[child].distance >= x.distance)\n      break;\n    q->a[i] = q->a[child];\n    i = child;\n  }\n  q->a[i] = x;\n  return result;\n}\n\nint main(void) {\n  const int edges[V][V] = {\n      {0, 1, 5, 0}, {0, 0, 2, 7}, {0, 0, 0, 1}, {0, 0, 0, 0}};\n  int dist[V] = {0, INF, INF, INF}, parent[V] = {-1, -1, -1, -1};\n  MinQueue q = {0};\n  if (!offer(&q, (Pending){0, 0}))\n    return 1;\n  while (q.n) {\n    Pending x = take(&q);\n    if (x.distance != dist[x.vertex])\n      continue;\n    for (int v = 0; v < V; ++v)\n      if (edges[x.vertex][v] > 0 && x.distance + edges[x.vertex][v] < dist[v]) {\n        dist[v] = x.distance + edges[x.vertex][v];\n        parent[v] = x.vertex;\n        if (!offer(&q, (Pending){v, dist[v]}))\n          return 1;\n      }\n  }\n  printf(\"cost=%d reverse_path=3\", dist[3]);\n  for (int v = parent[3]; v >= 0; v = parent[v])\n    printf(\",%d\", v);\n  puts(\"\");\n  return 0;\n}\n",
        "expected": "cost=4 reverse_path=3,2,1,0",
        "walkthrough": "The predecessor chain reconstructs three←two←one←zero. Stale distance-five and distance-eight candidates are harmless because the current-best comparison skips them.",
        "pitfall": "Silently dropping a candidate on queue overflow can produce incorrect routes; propagate failure.",
        "question": "What makes an older pending entry stale?",
        "choices": [
          "Its vertex number is larger than the start",
          "Its distance differs from the current best distance"
        ],
        "answer": 1,
        "why": "A newer relaxation established a better candidate for that vertex.",
        "tryit": "Replace matrix rows with adjacency lists and benchmark only after verifying route costs against the simpler implementation.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practicePlan": {
      "goal": "Find routes in a graph and explain the cost of its representation.",
      "tasks": [
        "Choose a graph representation, track discovery state, and match the route algorithm to the edge-weight contract.",
        "Replace matrix rows with adjacency lists and benchmark only after verifying route costs against the simpler implementation.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "graphs-6"
    }
  }
};
