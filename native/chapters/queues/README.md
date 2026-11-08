# Chapter 17: Stacks, queues, and deques

Part 4: Build data structures in C. Teaching baseline: C17.

Define bounded stack and queue operations before using them to parse or schedule work.

## Outcomes

- Maintain head, count, and capacity invariants in a ring.
- Reject overflow and underflow without changing state.
- Apply stacks to matching and expression evaluation.

## 17.1 Array-backed and linked implementations

A stack removes the most recently added value; a queue removes the oldest. The operation contract matters more than the container’s name.

An array-backed stack keeps its next free position in count. Push checks capacity before writing; pop checks count before decrementing and reading. A linked implementation avoids a fixed array limit but introduces allocation failure and node ownership. Both can implement constant-time push/pop when their required node locations are known.

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
  int stack[3], out;
  size_t count = 0;
  stack[count++] = 10;
  stack[count++] = 20;
  out = stack[--count];
  printf("popped=%d remaining=%zu\n", out, count);
  return 0;
}
```

Output:

```text
popped=20 remaining=1
```

The small trusted fixture establishes both pushes before popping. A public interface must expose the capacity and empty checks rather than relying on the caller’s fixed sequence.

**Watch for:** Pre-decrementing an empty size_t wraps before any array bound can be checked.

**Check:** Which item leaves a stack first?

1. The most recently pushed item
2. The oldest item

<details><summary>Answer</summary>

The most recently pushed item. LIFO is the defining removal order.

</details>

**Try:** Wrap this fixture in checked push and pop functions and test all empty/full boundaries.

Run from the repository root:

```sh
make example EXAMPLE=queues-1
```

## 17.2 Circular buffers

A circular queue reuses freed slots without shifting every remaining element. Keep a count to distinguish empty from full.

The next write is at (head+count)%capacity. Pop advances head modulo capacity. The invariant 0≤count≤capacity makes both operations bounded. This fixed small implementation cannot overflow the index addition; a general size_t ring must account for large-capacity arithmetic. Neither function provides thread synchronization.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { QCAP = 4 };
typedef struct {
  int data[QCAP];
  size_t head, count;
} Queue;
bool push(Queue *q, int x) {
  if (q->count == QCAP)
    return false;
  q->data[(q->head + q->count) % QCAP] = x;
  ++q->count;
  return true;
}
bool pop(Queue *q, int *out) {
  if (!q->count)
    return false;
  *out = q->data[q->head];
  q->head = (q->head + 1) % QCAP;
  --q->count;
  return true;
}

int main(void) {
  Queue q = {0};
  int x;
  push(&q, 1);
  push(&q, 2);
  pop(&q, &x);
  push(&q, 3);
  push(&q, 4);
  push(&q, 5);
  while (pop(&q, &x))
    printf("%d ", x);
  puts("");
  return 0;
}
```

Output:

```text
2 3 4 5
```

The slot freed by removing one is reused after the tail wraps. FIFO order is independent of the physical slot numbering.

**Watch for:** A modulo expression does not by itself prevent writing when the queue is full.

**Check:** What separates a full ring from an empty ring here?

1. The contents of the first array cell
2. The count field

<details><summary>Answer</summary>

The count field. Both states may have the same head and tail positions.

</details>

**Try:** Print physical indices while wrapping, then compare them with the logical output order.

Run from the repository root:

```sh
make example EXAMPLE=queues-2
```

## 17.3 Overflow, underflow, and resizing

A failed bounded operation should report failure and preserve the container’s state. Resizing is a separate policy.

The queue rejects a fifth item before modifying count or data. An empty pop leaves its output unchanged in this API. To resize a ring, copy values in logical order into a new allocation and reset head to zero only after success. A bounded queue can instead apply backpressure, a policy developed in the concurrency chapters.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

enum { QCAP = 4 };
typedef struct {
  int data[QCAP];
  size_t head, count;
} Queue;
bool push(Queue *q, int x) {
  if (q->count == QCAP)
    return false;
  q->data[(q->head + q->count) % QCAP] = x;
  ++q->count;
  return true;
}
bool pop(Queue *q, int *out) {
  if (!q->count)
    return false;
  *out = q->data[q->head];
  q->head = (q->head + 1) % QCAP;
  --q->count;
  return true;
}

