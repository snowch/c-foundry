window.PART_FIVE = {
  "database-foundations": {
    "intro": "Define a deliberately small database contract before implementing storage or SQL syntax.",
    "outcomes": [
      "Separate logical rows, storage, indexes, and execution.",
      "Specify commands and observable failures.",
      "Use acceptance tests as a development boundary."
    ],
    "topics": {
      "1": {
        "intro": "A schema names the fields and constrains their values. A key identifies a row under a uniqueness rule.",
        "explanation": "Our teaching table has a positive 32-bit ID, a bounded terminated name, and a nonnegative 32-bit score. The struct is an in-memory representation, not a disk format. The ID uniqueness rule belongs to the table interface rather than to C’s type system. Define these choices before adding indexes or parsing syntax.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\n\nint main(void) {\n  Table t = {0};\n  if (insert_row(&t, (Row){1, \"Ada\", 90}) != OK)\n    return 1;\n  display(&t);\n  return 0;\n}\n",
        "expected": "1 | Ada | 90",
        "walkthrough": "Insertion validates the row and copies it into the table. Embedded name storage makes this particular row copy independent of its source object.",
        "pitfall": "A struct declaration alone cannot enforce unique keys or guarantee portable serialized bytes.",
        "question": "Where is ID uniqueness enforced?",
        "choices": [
          "The table insertion operation",
          "The uint32_t type"
        ],
        "answer": 0,
        "why": "The type limits numeric representation, not relationships between rows.",
        "tryit": "Write the schema contract, including name length, empty names, key zero, and duplicate behavior.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "Storage owns rows, an index locates candidates, and execution decides which candidates satisfy a query. Keep those roles separable.",
        "explanation": "This initial table scan is both a correctness baseline and the fallback when no index exists. A later index can return candidate row positions, but execution must still honor the same row and predicate contract. Physical row positions may change after deletion or compaction; logical IDs should remain stable.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\n\nint main(void) {\n  Table t = {0};\n  insert_row(&t, (Row){1, \"Ada\", 90});\n  insert_row(&t, (Row){2, \"Grace\", 80});\n  int i = find_row(&t, 2);\n  printf(\"position=%d id=%u\\n\", i, (unsigned)t.rows[i].id);\n  return 0;\n}\n",
        "expected": "position=1 id=2",
        "walkthrough": "The logical ID two is stored at physical position one. These numbers are intentionally different.",
        "pitfall": "Treating array positions as permanent row IDs breaks references when rows move.",
        "question": "Which identifier should survive physical relocation?",
        "choices": [
          "The current array position",
          "The logical row ID"
        ],
        "answer": 1,
        "why": "Identity belongs to the schema contract rather than the current layout.",
        "tryit": "Delete the first row and confirm that ID two remains the same even though its position changes.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "Limit the first database so every promised behavior can be tested. A small, explicit contract is more useful than incomplete general SQL support.",
        "explanation": "The baseline is a single in-memory table with unique positive IDs, bounded names, and deterministic insertion order. It does not yet promise persistence, transactions, concurrent access, Unicode-aware comparison, or arbitrary SQL. Each later chapter adds a named capability while preserving the earlier behavior.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\n\nint main(void) {\n  Table t = {0};\n  Status first = insert_row(&t, (Row){1, \"Ada\", 90}),\n         again = insert_row(&t, (Row){1, \"Other\", 0});\n  printf(\"inserted=%d duplicate=%d rows=%zu\\n\", first == OK, again == DUPLICATE,\n         t.count);\n  return 0;\n}\n",
        "expected": "inserted=1 duplicate=1 rows=1",
        "walkthrough": "The second call is rejected and the original table count remains one. Rejection is observable rather than a silent overwrite.",
        "pitfall": "Implementing a feature’s happy path without its error contract does not complete the feature.",
        "question": "What happens to the first row after a duplicate insertion?",
        "choices": [
          "It remains unchanged",
          "It is silently replaced"
        ],
        "answer": 0,
        "why": "The initial insertion contract rejects duplicate IDs.",
        "tryit": "Write acceptance cases for missing rows, invalid rows, a full table, and an empty selection.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "A command loop separates input acquisition from command behavior. Keep each input line bounded and report unknown commands.",
        "explanation": "This first loop recognizes only insert-demo and select, deliberately postponing tokenization. fgets retains a newline when it fits; remove that line ending before comparison. If a line does not fit, reject and drain it so its tail cannot become a second command. EOF ends the loop normally; ferror distinguishes a read failure.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nvoid command(Table *t, const char *line) {\n  if (strcmp(line, \"insert-demo\") == 0) {\n    puts(insert_row(t, (Row){1, \"Ada\", 90}) == OK ? \"inserted\" : \"rejected\");\n  } else if (strcmp(line, \"select\") == 0)\n    display(t);\n  else\n    puts(\"unknown command\");\n}\n\nint main(void) {\n  Table t = {0};\n  char line[64];\n  while (fgets(line, sizeof line, stdin)) {\n    if (!strchr(line, '\\n') && !feof(stdin)) {\n      int c;\n      while ((c = getchar()) != '\\n' && c != EOF) {\n      }\n      puts(\"line too long\");\n      continue;\n    }\n    line[strcspn(line, \"\\r\\n\")] = 0;\n    command(&t, line);\n  }\n  if (ferror(stdin))\n    return 1;\n  return 0;\n}\n",
        "expected": "inserted\n1 | Ada | 90\nunknown command",
        "walkthrough": "The supplied input runs an insert, selection, and unknown command. The table survives across commands within this process.",
        "pitfall": "The browser’s input is supplied before execution; this is a batch command loop, not an interactive terminal prompt.",
        "question": "Why drain a line that exceeds the buffer?",
        "choices": [
          "To make the table persistent",
          "To prevent its tail being treated as a new command"
        ],
        "answer": 1,
        "why": "Input framing must remain aligned after rejecting a long command.",
        "tryit": "Add a quit command and test an overlong line followed by a valid command.",
        "input": "insert-demo\nselect\nwat\n",
        "runtime": "browser"
      },
      "5": {
        "intro": "Acceptance tests describe externally observable behavior rather than the internal representation used to achieve it.",
        "explanation": "The fixture checks successful insertion, duplicate rejection, and retained original contents. A test harness should fail with a nonzero exit status even in release builds, so required operations belong outside assert. This is the first contract suite; later storage and concurrency work must preserve it while adding their own cases.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\n\nint main(void) {\n  Table t = {0};\n  if (insert_row(&t, (Row){1, \"Ada\", 90}) != OK)\n    return 1;\n  if (insert_row(&t, (Row){1, \"Other\", 0}) != DUPLICATE || t.count != 1 ||\n      strcmp(t.rows[0].name, \"Ada\") != 0)\n    return 1;\n  puts(\"acceptance: insert duplicate preserve passed\");\n  return 0;\n}\n",
        "expected": "acceptance: insert duplicate preserve passed",
        "walkthrough": "The pass line is reached only after all checks succeed. Changing the representation is permitted if these externally specified results remain true.",
        "pitfall": "Putting insertion itself inside assert can remove required behavior when NDEBUG is defined.",
        "question": "Should a representation refactor change the acceptance contract?",
        "choices": [
          "No, unless the public behavior is intentionally revised",
          "Yes, tests should mirror every implementation detail"
        ],
        "answer": 0,
        "why": "Contracts allow implementation changes while retaining observable guarantees.",
        "tryit": "Extend the acceptance suite with empty selection, invalid ID, and full-capacity failure preservation.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practicePlan": {
      "goal": "Define TinyDB’s first commands and test their observable behavior.",
      "tasks": [
        "Define a deliberately small database contract before implementing storage or SQL syntax.",
        "Extend the acceptance suite with empty selection, invalid ID, and full-capacity failure preservation.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "database-foundations-5"
    }
  },
  "tables": {
    "intro": "Implement row lifecycle operations while keeping key uniqueness and initialized-count invariants true.",
    "outcomes": [
      "Insert, find, update, and delete through an explicit status API.",
      "Preserve state after rejected operations.",
      "Check a table’s invariants after operation sequences."
    ],
    "topics": {
      "1": {
        "intro": "A table’s initialized count is not its reserved capacity. Only rows below count belong to the logical table.",
        "explanation": "Table t={0} initializes an empty table. Row assignment copies embedded arrays as part of the struct, while pointer fields would require a separate ownership policy. The fixed array avoids allocation during table operations but imposes a deliberate capacity limit. The name field must contain a terminator within its 32 bytes.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\n\nint main(void) {\n  Table t = {0};\n  Row source = {7, \"Ada\", 95};\n  insert_row(&t, source);\n  source.name[0] = 'X';\n  printf(\"count=%zu stored=%s source=%s\\n\", t.count, t.rows[0].name,\n         source.name);\n  return 0;\n}\n",
        "expected": "count=1 stored=Ada source=Xda",
        "walkthrough": "Changing the source name after insertion does not affect the stored row because the embedded bytes were copied.",
        "pitfall": "Replacing the array with char * would make the same assignment share a target rather than clone it.",
        "question": "Does this row assignment copy the embedded name array?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 0,
        "why": "A compatible struct assignment copies its array members as part of the struct value.",
        "tryit": "Add an invariant checker for count≤capacity, terminated names, positive IDs, and unique IDs.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "Insertion and selection form the minimal useful table interface. Return an explicit missing result before accessing row storage.",
        "explanation": "find_row performs a linear scan and returns −1 for absence. Its signed result is tested before conversion to an array index. Full-table selection preserves insertion order in this baseline. Both lookup and a full selection take O(n) worst-case time; selection necessarily visits every emitted row.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\n\nint main(void) {\n  Table t = {0};\n  insert_row(&t, (Row){2, \"Grace\", 80});\n  insert_row(&t, (Row){1, \"Ada\", 90});\n  display(&t);\n  printf(\"missing=%d\\n\", find_row(&t, 99) < 0);\n  return 0;\n}\n",
        "expected": "2 | Grace | 80\n1 | Ada | 90\nmissing=1",
        "walkthrough": "Storage order is the order of successful insertion, not sorted ID order. Binary search would therefore be invalid on this array.",
        "pitfall": "Do not cast −1 to size_t and use it as an index.",
        "question": "Is this table sorted by ID?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "The insertion operation appends rather than maintaining sorted order.",
        "tryit": "Implement a selection by ID and compare it with the existing standalone query exercise.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "A failed insertion must leave existing rows intact. Define which error wins when more than one condition applies.",
        "explanation": "This API checks row validity, then duplicate identity, then capacity. Therefore a duplicate in a full table reports DUPLICATE. That priority is observable behavior and belongs in tests. Appending occurs only after every check has passed, so count and existing records stay unchanged on rejection.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\n\nint main(void) {\n  Table t = {0};\n  for (unsigned i = 1; i <= TABLE_CAP; ++i)\n    if (insert_row(&t, (Row){i, \"row\", 0}) != OK)\n      return 1;\n  printf(\"duplicate=%d full=%d count=%zu\\n\",\n         insert_row(&t, (Row){1, \"other\", 0}) == DUPLICATE,\n         insert_row(&t, (Row){99, \"extra\", 0}) == FULL, t.count);\n  return 0;\n}\n",
        "expected": "duplicate=1 full=1 count=8",
        "walkthrough": "The duplicate and new ninth key produce distinct failures. Neither increases the initialized count.",
        "pitfall": "An API can be inconsistent even if it never crashes: error priority and state preservation need tests too.",
        "question": "What is returned for a duplicate ID in a full table?",
        "choices": [
          "DUPLICATE under this documented policy",
          "An insertion that overwrites the first row"
        ],
        "answer": 0,
        "why": "Duplicate checking precedes the capacity check.",
        "tryit": "Try an invalid row in a full table and record the intended error priority.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "Update changes selected fields of an existing logical row; deletion removes membership and repairs the physical layout.",
        "explanation": "The score update keeps the ID and name unchanged. Deletion shifts later rows left to preserve baseline selection order, taking O(n) time. Any borrowed row address at or after the deleted position may now refer to a different logical row. A missing update or delete returns MISSING without changing the table.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\n\nint main(void) {\n  Table t = {0};\n  insert_row(&t, (Row){1, \"Ada\", 90});\n  insert_row(&t, (Row){2, \"Grace\", 80});\n  update_score(&t, 2, 99);\n  delete_row(&t, 1);\n  display(&t);\n  printf(\"missing=%d\\n\", delete_row(&t, 1) == MISSING);\n  return 0;\n}\n",
        "expected": "2 | Grace | 99\nmissing=1",
        "walkthrough": "Grace moves to position zero after deleting Ada, but her ID remains two and her updated score remains 99.",
        "pitfall": "Swap-with-last deletion can be faster but changes row order; it needs a different public ordering contract.",
        "question": "Does a saved array position remain a stable row identity after deletion?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "Shifting changes the position-to-row mapping.",
        "tryit": "Test deletion from the beginning, middle, end, and a one-row table.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "A working in-memory database needs consistent behavior across sequences, not just isolated successful calls.",
        "explanation": "The fixture combines insertion, duplicate rejection, update, and deletion, then checks the surviving row by logical key. These checks are a starting point for state-machine testing: maintain an independent simple reference collection and compare results after generated operations. Persistence and concurrent access are still separate capabilities.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\n\nint main(void) {\n  Table t = {0};\n  if (insert_row(&t, (Row){1, \"Ada\", 90}) != OK ||\n      insert_row(&t, (Row){2, \"Grace\", 80}) != OK)\n    return 1;\n  if (update_score(&t, 2, 88) != OK || delete_row(&t, 1) != OK)\n    return 1;\n  int i = find_row(&t, 2);\n  if (t.count != 1 || i < 0 || t.rows[i].score != 88)\n    return 1;\n  display(&t);\n  puts(\"table contract passed\");\n  return 0;\n}\n",
        "expected": "2 | Grace | 88\ntable contract passed",
        "walkthrough": "The final state contains exactly the updated surviving row. Checking by ID prevents the test from relying unnecessarily on an intermediate array position.",
        "pitfall": "Passing this sequence does not establish every possible operation ordering or memory-safety property.",
        "question": "What should a generated operation test compare?",
        "choices": [
          "Public results and logical state against a reference",
          "Only whether the process prints a pass line"
        ],
        "answer": 0,
        "why": "An independent model can detect errors that the implementation’s own assumptions would miss.",
        "tryit": "Generate bounded insert/update/delete sequences and check invariants after every operation.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practice": "query",
    "practicePlan": {
      "goal": "Insert records, reject duplicates, and find rows by ID.",
      "tasks": [
        "Implement row lifecycle operations while keeping key uniqueness and initialized-count invariants true.",
        "Generate bounded insert/update/delete sequences and check invariants after every operation.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "tables-5"
    }
  },
  "parsing": {
    "intro": "Recognize a deliberately small SQL grammar and keep syntax, schema validation, and execution separate.",
    "outcomes": [
      "Tokenize bounded identifiers, numbers, and quoted strings.",
      "Construct a typed statement only after complete syntax validation.",
      "Reject trailing input and distinguish syntax from value errors."
    ],
    "topics": {
      "1": {
        "intro": "Tokenization converts characters into categories such as keywords, identifiers, literals, and punctuation. It does not execute commands.",
        "explanation": "The lexer recognizes bounded ASCII words, checked unsigned 32-bit integers, quoted strings, and the punctuation needed by this grammar. It returns BAD for invalid or oversized tokens. Keywords are case-sensitive in this teaching dialect; changing that policy requires deliberate normalization rather than silently accepting some mixed-case forms.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef enum {\n  END,\n  WORD,\n  NUMBER,\n  STRING,\n  SEMI,\n  LP,\n  RP,\n  COMMA,\n  STAR,\n  EQUAL,\n  BAD\n} Token;\ntypedef struct {\n  const char *p;\n  char text[32];\n  uint32_t number;\n} Lexer;\nToken next(Lexer *l) {\n  while (*l->p == ' ' || *l->p == '\\t' || *l->p == '\\n' || *l->p == '\\r')\n    ++l->p;\n  unsigned char ch = (unsigned char)*l->p;\n  l->text[0] = 0;\n  if (!ch)\n    return END;\n  if (ch >= '0' && ch <= '9') {\n    uint32_t n = 0;\n    do {\n      unsigned digit = (unsigned)(*l->p - '0');\n      if (n > (UINT32_MAX - digit) / 10)\n        return BAD;\n      n = n * 10 + digit;\n      ++l->p;\n    } while (*l->p >= '0' && *l->p <= '9');\n    l->number = n;\n    return NUMBER;\n  }\n  if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == '_') {\n    size_t n = 0;\n    while ((*l->p >= 'A' && *l->p <= 'Z') || (*l->p >= 'a' && *l->p <= 'z') ||\n           (*l->p >= '0' && *l->p <= '9') || *l->p == '_') {\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p++;\n    }\n    l->text[n] = 0;\n    return WORD;\n  }\n  ++l->p;\n  if (ch == '\\'') {\n    size_t n = 0;\n    for (;;) {\n      if (!*l->p)\n        return BAD;\n      if (*l->p == '\\'' && l->p[1] != '\\'') {\n        ++l->p;\n        l->text[n] = 0;\n        return STRING;\n      }\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p;\n      if (*l->p == '\\'')\n        ++l->p;\n      ++l->p;\n    }\n  }\n  switch (ch) {\n  case ';':\n    return SEMI;\n  case '(':\n    return LP;\n  case ')':\n    return RP;\n  case ',':\n    return COMMA;\n  case '*':\n    return STAR;\n  case '=':\n    return EQUAL;\n  default:\n    return BAD;\n  }\n}\nbool keyword(Lexer *l, const char *word) {\n  return next(l) == WORD && strcmp(l->text, word) == 0;\n}\n\nint main(void) {\n  Lexer l = {\"SELECT * FROM people;\", {0}, 0};\n  Token token;\n  unsigned words = 0, punctuation = 0;\n  while ((token = next(&l)) != END) {\n    if (token == BAD)\n      return 1;\n    if (token == WORD)\n      ++words;\n    else\n      ++punctuation;\n  }\n  printf(\"words=%u punctuation=%u\\n\", words, punctuation);\n  return 0;\n}\n",
        "expected": "words=3 punctuation=2",
        "walkthrough": "SELECT, FROM, and people are words. The star and semicolon are punctuation. No table access occurs during lexing.",
        "pitfall": "Treating a keyword-looking substring inside a quoted string as syntax corrupts valid data.",
        "question": "Does tokenization insert a row?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "Lexing identifies categories and values; execution is a later stage.",
        "tryit": "Print each token category and source offset, then test invalid characters and an overflowing numeric literal.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "Quoted strings can contain whitespace and escaped quotes. A lexer must distinguish a closing quote from a quote represented as data.",
        "explanation": "Inside a single-quoted string, this lexer interprets two adjacent quotes as one data quote. It rejects an unterminated string or a decoded value exceeding 31 bytes. Whitespace outside tokens is ignored; whitespace inside a quoted string is preserved. These are ASCII byte-oriented rules, not Unicode normalization.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef enum {\n  END,\n  WORD,\n  NUMBER,\n  STRING,\n  SEMI,\n  LP,\n  RP,\n  COMMA,\n  STAR,\n  EQUAL,\n  BAD\n} Token;\ntypedef struct {\n  const char *p;\n  char text[32];\n  uint32_t number;\n} Lexer;\nToken next(Lexer *l) {\n  while (*l->p == ' ' || *l->p == '\\t' || *l->p == '\\n' || *l->p == '\\r')\n    ++l->p;\n  unsigned char ch = (unsigned char)*l->p;\n  l->text[0] = 0;\n  if (!ch)\n    return END;\n  if (ch >= '0' && ch <= '9') {\n    uint32_t n = 0;\n    do {\n      unsigned digit = (unsigned)(*l->p - '0');\n      if (n > (UINT32_MAX - digit) / 10)\n        return BAD;\n      n = n * 10 + digit;\n      ++l->p;\n    } while (*l->p >= '0' && *l->p <= '9');\n    l->number = n;\n    return NUMBER;\n  }\n  if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == '_') {\n    size_t n = 0;\n    while ((*l->p >= 'A' && *l->p <= 'Z') || (*l->p >= 'a' && *l->p <= 'z') ||\n           (*l->p >= '0' && *l->p <= '9') || *l->p == '_') {\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p++;\n    }\n    l->text[n] = 0;\n    return WORD;\n  }\n  ++l->p;\n  if (ch == '\\'') {\n    size_t n = 0;\n    for (;;) {\n      if (!*l->p)\n        return BAD;\n      if (*l->p == '\\'' && l->p[1] != '\\'') {\n        ++l->p;\n        l->text[n] = 0;\n        return STRING;\n      }\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p;\n      if (*l->p == '\\'')\n        ++l->p;\n      ++l->p;\n    }\n  }\n  switch (ch) {\n  case ';':\n    return SEMI;\n  case '(':\n    return LP;\n  case ')':\n    return RP;\n  case ',':\n    return COMMA;\n  case '*':\n    return STAR;\n  case '=':\n    return EQUAL;\n  default:\n    return BAD;\n  }\n}\nbool keyword(Lexer *l, const char *word) {\n  return next(l) == WORD && strcmp(l->text, word) == 0;\n}\n\nint main(void) {\n  Lexer l = {\"  'Ada Lovelace'  'O''Brien'\", {0}, 0};\n  if (next(&l) != STRING)\n    return 1;\n  puts(l.text);\n  if (next(&l) != STRING)\n    return 1;\n  puts(l.text);\n  Lexer bad = {\"'unfinished\", {0}, 0};\n  printf(\"unterminated=%d\\n\", next(&bad) == BAD);\n  return 0;\n}\n",
        "expected": "Ada Lovelace\nO'Brien\nunterminated=1",
        "walkthrough": "The doubled quote contributes one character to O'Brien. The malformed second fixture reaches the end before a closing quote.",
        "pitfall": "A fixed-size token buffer needs a decoded-length check before every write, including escaped data.",
        "question": "Is a doubled quote inside this literal a token boundary?",
        "choices": [
          "Yes, it ends the statement",
          "No, it represents one quote character"
        ],
        "answer": 1,
        "why": "The lexer’s string state handles doubled quotes before looking for token boundaries.",
        "tryit": "Test an empty string, 31-byte and 32-byte strings, and whitespace around every punctuation token.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "A grammar specifies complete legal sequences, not just recognizable prefixes. Start with two statements you can test thoroughly.",
        "explanation": "The subset is INSERT INTO people VALUES (number, string, number); and SELECT * FROM people optionally followed by WHERE id = number. Both require a semicolon and end of input. The parser builds a temporary statement and assigns it to the output only after success, preserving output state after rejection.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\ntypedef enum {\n  END,\n  WORD,\n  NUMBER,\n  STRING,\n  SEMI,\n  LP,\n  RP,\n  COMMA,\n  STAR,\n  EQUAL,\n  BAD\n} Token;\ntypedef struct {\n  const char *p;\n  char text[32];\n  uint32_t number;\n} Lexer;\nToken next(Lexer *l) {\n  while (*l->p == ' ' || *l->p == '\\t' || *l->p == '\\n' || *l->p == '\\r')\n    ++l->p;\n  unsigned char ch = (unsigned char)*l->p;\n  l->text[0] = 0;\n  if (!ch)\n    return END;\n  if (ch >= '0' && ch <= '9') {\n    uint32_t n = 0;\n    do {\n      unsigned digit = (unsigned)(*l->p - '0');\n      if (n > (UINT32_MAX - digit) / 10)\n        return BAD;\n      n = n * 10 + digit;\n      ++l->p;\n    } while (*l->p >= '0' && *l->p <= '9');\n    l->number = n;\n    return NUMBER;\n  }\n  if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == '_') {\n    size_t n = 0;\n    while ((*l->p >= 'A' && *l->p <= 'Z') || (*l->p >= 'a' && *l->p <= 'z') ||\n           (*l->p >= '0' && *l->p <= '9') || *l->p == '_') {\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p++;\n    }\n    l->text[n] = 0;\n    return WORD;\n  }\n  ++l->p;\n  if (ch == '\\'') {\n    size_t n = 0;\n    for (;;) {\n      if (!*l->p)\n        return BAD;\n      if (*l->p == '\\'' && l->p[1] != '\\'') {\n        ++l->p;\n        l->text[n] = 0;\n        return STRING;\n      }\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p;\n      if (*l->p == '\\'')\n        ++l->p;\n      ++l->p;\n    }\n  }\n  switch (ch) {\n  case ';':\n    return SEMI;\n  case '(':\n    return LP;\n  case ')':\n    return RP;\n  case ',':\n    return COMMA;\n  case '*':\n    return STAR;\n  case '=':\n    return EQUAL;\n  default:\n    return BAD;\n  }\n}\nbool keyword(Lexer *l, const char *word) {\n  return next(l) == WORD && strcmp(l->text, word) == 0;\n}\ntypedef enum { INSERT_STMT, SELECT_STMT } Kind;\ntypedef struct {\n  Kind kind;\n  Row row;\n  bool filtered;\n  uint32_t key;\n} Statement;\nbool parse(const char *sql, Statement *out) {\n  Lexer l = {sql, {0}, 0};\n  Statement s = {0};\n  if (next(&l) != WORD)\n    return false;\n  if (strcmp(l.text, \"INSERT\") == 0) {\n    s.kind = INSERT_STMT;\n    if (!keyword(&l, \"INTO\") || !keyword(&l, \"people\") ||\n        !keyword(&l, \"VALUES\") || next(&l) != LP || next(&l) != NUMBER)\n      return false;\n    s.row.id = l.number;\n    if (next(&l) != COMMA || next(&l) != STRING)\n      return false;\n    memcpy(s.row.name, l.text, sizeof s.row.name);\n    if (next(&l) != COMMA || next(&l) != NUMBER)\n      return false;\n    s.row.score = l.number;\n    if (next(&l) != RP || next(&l) != SEMI || next(&l) != END)\n      return false;\n  } else if (strcmp(l.text, \"SELECT\") == 0) {\n    s.kind = SELECT_STMT;\n    if (next(&l) != STAR || !keyword(&l, \"FROM\") || !keyword(&l, \"people\"))\n      return false;\n    Token t = next(&l);\n    if (t == WORD && strcmp(l.text, \"WHERE\") == 0) {\n      if (!keyword(&l, \"id\") || next(&l) != EQUAL || next(&l) != NUMBER)\n        return false;\n      s.filtered = true;\n      s.key = l.number;\n      t = next(&l);\n    }\n    if (t != SEMI || next(&l) != END)\n      return false;\n  } else\n    return false;\n  *out = s;\n  return true;\n}\nbool validate(const Statement *s) {\n  return s->kind != INSERT_STMT || (s->row.id > 0 && s->row.name[0] != 0);\n}\n\nint main(void) {\n  Statement s = {0};\n  bool good = parse(\"INSERT INTO people VALUES (1, 'Ada', 90);\", &s);\n  printf(\"valid=%d missing_semicolon=%d trailing=%d\\n\", good,\n         !parse(\"SELECT * FROM people\", &s),\n         !parse(\"SELECT * FROM people; garbage\", &s));\n  return 0;\n}\n",
        "expected": "valid=1 missing_semicolon=1 trailing=1",
        "walkthrough": "The valid insert matches the complete production. The other strings fail because the required terminator or end-of-input contract is violated.",
        "pitfall": "Accepting a valid prefix while ignoring trailing tokens can hide malformed or unintended commands.",
        "question": "What follows the semicolon in this grammar?",
        "choices": [
          "End of input",
          "Any ignored characters"
        ],
        "answer": 0,
        "why": "A single-statement parser must consume the entire statement.",
        "tryit": "Write the grammar in a small notation, then generate one malformed example for each required punctuation token.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "A statement representation should retain semantic values rather than pointers into a lexer’s reused token buffer.",
        "explanation": "The parser copies the insert’s bounded name into the statement and stores numeric values in typed fields. A SELECT records whether it has a key predicate and the key itself. It does not store raw SQL fragments for execution to reinterpret. This tagged representation lets validation and execution dispatch on Kind.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\ntypedef enum {\n  END,\n  WORD,\n  NUMBER,\n  STRING,\n  SEMI,\n  LP,\n  RP,\n  COMMA,\n  STAR,\n  EQUAL,\n  BAD\n} Token;\ntypedef struct {\n  const char *p;\n  char text[32];\n  uint32_t number;\n} Lexer;\nToken next(Lexer *l) {\n  while (*l->p == ' ' || *l->p == '\\t' || *l->p == '\\n' || *l->p == '\\r')\n    ++l->p;\n  unsigned char ch = (unsigned char)*l->p;\n  l->text[0] = 0;\n  if (!ch)\n    return END;\n  if (ch >= '0' && ch <= '9') {\n    uint32_t n = 0;\n    do {\n      unsigned digit = (unsigned)(*l->p - '0');\n      if (n > (UINT32_MAX - digit) / 10)\n        return BAD;\n      n = n * 10 + digit;\n      ++l->p;\n    } while (*l->p >= '0' && *l->p <= '9');\n    l->number = n;\n    return NUMBER;\n  }\n  if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == '_') {\n    size_t n = 0;\n    while ((*l->p >= 'A' && *l->p <= 'Z') || (*l->p >= 'a' && *l->p <= 'z') ||\n           (*l->p >= '0' && *l->p <= '9') || *l->p == '_') {\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p++;\n    }\n    l->text[n] = 0;\n    return WORD;\n  }\n  ++l->p;\n  if (ch == '\\'') {\n    size_t n = 0;\n    for (;;) {\n      if (!*l->p)\n        return BAD;\n      if (*l->p == '\\'' && l->p[1] != '\\'') {\n        ++l->p;\n        l->text[n] = 0;\n        return STRING;\n      }\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p;\n      if (*l->p == '\\'')\n        ++l->p;\n      ++l->p;\n    }\n  }\n  switch (ch) {\n  case ';':\n    return SEMI;\n  case '(':\n    return LP;\n  case ')':\n    return RP;\n  case ',':\n    return COMMA;\n  case '*':\n    return STAR;\n  case '=':\n    return EQUAL;\n  default:\n    return BAD;\n  }\n}\nbool keyword(Lexer *l, const char *word) {\n  return next(l) == WORD && strcmp(l->text, word) == 0;\n}\ntypedef enum { INSERT_STMT, SELECT_STMT } Kind;\ntypedef struct {\n  Kind kind;\n  Row row;\n  bool filtered;\n  uint32_t key;\n} Statement;\nbool parse(const char *sql, Statement *out) {\n  Lexer l = {sql, {0}, 0};\n  Statement s = {0};\n  if (next(&l) != WORD)\n    return false;\n  if (strcmp(l.text, \"INSERT\") == 0) {\n    s.kind = INSERT_STMT;\n    if (!keyword(&l, \"INTO\") || !keyword(&l, \"people\") ||\n        !keyword(&l, \"VALUES\") || next(&l) != LP || next(&l) != NUMBER)\n      return false;\n    s.row.id = l.number;\n    if (next(&l) != COMMA || next(&l) != STRING)\n      return false;\n    memcpy(s.row.name, l.text, sizeof s.row.name);\n    if (next(&l) != COMMA || next(&l) != NUMBER)\n      return false;\n    s.row.score = l.number;\n    if (next(&l) != RP || next(&l) != SEMI || next(&l) != END)\n      return false;\n  } else if (strcmp(l.text, \"SELECT\") == 0) {\n    s.kind = SELECT_STMT;\n    if (next(&l) != STAR || !keyword(&l, \"FROM\") || !keyword(&l, \"people\"))\n      return false;\n    Token t = next(&l);\n    if (t == WORD && strcmp(l.text, \"WHERE\") == 0) {\n      if (!keyword(&l, \"id\") || next(&l) != EQUAL || next(&l) != NUMBER)\n        return false;\n      s.filtered = true;\n      s.key = l.number;\n      t = next(&l);\n    }\n    if (t != SEMI || next(&l) != END)\n      return false;\n  } else\n    return false;\n  *out = s;\n  return true;\n}\nbool validate(const Statement *s) {\n  return s->kind != INSERT_STMT || (s->row.id > 0 && s->row.name[0] != 0);\n}\n\nint main(void) {\n  Statement s = {0};\n  if (!parse(\"SELECT * FROM people WHERE id = 7;\", &s))\n    return 1;\n  printf(\"select=%d filtered=%d id=%u\\n\", s.kind == SELECT_STMT, s.filtered,\n         (unsigned)s.key);\n  return 0;\n}\n",
        "expected": "select=1 filtered=1 id=7",
        "walkthrough": "The filtered flag distinguishes an explicit key predicate from an unfiltered scan; zero-initialized spare fields are not used as a substitute for that flag.",
        "pitfall": "Keeping l.text pointers in the statement would make earlier tokens change when the lexer reads the next token.",
        "question": "Why copy the string into the statement?",
        "choices": [
          "String literals always need malloc",
          "The lexer’s token buffer is reused"
        ],
        "answer": 1,
        "why": "The statement needs stable data after subsequent token reads.",
        "tryit": "Add an UPDATE production and a distinct statement variant without changing SELECT field meanings.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "Syntax errors and invalid values are different failures. Report them before mutating the table.",
        "explanation": "A row ID of zero is syntactically a number but violates the schema. A missing closing parenthesis is a syntax error and should not reach validation. The example’s Boolean stages keep the distinction explicit; a user-facing parser can additionally retain the failing source offset and expected token to produce a precise diagnostic.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\ntypedef enum {\n  END,\n  WORD,\n  NUMBER,\n  STRING,\n  SEMI,\n  LP,\n  RP,\n  COMMA,\n  STAR,\n  EQUAL,\n  BAD\n} Token;\ntypedef struct {\n  const char *p;\n  char text[32];\n  uint32_t number;\n} Lexer;\nToken next(Lexer *l) {\n  while (*l->p == ' ' || *l->p == '\\t' || *l->p == '\\n' || *l->p == '\\r')\n    ++l->p;\n  unsigned char ch = (unsigned char)*l->p;\n  l->text[0] = 0;\n  if (!ch)\n    return END;\n  if (ch >= '0' && ch <= '9') {\n    uint32_t n = 0;\n    do {\n      unsigned digit = (unsigned)(*l->p - '0');\n      if (n > (UINT32_MAX - digit) / 10)\n        return BAD;\n      n = n * 10 + digit;\n      ++l->p;\n    } while (*l->p >= '0' && *l->p <= '9');\n    l->number = n;\n    return NUMBER;\n  }\n  if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == '_') {\n    size_t n = 0;\n    while ((*l->p >= 'A' && *l->p <= 'Z') || (*l->p >= 'a' && *l->p <= 'z') ||\n           (*l->p >= '0' && *l->p <= '9') || *l->p == '_') {\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p++;\n    }\n    l->text[n] = 0;\n    return WORD;\n  }\n  ++l->p;\n  if (ch == '\\'') {\n    size_t n = 0;\n    for (;;) {\n      if (!*l->p)\n        return BAD;\n      if (*l->p == '\\'' && l->p[1] != '\\'') {\n        ++l->p;\n        l->text[n] = 0;\n        return STRING;\n      }\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p;\n      if (*l->p == '\\'')\n        ++l->p;\n      ++l->p;\n    }\n  }\n  switch (ch) {\n  case ';':\n    return SEMI;\n  case '(':\n    return LP;\n  case ')':\n    return RP;\n  case ',':\n    return COMMA;\n  case '*':\n    return STAR;\n  case '=':\n    return EQUAL;\n  default:\n    return BAD;\n  }\n}\nbool keyword(Lexer *l, const char *word) {\n  return next(l) == WORD && strcmp(l->text, word) == 0;\n}\ntypedef enum { INSERT_STMT, SELECT_STMT } Kind;\ntypedef struct {\n  Kind kind;\n  Row row;\n  bool filtered;\n  uint32_t key;\n} Statement;\nbool parse(const char *sql, Statement *out) {\n  Lexer l = {sql, {0}, 0};\n  Statement s = {0};\n  if (next(&l) != WORD)\n    return false;\n  if (strcmp(l.text, \"INSERT\") == 0) {\n    s.kind = INSERT_STMT;\n    if (!keyword(&l, \"INTO\") || !keyword(&l, \"people\") ||\n        !keyword(&l, \"VALUES\") || next(&l) != LP || next(&l) != NUMBER)\n      return false;\n    s.row.id = l.number;\n    if (next(&l) != COMMA || next(&l) != STRING)\n      return false;\n    memcpy(s.row.name, l.text, sizeof s.row.name);\n    if (next(&l) != COMMA || next(&l) != NUMBER)\n      return false;\n    s.row.score = l.number;\n    if (next(&l) != RP || next(&l) != SEMI || next(&l) != END)\n      return false;\n  } else if (strcmp(l.text, \"SELECT\") == 0) {\n    s.kind = SELECT_STMT;\n    if (next(&l) != STAR || !keyword(&l, \"FROM\") || !keyword(&l, \"people\"))\n      return false;\n    Token t = next(&l);\n    if (t == WORD && strcmp(l.text, \"WHERE\") == 0) {\n      if (!keyword(&l, \"id\") || next(&l) != EQUAL || next(&l) != NUMBER)\n        return false;\n      s.filtered = true;\n      s.key = l.number;\n      t = next(&l);\n    }\n    if (t != SEMI || next(&l) != END)\n      return false;\n  } else\n    return false;\n  *out = s;\n  return true;\n}\nbool validate(const Statement *s) {\n  return s->kind != INSERT_STMT || (s->row.id > 0 && s->row.name[0] != 0);\n}\n\nint main(void) {\n  Statement s = {0};\n  bool syntax = parse(\"INSERT INTO people VALUES (0, 'Ada', 90);\", &s);\n  printf(\"parsed=%d value_rejected=%d\\n\", syntax, syntax && !validate(&s));\n  printf(\"syntax_rejected=%d\\n\",\n         !parse(\"INSERT INTO people VALUES (1, 'Ada', 90;\", &s));\n  return 0;\n}\n",
        "expected": "parsed=1 value_rejected=1\nsyntax_rejected=1",
        "walkthrough": "The zero-ID statement reaches validation and is rejected there. The missing-parenthesis statement never produces a valid new statement.",
        "pitfall": "Do not partially insert a row while still parsing later fields; a later syntax failure must leave the table unchanged.",
        "question": "Where should zero-ID rejection occur?",
        "choices": [
          "Schema validation",
          "Character tokenization"
        ],
        "answer": 0,
        "why": "Zero is a valid numeric token but an invalid key under this schema.",
        "tryit": "Return a structured error with stage, source offset, and expected token, then test that rejection preserves table state.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practicePlan": {
      "goal": "Parse a small SQL subset and explain malformed statements.",
      "tasks": [
        "Recognize a deliberately small SQL grammar and keep syntax, schema validation, and execution separate.",
        "Return a structured error with stage, source offset, and expected token, then test that rejection preserves table state.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "parsing-5"
    }
  },
  "execution": {
    "intro": "Execute typed, validated statements and build query operators with explicit input and output contracts.",
    "outcomes": [
      "Scan and filter only initialized rows.",
      "Separate projection and ordering from storage mutation.",
      "Evaluate aggregates with defined empty-input behavior."
    ],
    "topics": {
      "1": {
        "intro": "A scan supplies every initialized row to the next operator. Keep its bounds independent of unused capacity.",
        "explanation": "A scan’s basic invariant is that every emitted row came from a valid index below count and no earlier index is emitted again. It is Θ(n) in table size and requires O(1) cursor state. The initial table’s insertion-order behavior is explicit; SQL without ORDER BY should not generally promise a stable presentation order.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\n\nint main(void) {\n  Table t = {0};\n  insert_row(&t, (Row){1, \"Ada\", 90});\n  insert_row(&t, (Row){2, \"Grace\", 80});\n  insert_row(&t, (Row){3, \"Ken\", 90});\n  display(&t);\n  return 0;\n}\n",
        "expected": "1 | Ada | 90\n2 | Grace | 80\n3 | Ken | 90",
        "walkthrough": "All three initialized rows are emitted once. The remaining five capacity slots are not rows.",
        "pitfall": "Using capacity instead of count exposes storage that does not belong to the logical table.",
        "question": "What bounds the scan?",
        "choices": [
          "The initialized row count",
          "The maximum table capacity"
        ],
        "answer": 0,
        "why": "Unused capacity is reserved storage, not query input.",
        "tryit": "Implement a cursor with next and exhausted results, including an empty table.",
        "input": "",
        "runtime": "browser"
      },
      "2": {
        "intro": "Filtering retains rows whose predicate evaluates true. A rejected row still contributes to scan work.",
        "explanation": "The fixture selects scores at least ninety. Two rows pass, but all three are examined. A later index may reduce candidates; it must preserve the same predicate result. This simple numeric predicate has no SQL NULL semantics, coercion rules, or three-valued logic, and the schema deliberately omits nullable fields.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\n\nint main(void) {\n  Table t = {0};\n  insert_row(&t, (Row){1, \"Ada\", 90});\n  insert_row(&t, (Row){2, \"Grace\", 80});\n  insert_row(&t, (Row){3, \"Ken\", 90});\n  size_t examined = 0, matched = 0;\n  for (size_t i = 0; i < t.count; ++i) {\n    ++examined;\n    if (t.rows[i].score >= 90) {\n      ++matched;\n      printf(\"%s\\n\", t.rows[i].name);\n    }\n  }\n  printf(\"examined=%zu matched=%zu\\n\", examined, matched);\n  return 0;\n}\n",
        "expected": "Ada\nKen\nexamined=3 matched=2",
        "walkthrough": "Filtering changes output size without making this full scan sublinear. The counters distinguish those two quantities.",
        "pitfall": "Reporting only matching-row count as query work hides rejected-row comparisons.",
        "question": "Does returning two rows mean only two were examined?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "This operator must inspect the predicate for every scanned row.",
        "tryit": "Add equality and range predicates and compare result sets with a simple reference loop.",
        "input": "",
        "runtime": "browser"
      },
      "3": {
        "intro": "Projection selects fields for output. It need not mutate stored records or copy every field.",
        "explanation": "The output operator prints ID and name while leaving score in storage. A typed projection representation can choose fields explicitly, rather than interpreting column strings repeatedly during row iteration. SELECT of duplicate column combinations still preserves duplicate rows unless a DISTINCT capability is deliberately added.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\n\nint main(void) {\n  Table t = {0};\n  insert_row(&t, (Row){1, \"Ada\", 90});\n  insert_row(&t, (Row){2, \"Grace\", 80});\n  insert_row(&t, (Row){3, \"Ken\", 90});\n  for (size_t i = 0; i < t.count; ++i)\n    printf(\"%u | %s\\n\", (unsigned)t.rows[i].id, t.rows[i].name);\n  return 0;\n}\n",
        "expected": "1 | Ada\n2 | Grace\n3 | Ken",
        "walkthrough": "The score values remain stored but are not part of the output shape. Projection and filtering answer different questions.",
        "pitfall": "Do not erase unselected fields from the table while formatting a query result.",
        "question": "Does projection delete stored columns?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "It controls the result representation, not the underlying row schema.",
        "tryit": "Represent the selected columns as an enum array and reject unknown or repeated columns according to a stated policy.",
        "input": "",
        "runtime": "browser"
      },
      "4": {
        "intro": "Ordering before limiting is different from limiting before ordering. Specify a deterministic tie-break where reproducible output is required.",
        "explanation": "Copy the initialized rows into a result buffer, sort by score then ID, and return the first two. The table itself retains its storage order. This full-sort approach needs O(n) result storage; more advanced top-k or index-order plans can reduce work under additional assumptions. The C qsort interface does not guarantee stability.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nint by_score(const void *pa, const void *pb) {\n  const Row *a = pa, *b = pb;\n  if (a->score != b->score)\n    return (a->score > b->score) - (a->score < b->score);\n  return (a->id > b->id) - (a->id < b->id);\n}\n\nint main(void) {\n  Table t = {0};\n  insert_row(&t, (Row){1, \"Ada\", 90});\n  insert_row(&t, (Row){2, \"Grace\", 80});\n  insert_row(&t, (Row){3, \"Ken\", 90});\n  Row result[TABLE_CAP];\n  memcpy(result, t.rows, t.count * sizeof result[0]);\n  qsort(result, t.count, sizeof result[0], by_score);\n  for (size_t i = 0; i < 2 && i < t.count; ++i)\n    printf(\"%s %u\\n\", result[i].name, (unsigned)result[i].score);\n  return 0;\n}\n",
        "expected": "Grace 80\nAda 90",
        "walkthrough": "Grace sorts before both ninety-score rows. The ID tie-break puts Ada before Ken. Taking the first two original rows first would be a different query.",
        "pitfall": "A limit does not generally permit stopping before sorting unless the input already satisfies the requested order or a correct top-k method is used.",
        "question": "Which happens first for ORDER BY score LIMIT 2?",
        "choices": [
          "Choose any two rows, then sort them",
          "Establish score order, then choose two rows"
        ],
        "answer": 1,
        "why": "The limit applies to the ordered result.",
        "tryit": "Implement top-k with a heap and compare it against this full-sort baseline.",
        "input": "",
        "runtime": "browser"
      },
      "5": {
        "intro": "Aggregation summarizes a set of rows. Define empty-set behavior and arithmetic representation before implementing it.",
        "explanation": "COUNT is zero on an empty input. This example uses a 64-bit sum for a table with at most eight unsigned 32-bit scores, so the sum is representable. An average is computed only when count is nonzero; a general SQL engine might return NULL for empty AVG and SUM. Our explicit empty policy is not an accidental divide-by-zero workaround.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\n\nint main(void) {\n  Table t = {0};\n  insert_row(&t, (Row){1, \"Ada\", 90});\n  insert_row(&t, (Row){2, \"Grace\", 80});\n  insert_row(&t, (Row){3, \"Ken\", 90});\n  uint64_t sum = 0;\n  for (size_t i = 0; i < t.count; ++i)\n    sum += t.rows[i].score;\n  printf(\"count=%zu sum=%llu average=%.2f\\n\", t.count, (unsigned long long)sum,\n         t.count ? (double)sum / t.count : 0.0);\n  return 0;\n}\n",
        "expected": "count=3 sum=260 average=86.67",
        "walkthrough": "The average is 260 divided by three, formatted to two decimal places. The widening occurs in the accumulator rather than after an overflowing narrow sum.",
        "pitfall": "Widening a result after arithmetic does not repair an overflow that already occurred in the original type.",
        "question": "When is division for average permitted?",
        "choices": [
          "When the input count is nonzero",
          "For every possible table state"
        ],
        "answer": 0,
        "why": "Empty input requires a separate result policy.",
        "tryit": "Add min and max with explicit no-value results for empty input and test maximum score values.",
        "input": "",
        "runtime": "browser"
      },
      "6": {
        "intro": "A clean query path parses syntax, validates meaning, and only then executes. This makes failure preservation testable.",
        "explanation": "The parser returns a typed temporary statement. Validation enforces schema constraints before execute can mutate the table. SELECT uses a scan or filtered scan, while INSERT delegates uniqueness and capacity to the table API. The fixture exercises the complete implemented SQL subset; ordering and aggregation examples are operators to extend into its grammar, not syntax already accepted by this parser.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\ntypedef enum {\n  END,\n  WORD,\n  NUMBER,\n  STRING,\n  SEMI,\n  LP,\n  RP,\n  COMMA,\n  STAR,\n  EQUAL,\n  BAD\n} Token;\ntypedef struct {\n  const char *p;\n  char text[32];\n  uint32_t number;\n} Lexer;\nToken next(Lexer *l) {\n  while (*l->p == ' ' || *l->p == '\\t' || *l->p == '\\n' || *l->p == '\\r')\n    ++l->p;\n  unsigned char ch = (unsigned char)*l->p;\n  l->text[0] = 0;\n  if (!ch)\n    return END;\n  if (ch >= '0' && ch <= '9') {\n    uint32_t n = 0;\n    do {\n      unsigned digit = (unsigned)(*l->p - '0');\n      if (n > (UINT32_MAX - digit) / 10)\n        return BAD;\n      n = n * 10 + digit;\n      ++l->p;\n    } while (*l->p >= '0' && *l->p <= '9');\n    l->number = n;\n    return NUMBER;\n  }\n  if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == '_') {\n    size_t n = 0;\n    while ((*l->p >= 'A' && *l->p <= 'Z') || (*l->p >= 'a' && *l->p <= 'z') ||\n           (*l->p >= '0' && *l->p <= '9') || *l->p == '_') {\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p++;\n    }\n    l->text[n] = 0;\n    return WORD;\n  }\n  ++l->p;\n  if (ch == '\\'') {\n    size_t n = 0;\n    for (;;) {\n      if (!*l->p)\n        return BAD;\n      if (*l->p == '\\'' && l->p[1] != '\\'') {\n        ++l->p;\n        l->text[n] = 0;\n        return STRING;\n      }\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p;\n      if (*l->p == '\\'')\n        ++l->p;\n      ++l->p;\n    }\n  }\n  switch (ch) {\n  case ';':\n    return SEMI;\n  case '(':\n    return LP;\n  case ')':\n    return RP;\n  case ',':\n    return COMMA;\n  case '*':\n    return STAR;\n  case '=':\n    return EQUAL;\n  default:\n    return BAD;\n  }\n}\nbool keyword(Lexer *l, const char *word) {\n  return next(l) == WORD && strcmp(l->text, word) == 0;\n}\ntypedef enum { INSERT_STMT, SELECT_STMT } Kind;\ntypedef struct {\n  Kind kind;\n  Row row;\n  bool filtered;\n  uint32_t key;\n} Statement;\nbool parse(const char *sql, Statement *out) {\n  Lexer l = {sql, {0}, 0};\n  Statement s = {0};\n  if (next(&l) != WORD)\n    return false;\n  if (strcmp(l.text, \"INSERT\") == 0) {\n    s.kind = INSERT_STMT;\n    if (!keyword(&l, \"INTO\") || !keyword(&l, \"people\") ||\n        !keyword(&l, \"VALUES\") || next(&l) != LP || next(&l) != NUMBER)\n      return false;\n    s.row.id = l.number;\n    if (next(&l) != COMMA || next(&l) != STRING)\n      return false;\n    memcpy(s.row.name, l.text, sizeof s.row.name);\n    if (next(&l) != COMMA || next(&l) != NUMBER)\n      return false;\n    s.row.score = l.number;\n    if (next(&l) != RP || next(&l) != SEMI || next(&l) != END)\n      return false;\n  } else if (strcmp(l.text, \"SELECT\") == 0) {\n    s.kind = SELECT_STMT;\n    if (next(&l) != STAR || !keyword(&l, \"FROM\") || !keyword(&l, \"people\"))\n      return false;\n    Token t = next(&l);\n    if (t == WORD && strcmp(l.text, \"WHERE\") == 0) {\n      if (!keyword(&l, \"id\") || next(&l) != EQUAL || next(&l) != NUMBER)\n        return false;\n      s.filtered = true;\n      s.key = l.number;\n      t = next(&l);\n    }\n    if (t != SEMI || next(&l) != END)\n      return false;\n  } else\n    return false;\n  *out = s;\n  return true;\n}\nbool validate(const Statement *s) {\n  return s->kind != INSERT_STMT || (s->row.id > 0 && s->row.name[0] != 0);\n}\nbool execute(Table *t, const Statement *s) {\n  if (!validate(s))\n    return false;\n  if (s->kind == INSERT_STMT)\n    return insert_row(t, s->row) == OK;\n  for (size_t i = 0; i < t->count; ++i)\n    if (!s->filtered || t->rows[i].id == s->key)\n      printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n             (unsigned)t->rows[i].score);\n  return true;\n}\n\nint main(void) {\n  Table t = {0};\n  const char *sql[] = {\"INSERT INTO people VALUES (1, 'Ada', 90);\",\n                       \"SELECT * FROM people WHERE id = 1;\"};\n  for (size_t i = 0; i < 2; ++i) {\n    Statement s = {0};\n    if (!parse(sql[i], &s) || !validate(&s) || !execute(&t, &s))\n      return 1;\n  }\n  printf(\"rows=%zu\\n\", t.count);\n  return 0;\n}\n",
        "expected": "1 | Ada | 90\nrows=1",
        "walkthrough": "The first statement inserts and the second retrieves by logical key. Every stage can be tested independently as well as through this end-to-end path.",
        "pitfall": "Do not describe ORDER BY or SUM as accepted SQL until their grammar, validation, and executor paths are implemented together.",
        "question": "Which stage is allowed to mutate the table?",
        "choices": [
          "Tokenization as soon as INSERT is seen",
          "Execution after successful parsing and validation"
        ],
        "answer": 1,
        "why": "Malformed or invalid statements must leave stored state untouched.",
        "tryit": "Extend the grammar with one earlier operator, add end-to-end tests, and preserve all existing rejection behavior.",
        "input": "",
        "runtime": "browser"
      }
    },
    "practicePlan": {
      "goal": "Execute validated statements over an in-memory table.",
      "tasks": [
        "Execute typed, validated statements and build query operators with explicit input and output contracts.",
        "Extend the grammar with one earlier operator, add end-to-end tests, and preserve all existing rejection behavior.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "execution-6"
    }
  },
  "persistence": {
    "intro": "Define bytes independently of structs, check every stream operation, and load untrusted files into a temporary validated table.",
    "outcomes": [
      "Document a versioned little-endian record format.",
      "Read and write bounded fixed-size pages.",
      "Reject truncated, corrupt, duplicate-key, and trailing input without replacing live state."
    ],
    "topics": {
      "1": {
        "intro": "A file header identifies a format and states how to interpret the remaining bytes. Unknown versions should fail clearly.",
        "explanation": "The teaching format begins with ASCII TDB1, version byte one, record-size byte forty, a one-byte row count, and a reserved zero byte. It requires eight-bit bytes and exact-width uint32_t. The count is capped by the bounded table; a larger format would use wider lengths and checked offset calculations. Header bytes are a protocol, not the memory layout of a C header struct.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n_Static_assert(CHAR_BIT == 8, \"eight-bit format required\");\n\nint main(void) {\n  unsigned char header[8] = {0x54, 0x44, 0x42, 0x31, 1, 40, 2, 0};\n  printf(\"version=%u record_bytes=%u rows=%u reserved=%u\\n\", (unsigned)header[4],\n         (unsigned)header[5], (unsigned)header[6], (unsigned)header[7]);\n  return 0;\n}\n",
        "expected": "version=1 record_bytes=40 rows=2 reserved=0",
        "walkthrough": "Every offset has a documented meaning. A loader must validate all these fields before using the row count to read records.",
        "pitfall": "An application must not treat an unknown version as if it were the current format.",
        "question": "What should an unsupported version cause?",
        "choices": [
          "Explicit rejection or a defined migration path",
          "An unchecked raw-struct read"
        ],
        "answer": 0,
        "why": "Different layouts need deliberate compatibility handling.",
        "tryit": "Write a byte-offset format table and test bad magic, version, record width, and reserved bytes.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "Serialization must encode field widths and byte order explicitly. Raw struct dumps expose padding and native representation assumptions.",
        "explanation": "A record contains four little-endian ID bytes, 32 name bytes with a required terminator and a nonempty name, and four little-endian score bytes. The encoder clears spare name bytes for reproducible output. The decoder checks length and validity before assigning the output row. Numeric ranges and name ownership stay consistent with the in-memory schema.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\n\nint main(void) {\n  Row row = {513, \"Ada\", 90}, copy = {0};\n  unsigned char bytes[ROW_BYTES];\n  if (!encode_row(bytes, &row) || !decode_row(bytes, sizeof bytes, &copy))\n    return 1;\n  printf(\"id_bytes=%u,%u,%u,%u row=%u:%s:%u\\n\", (unsigned)bytes[0], (unsigned)bytes[1], (unsigned)bytes[2],\n         (unsigned)bytes[3], (unsigned)copy.id, copy.name, (unsigned)copy.score);\n  return 0;\n}\n",
        "expected": "id_bytes=1,2,0,0 row=513:Ada:90",
        "walkthrough": "The ID 513 is 1+2·256, so its first two bytes are one and two. The name is copied into owned embedded storage.",
        "pitfall": "A round trip alone can hide matching encoder/decoder bugs; also compare independently specified bytes.",
        "question": "Does this format depend on sizeof(Row)?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "Its forty bytes are specified by offsets, independent of struct padding.",
        "tryit": "Add fixture-byte tests for zero, maximum score, maximum ID, and a 31-byte name.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "Fixed-size pages give storage a simple addressing unit. A page number maps to an offset only after range and multiplication checks.",
        "explanation": "The pager uses 128-byte pages and permits writing an existing page or appending exactly the next page. Reads reject IDs outside the known count. fseek positions the update stream before switching between reads and writes. These checks establish logical addressing; successful buffered I/O alone does not promise crash durability.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\ntypedef struct {\n  FILE *file;\n  size_t pages;\n} Pager;\nbool write_page(Pager *p, size_t id, const unsigned char *bytes) {\n  if (id > p->pages || id > (size_t)LONG_MAX / PAGE_BYTES)\n    return false;\n  if (fseek(p->file, (long)(id * PAGE_BYTES), SEEK_SET) != 0 ||\n      fwrite(bytes, 1, PAGE_BYTES, p->file) != PAGE_BYTES)\n    return false;\n  if (id == p->pages)\n    ++p->pages;\n  return true;\n}\nbool read_page(Pager *p, size_t id, unsigned char *out) {\n  if (id >= p->pages || id > (size_t)LONG_MAX / PAGE_BYTES)\n    return false;\n  return fseek(p->file, (long)(id * PAGE_BYTES), SEEK_SET) == 0 &&\n         fread(out, 1, PAGE_BYTES, p->file) == PAGE_BYTES;\n}\n\nint main(void) {\n  FILE *f = tmpfile();\n  if (!f)\n    return 1;\n  Pager p = {f, 0};\n  unsigned char page[PAGE_BYTES] = {0}, copy[PAGE_BYTES];\n  page[7] = 42;\n  bool ok = write_page(&p, 0, page) && read_page(&p, 0, copy);\n  if (!ok) {\n    fclose(f);\n    return 1;\n  }\n  printf(\"pages=%zu byte7=%u missing=%d\\n\", p.pages, copy[7],\n         !read_page(&p, 1, copy));\n  if (fclose(f) != 0)\n    return 1;\n  return 0;\n}\n",
        "expected": "pages=1 byte7=42 missing=1",
        "walkthrough": "The first write establishes page zero. Reading page one fails before accessing a nonexistent page.",
        "pitfall": "An unchecked page_id×page_size can overflow before fseek receives the offset.",
        "question": "Which page may be appended?",
        "choices": [
          "Exactly the current page count",
          "Any arbitrary unbounded page ID"
        ],
        "answer": 0,
        "why": "This pager rejects gaps and tracks contiguous initialized pages.",
        "tryit": "Write two pages with distinct markers, close and reopen a named file, and verify offsets from its checked length.",
        "input": "",
        "runtime": "native"
      },
      "4": {
        "intro": "A pager centralizes page addressing and I/O errors so higher layers do not duplicate those checks. Its lifecycle includes stream ownership.",
        "explanation": "The Pager borrows an already opened FILE; its caller is responsible for closing it. write_page may fail and higher layers must stop rather than treating the page as committed. This minimal layer tracks initialized page count but has no cache, dirty flags, transaction log, or durable commit protocol. Later chapters add those capabilities behind explicit contracts.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\ntypedef struct {\n  FILE *file;\n  size_t pages;\n} Pager;\nbool write_page(Pager *p, size_t id, const unsigned char *bytes) {\n  if (id > p->pages || id > (size_t)LONG_MAX / PAGE_BYTES)\n    return false;\n  if (fseek(p->file, (long)(id * PAGE_BYTES), SEEK_SET) != 0 ||\n      fwrite(bytes, 1, PAGE_BYTES, p->file) != PAGE_BYTES)\n    return false;\n  if (id == p->pages)\n    ++p->pages;\n  return true;\n}\nbool read_page(Pager *p, size_t id, unsigned char *out) {\n  if (id >= p->pages || id > (size_t)LONG_MAX / PAGE_BYTES)\n    return false;\n  return fseek(p->file, (long)(id * PAGE_BYTES), SEEK_SET) == 0 &&\n         fread(out, 1, PAGE_BYTES, p->file) == PAGE_BYTES;\n}\n\nint main(void) {\n  FILE *f = tmpfile();\n  if (!f)\n    return 1;\n  Pager p = {f, 0};\n  unsigned char page[PAGE_BYTES] = {0}, copy[PAGE_BYTES];\n  bool gap = write_page(&p, 2, page);\n  page[0] = 9;\n  bool ok = write_page(&p, 0, page) && read_page(&p, 0, copy);\n  printf(\"gap_rejected=%d valid=%d marker=%u\\n\", !gap, ok, ok ? copy[0] : 0);\n  if (fclose(f) != 0 || !ok)\n    return 1;\n  return 0;\n}\n",
        "expected": "gap_rejected=1 valid=1 marker=9",
        "walkthrough": "The rejected gap write leaves the page count zero, allowing the valid page-zero append afterward.",
        "pitfall": "A boolean page write is not a transaction commit; naming it commit would imply guarantees it lacks.",
        "question": "Who closes the stream in this pager API?",
        "choices": [
          "Every read_page call",
          "The caller that owns it"
        ],
        "answer": 1,
        "why": "The pager borrows the FILE rather than taking ownership.",
        "tryit": "Add open/close functions with explicit ownership and tests for partial-page files and I/O failures.",
        "input": "",
        "runtime": "native"
      },
      "5": {
        "intro": "A browser compiler’s virtual files are temporary unless explicitly transferred to persistent browser storage or exported to the user.",
        "explanation": "This native transfer tool writes people.tdb and loads it back through the validated decoder. Use KEEP_FILES=1 with the repository runner to retain the named artifact under .build/files/persistence-5, then download it through the Codespaces file explorer. The browser page also supplies a matching sample file. Browser drafts and localStorage lesson marks are not database-file persistence, and a saved browser blob does not imply transaction durability.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\n\nint main(int argc, char **argv) {\n  Table source = {0}, copy = {0};\n  insert_row(&source, (Row){1, \"Ada\", 90});\n  insert_row(&source, (Row){2, \"Grace\", 80});\n  if (argc == 3 && strcmp(argv[1], \"import\") == 0) {\n    FILE *in = fopen(argv[2], \"rb\");\n    if (!in)\n      return 1;\n    bool ok = load(in, &copy);\n    if (fclose(in) != 0 || !ok)\n      return 1;\n    display(&copy);\n    return 0;\n  }\n  if (argc != 1)\n    return 1;\n  FILE *out = fopen(\"people.tdb\", \"wb\");\n  if (!out)\n    return 1;\n  bool written = save(out, &source);\n  if (fclose(out) != 0 || !written)\n    return 1;\n  FILE *in = fopen(\"people.tdb\", \"rb\");\n  if (!in)\n    return 1;\n  bool read = load(in, &copy);\n  if (fclose(in) != 0 || !read)\n    return 1;\n  printf(\"exported=1 imported=1 rows=%zu\\n\", copy.count);\n  return 0;\n}\n",
        "expected": "exported=1 imported=1 rows=2",
        "walkthrough": "The default run exports and reimports two rows. The optional import argument loads an external file and prints its validated contents; no raw struct casts are used.",
        "pitfall": "Do not claim that the page’s current Wasm runner automatically persists its filesystem across executions.",
        "question": "Does compiling in a browser automatically persist program files?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "The runtime resets its virtual filesystem; a host transfer/storage step is separate.",
        "tryit": "Retain and download people.tdb. Compile this source in Codespaces, then run the executable with import and the downloaded file path.",
        "input": "",
        "runtime": "native",
        "command": "make example EXAMPLE=persistence-5 KEEP_FILES=1",
        "artifact": {
          "href": "assets/tinydb-sample.tdb",
          "label": "Download the two-row TinyDB sample"
        }
      },
      "6": {
        "intro": "Untrusted files must be validated completely before replacing a live table. Truncated input is a normal error case, not an invitation to read partial objects.",
        "explanation": "load constructs a temporary table, validates the header, reads exact record lengths, checks decoded rows and duplicate IDs, and rejects trailing bytes. Only after reaching a clean end does it assign the output table. This fixed-size approach bounds memory use. A production format should also document checksums, limits, and evolution rules; checksums detect accidental corruption, not malicious authenticity.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\n\nint main(void) {\n  FILE *f = tmpfile();\n  if (!f)\n    return 1;\n  unsigned char bad[] = {0x54, 0x44, 0x42, 0x31, 1, 40, 1, 0, 7};\n  if (fwrite(bad, 1, sizeof bad, f) != sizeof bad ||\n      fseek(f, 0, SEEK_SET) != 0) {\n    fclose(f);\n    return 1;\n  }\n  Table live = {0};\n  insert_row(&live, (Row){9, \"Keep\", 1});\n  bool loaded = load(f, &live);\n  printf(\"rejected=%d retained=%s count=%zu\\n\", !loaded, live.rows[0].name,\n         live.count);\n  if (fclose(f) != 0)\n    return 1;\n  return 0;\n}\n",
        "expected": "rejected=1 retained=Keep count=1",
        "walkthrough": "The header declares one forty-byte row but provides only one byte. Loading fails and the previously live Keep row remains unchanged.",
        "pitfall": "Assigning decoded rows directly into the live table before validating the entire file makes rejection destructive.",
        "question": "When is live state replaced?",
        "choices": [
          "Immediately after reading the magic bytes",
          "Only after complete validation succeeds"
        ],
        "answer": 1,
        "why": "Later records or trailing input may still invalidate the file.",
        "tryit": "Test every truncation offset, a duplicate ID, an unterminated name field, and one extra trailing byte.",
        "input": "",
        "runtime": "native"
      }
    },
    "practicePlan": {
      "goal": "Persist rows through a pager and reject corrupt database input.",
      "tasks": [
        "Define bytes independently of structs, check every stream operation, and load untrusted files into a temporary validated table.",
        "Test every truncation offset, a duplicate ID, an unterminated name field, and one extra trailing byte.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "persistence-6"
    }
  }
};
