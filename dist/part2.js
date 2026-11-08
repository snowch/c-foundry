window.PART_TWO = {
  "pointers": {
    "intro": "Follow addresses without losing track of the objects they designate. Learn which writes change values, which change pointers, and how array bounds and const constrain access.",
    "outcomes": [
      "Distinguish a pointer object, its value, and its live target.",
      "Pass addresses and pointer-to-pointer outputs deliberately.",
      "Respect array endpoints, const declarations, and aliasing."
    ],
    "practice": "pointers",
    "topics": {
      "1": {
        "intro": "A pointer is an object whose value can designate another object. Keep three things separate: the pointer variable, the address value it holds, and the object reached through that address.",
        "explanation": "<code>&amp;x</code> produces the address of x. In an expression, <code>*p</code> accesses the object that p points to; in a declaration, the * is part of declaring a pointer. A null pointer designates no object. Test a pointer when its contract permits NULL, and never dereference it in that state. Being non-null alone does not prove that its target is alive or accessible.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    int value = 10;\n    int *p = &value;\n    *p = 42;\n    printf(\"value=%d\\n\", value);\n    p = NULL;\n    printf(\"null=%d\\n\", p == NULL);\n    return 0;\n}\n",
        "expected": "value=42\nnull=1",
        "walkthrough": "p first holds an address that reaches value. The assignment through *p changes value, not the address in p. Assigning NULL afterward changes the pointer itself. It does not undo the earlier write or destroy value. The program compares the null pointer but never dereferences it.",
        "pitfall": "An uninitialized pointer is not an empty pointer. Initialize it to a valid address or NULL, and establish lifetime and bounds before use.",
        "question": "Which statement changes the integer reached by p?",
        "choices": [
          "p = NULL;",
          "*p = 42;"
        ],
        "answer": 1,
        "why": "Dereferencing selects the pointed-to object as the destination of the assignment.",
        "tryit": "Change the write to 21, then compare value and *p before setting p to NULL.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "Passing a pointer still passes a value: the callee receives a copy of an address. That copy can reach a caller-owned object, so writing through it can change that object.",
        "explanation": "A swap takes two int pointers and exchanges the pointed-to values. To change a caller’s pointer variable itself, a function instead needs the address of that pointer: an int ** parameter. Read the levels deliberately. <code>*destination = target</code> writes an int * into the caller’s pointer object; <code>**destination</code> would access the integer reached through it.",
        "code": "#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n    int saved = *a;\n    *a = *b;\n    *b = saved;\n}\n\nvoid point_to(int **destination, int *target) {\n    *destination = target;\n}\n\nint main(void) {\n    int a = 10, b = 42;\n    swap(&a, &b);\n    int *p = &a;\n    point_to(&p, &b);\n    printf(\"%d %d %d\\n\", a, b, *p);\n    return 0;\n}\n",
        "expected": "42 10 10",
        "walkthrough": "The swap writes 42 into a and 10 into b. The local pointer p initially reaches a. point_to receives &p, so its assignment redirects p to b. These helpers require non-null pointers to live objects; the caller supplies them. Each pointer parameter is still a separate copy.",
        "pitfall": "Assigning to a plain int * parameter cannot redirect the caller’s pointer. It only replaces the callee’s copy unless the function returns a new pointer or receives a pointer-to-pointer.",
        "question": "What parameter type allows a helper to replace a caller’s int *?",
        "choices": [
          "int",
          "int *",
          "int **"
        ],
        "answer": 2,
        "why": "The helper needs access to the pointer object itself, through its address.",
        "tryit": "Remove point_to and pass &p to a helper that sets p to NULL. Do not dereference p afterward.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "Pointer arithmetic moves in elements of the pointed-to type. It is constrained by the array object involved; it is not permission to inspect arbitrary neighboring memory.",
        "explanation": "For an array with n elements, a pointer may designate an element or the one-past position used as an endpoint. A one-past pointer may be compared or subtracted within the appropriate array range, but not dereferenced. Subtracting pointers into the same array produces ptrdiff_t. Most array expressions convert to a pointer to their first element; an array parameter therefore needs an explicit length rather than sizeof on the parameter.",
        "code": "#include <stdio.h>\n#include <stddef.h>\n\nint main(void) {\n    int values[] = {2, 4, 6};\n    int *p = values + 1;\n    int *end = values + 3;\n    printf(\"%d %d %td\\n\", *p, *(p + 1), end - values);\n    return 0;\n}\n",
        "expected": "4 6 3",
        "walkthrough": "p reaches the second int, so *p is 4 and *(p + 1) is 6. end is one past the third element, and end - values counts three int elements, not their byte size. The td format prints ptrdiff_t. No expression reads *end.",
        "pitfall": "Subtracting unrelated pointers or dereferencing the endpoint has undefined behavior. An apparently plausible address is not evidence that an access is valid.",
        "question": "May this program read *end?",
        "choices": [
          "Yes: it is an endpoint",
          "No: it is one past the array"
        ],
        "answer": 1,
        "why": "The one-past position supports iteration boundaries, not reading another element.",
        "tryit": "Write a loop from values to end that prints each value while p != end.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "const can constrain the pointed-to object, the pointer object, or both. Read each declaration from the name outward and ask which assignment the compiler should reject.",
        "explanation": "<code>const int *read</code> prevents modifying an int through read, but read may be redirected. <code>int *const fixed</code> fixes the pointer after initialization, while permitting writes through it to a modifiable int. These declarations do not create ownership or extend the target’s lifetime. A read-only interface can accept a modifiable object without promising that the entire program has no other writer.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    int a = 10, b = 20;\n    const int *read = &a;\n    int *const fixed = &a;\n    *fixed = 11;\n    read = &b;\n    printf(\"%d %d\\n\", a, *read);\n    return 0;\n}\n",
        "expected": "11 20",
        "walkthrough": "fixed keeps the address of a and writes 11 into a. read can then point at b and read 20. Trying *read = 7 or fixed = &b is rejected by the relevant type constraint. A cast that removes const does not make a genuinely const object modifiable.",
        "pitfall": "const is not a lock and does not make shared access thread-safe. Also, a const-qualified pointer can still dangle when the target’s lifetime ends.",
        "question": "Which assignment is allowed by const int *read?",
        "choices": [
          "read = &b;",
          "*read = 7;"
        ],
        "answer": 0,
        "why": "The pointer may change, but this access path does not permit modifying the int.",
        "tryit": "Introduce one forbidden assignment at a time, read the diagnostic, and restore the valid version.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "Implementing swap is a small way to check your understanding of addresses, reads, and writes. Explain where the original value goes before either destination is overwritten.",
        "explanation": "Save *a in an ordinary local int, assign *b into *a, then assign the saved int into *b. The saved value is a copy, so a later write through a cannot change it. This version also works when both pointers designate the same int. Aliasing means that multiple access paths can reach one object; do not assume different parameter names imply different storage.",
        "code": "#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n    int saved = *a;\n    *a = *b;\n    *b = saved;\n}\n\nint main(void) {\n    int x = 10, y = 42;\n    swap(&x, &y);\n    int same = 7;\n    swap(&same, &same);\n    printf(\"%d %d %d\\n\", x, y, same);\n    return 0;\n}\n",
        "expected": "42 10 7",
        "walkthrough": "The first call exchanges two objects. The second reads and writes the same object through both parameters; each step leaves a valid value and the final result is still 7. Both calls satisfy the helper’s requirement of pointers to live, modifiable ints.",
        "pitfall": "Overwriting *a before saving it loses the original value. Conversely, changing a rather than *a changes only a pointer copy.",
        "question": "Why does the temporary survive the write to *a?",
        "choices": [
          "It stores its own int value",
          "It is another name for *a"
        ],
        "answer": 0,
        "why": "The initializer copies the integer into a separate local object.",
        "tryit": "Complete the pointer exercise, then add a same-object call and explain the result.",
        "input": "",
        "runtime": "browser"
      }
    }
  },
  "allocation": {
    "intro": "Make memory lifetimes explicit. Allocate and initialize safely, preserve ownership across failures, and build buffers whose length and capacity have separate meanings.",
    "outcomes": [
      "Use malloc, calloc, realloc, and free with a clear owner.",
      "Reject overflowing sizes and handle deterministic failure paths.",
      "Build a growable array and understand the matching string-builder pattern."
    ],
    "practice": "grow",
    "topics": {
      "1": {
        "intro": "Automatic storage is tied to a block’s execution. Dynamically allocated storage remains available until it is released, so its lifetime must be managed explicitly.",
        "explanation": "malloc requests a byte count and returns either a suitably aligned allocation or NULL. The allocation is not initialized. Use sizeof on the pointed-to type when calculating space, check the result, and initialize each element before reading it. In C, the void * result converts to an object pointer without an explicit cast. The owner is the code responsible for eventually calling free.",
        "code": "#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    size_t count = 5;\n    int *values = malloc(count * sizeof *values);\n    if (values == NULL) return 1;\n    int total = 0;\n    for (size_t i = 0; i < count; i++) {\n        values[i] = (int)i + 1;\n        total += values[i];\n    }\n    printf(\"%d\\n\", total);\n    free(values);\n    return 0;\n}\n",
        "expected": "15",
        "walkthrough": "The constant count is small enough for this size calculation. Each value is written before it contributes to the sum. free ends the allocation’s lifetime after its final use. The local pointer variable itself remains in scope, but its old value must not be used to access the released object.",
        "pitfall": "Returning a pointer to an ordinary local array does not create a heap allocation. Its block lifetime ends even though the address can be copied elsewhere.",
        "question": "Does malloc initialize every int to zero?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "The bytes have indeterminate contents until you establish values in them.",
        "tryit": "Move free before printf only if the sum has already been copied into total. Explain which objects the print still accesses.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "calloc initializes its allocated bytes to zero. realloc changes an allocation’s size and may move it. Treat that possible move as an ownership transition rather than assuming the address stays fixed.",
        "explanation": "For a nonzero requested size, a failed realloc leaves the original allocation valid. Store the result in a temporary pointer and replace the owner only after success. On success, old aliases must no longer be used, even if the numerical address appears unchanged. Newly added bytes are not initialized by realloc; establish values before reading them. Avoid zero-size allocation edge cases in this interface.",
        "code": "#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    int *values = calloc(3, sizeof *values);\n    if (!values) return 1;\n    printf(\"first=%d\\n\", values[0]);\n    int *grown = realloc(values, 6 * sizeof *values);\n    if (!grown) { free(values); return 1; }\n    values = grown;\n    for (int i = 3; i < 6; i++) values[i] = i + 1;\n    printf(\"last=%d\\n\", values[5]);\n    free(values);\n    return 0;\n}\n",
        "expected": "first=0\nlast=6",
        "walkthrough": "The first three int objects have zero values after calloc on these C integer types. The expanded region is filled explicitly, so the last value is 6. If growth fails, the code frees the still-owned original allocation. If it succeeds, values becomes the sole owner of the resized allocation.",
        "pitfall": "Writing values = realloc(values, bytes) directly can lose the only pointer to the old allocation when realloc returns NULL.",
        "question": "When a nonzero realloc request fails, who still owns the original allocation?",
        "choices": [
          "The caller",
          "Nobody: it was automatically freed"
        ],
        "answer": 0,
        "why": "Failure preserves the original allocation and its contents.",
        "tryit": "Change the initial values, grow the array, and verify that the earlier elements are preserved.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "Allocation sizes need arithmetic checks before the allocator is called. Otherwise a multiplication can wrap to a small size while later code assumes a much larger array.",
        "explanation": "For count elements of type int, reject a count larger than SIZE_MAX / sizeof(int) before multiplying. Define your policy for zero elements explicitly. To study a failure path without depending on the operating system’s memory state, inject a deterministic allocator that can deliberately return NULL. Such a test is a model of failure, not evidence that a particular large allocation will fail on every machine.",
        "code": "#include <stdio.h>\n#include <stdlib.h>\n#include <stdint.h>\n#include <stdbool.h>\n\nvoid *allocate_for_demo(size_t bytes, bool fail) {\n    if (fail) return NULL;\n    return malloc(bytes);\n}\n\nint main(void) {\n    size_t count = SIZE_MAX;\n    if (count > SIZE_MAX / sizeof(int)) puts(\"overflow rejected\");\n    int *values = allocate_for_demo(4 * sizeof *values, true);\n    if (!values) puts(\"simulated failure handled\");\n    free(values);\n    return 0;\n}\n",
        "expected": "overflow rejected\nsimulated failure handled",
        "walkthrough": "The count check rejects the impossible int-array size before multiplication. The second request deliberately fails, allowing the error branch to be observed repeatably. free(NULL) is defined to do nothing. A successful request would instead need initialization, use, and eventual release.",
        "pitfall": "Do not deliberately consume the machine’s memory to test failure handling. It is unreliable and can disrupt other work. Also distinguish arithmetic validation from the allocator’s own ability to satisfy a valid request.",
        "question": "Should count * sizeof(int) be evaluated before checking for size overflow?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "A wrapped multiplication has already lost the size you intended to request.",
        "tryit": "Make the injected allocator succeed for a small request, initialize the ints, and add cleanup for that path.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "Ownership is a program convention explaining who releases an allocation. Copying a pointer does not copy the allocation or create another independent owner.",
        "explanation": "A helper that returns a newly allocated copy transfers ownership to its caller. A borrowed pointer permits use under a stated lifetime but does not transfer the obligation to free. Define whether a function borrows, takes, or returns ownership in its interface. After free, every alias into that allocation is invalid for access; setting one owner variable to NULL does not update other aliases.",
        "code": "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nchar *copy_text(const char *source) {\n    size_t bytes = strlen(source) + 1;\n    char *copy = malloc(bytes);\n    if (copy) memcpy(copy, source, bytes);\n    return copy;\n}\n\nint main(void) {\n    char original[] = \"Hi\";\n    char *copy = copy_text(original);\n    if (!copy) return 1;\n    copy[0] = 'B';\n    printf(\"%s %s\\n\", original, copy);\n    free(copy);\n    copy = NULL;\n    return 0;\n}\n",
        "expected": "Hi Bi",
        "walkthrough": "The source is borrowed and must be a valid terminated string whose length plus one is representable. The helper copies its bytes into separate storage. Changing copy does not change original. The caller frees the returned allocation once and does not attempt to free the automatic original array.",
        "pitfall": "A double free is not harmless cleanup, and a dangling pointer is not made safe by being non-null. Review all returns and error paths for the same ownership rule.",
        "question": "Does assigning another pointer variable to copy create a second allocation?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "It copies an address. Both pointers would reach the same allocation.",
        "tryit": "Write down the owner and borrowed access paths in this program before adding another pointer to the copy.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "A growable buffer separates length from capacity. Length describes initialized content in use; capacity describes how much storage is currently available.",
        "explanation": "A string builder also needs one spare byte for its zero terminator. Before appending, compute the required size without overflow, grow through a temporary realloc result if necessary, and copy the new text including its terminator. This append interface borrows suffix and requires that it not point into the builder’s own allocation, since growth could invalidate such an alias. On failure, the caller still owns the previous buffer.",
        "code": "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdint.h>\n#include <stdbool.h>\n\nbool append(char **text, size_t *length, size_t *capacity, const char *suffix) {\n    size_t extra = strlen(suffix);\n    if (*length == SIZE_MAX || extra > SIZE_MAX - *length - 1) return false;\n    size_t needed = *length + extra + 1;\n    if (needed > *capacity) {\n        size_t next = *capacity ? *capacity : 8;\n        while (next < needed) {\n            if (next > SIZE_MAX / 2) { next = needed; break; }\n            next *= 2;\n        }\n        char *grown = realloc(*text, next);\n        if (!grown) return false;\n        *text = grown;\n        *capacity = next;\n    }\n    memcpy(*text + *length, suffix, extra + 1);\n    *length += extra;\n    return true;\n}\n\nint main(void) {\n    char *text = NULL;\n    size_t length = 0, capacity = 0;\n    if (!append(&text, &length, &capacity, \"hello\") ||\n        !append(&text, &length, &capacity, \" C\")) {\n        free(text);\n        return 1;\n    }\n    printf(\"%s\\nlength=%zu fits=%d\\n\", text, length, capacity >= length + 1);\n    free(text);\n    return 0;\n}\n",
        "expected": "hello C\nlength=7 fits=1",
        "walkthrough": "The first append creates storage and writes a valid string. The second reuses capacity if it fits. length excludes the zero terminator; needed includes it. The pointer-to-pointer lets append replace the caller’s owner after growth. The chapter project applies the same rules to a dynamic int array.",
        "pitfall": "Capacity is not the number of initialized elements. Never traverse unused capacity as though it were meaningful content, and never discard the owner on a failed growth request.",
        "question": "For a string of length 7, what minimum capacity is needed?",
        "choices": [
          "7",
          "8"
        ],
        "answer": 1,
        "why": "The terminator needs one additional char element.",
        "tryit": "Append another literal, then implement the chapter’s growable-array project.",
        "input": "",
        "runtime": "browser"
      }
    }
  },
  "structured-data": {
    "intro": "Represent related values and relationships with structs, enums, and tagged unions. Separate logical records from their layout, and document borrowed pointers into collections.",
    "outcomes": [
      "Choose fields, tags, and ownership rules for records.",
      "Inspect padding without treating memory layout as a file format.",
      "Find and update records while respecting collection lifetime."
    ],
    "practice": "records",
    "topics": {
      "1": {
        "intro": "A struct groups fields into one object with a defined type. Each field has a name and type, so a record can express more meaning than parallel arrays with matching indexes.",
        "explanation": "Use the dot operator on a struct object and the arrow operator on a pointer to one. A designated initializer names the fields being initialized; omitted fields receive zero initialization in this aggregate initializer. Assignment between compatible structs copies their members, including embedded arrays. That copy is not a deep copy of separately allocated objects reached through pointer members.",
        "code": "#include <stdio.h>\n\nstruct Row { int id; char name[32]; };\n\nint main(void) {\n    struct Row row = {.id = 1, .name = \"Ada\"};\n    struct Row copy = row;\n    copy.id = 2;\n    printf(\"%d | %s\\n%d | %s\\n\", row.id, row.name, copy.id, copy.name);\n    return 0;\n}\n",
        "expected": "1 | Ada\n2 | Ada",
        "walkthrough": "row and copy have distinct embedded name arrays. Updating copy.id leaves row.id unchanged. No heap storage is involved, so neither object needs free. If name were a char * instead, struct assignment would copy that pointer value rather than allocate another string.",
        "pitfall": "Do not assume that copying a struct containing owning pointers creates independent ownership. You need an explicit clone or transfer policy for those members.",
        "question": "Does struct assignment automatically duplicate a heap string reached by a pointer member?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "Pointer members are copied as values; the pointed-to allocation is not duplicated.",
        "tryit": "Change a character in copy.name and confirm that row.name remains unchanged.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "An enum gives meaningful names to integer choices. A union stores alternatives in overlapping storage. A tagged union combines them so the program knows which alternative it may interpret.",
        "explanation": "Maintain an invariant connecting the tag to the union member you most recently established. A switch on the tag selects the appropriate interpretation. typedef can give the whole record a concise type name, but it does not create lifetime management. In this example, the text member borrows a string literal whose lifetime covers the program; an owned heap string would need a different cleanup rule.",
        "code": "#include <stdio.h>\n\ntypedef enum { NUMBER, TEXT } Kind;\ntypedef struct {\n    Kind kind;\n    union { int number; const char *text; } data;\n} Value;\n\nvoid show(Value value) {\n    switch (value.kind) {\n        case NUMBER: printf(\"number=%d\\n\", value.data.number); break;\n        case TEXT: printf(\"text=%s\\n\", value.data.text); break;\n    }\n}\n\nint main(void) {\n    Value value = {.kind = NUMBER, .data.number = 7};\n    show(value);\n    value.kind = TEXT;\n    value.data.text = \"Ada\";\n    show(value);\n    return 0;\n}\n",
        "expected": "number=7\ntext=Ada",
        "walkthrough": "The first value establishes the number alternative. Before the second call, both tag and text member are updated. show therefore follows the matching branch each time. The union reuses storage; it is not a record holding both independent payloads simultaneously.",
        "pitfall": "Reading another union member to guess a different representation is not a portable serialization strategy. Keep the tag and payload consistent instead.",
        "question": "What tells show which union member to use?",
        "choices": [
          "The tag",
          "The size of the union"
        ],
        "answer": 0,
        "why": "The program’s invariant associates each Kind value with an established payload member.",
        "tryit": "Add a third enum case with a suitable payload and update every switch handling it.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "A struct’s size may include padding between members and at its end. Its layout meets alignment requirements, but a particular arrangement is not a portable file format.",
        "explanation": "sizeof reports the storage required for an object of that type, including padding. offsetof from stddef.h reports a member’s byte offset, and _Alignof reports a type’s alignment requirement in C11 and later. Use these for inspection or deliberate low-level interfaces, not to hardcode one machine’s layout into a persistent format. A file format should specify byte order and field widths independently.",
        "code": "#include <stdio.h>\n#include <stddef.h>\n\ntypedef struct { char flag; int count; } Row;\n\nint main(void) {\n    printf(\"fields fit=%d\\n\", sizeof(Row) >= sizeof(char) + sizeof(int));\n    printf(\"count aligned=%d\\n\", offsetof(Row, count) % _Alignof(int) == 0);\n    return 0;\n}\n",
        "expected": "fields fit=1\ncount aligned=1",
        "walkthrough": "The checks describe properties instead of assuming a particular number of padding bytes. On the course toolchains, the int member is placed at a suitably aligned offset. You can additionally print sizeof(Row) and offsetof(Row, count) to inspect a concrete platform, while remembering those numeric results are not universal C guarantees.",
        "pitfall": "memcmp over an entire struct can compare padding rather than just logical field values. Likewise, fwrite(&row, sizeof row, 1, file) exposes layout and representation assumptions.",
        "question": "Does sizeof(Row) necessarily equal the sum of its field sizes?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "Padding can make the complete object larger.",
        "tryit": "Reorder the fields and print actual sizes and offsets. Keep those observations separate from your file-format design.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "A struct can contain a pointer to another object of the same type. This lets objects represent relationships, but each relationship needs a clear ownership and lifetime policy.",
        "explanation": "A self-referential type uses a pointer because an object cannot contain an infinitely nested instance of itself by value. Here, a two-node chain owns both allocations. During cleanup, save the next pointer before freeing the current node. A pointer borrowed from a node is not usable after that node is released. Later data-structure chapters develop insertion and deletion algorithms on this foundation.",
        "code": "#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node { int value; struct Node *next; } Node;\n\nint main(void) {\n    Node *first = malloc(sizeof *first);\n    Node *second = malloc(sizeof *second);\n    if (!first || !second) { free(first); free(second); return 1; }\n    *first = (Node){.value = 1, .next = second};\n    *second = (Node){.value = 2, .next = NULL};\n    printf(\"sum=%d\\n\", first->value + first->next->value);\n    while (first) {\n        Node *next = first->next;\n        free(first);\n        first = next;\n    }\n    return 0;\n}\n",
        "expected": "sum=3",
        "walkthrough": "The arrows follow pointers to live Node objects. The cleanup loop remembers the successor while the current node is still alive, frees the current allocation, then advances using the saved pointer. The failure path also releases whichever allocation succeeded, since free(NULL) is permitted.",
        "pitfall": "Reading first->next after free(first) is a use-after-free, even if the old bytes seem unchanged. Save what cleanup needs before ending the object’s lifetime.",
        "question": "When must the loop read the next pointer?",
        "choices": [
          "Before freeing the current node",
          "After freeing the current node"
        ],
        "answer": 0,
        "why": "Accessing a member requires the current node to still be alive.",
        "tryit": "Add a third node, update the sum, and ensure the same cleanup loop releases every allocation.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "A collection interface should make lookup success, failure, and mutation explicit. Returning a borrowed pointer can be convenient while the collection remains in place and alive.",
        "explanation": "The helper searches only the supplied count of initialized rows and returns either a row address or NULL. Its caller checks the result before modifying a field. The embedded name storage remains owned by each row. If the table were dynamically resized, a previously returned row pointer could become invalid; a larger interface must document that invalidation rule.",
        "code": "#include <stdio.h>\n\ntypedef struct { int id; char name[32]; int score; } Row;\n\nRow *find(Row *rows, size_t count, int id) {\n    for (size_t i = 0; i < count; i++) {\n        if (rows[i].id == id) return &rows[i];\n    }\n    return NULL;\n}\n\nint main(void) {\n    Row rows[] = {{1, \"Ada\", 80}, {2, \"Grace\", 90}};\n    Row *found = find(rows, 2, 2);\n    if (found) found->score = 99;\n    printf(\"%s %d\\n\", rows[1].name, rows[1].score);\n    return 0;\n}\n",
        "expected": "Grace 99",
        "walkthrough": "The returned address reaches the second element. Updating found->score therefore updates rows[1]. The pointer is borrowed, so the caller does not free it. With an unknown ID, find returns NULL and the conditional prevents a dereference.",
        "pitfall": "Passing capacity instead of initialized count could expose uninitialized rows. Also, a successful lookup does not justify keeping its pointer past the collection’s lifetime or a relocation.",
        "question": "Should the caller free the pointer returned from this stack-array lookup?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "It designates an element inside an existing array, not an independently owned allocation.",
        "tryit": "Implement the record-update project and test an absent ID and an overlong name.",
        "input": "",
        "runtime": "browser"
      }
    }
  },
  "larger-programs": {
    "intro": "Build real module boundaries. Compile source files separately, control linkage, and define callback, ownership, and failure contracts that callers can use correctly.",
    "outcomes": [
      "Separate header declarations from source definitions.",
      "Explain internal/external linkage, include guards, and configuration.",
      "Implement and test a small owned-record module across multiple files."
    ],
    "nativePractice": {
      "id": "record-store",
      "title": "Build an owned record-store module"
    },
    "topics": {
      "1": {
        "intro": "Separate compilation lets an implementation change without placing every definition in the caller’s source file. The header states an interface; the source file provides its implementation.",
        "explanation": "Each .c file is preprocessed and compiled as its own translation unit. Include the module’s own header in its implementation as well as in callers, so incompatible declarations can be diagnosed. The linker then combines the object files. A declaration makes a name and type known; it does not by itself supply the function’s executable definition.",
        "code": "#include <stdio.h>\n#include \"operations.h\"\n\nint main(void) {\n    printf(\"%d\\n\", twice(21));\n    return 0;\n}\n",
        "expected": "42",
        "walkthrough": "main.c sees the declaration of twice through operations.h. operations.c supplies the matching definition. Compile both .c files and link them together; compiling only main.c cannot provide the missing definition. The example command compiles the complete file set in the repository workspace.",
        "pitfall": "Do not include operations.c into main.c to simulate a module boundary. Include the header and compile the implementation separately.",
        "question": "Which file belongs in an #include in the caller?",
        "choices": [
          "operations.h",
          "operations.c"
        ],
        "answer": 0,
        "why": "The public header describes the interface; the implementation is a separately compiled translation unit.",
        "tryit": "Change twice in operations.c and rebuild the same multi-file example.",
        "input": "",
        "runtime": "native",
        "files": {
          "operations.h": "#ifndef OPERATIONS_H\n#define OPERATIONS_H\nint twice(int value);\n#endif\n",
          "operations.c": "#include \"operations.h\"\n\nint twice(int value) {\n    return value * 2;\n}\n",
          "main.c": "#include <stdio.h>\n#include \"operations.h\"\n\nint main(void) {\n    printf(\"%d\\n\", twice(21));\n    return 0;\n}\n"
        }
      },
      "2": {
        "intro": "Linkage determines whether declarations in different scopes or translation units can refer to the same entity. It is distinct from the lifetime of an object.",
        "explanation": "This header declares operations with extern. One source file provides its initialized definition. The file-scope static private_count has internal linkage, so other translation units cannot access it by that name; they use the exported functions. A static local also has persistent storage duration, but its name remains block-scoped. The same keyword participates in different declaration contexts, so describe the effect rather than memorizing one slogan.",
        "code": "#include <stdio.h>\n#include \"counter.h\"\n\nint main(void) {\n    tick();\n    tick();\n    printf(\"calls=%d private=%d\\n\", operations, read_private());\n    return 0;\n}\n",
        "expected": "calls=2 private=2",
        "walkthrough": "Both objects persist across calls. tick updates the exported counter and the private counter, while main reads the latter through a function. The header contains no ordinary global object definition that would be repeated in each including file.",
        "pitfall": "Defining a shared mutable global in a header can produce multiple definitions at link time. Prefer module functions when they make state ownership clearer.",
        "question": "How many source files should define the exported operations object?",
        "choices": [
          "Exactly one",
          "Every file that includes the header"
        ],
        "answer": 0,
        "why": "The extern declaration can be repeated; the object needs one program definition.",
        "tryit": "Make operations private too and replace the public object declaration with a read function.",
        "input": "",
        "runtime": "native",
        "files": {
          "counter.h": "#ifndef COUNTER_H\n#define COUNTER_H\nextern int operations;\nvoid tick(void);\nint read_private(void);\n#endif\n",
          "counter.c": "#include \"counter.h\"\n\nint operations = 0;\nstatic int private_count;\n\nvoid tick(void) { operations++; private_count++; }\nint read_private(void) { return private_count; }\n",
          "main.c": "#include <stdio.h>\n#include \"counter.h\"\n\nint main(void) {\n    tick();\n    tick();\n    printf(\"calls=%d private=%d\\n\", operations, read_private());\n    return 0;\n}\n"
        }
      },
      "3": {
        "intro": "The preprocessor transforms source before ordinary C compilation. Keep its role small and visible: header guards and explicit configuration are common uses.",
        "explanation": "An include guard wraps a header in a conditional so repeated inclusion in one translation unit does not repeat its contents. The separate FACTOR conditional supplies a default only when configuration has not already defined it. A static inline function keeps ordinary parameter evaluation rules, unlike an expression macro that may evaluate an argument more than once. Header guards do not prevent multiple external definitions across different translation units.",
        "code": "#include <stdio.h>\n#include \"scale.h\"\n#include \"scale.h\"\n\nint main(void) {\n    printf(\"%d\\n\", scale(7));\n    return 0;\n}\n",
        "expected": "21",
        "walkthrough": "Although scale.h is included twice, its guard admits the body once in main’s translation unit. FACTOR defaults to 3, so scale(7) returns 21. The helper has internal linkage and can appear in another translation unit without creating one conflicting external function definition.",
        "pitfall": "A macro such as SQUARE(x) expanding to (x)*(x) is unsafe for an argument with side effects. Also parenthesize expression macros carefully when they are genuinely needed.",
        "question": "Does an include guard protect against every linker multiple-definition problem?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "It prevents repetition within one translation unit; separate translation units still need a correct linkage design.",
        "tryit": "Change the default factor, then inspect the preprocessed source with gcc -E main.c in the example folder.",
        "input": "",
        "runtime": "native",
        "files": {
          "scale.h": "#ifndef SCALE_H\n#define SCALE_H\n#ifndef FACTOR\n#define FACTOR 3\n#endif\nstatic inline int scale(int value) { return value * FACTOR; }\n#endif\n",
          "main.c": "#include <stdio.h>\n#include \"scale.h\"\n#include \"scale.h\"\n\nint main(void) {\n    printf(\"%d\\n\", scale(7));\n    return 0;\n}\n"
        }
      },
      "4": {
        "intro": "A function pointer lets a caller supply behavior through a typed interface. A callback is a function passed for another component to call according to a documented contract.",
        "explanation": "qsort receives a comparison callback. Its two arguments designate elements, and its result must be negative, zero, or positive according to their ordering. The callback converts each void pointer back to the correct element type before reading it. The function signature and element-size argument must match the actual array. The standard does not promise a particular sorting algorithm or stability.",
        "code": "#include <stdio.h>\n#include <stdlib.h>\n\nint compare_ints(const void *left, const void *right) {\n    int a = *(const int *)left;\n    int b = *(const int *)right;\n    return (a > b) - (a < b);\n}\n\nint main(void) {\n    int values[] = {7, -3, 0, 7};\n    qsort(values, 4, sizeof values[0], compare_ints);\n    for (size_t i = 0; i < 4; i++) printf(\"%s%d\", i ? \" \" : \"\", values[i]);\n    puts(\"\");\n    return 0;\n}\n",
        "expected": "-3 0 7 7",
        "walkthrough": "The relational expressions each yield 0 or 1, so their difference produces a valid sign without subtracting the potentially extreme element values themselves. Equal values compare as zero. The callback must describe a consistent ordering throughout the call.",
        "pitfall": "return a - b can overflow for valid int values, and casting an incompatible function pointer does not repair a mismatched callback signature.",
        "question": "Why avoid a - b as this comparator?",
        "choices": [
          "It can overflow",
          "qsort only accepts positive results"
        ],
        "answer": 0,
        "why": "A comparator should handle every supported int pair without undefined signed overflow.",
        "tryit": "Reverse the comparison’s sign to sort descending and predict the new output.",
        "input": "",
        "runtime": "native"
      },
      "5": {
        "intro": "A usable interface explains more than parameter types. State what it borrows, what it owns, how it reports failure, and what its outputs mean after failure.",
        "explanation": "copy_name borrows a valid source string and returns a separately allocated owner through out on success. It sets a supplied output slot to NULL before a failure is possible, making the cleanup policy predictable. Distinct status values distinguish invalid arguments from allocation failure. The output slot must not already be the caller’s only owner of another allocation: overwriting that owner would leak it.",
        "code": "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef enum { OK, BAD_INPUT, NO_MEMORY } Status;\n\nStatus copy_name(const char *source, char **out) {\n    if (!out) return BAD_INPUT;\n    *out = NULL;\n    if (!source) return BAD_INPUT;\n    size_t bytes = strlen(source) + 1;\n    char *copy = malloc(bytes);\n    if (!copy) return NO_MEMORY;\n    memcpy(copy, source, bytes);\n    *out = copy;\n    return OK;\n}\n\nint main(void) {\n    char *name = NULL;\n    Status result = copy_name(\"Ada\", &name);\n    if (result != OK) return 1;\n    printf(\"%s\\n\", name);\n    free(name);\n    name = NULL;\n    printf(\"bad input=%d\\n\", copy_name(NULL, &name) == BAD_INPUT);\n    return 0;\n}\n",
        "expected": "Ada\nbad input=1",
        "walkthrough": "The caller checks the status before reading the returned string and frees it exactly once. The second call supplies an invalid source and observes BAD_INPUT with a null output. The chapter project extends this ownership contract into a multi-file record-store module.",
        "pitfall": "Error handling is part of the API, not an afterthought. Document output state on failure and ensure the implementation matches that promise.",
        "question": "May a caller assume name is usable after any status?",
        "choices": [
          "Yes",
          "Only after OK"
        ],
        "answer": 1,
        "why": "The status determines whether the returned owner was established.",
        "tryit": "Implement the native record-store project and test its failure and cleanup paths.",
        "input": "",
        "runtime": "native"
      }
    }
  },
  "files-bytes": {
    "intro": "Move from in-memory objects to explicitly encoded bytes. Check stream operations, investigate invariants with native tools, and finish with a documented record format.",
    "outcomes": [
      "Manage FILE resources and distinguish buffering from durability.",
      "Use unsigned masks and explicit endian encoding.",
      "Validate a binary record format with fixtures, malformed input, and native diagnostics."
    ],
    "nativePractice": {
      "id": "binary-record",
      "title": "Build a portable binary record codec"
    },
    "topics": {
      "1": {
        "intro": "A FILE stream combines an underlying resource with buffering and state. Opening a stream creates a cleanup obligation even when a later operation fails.",
        "explanation": "Check open, read, write, positioning, and close results according to their contracts. Text and binary modes can differ across platforms; use rb and wb for a binary format. This temporary update stream demonstrates writing and then repositioning before reading. Reaching EOF and encountering an I/O error are different conditions; use feof and ferror to distinguish them when a read stops.",
        "code": "#include <stdio.h>\n\nint main(void) {\n    FILE *file = tmpfile();\n    if (!file) return 1;\n    if (fputs(\"Ada\\n\", file) == EOF || fflush(file) != 0 ||\n        fseek(file, 0, SEEK_SET) != 0) { fclose(file); return 1; }\n    char line[16];\n    if (!fgets(line, sizeof line, file)) { fclose(file); return 1; }\n    printf(\"%s\", line);\n    if (fclose(file) != 0) return 1;\n    return 0;\n}\n",
        "expected": "Ada",
        "walkthrough": "tmpfile creates a temporary binary update stream. The program checks the write, flushes buffered data, seeks back to the start, and reads the line. fclose releases the stream and removes its temporary file. Every path after a successful open attempts to close it.",
        "pitfall": "Successful fprintf or fwrite can mean bytes reached a library buffer, not that they are durable on storage. Durability needs platform-specific guarantees discussed with the database log.",
        "question": "Does a buffered successful write alone prove crash durability?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "Buffering and persistence are different stages; even flush is not a universal crash-durability guarantee.",
        "tryit": "Inspect feof and ferror after deliberately attempting another read at end-of-file.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "Bitwise operators manipulate the representation of unsigned values. Use them to define flags and packed fields deliberately, with shifts constrained to the type’s width.",
        "explanation": "OR sets mask bits, AND selects them, XOR toggles them, and complement inverts them. Fixed-width uint32_t is available on our target platforms; its existence is a format requirement, not a promise for every imaginable C implementation. Use a suitably typed unsigned left operand for shifts and keep the shift count below the width. inttypes.h supplies portable printf format macros for fixed-width types.",
        "code": "#include <stdio.h>\n#include <stdint.h>\n#include <inttypes.h>\n\nint main(void) {\n    uint32_t flags = 0;\n    flags |= UINT32_C(1) << 2;\n    flags |= UINT32_C(1) << 5;\n    flags &= ~(UINT32_C(1) << 2);\n    printf(\"hex=%\" PRIx32 \" bit2=%d bit5=%d\\n\", flags,\n           (flags & (UINT32_C(1) << 2)) != 0,\n           (flags & (UINT32_C(1) << 5)) != 0);\n    return 0;\n}\n",
        "expected": "hex=20 bit2=0 bit5=1",
        "walkthrough": "The program first sets bits 2 and 5, then clears only bit 2 with an inverted mask. The remaining value is hexadecimal 20, meaning bit 5 is set. The two comparisons turn selected bit fields into ordinary truth values for printing.",
        "pitfall": "Shifting by a negative count or by a count at least as large as the promoted operand’s width is undefined. Bitwise & also does not short-circuit like logical &&.",
        "question": "Which operation clears the selected bit while preserving the others?",
        "choices": [
          "flags &= ~mask",
          "flags = ~mask"
        ],
        "answer": 0,
        "why": "The AND limits the change to bits selected by the inverted mask.",
        "tryit": "Add a third flag and toggle it twice with XOR; verify that the original flags are restored.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "Serialization defines a byte representation independently of an object’s in-memory layout. Pick a byte order and widths explicitly, and make the decoder validate the format before constructing values.",
        "explanation": "This format requires eight-bit bytes and a uint32_t. Encoding extracts the low-order byte first, defining little-endian order regardless of the host’s native order. Decoding casts each byte to uint32_t before shifting so the shift is performed in an appropriate unsigned type. A production decoder must also verify the available length before indexing its input.",
        "code": "#include <stdio.h>\n#include <stdint.h>\n#include <limits.h>\n\nint main(void) {\n    if (CHAR_BIT != 8) return 1;\n    uint32_t value = UINT32_C(0x12345678);\n    unsigned char bytes[4];\n    for (unsigned i = 0; i < 4; i++) bytes[i] = (unsigned char)(value >> (8 * i));\n    uint32_t decoded = (uint32_t)bytes[0] | ((uint32_t)bytes[1] << 8) |\n                       ((uint32_t)bytes[2] << 16) | ((uint32_t)bytes[3] << 24);\n    printf(\"%02x %02x %02x %02x\\nround trip=%d\\n\",\n           (unsigned)bytes[0], (unsigned)bytes[1],\n           (unsigned)bytes[2], (unsigned)bytes[3], decoded == value);\n    return 0;\n}\n",
        "expected": "78 56 34 12\nround trip=1",
        "walkthrough": "The hexadecimal value becomes four specified bytes, then the decoder reconstructs the original value from them. A machine with another host byte order would use the same extraction rules. There is no unaligned cast from a byte buffer to a uint32_t pointer.",
        "pitfall": "Writing a raw struct bakes in padding and representation assumptions. Casting the input buffer to an integer pointer can also violate alignment or aliasing rules.",
        "question": "What establishes the file’s byte order here?",
        "choices": [
          "The explicit extraction and reconstruction rules",
          "The host’s native layout"
        ],
        "answer": 0,
        "why": "The representation is specified by the algorithm rather than a raw memory dump.",
        "tryit": "Try zero and the largest uint32_t, checking round trips without changing the byte order.",
        "input": "",
        "runtime": "native"
      },
      "4": {
        "intro": "Undefined behavior is a broken language contract, not a particular error message. A program can appear to work while reading a dead object or crossing an array boundary.",
        "explanation": "Validate external inputs before use, and use assertions to document internal invariants while developing. A debugger can show values, call stacks, and control flow, but an observed run cannot turn an invalid operation into a guarantee. Build with debug information and warnings. Keep required behavior outside assert, because NDEBUG can remove assertions. The example’s caller explicitly validates the index before calling the helper.",
        "code": "#include <stdio.h>\n#include <assert.h>\n\nint at(const int *values, size_t count, size_t index) {\n    assert(values != NULL);\n    assert(index < count);\n    return values[index];\n}\n\nint main(void) {\n    const int values[] = {4, 8, 12};\n    size_t index = 2;\n    if (index >= 3) return 1;\n    printf(\"%d\\n\", at(values, 3, index));\n    return 0;\n}\n",
        "expected": "12",
        "walkthrough": "The runtime guard protects the external boundary, while the assertions express assumptions inside at. The program accesses a live array element. To investigate in Codespaces, build with -g, set a breakpoint in at using GDB, and inspect values, count, and index before continuing.",
        "pitfall": "A dangling pointer is not safe because its address is non-null. Likewise, changing optimization settings may expose a bug, but does not make undefined behavior valid at another setting.",
        "question": "Should an assertion be the only validation of untrusted input?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "Assertions can disappear; external input still needs a runtime error-handling policy.",
        "tryit": "Use GDB on the example and inspect the valid index rather than deliberately executing an out-of-bounds access.",
        "input": "",
        "runtime": "native"
      },
      "5": {
        "intro": "Combine tests with compiler diagnostics, sanitizers, and portability checks. Each tool detects a different set of mistakes; none is a proof that a program is correct.",
        "explanation": "The copy helper requires valid nonoverlapping source and destination objects and a terminated source. It rejects text that cannot fit including the terminator. Test both the boundary that fits and the first value that does not. AddressSanitizer helps detect many invalid memory accesses, and UndefinedBehaviorSanitizer detects selected invalid operations. Use them on native builds: the page’s Wasm runner is not providing these native sanitizer runtimes.",
        "code": "#include <stdio.h>\n#include <string.h>\n#include <stdbool.h>\n\nbool copy_checked(char *destination, size_t capacity, const char *source) {\n    size_t length = strlen(source);\n    if (length >= capacity) return false;\n    memcpy(destination, source, length + 1);\n    return true;\n}\n\nint main(void) {\n    char small[4];\n    printf(\"short=%s\\n\", copy_checked(small, sizeof small, \"Ada\") ? \"ok\" : \"rejected\");\n    printf(\"too-long=%s\\n\", copy_checked(small, sizeof small, \"Grace\") ? \"ok\" : \"rejected\");\n    return 0;\n}\n",
        "expected": "short=ok\ntoo-long=rejected",
        "walkthrough": "Ada needs exactly four chars with its terminator and fits. Grace does not, so the helper returns without copying it. In Codespaces, run this example with SANITIZE=1 and compare GCC and Clang builds. Keep a passing test distinct from evidence about paths that have not executed.",
        "pitfall": "Sanitizers have coverage and platform limits. They do not generally prove ownership, absence of logical errors, or race freedom; concurrency needs additional tools and reasoning.",
        "question": "Does a sanitizer-clean run prove there are no bugs?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "It checks the executed behavior for the classes of problems that sanitizer can detect.",
        "tryit": "Run make example EXAMPLE=files-bytes-5 SANITIZE=1, then add a destination-capacity boundary case.",
        "input": "",
        "runtime": "native"
      },
      "6": {
        "intro": "A portable record format starts with a written specification and a decoder that rejects malformed input. An exact-size record is a useful first step before the database introduces pages and variable-length values.",
        "explanation": "Our ten-byte format is: bytes 0–1 ASCII C and F, byte 2 version 1, byte 3 reserved zero, bytes 4–7 a little-endian uint32_t ID, and bytes 8–9 a little-endian uint16_t score. The API requires non-null pointers to valid objects, and eight-bit bytes. The decoder checks the length before inspecting fields and commits its output only after validation. IDs and scores may span their entire unsigned type ranges.",
        "code": "#include <stdio.h>\n#include <stdint.h>\n#include <inttypes.h>\n#include <stdbool.h>\n#include <limits.h>\n\ntypedef struct { uint32_t id; uint16_t score; } Record;\n\nvoid encode(unsigned char out[10], Record row) {\n    out[0] = 0x43; out[1] = 0x46; out[2] = 1; out[3] = 0;\n    for (unsigned i = 0; i < 4; i++) out[4 + i] = (unsigned char)(row.id >> (i * 8));\n    out[8] = (unsigned char)row.score;\n    out[9] = (unsigned char)(row.score >> 8);\n}\n\nbool decode(const unsigned char *bytes, size_t length, Record *out) {\n    if (length != 10 || bytes[0] != 0x43 || bytes[1] != 0x46 ||\n        bytes[2] != 1 || bytes[3] != 0) return false;\n    Record row = {0, 0};\n    for (unsigned i = 0; i < 4; i++) row.id |= (uint32_t)bytes[4 + i] << (i * 8);\n    row.score = (uint16_t)((uint16_t)bytes[8] | ((uint16_t)bytes[9] << 8));\n    *out = row;\n    return true;\n}\n\nint main(void) {\n    if (CHAR_BIT != 8) return 1;\n    Record original = {513, 90}, restored;\n    unsigned char bytes[10];\n    encode(bytes, original);\n    if (!decode(bytes, sizeof bytes, &restored)) return 1;\n    printf(\"id=%\" PRIu32 \" score=%\" PRIu16 \"\\n\", restored.id, restored.score);\n    bytes[2] = 2;\n    printf(\"bad version=%d\\n\", !decode(bytes, sizeof bytes, &restored));\n    return 0;\n}\n",
        "expected": "id=513 score=90\nbad version=1",
        "walkthrough": "The first round trip restores the two fields without copying struct padding. Changing the version byte makes decoding fail. The chapter project moves the encoder and decoder behind a header and tests exact bytes, truncation, unknown versions, and an actual temporary-file round trip.",
        "pitfall": "Do not silently accept a format version you cannot interpret. Also, a round trip alone can miss a shared mistake in encoder and decoder, so test against independently specified byte fixtures.",
        "question": "Why test a known byte fixture as well as a round trip?",
        "choices": [
          "Encoder and decoder could share the same mistake",
          "Round trips never exercise decoding"
        ],
        "answer": 0,
        "why": "A fixed independently defined representation catches errors that two mutually consistent functions can hide.",
        "tryit": "Implement the native binary-record project and explain every byte in its test fixture.",
        "input": "",
        "runtime": "native"
      }
    }
  }
};