int main(void) {
  Queue q = {0};
  int x = 99;
  bool empty = pop(&q, &x);
  for (int i = 0; i < 4; ++i)
    push(&q, i);
  bool full = push(&q, 8);
  printf("empty_ok=%d output=%d full_ok=%d count=%zu\n", empty, x, full,
         q.count);
  return 0;
}
```

Output:

```text
empty_ok=0 output=99 full_ok=0 count=4
```

Both rejected operations preserve their documented state. A false result is not a stored Boolean queue element.

**Watch for:** Silently overwriting the oldest item changes a reliable work queue into a lossy buffer.

**Check:** What should a rejected push do to count?

1. Leave it unchanged
2. Increment it and fix it later

<details><summary>Answer</summary>

Leave it unchanged. The capacity invariant must remain true when the operation returns.

</details>

**Try:** Implement resize with failure preservation and verify FIFO order across a wrapped resize.

Run from the repository root:

```sh
make example EXAMPLE=queues-3
```

## 17.4 Bracket matching

Bracket matching uses a stack because the most recent unmatched opening bracket must close first.

Push opening brackets and compare each closing bracket with the top. Reject an unmatched close, the wrong bracket type, or leftover opens at the end. The fixed 32-entry stack rejects excess nesting rather than overflowing. This recognizer handles only bracket characters, not a complete C lexer with comments and string literals.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

bool balanced(const char *s) {
  char stack[32];
  size_t n = 0;
  for (; *s; ++s) {
    if (*s == '(' || *s == '[') {
      if (n == sizeof stack)
        return false;
      stack[n++] = *s;
    } else if (*s == ')' || *s == ']') {
      if (!n)
        return false;
      char open = stack[--n];
      if ((*s == ')' && open != '(') || (*s == ']' && open != '['))
        return false;
    }
  }
  return n == 0;
}

int main(void) {
  printf("balanced=%d crossed=%d\n", balanced("([])"), balanced("([)]"));
  return 0;
}
```

Output:

```text
balanced=1 crossed=0
```

The crossed example has matching counts but violates nesting order, which the top-of-stack comparison detects.

**Watch for:** Counting opens and closes without their order cannot validate nesting.

**Check:** Why does ([)] fail?

1. It contains too many brackets
2. The first close does not match the most recent open

<details><summary>Answer</summary>

The first close does not match the most recent open. The top is [ when ) arrives.

</details>

**Try:** Test empty input, a lone closing bracket, an unfinished open, and nesting beyond capacity.

Run from the repository root:

```sh
make example EXAMPLE=queues-4
```

## 17.5 Expression evaluation

Postfix expression evaluation consumes operands before an operator. A stack preserves the required evaluation order.

For a binary operator, pop the right operand and then the left. The example intentionally recognizes only single decimal digits and + or −, ignoring spaces. It rejects unknown characters, insufficient operands, excess stack depth, and extra final operands. It also checks signed arithmetic before each addition or subtraction; a bounded stack alone would not bound a long expression’s accumulated value.

### main.c

```c
#include <limits.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

bool evaluate(const char *s, int *out) {
  int stack[32];
  size_t n = 0;
  for (; *s; ++s) {
    if (*s == ' ')
      continue;
    if (*s >= '0' && *s <= '9') {
      if (n == 32)
        return false;
      stack[n++] = *s - '0';
    } else {
      if (n < 2 || (*s != '+' && *s != '-'))
        return false;
      int right = stack[--n], left = stack[--n];
      if (*s == '+') {
        if ((right > 0 && left > INT_MAX - right) ||
            (right < 0 && left < INT_MIN - right)) return false;
        stack[n++] = left + right;
      } else {
        if ((right > 0 && left < INT_MIN + right) ||
            (right < 0 && left > INT_MAX + right)) return false;
        stack[n++] = left - right;
      }
    }
  }
  if (n != 1)
    return false;
  *out = stack[0];
  return true;
}

int main(void) {
  int value;
  bool ok = evaluate("8 3 - 2 +", &value);
  printf("ok=%d result=%d\n", ok, value);
  return 0;
}
```

Output:

```text
ok=1 result=7
```

The subtraction computes 8−3, followed by adding two. Reversing the two popped operands would change the subtraction.

**Watch for:** A parser for one-digit postfix tokens is not an infix or full numeric-expression parser.

**Check:** Which operand is popped first?

1. The right operand
2. The left operand

<details><summary>Answer</summary>

The right operand. The left operand was pushed earlier and lies below the right.

</details>

**Try:** Extend tokenization to multi-digit integers and add checked arithmetic and division-by-zero handling.

Run from the repository root:

```sh
make example EXAMPLE=queues-5
```

## Build it yourself

Build a circular queue and use a stack to evaluate expressions.

1. Define bounded stack and queue operations before using them to parse or schedule work.
2. Extend tokenization to multi-digit integers and add checked arithmetic and division-by-zero handling.
3. Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants.

### Check your work

- Run the complete example and compare its output with the documented fixture.
- Predict and check at least one changed input, including a failing or absent case.
- Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work.

Baseline command (checks original output, not every extension):

```sh
make example EXAMPLE=queues-5
```

Chapter workspace command: `make chapter CHAPTER=queues`.

Generated from dist/part4.js by tools/sync_readings.cjs. Full reading: https://snowch.github.io/c-foundry/#/chapter/queues
