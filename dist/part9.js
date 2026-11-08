window.PART_NINE = {
  "multi-client": {
    "intro": "Define request admission, transaction ownership, and overload behavior before accepting multiple callers.",
    "outcomes": [
      "Separate scheduling from execution and durable acknowledgement.",
      "Bind transaction state to a session.",
      "Bound pending requests and define backpressure."
    ],
    "topics": {
      "1": {
        "intro": "Multiple clients need a request order that storage can enforce and responses can identify. Arrival time is not necessarily admission order.",
        "explanation": "The bounded queue gives one consumer a serialized stream of copied requests. The fixture verifies all eight accepted requests reach the owner. A real protocol should attach request and session IDs and correlate responses; FIFO order is the order of successful queue admission, not a claim about wall-clock arrival across independent clients.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\nenum { WORK_CAP = 4, WORK_ITEMS = 8 };\ntypedef struct {\n  int data[WORK_CAP];\n  size_t head, count;\n  bool closed;\n  pthread_mutex_t lock;\n  pthread_cond_t ready, space;\n} WorkQueue;\nbool offer_work(WorkQueue *q, int value) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  while (q->count == WORK_CAP && !q->closed)\n    CHECK(pthread_cond_wait(&q->space, &q->lock));\n  if (q->closed) {\n    CHECK(pthread_mutex_unlock(&q->lock));\n    return false;\n  }\n  q->data[(q->head + q->count) % WORK_CAP] = value;\n  ++q->count;\n  CHECK(pthread_cond_signal(&q->ready));\n  CHECK(pthread_mutex_unlock(&q->lock));\n  return true;\n}\nbool take_work(WorkQueue *q, int *out) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  while (!q->count && !q->closed)\n    CHECK(pthread_cond_wait(&q->ready, &q->lock));\n  if (!q->count) {\n    CHECK(pthread_mutex_unlock(&q->lock));\n    return false;\n  }\n  *out = q->data[q->head];\n  q->head = (q->head + 1) % WORK_CAP;\n  --q->count;\n  CHECK(pthread_cond_signal(&q->space));\n  CHECK(pthread_mutex_unlock(&q->lock));\n  return true;\n}\nvoid close_work(WorkQueue *q) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  q->closed = true;\n  CHECK(pthread_cond_broadcast(&q->ready));\n  CHECK(pthread_cond_broadcast(&q->space));\n  CHECK(pthread_mutex_unlock(&q->lock));\n}\ntypedef struct {\n  WorkQueue *queue;\n  unsigned received;\n  long sum;\n} Work;\nvoid *produce(void *arg) {\n  Work *w = arg;\n  for (int i = 1; i <= WORK_ITEMS; ++i)\n    if (!offer_work(w->queue, i))\n      return NULL;\n  close_work(w->queue);\n  return NULL;\n}\nvoid *consume(void *arg) {\n  Work *w = arg;\n  int value;\n  while (take_work(w->queue, &value)) {\n    ++w->received;\n    w->sum += value;\n  }\n  return NULL;\n}\nvoid run_queue(unsigned *count, long *sum) {\n  WorkQueue q = {.lock = PTHREAD_MUTEX_INITIALIZER,\n                 .ready = PTHREAD_COND_INITIALIZER,\n                 .space = PTHREAD_COND_INITIALIZER};\n  Work work = {&q, 0, 0};\n  pthread_t producer, consumer;\n  CHECK(pthread_create(&consumer, NULL, consume, &work));\n  CHECK(pthread_create(&producer, NULL, produce, &work));\n  CHECK(pthread_join(producer, NULL));\n  CHECK(pthread_join(consumer, NULL));\n  *count = work.received;\n  *sum = work.sum;\n  CHECK(pthread_cond_destroy(&q.ready));\n  CHECK(pthread_cond_destroy(&q.space));\n  CHECK(pthread_mutex_destroy(&q.lock));\n}\n\nint main(void) {\n  unsigned count;\n  long total;\n  run_queue(&count, &total);\n  printf(\"scheduled=%u owner_total=%ld\\n\", count, total);\n  return 0;\n}\n",
        "expected": "scheduled=8 owner_total=36",
        "walkthrough": "The single consumer owns mutation of the aggregate. The example models scheduling in one process and does not open network sockets.",
        "pitfall": "A response without a request identity can be misattributed when clients have several operations in flight.",
        "question": "Which order does this queue establish?",
        "choices": [
          "Successful admission order",
          "A universal order of network arrival times"
        ],
        "answer": 0,
        "why": "The queue’s protected enqueue operation provides the ordering point.",
        "tryit": "Add session/request IDs, copy-out responses, and tests that every response matches one accepted request.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      },
      "2": {
        "intro": "A transaction boundary must belong to a session, not merely to whichever request arrives next. Other clients cannot commit or mutate another client’s working state.",
        "explanation": "The serialized-owner model tracks the active session ID. SET and COMMIT reject a different session without changing the active transaction. This fixture contains one value and an in-memory commit; integrating durable logging must retain the same ownership checks before acknowledgement. Define timeouts, disconnect rollback, and admission fairness separately.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  unsigned owner;\n  bool active;\n  int committed, working;\n} SessionDB;\nbool tx_begin(SessionDB *db, unsigned session) {\n  if (!session || db->active)\n    return false;\n  db->owner = session;\n  db->working = db->committed;\n  db->active = true;\n  return true;\n}\nbool tx_set(SessionDB *db, unsigned session, int value) {\n  if (!db->active || db->owner != session)\n    return false;\n  db->working = value;\n  return true;\n}\nbool tx_commit(SessionDB *db, unsigned session) {\n  if (!db->active || db->owner != session)\n    return false;\n  db->committed = db->working;\n  db->active = false;\n  db->owner = 0;\n  return true;\n}\n\nint main(void) {\n  SessionDB db = {0};\n  tx_begin(&db, 1);\n  tx_set(&db, 1, 42);\n  bool wrong = tx_commit(&db, 2);\n  bool right = tx_commit(&db, 1);\n  printf(\"other_rejected=%d owner_committed=%d value=%d\\n\", !wrong, right,\n         db.committed);\n  return 0;\n}\n",
        "expected": "other_rejected=1 owner_committed=1 value=42",
        "walkthrough": "The failed session-two commit leaves session one’s working value intact. Only its owner can publish it.",
        "pitfall": "Serializing individual requests does not automatically serialize a multi-request transaction under one owner.",
        "question": "May another session commit the current transaction?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "The transaction handle is associated with a session identity.",
        "tryit": "Add disconnect rollback and reject stale requests from a session whose transaction has already ended.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "Backpressure makes overload behavior explicit. A system must decide whether a full queue blocks, rejects, or sheds work under a documented policy.",
        "explanation": "The fixture uses blocking admission and draining close. Memory is bounded by four pending copied requests even while eight operations are processed. A production service may choose timeouts or immediate rejection, but it must define whether a timed-out request was never accepted, accepted but not completed, or committed with a lost response.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\nenum { WORK_CAP = 4, WORK_ITEMS = 8 };\ntypedef struct {\n  int data[WORK_CAP];\n  size_t head, count;\n  bool closed;\n  pthread_mutex_t lock;\n  pthread_cond_t ready, space;\n} WorkQueue;\nbool offer_work(WorkQueue *q, int value) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  while (q->count == WORK_CAP && !q->closed)\n    CHECK(pthread_cond_wait(&q->space, &q->lock));\n  if (q->closed) {\n    CHECK(pthread_mutex_unlock(&q->lock));\n    return false;\n  }\n  q->data[(q->head + q->count) % WORK_CAP] = value;\n  ++q->count;\n  CHECK(pthread_cond_signal(&q->ready));\n  CHECK(pthread_mutex_unlock(&q->lock));\n  return true;\n}\nbool take_work(WorkQueue *q, int *out) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  while (!q->count && !q->closed)\n    CHECK(pthread_cond_wait(&q->ready, &q->lock));\n  if (!q->count) {\n    CHECK(pthread_mutex_unlock(&q->lock));\n    return false;\n  }\n  *out = q->data[q->head];\n  q->head = (q->head + 1) % WORK_CAP;\n  --q->count;\n  CHECK(pthread_cond_signal(&q->space));\n  CHECK(pthread_mutex_unlock(&q->lock));\n  return true;\n}\nvoid close_work(WorkQueue *q) {\n  CHECK(pthread_mutex_lock(&q->lock));\n  q->closed = true;\n  CHECK(pthread_cond_broadcast(&q->ready));\n  CHECK(pthread_cond_broadcast(&q->space));\n  CHECK(pthread_mutex_unlock(&q->lock));\n}\ntypedef struct {\n  WorkQueue *queue;\n  unsigned received;\n  long sum;\n} Work;\nvoid *produce(void *arg) {\n  Work *w = arg;\n  for (int i = 1; i <= WORK_ITEMS; ++i)\n    if (!offer_work(w->queue, i))\n      return NULL;\n  close_work(w->queue);\n  return NULL;\n}\nvoid *consume(void *arg) {\n  Work *w = arg;\n  int value;\n  while (take_work(w->queue, &value)) {\n    ++w->received;\n    w->sum += value;\n  }\n  return NULL;\n}\nvoid run_queue(unsigned *count, long *sum) {\n  WorkQueue q = {.lock = PTHREAD_MUTEX_INITIALIZER,\n                 .ready = PTHREAD_COND_INITIALIZER,\n                 .space = PTHREAD_COND_INITIALIZER};\n  Work work = {&q, 0, 0};\n  pthread_t producer, consumer;\n  CHECK(pthread_create(&consumer, NULL, consume, &work));\n  CHECK(pthread_create(&producer, NULL, produce, &work));\n  CHECK(pthread_join(producer, NULL));\n  CHECK(pthread_join(consumer, NULL));\n  *count = work.received;\n  *sum = work.sum;\n  CHECK(pthread_cond_destroy(&q.ready));\n  CHECK(pthread_cond_destroy(&q.space));\n  CHECK(pthread_mutex_destroy(&q.lock));\n}\n\nint main(void) {\n  unsigned count;\n  long sum;\n  run_queue(&count, &sum);\n  printf(\"queue_bound=%d processed=%u\\n\", WORK_CAP, count);\n  return 0;\n}\n",
        "expected": "queue_bound=4 processed=8",
        "walkthrough": "The queue remains bounded while its slots are reused. Processing more requests than capacity does not imply unbounded buffering.",
        "pitfall": "Retrying after an ambiguous timeout can duplicate a committed operation unless request deduplication is part of the protocol.",
        "question": "What must a timeout response clarify?",
        "choices": [
          "Whether admission or completion is known",
          "Only that the client waited"
        ],
        "answer": 0,
        "why": "The client needs enough state to make a safe retry decision.",
        "tryit": "Add try-offer and timed-admission variants, then test exactly-once request IDs across retries.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      }
    },
    "practicePlan": {
      "goal": "Extend the native TinyDB baseline with a serialized request path.",
      "tasks": [
        "Define request admission, transaction ownership, and overload behavior before accepting multiple callers.",
        "Add try-offer and timed-admission variants, then test exactly-once request IDs across retries.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "multi-client-3"
    }
  },
  "isolation": {
    "intro": "Specify what readers may observe before changing locks. Race freedom and transaction isolation are related but different contracts.",
    "outcomes": [
      "Protect multi-field invariants with reader/writer locking.",
      "Detect stale writes rather than losing updates.",
      "Distinguish statement visibility from repeatable transaction snapshots."
    ],
    "topics": {
      "1": {
        "intro": "Reader/writer locking permits simultaneous readers while excluding a writer from protected state. Every access must follow the same protocol.",
        "explanation": "The account transfer updates two fields under an exclusive lock; readers compute their sum under a shared lock. No reader may observe the half-completed transfer. The test verifies an invariant rather than a particular scheduling order. Lock fairness and starvation behavior depend on the implementation and policy, not merely the use of a reader/writer lock.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\ntypedef struct {\n  int a, b;\n  pthread_rwlock_t lock;\n} Account;\nAccount account = {100, 0, PTHREAD_RWLOCK_INITIALIZER};\natomic_bool invalid_read;\nvoid *transfer(void *unused) {\n  (void)unused;\n  for (unsigned i = 0; i < 1000; ++i) {\n    CHECK(pthread_rwlock_wrlock(&account.lock));\n    if (i % 2 == 0) {\n      --account.a;\n      ++account.b;\n    } else {\n      ++account.a;\n      --account.b;\n    }\n    CHECK(pthread_rwlock_unlock(&account.lock));\n  }\n  return NULL;\n}\nvoid *read_total(void *unused) {\n  (void)unused;\n  for (unsigned i = 0; i < 1000; ++i) {\n    CHECK(pthread_rwlock_rdlock(&account.lock));\n    if (account.a + account.b != 100)\n      atomic_store(&invalid_read, true);\n    CHECK(pthread_rwlock_unlock(&account.lock));\n  }\n  return NULL;\n}\nvoid run_accounts(void) {\n  atomic_init(&invalid_read, false);\n  pthread_t writer, readers[2];\n  CHECK(pthread_create(&writer, NULL, transfer, NULL));\n  for (unsigned i = 0; i < 2; ++i)\n    CHECK(pthread_create(&readers[i], NULL, read_total, NULL));\n  CHECK(pthread_join(writer, NULL));\n  for (unsigned i = 0; i < 2; ++i)\n    CHECK(pthread_join(readers[i], NULL));\n}\n\nint main(void) {\n  run_accounts();\n  printf(\"consistent=%d final_total=%d\\n\", !atomic_load(&invalid_read),\n         account.a + account.b);\n  CHECK(pthread_rwlock_destroy(&account.lock));\n  return 0;\n}\n",
        "expected": "consistent=1 final_total=100",
        "walkthrough": "After joins there is no concurrent access, so main can read the final total directly. During execution every account access follows the lock discipline.",
        "pitfall": "Adding a read lock to only some readers leaves the overall shared-state contract broken.",
        "question": "What protects a reader from a half-completed transfer?",
        "choices": [
          "Holding the shared lock across both field reads",
          "Reading each field at unrelated times"
        ],
        "answer": 0,
        "why": "The invariant spans both fields and needs one consistent observation interval.",
        "tryit": "Define a lock hierarchy for accounts and tables, then measure contention with verified invariant checks.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      },
      "2": {
        "intro": "An optimistic update can reject a stale read instead of silently overwriting a newer result. The version comparison and write must share one atomic critical section in concurrent use.",
        "explanation": "Two logical sessions read version one. The first commits a new value and advances the version; the second is rejected when its observed version no longer matches. This deterministic sequential schedule models the conflict rule. A threaded implementation must guard compare_commit with a mutex or an appropriate atomic state protocol, including version-wrap handling.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  int value;\n  unsigned version;\n} Versioned;\nbool compare_commit(Versioned *db, unsigned observed, int value) {\n  if (db->version != observed)\n    return false;\n  db->value = value;\n  ++db->version;\n  return true;\n}\n\nint main(void) {\n  Versioned db = {10, 1};\n  unsigned first = db.version, second = db.version;\n  bool a = compare_commit(&db, first, 11), b = compare_commit(&db, second, 12);\n  printf(\"first=%d stale_rejected=%d value=%d version=%u\\n\", a, !b, db.value,\n         db.version);\n  return 0;\n}\n",
        "expected": "first=1 stale_rejected=1 value=11 version=2",
        "walkthrough": "The stale second write does not erase the first committed update. A client may retry after rereading under an explicit application policy.",
        "pitfall": "A plain version check followed by an unlocked store is still vulnerable to a check-then-act race.",
        "question": "Which steps need one concurrent atomic boundary?",
        "choices": [
          "Only reading the version number",
          "Version validation and publication of the new value/version"
        ],
        "answer": 1,
        "why": "Another writer must not slip between validation and publication.",
        "tryit": "Protect compare_commit with a lock, then test two sessions synchronized to read the same initial version.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "An isolation contract states which anomalies are allowed across a transaction’s sequence of operations. Protecting each statement does not automatically provide repeatable reads.",
        "explanation": "The fixture models a reader observing a committed value, another session committing a change, and the first reader observing the newer value on its next statement. That is compatible with a per-statement committed-read policy but not a repeatable snapshot. A complete implementation must specify multi-row reads, phantoms, write conflicts, and transaction boundaries rather than borrowing a label without its tests.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  int value;\n  unsigned version;\n} Versioned;\nbool compare_commit(Versioned *db, unsigned observed, int value) {\n  if (db->version != observed)\n    return false;\n  db->value = value;\n  ++db->version;\n  return true;\n}\n\nint main(void) {\n  Versioned db = {10, 1};\n  int first = db.value;\n  compare_commit(&db, 1, 20);\n  int second = db.value;\n  printf(\"statement_reads=%d,%d repeatable=%d\\n\", first, second,\n         first == second);\n  return 0;\n}\n",
        "expected": "statement_reads=10,20 repeatable=0",
        "walkthrough": "Both reads observe committed state, but they do not belong to one frozen snapshot. The example makes the nonrepeatable read explicit without using a C data race.",
        "pitfall": "Race-free field access is necessary but does not define all database isolation semantics.",
        "question": "Does per-statement locking guarantee repeatable reads for a longer transaction?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "Another transaction may commit between statements after each lock is released.",
        "tryit": "Write schedule tests for nonrepeatable reads, lost updates, and multi-row consistency before choosing an isolation label.",
        "input": "",
        "runtime": "native"
      }
    },
    "practicePlan": {
      "goal": "Specify the behavior of concurrent reads before changing the locking strategy.",
      "tasks": [
        "Specify what readers may observe before changing locks. Race freedom and transaction isolation are related but different contracts.",
        "Write schedule tests for nonrepeatable reads, lost updates, and multi-row consistency before choosing an isolation label.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "isolation-3"
    }
  },
  "snapshots": {
    "intro": "Retain committed versions so readers can use a stable visibility boundary. Reclaim only after the active-snapshot horizon permits it.",
    "outcomes": [
      "Define inclusive creation and exclusive deletion timestamps.",
      "Separate visibility from physical version storage.",
      "Protect old versions while any reader can still observe them."
    ],
    "topics": {
      "1": {
        "intro": "A snapshot read chooses versions according to a stable committed-time boundary, not according to the latest value at each statement.",
        "explanation": "The one-key model has value ten created at time one and superseded at time three; value twenty becomes visible at time three. A snapshot at time two continues to see ten. Timestamps here are bounded committed sequence numbers, not wall-clock time. Concurrent publication of version metadata needs synchronization in an assembled engine.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  int value;\n  uint64_t created, deleted;\n} Version;\nbool visible(const Version *v, uint64_t snapshot) {\n  return v->created <= snapshot && (v->deleted == 0 || snapshot < v->deleted);\n}\nbool snapshot_read(const Version *versions, size_t count, uint64_t snapshot,\n                   int *out) {\n  for (size_t i = count; i > 0; --i)\n    if (visible(&versions[i - 1], snapshot)) {\n      *out = versions[i - 1].value;\n      return true;\n    }\n  return false;\n}\nsize_t reclaim(Version *versions, size_t count, uint64_t oldest) {\n  size_t kept = 0;\n  for (size_t i = 0; i < count; ++i)\n    if (versions[i].deleted == 0 || versions[i].deleted > oldest)\n      versions[kept++] = versions[i];\n  return kept;\n}\n\nint main(void) {\n  Version v[] = {{10, 1, 3}, {20, 3, 0}};\n  int old = 0, current = 0;\n  if (!snapshot_read(v, 2, 2, &old) || !snapshot_read(v, 2, 3, &current))\n    return 1;\n  printf(\"snapshot2=%d snapshot3=%d\\n\", old, current);\n  return 0;\n}\n",
        "expected": "snapshot2=10 snapshot3=20",
        "walkthrough": "The old version’s deletion boundary is exclusive: it is visible before time three, not at three. The new version is visible starting at three.",
        "pitfall": "A snapshot timestamp must refer to a known committed state; wall-clock comparisons alone do not establish commit order.",
        "question": "Which value does snapshot two see after time three commits?",
        "choices": [
          "Ten",
          "Twenty"
        ],
        "answer": 0,
        "why": "Its visibility boundary remains fixed rather than advancing between reads.",
        "tryit": "Add a later committed version and verify that repeated reads at snapshot two remain unchanged.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "MVCC stores multiple committed versions and uses a visibility rule to decide which one a reader sees. It does not by itself solve write conflicts or serializability.",
        "explanation": "The model tests created≤snapshot and either no deletion or snapshot<deleted. It searches newest to oldest and returns a copied value. A real implementation also needs transaction status for uncommitted versions, atomic publication of multi-row commits, conflict handling, indexes that respect visibility, and safe version lifetimes. The fixture deliberately contains only committed immutable version records.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  int value;\n  uint64_t created, deleted;\n} Version;\nbool visible(const Version *v, uint64_t snapshot) {\n  return v->created <= snapshot && (v->deleted == 0 || snapshot < v->deleted);\n}\nbool snapshot_read(const Version *versions, size_t count, uint64_t snapshot,\n                   int *out) {\n  for (size_t i = count; i > 0; --i)\n    if (visible(&versions[i - 1], snapshot)) {\n      *out = versions[i - 1].value;\n      return true;\n    }\n  return false;\n}\nsize_t reclaim(Version *versions, size_t count, uint64_t oldest) {\n  size_t kept = 0;\n  for (size_t i = 0; i < count; ++i)\n    if (versions[i].deleted == 0 || versions[i].deleted > oldest)\n      versions[kept++] = versions[i];\n  return kept;\n}\n\nint main(void) {\n  Version old = {10, 1, 3}, fresh = {20, 3, 0};\n  for (uint64_t s = 2; s <= 3; ++s)\n    printf(\"snapshot=%llu old=%d new=%d\\n\", (unsigned long long)s,\n           visible(&old, s), visible(&fresh, s));\n  return 0;\n}\n",
        "expected": "snapshot=2 old=1 new=0\nsnapshot=3 old=0 new=1",
        "walkthrough": "At the exact boundary, visibility switches without a gap or overlap between these two versions.",
        "pitfall": "Calling a store MVCC does not establish a particular isolation level or automatic conflict detection.",
        "question": "Does retaining versions alone guarantee serializable transactions?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "Visibility, conflict rules, and transaction coordination jointly determine isolation.",
        "tryit": "Add transaction-status metadata for tentative versions and reject their visibility until commit publication.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "Old versions can be reclaimed only when no active snapshot may still need them. Version retention is a concurrency and lifetime problem.",
        "explanation": "For exclusive deletion time d, a version is no longer visible to snapshots at or after d. If the oldest active snapshot is at least d, the version can be removed under this model. Protect the active-reader registry and reclamation decision with synchronization, and prevent raw version pointers from escaping their protected lifetime. Timestamp wrap and abandoned reader handling need explicit policies.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  int value;\n  uint64_t created, deleted;\n} Version;\nbool visible(const Version *v, uint64_t snapshot) {\n  return v->created <= snapshot && (v->deleted == 0 || snapshot < v->deleted);\n}\nbool snapshot_read(const Version *versions, size_t count, uint64_t snapshot,\n                   int *out) {\n  for (size_t i = count; i > 0; --i)\n    if (visible(&versions[i - 1], snapshot)) {\n      *out = versions[i - 1].value;\n      return true;\n    }\n  return false;\n}\nsize_t reclaim(Version *versions, size_t count, uint64_t oldest) {\n  size_t kept = 0;\n  for (size_t i = 0; i < count; ++i)\n    if (versions[i].deleted == 0 || versions[i].deleted > oldest)\n      versions[kept++] = versions[i];\n  return kept;\n}\n\nint main(void) {\n  Version a[] = {{10, 1, 3}, {20, 3, 0}}, b[] = {{10, 1, 3}, {20, 3, 0}};\n  size_t retained = reclaim(a, 2, 2), released = reclaim(b, 2, 3);\n  printf(\"old_reader_keeps=%zu horizon3_keeps=%zu\\n\", retained, released);\n  return 0;\n}\n",
        "expected": "old_reader_keeps=2 horizon3_keeps=1",
        "walkthrough": "A reader at time two keeps the old version alive. Once the horizon reaches three, only the current version remains.",
        "pitfall": "Compacting a version array invalidates borrowed addresses even for surviving entries.",
        "question": "May the old version be freed while snapshot two is active?",
        "choices": [
          "No",
          "Yes"
        ],
        "answer": 0,
        "why": "That reader still requires the value visible before deletion time three.",
        "tryit": "Implement an active-snapshot registry and test reader start/end interleavings with reclamation under one documented protocol.",
        "input": "",
        "runtime": "native"
      }
    },
    "practicePlan": {
      "goal": "Design version visibility tests before implementing snapshot reads.",
      "tasks": [
        "Retain committed versions so readers can use a stable visibility boundary. Reclaim only after the active-snapshot horizon permits it.",
        "Implement an active-snapshot registry and test reader start/end interleavings with reclamation under one documented protocol.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "snapshots-3"
    }
  },
  "maintenance": {
    "intro": "Make recovery work with snapshots, log positions, and reusable storage without freeing data that remains referenced.",
    "outcomes": [
      "Replay only complete committed work after an applied log position.",
      "Order checkpoint publication before log truncation.",
      "Check page integrity before compaction and reuse."
    ],
    "topics": {
      "1": {
        "intro": "A log sequence number identifies a position in a stable ordered log. Recovery must know which committed position a checkpoint already includes.",
        "explanation": "The typed-record model skips records at or before the checkpoint’s applied LSN, requires a contiguous suffix, and updates the checkpoint only on a matching COMMIT. It retains the one-value single-writer transaction restriction. An on-disk log needs explicit record encoding, checksums, and torn-record framing; this struct is not a file format.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nenum { BEGIN_REC = 1, SET_REC = 2, COMMIT_REC = 3, LOG_BYTES = 8 };\nvoid log_record(unsigned char *out, unsigned kind, unsigned tx,\n                uint32_t value) {\n  memset(out, 0, LOG_BYTES);\n  out[0] = (unsigned char)kind;\n  out[1] = (unsigned char)tx;\n  put32(out + 4, value);\n}\nuint32_t recover(const unsigned char *log, size_t length, uint32_t base) {\n  unsigned active = 0;\n  uint32_t pending = base;\n  for (size_t at = 0; at <= length && length - at >= LOG_BYTES;\n       at += LOG_BYTES) {\n    const unsigned char *r = log + at;\n    if (!r[1] || r[2] || r[3])\n      break;\n    if (r[0] == BEGIN_REC) {\n      if (active)\n        break;\n      active = r[1];\n      pending = base;\n    } else if (r[0] == SET_REC) {\n      if (active != r[1])\n        break;\n      pending = get32(r + 4);\n    } else if (r[0] == COMMIT_REC) {\n      if (active != r[1])\n        break;\n      base = pending;\n      active = 0;\n    } else\n      break;\n  }\n  return base;\n}\ntypedef struct {\n  uint64_t lsn;\n  unsigned kind, tx;\n  uint32_t value;\n} LogRecord;\ntypedef struct {\n  uint64_t applied;\n  uint32_t value;\n} Checkpoint;\nCheckpoint replay(const LogRecord *log, size_t n, Checkpoint base) {\n  unsigned active = 0;\n  uint64_t seen = base.applied;\n  uint32_t pending = base.value;\n  for (size_t i = 0; i < n; ++i) {\n    LogRecord r = log[i];\n    if (r.lsn <= base.applied)\n      continue;\n    if (seen == UINT64_MAX || r.lsn != seen + 1 || !r.tx)\n      break;\n    seen = r.lsn;\n    if (r.kind == BEGIN_REC) {\n      if (active)\n        break;\n      active = r.tx;\n      pending = base.value;\n    } else if (r.kind == SET_REC) {\n      if (active != r.tx)\n        break;\n      pending = r.value;\n    } else if (r.kind == COMMIT_REC) {\n      if (active != r.tx)\n        break;\n      base = (Checkpoint){r.lsn, pending};\n      active = 0;\n    } else\n      break;\n  }\n  return base;\n}\n\nint main(void) {\n  LogRecord log[] = {{1, BEGIN_REC, 1, 0},  {2, SET_REC, 1, 10},\n                     {3, COMMIT_REC, 1, 0}, {4, BEGIN_REC, 2, 0},\n                     {5, SET_REC, 2, 20},   {6, COMMIT_REC, 2, 0}};\n  Checkpoint result = replay(log, 6, (Checkpoint){3, 10});\n  printf(\"value=%u applied=%llu\\n\", (unsigned)result.value,\n         (unsigned long long)result.applied);\n  return 0;\n}\n",
        "expected": "value=20 applied=6",
        "walkthrough": "The first committed transaction is already represented by the checkpoint. Only the second changes the recovered state.",
        "pitfall": "A log offset that changes meaning after truncation is not a stable global LSN without an epoch or base-offset convention.",
        "question": "Which records are skipped during replay?",
        "choices": [
          "Those already covered by the applied checkpoint LSN",
          "Every record before the most recent SET regardless of commit"
        ],
        "answer": 0,
        "why": "A committed applied boundary identifies what the snapshot already contains.",
        "tryit": "Serialize explicit LSNs with checksums and test missing, duplicated, reordered, and torn records.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "A checkpoint permits old log removal only after the snapshot is safely published. Reversing that order can erase the only recoverable copy.",
        "explanation": "This Linux/POSIX teaching fixture pauses writers, writes and syncs a temporary snapshot, renames it to the checkpoint path, syncs the directory, then truncates and syncs the older log. The fixed 16-byte snapshot encodes a small LSN and value with zero high bytes. A concurrent engine additionally needs a consistent snapshot boundary, complete page coverage, checksums, and a carefully defined log retention horizon.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <fcntl.h>\n#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <unistd.h>\n\nint main(void) {\n  unsigned char snapshot[16] = {0x53, 0x4e, 0x50, 0x31};\n  snapshot[4] = 3;\n  snapshot[12] = 10;\n  FILE *log = fopen(\"wal.log\", \"w+b\");\n  if (!log)\n    return 1;\n  if (fwrite(\"old-log\", 1, 7, log) != 7 || fflush(log) || fsync(fileno(log))) {\n    fclose(log);\n    return 1;\n  }\n  FILE *temp = fopen(\"checkpoint.tmp\", \"wb\");\n  if (!temp) {\n    fclose(log);\n    return 1;\n  }\n  bool ok = fwrite(snapshot, 1, sizeof snapshot, temp) == sizeof snapshot &&\n            fflush(temp) == 0 && fsync(fileno(temp)) == 0;\n  int closed = fclose(temp);\n  if (!ok || closed || rename(\"checkpoint.tmp\", \"checkpoint.db\")) {\n    fclose(log);\n    return 1;\n  }\n  int dir = open(\".\", O_RDONLY);\n  if (dir < 0) {\n    fclose(log);\n    return 1;\n  }\n  int synced = fsync(dir), dir_closed = close(dir);\n  if (synced || dir_closed || ftruncate(fileno(log), 0) || fsync(fileno(log))) {\n    fclose(log);\n    return 1;\n  }\n  if (fclose(log))\n    return 1;\n  FILE *read = fopen(\"checkpoint.db\", \"rb\");\n  if (!read)\n    return 1;\n  unsigned char bytes[16];\n  ok = fread(bytes, 1, sizeof bytes, read) == sizeof bytes &&\n       memcmp(bytes, snapshot, sizeof bytes) == 0;\n  if (fclose(read) || !ok)\n    return 1;\n  puts(\"checkpoint=10 applied_lsn=3 wal_truncated=1\");\n  return 0;\n}\n",
        "expected": "checkpoint=10 applied_lsn=3 wal_truncated=1",
        "walkthrough": "The pass line follows checked file and directory synchronization and a byte-for-byte reload of the published snapshot. It exercises a local filesystem, not all possible power-loss or remote-filesystem behavior.",
        "pitfall": "Atomic rename alone does not establish every required durability guarantee, and truncating the log first is unsafe.",
        "question": "When may the old log be truncated?",
        "choices": [
          "Before writing the snapshot to save space",
          "After the covering checkpoint is durably published"
        ],
        "answer": 1,
        "why": "Recovery needs at least one complete surviving representation of every acknowledged change.",
        "tryit": "Use KEEP_FILES=1 to inspect the artifacts, then inject failure after each protocol step and verify a valid recovery source remains.",
        "input": "",
        "runtime": "native",
        "command": "make example EXAMPLE=maintenance-2 KEEP_FILES=1"
      },
      "3": {
        "intro": "Free-page reuse and compaction require a reachability and identity policy. An unlinked physical page may still be needed by a snapshot or recovery log.",
        "explanation": "The fixture checks a slotted-page model for bounds and overlapping live ranges before compaction. It then constructs an overlapping corruption and verifies rejection. A full storage allocator must also track roots, index references, active snapshots, and log dependencies before placing a page on the reusable free list. A generation number can help reject stale external page handles.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { PSIZE = 64, MAX_SLOTS = 8 };\ntypedef struct {\n  unsigned char bytes[PSIZE];\n  size_t offset[MAX_SLOTS], length[MAX_SLOTS], count, free_end;\n} Page;\nvoid page_init(Page *p) {\n  memset(p, 0, sizeof *p);\n  p->free_end = PSIZE;\n}\nbool page_insert(Page *p, const unsigned char *data, size_t n, size_t *slot) {\n  if (!n || p->count == MAX_SLOTS || n > p->free_end)\n    return false;\n  size_t i = p->count;\n  p->free_end -= n;\n  memcpy(p->bytes + p->free_end, data, n);\n  p->offset[i] = p->free_end;\n  p->length[i] = n;\n  ++p->count;\n  *slot = i;\n  return true;\n}\nbool page_read(const Page *p, size_t slot, const unsigned char **data,\n               size_t *length) {\n  if (slot >= p->count || !p->length[slot] || p->offset[slot] > PSIZE ||\n      p->length[slot] > PSIZE - p->offset[slot])\n    return false;\n  *data = p->bytes + p->offset[slot];\n  *length = p->length[slot];\n  return true;\n}\nbool page_delete(Page *p, size_t slot) {\n  if (slot >= p->count || !p->length[slot])\n    return false;\n  p->length[slot] = 0;\n  return true;\n}\nvoid compact(Page *p) {\n  Page next;\n  page_init(&next);\n  next.count = p->count;\n  for (size_t i = 0; i < p->count; ++i)\n    if (p->length[i]) {\n      next.free_end -= p->length[i];\n      next.offset[i] = next.free_end;\n      next.length[i] = p->length[i];\n      memcpy(next.bytes + next.free_end, p->bytes + p->offset[i], p->length[i]);\n    }\n  *p = next;\n}\nbool page_valid(const Page *p) {\n  if (p->count > MAX_SLOTS || p->free_end > PSIZE)\n    return false;\n  for (size_t i = 0; i < p->count; ++i) {\n    if (!p->length[i])\n      continue;\n    if (p->offset[i] < p->free_end || p->offset[i] > PSIZE ||\n        p->length[i] > PSIZE - p->offset[i])\n      return false;\n    for (size_t j = 0; j < i; ++j)\n      if (p->length[j]) {\n        if (p->offset[j] > PSIZE || p->length[j] > PSIZE - p->offset[j])\n          return false;\n        size_t end_i = p->offset[i] + p->length[i],\n               end_j = p->offset[j] + p->length[j];\n        if (p->offset[i] < end_j && p->offset[j] < end_i)\n          return false;\n      }\n  }\n  return true;\n}\n\nint main(void) {\n  Page p;\n  page_init(&p);\n  size_t a, b;\n  page_insert(&p, (const unsigned char *)\"Ada\", 3, &a);\n  page_insert(&p, (const unsigned char *)\"Ken\", 3, &b);\n  bool good = page_valid(&p);\n  Page bad = p;\n  bad.offset[b] = bad.offset[a];\n  printf(\"valid=%d overlap_rejected=%d\\n\", good, !page_valid(&bad));\n  return 0;\n}\n",
        "expected": "valid=1 overlap_rejected=1",
        "walkthrough": "Both individual ranges fit the byte area, but their overlap violates the page’s stronger structural invariant.",
        "pitfall": "Bounds checks alone do not prove that two live records occupy distinct bytes.",
        "question": "Is an unlinked page always immediately reusable?",
        "choices": [
          "No, snapshots or recovery may still reference it",
          "Yes"
        ],
        "answer": 0,
        "why": "Logical unlinking does not automatically end every reader or recovery dependency.",
        "tryit": "Add free-list generations and a root-to-page integrity walk, then test stale handles after reuse.",
        "input": "",
        "runtime": "native"
      }
    },
    "practicePlan": {
      "goal": "Extend the earlier pager and log with a tested checkpoint protocol.",
      "tasks": [
        "Make recovery work with snapshots, log positions, and reusable storage without freeing data that remains referenced.",
        "Add free-list generations and a root-to-page integrity walk, then test stale handles after reuse.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "maintenance-3"
    }
  },
  "richer-queries": {
    "intro": "Add query capabilities with explicit key ordering, typed parameters, and evidence that optimized execution preserves results.",
    "outcomes": [
      "Use a composite key consistently for ordering and lookup.",
      "Bind typed parameters rather than concatenating SQL strings.",
      "Compare estimated and measured work without changing query results."
    ],
    "topics": {
      "1": {
        "intro": "Composite indexes order tuples lexicographically; prepared statements separate a fixed query shape from typed parameters; joins can use the same key lookup.",
        "explanation": "The fixture supports one exact prepared query shape, deliberately not a general SQL preparer. It binds tenant and ID as unsigned values and executes a composite-key binary search. The same lookup serves an indexed join from orders to customers, preserving one output per matching order. Adding these capabilities to the earlier SQL grammar is an assembly exercise with new parser and validation tests.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\ntypedef struct {\n  unsigned tenant, id;\n  const char *name;\n} Customer;\nint compare_key(const Customer *a, unsigned tenant, unsigned id) {\n  if (a->tenant != tenant)\n    return (a->tenant > tenant) - (a->tenant < tenant);\n  return (a->id > id) - (a->id < id);\n}\nconst Customer *lookup_customer(const Customer *rows, size_t n, unsigned tenant,\n                                unsigned id) {\n  size_t lo = 0, hi = n;\n  while (lo < hi) {\n    size_t mid = lo + (hi - lo) / 2;\n    if (compare_key(&rows[mid], tenant, id) < 0)\n      lo = mid + 1;\n    else\n      hi = mid;\n  }\n  return lo < n && compare_key(&rows[lo], tenant, id) == 0 ? &rows[lo] : NULL;\n}\ntypedef struct {\n  bool prepared, bound;\n  unsigned tenant, id;\n} Prepared;\nbool prepare(Prepared *p, const char *sql) {\n  *p = (Prepared){0};\n  if (strcmp(sql, \"SELECT name FROM people WHERE tenant = ? AND id = ?;\") != 0)\n    return false;\n  p->prepared = true;\n  return true;\n}\nbool bind(Prepared *p, unsigned tenant, unsigned id) {\n  if (!p->prepared || !tenant || !id)\n    return false;\n  p->tenant = tenant;\n  p->id = id;\n  p->bound = true;\n  return true;\n}\nconst Customer *execute_prepared(const Prepared *p, const Customer *rows,\n                                 size_t n) {\n  return p->prepared && p->bound ? lookup_customer(rows, n, p->tenant, p->id)\n                                 : NULL;\n}\n\nint main(void) {\n  Customer customers[] = {{1, 1, \"Ada\"}, {1, 2, \"Grace\"}, {2, 1, \"Ken\"}};\n  Prepared p;\n  if (!prepare(&p, \"SELECT name FROM people WHERE tenant = ? AND id = ?;\") ||\n      !bind(&p, 1, 2))\n    return 1;\n  const Customer *row = execute_prepared(&p, customers, 3);\n  if (!row)\n    return 1;\n  printf(\"prepared=%s\\n\", row->name);\n  struct Order {\n    unsigned tenant, person, total;\n  } orders[] = {{1, 1, 20}, {1, 1, 30}, {2, 1, 40}};\n  for (size_t i = 0; i < 3; ++i) {\n    row = lookup_customer(customers, 3, orders[i].tenant, orders[i].person);\n    if (row)\n      printf(\"join=%s:%u\\n\", row->name, orders[i].total);\n  }\n  return 0;\n}\n",
        "expected": "prepared=Grace\njoin=Ada:20\njoin=Ada:30\njoin=Ken:40",
        "walkthrough": "Tenant two’s ID one correctly selects Ken rather than tenant one’s Ada. Two orders for Ada produce two join rows.",
        "pitfall": "A composite index on (tenant,id) does not directly provide global ordering by id alone.",
        "question": "Why bind values instead of appending them into SQL text?",
        "choices": [
          "To keep data separate from the prepared syntax",
          "To bypass schema validation"
        ],
        "answer": 0,
        "why": "Typed binding retains the query structure while validating values separately.",
        "tryit": "Generalize preparation through the real parser, add parameter types and lifetime rules, and test composite-prefix queries.",
        "input": "",
        "runtime": "native"
      },
      "2": {
        "intro": "Better statistics model the distribution that predicates actually encounter. Histograms can represent skew that a uniform estimate misses.",
        "explanation": "The fixture has seven score-one rows and one score-nine row. A ten-value uniform model estimates 0.8 matches for score one, while a per-value histogram records seven. These statistics describe this snapshot of data; updates can make them stale, and independent single-column histograms still miss correlations between columns.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  unsigned scores[] = {1, 1, 1, 1, 1, 1, 1, 9}, histogram[10] = {0}, actual = 0;\n  for (size_t i = 0; i < 8; ++i)\n    ++histogram[scores[i]];\n  for (size_t i = 0; i < 8; ++i)\n    if (scores[i] == 1)\n      ++actual;\n  printf(\"uniform=%.2f histogram=%u actual=%u\\n\", 8.0 / 10.0, histogram[1],\n         actual);\n  return 0;\n}\n",
        "expected": "uniform=0.80 histogram=7 actual=7",
        "walkthrough": "The histogram matches this known dataset’s count. Its accuracy does not eliminate the need to measure execution or refresh after changes.",
        "pitfall": "Collecting statistics may have its own cost and locking or snapshot requirements.",
        "question": "Why is the uniform estimate poor here?",
        "choices": [
          "All tables always have ten equally likely values",
          "The values are heavily skewed"
        ],
        "answer": 1,
        "why": "The distribution assumption disagrees with the stored data.",
        "tryit": "Collect a bounded histogram from a consistent snapshot and compare planner decisions before and after a skewed update workload.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "An optimized plan must first return the same logical result. Instrument matching units when comparing its work with a baseline.",
        "explanation": "The fixture joins three lookup keys against eight ordered IDs. The nested baseline compares every pair; the indexed path counts ordering comparisons plus its final equality checks. Its result count agrees with the baseline. These are comparison counts, not page reads or elapsed time; the index’s construction and maintenance costs are separate.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main(void) {\n  int ids[] = {1, 2, 3, 4, 5, 6, 7, 8}, keys[] = {2, 4, 8};\n  unsigned nested = 0, indexed = 0, a = 0, b = 0;\n  for (size_t k = 0; k < 3; ++k) {\n    for (size_t i = 0; i < 8; ++i) {\n      ++nested;\n      if (ids[i] == keys[k])\n        ++a;\n    }\n    size_t lo = 0, hi = 8;\n    while (lo < hi) {\n      ++indexed;\n      size_t mid = lo + (hi - lo) / 2;\n      if (ids[mid] < keys[k])\n        lo = mid + 1;\n      else\n        hi = mid;\n    }\n    if (lo < 8) {\n      ++indexed;\n      if (ids[lo] == keys[k])\n        ++b;\n    }\n  }\n  if (a != b)\n    return 1;\n  printf(\"nested=%u indexed=%u results=%u\\n\", nested, indexed, b);\n  return 0;\n}\n",
        "expected": "nested=24 indexed=13 results=3",
        "walkthrough": "Thirteen counted comparisons replace twenty-four in this fixture. Smaller or differently ordered workloads may have different tradeoffs.",
        "pitfall": "Mixing comparator calls in one plan with only successful matches in another produces an invalid comparison.",
        "question": "What must match before comparing performance?",
        "choices": [
          "The query’s logical results",
          "The chosen operator names"
        ],
        "answer": 0,
        "why": "A faster plan that drops or duplicates rows is incorrect.",
        "tryit": "Compare complete result multisets including duplicates, then add index-build cost and page-cache counters.",
        "input": "",
        "runtime": "native"
      }
    },
    "practicePlan": {
      "goal": "Compare richer query plans using correctness tests and measured work.",
      "tasks": [
        "Add query capabilities with explicit key ordering, typed parameters, and evidence that optimized execution preserves results.",
        "Compare complete result multisets including duplicates, then add index-build cost and page-cache counters.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "richer-queries-3"
    }
  },
  "reliability": {
    "intro": "Evaluate concurrency, allocation, and recovery with reproducible workloads and clearly scoped evidence.",
    "outcomes": [
      "Measure contention without assuming deterministic schedules.",
      "Count allocation and cache operations separately from runtime.",
      "Retain fault and fuzz regressions as release evidence."
    ],
    "topics": {
      "1": {
        "intro": "A contention workload should preserve correctness while collecting schedule-dependent metrics. Do not require one exact interleaving to pass.",
        "explanation": "Four workers each process a thousand protected increments. A failed try-lock due to EBUSY increments a contention counter before blocking normally. The fixture asserts the deterministic total and a bound on counted waits, but does not fix the actual wait count. Instrumentation changes timing, and wait counts are not latency measurements.",
        "code": "#define _POSIX_C_SOURCE 200809L\n#include <errno.h>\n#include <limits.h>\n#include <pthread.h>\n#include <sched.h>\n#include <stdatomic.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n#define CHECK(call)                                                            \\\n  do {                                                                         \\\n    int error = (call);                                                        \\\n    if (error) {                                                               \\\n      fprintf(stderr, \"thread error %d\\n\", error);                             \\\n      exit(1);                                                                 \\\n    }                                                                          \\\n  } while (0)\npthread_mutex_t service_lock = PTHREAD_MUTEX_INITIALIZER;\natomic_uint waited;\nunsigned processed;\nvoid *requests(void *unused) {\n  (void)unused;\n  for (unsigned i = 0; i < 1000; ++i) {\n    int error = pthread_mutex_trylock(&service_lock);\n    if (error == EBUSY) {\n      atomic_fetch_add(&waited, 1);\n      CHECK(pthread_mutex_lock(&service_lock));\n    } else if (error)\n      exit(1);\n    ++processed;\n    CHECK(pthread_mutex_unlock(&service_lock));\n  }\n  return NULL;\n}\n\nint main(void) {\n  atomic_init(&waited, 0);\n  pthread_t workers[4];\n  for (unsigned i = 0; i < 4; ++i)\n    CHECK(pthread_create(&workers[i], NULL, requests, NULL));\n  for (unsigned i = 0; i < 4; ++i)\n    CHECK(pthread_join(workers[i], NULL));\n  if (processed != 4000)\n    return 1;\n  printf(\"requests=%u wait_count_bounded=%d\\n\", processed,\n         atomic_load(&waited) <= processed);\n  CHECK(pthread_mutex_destroy(&service_lock));\n  return 0;\n}\n",
        "expected": "requests=4000 wait_count_bounded=1",
        "walkthrough": "Every request completes. The number that initially encountered a busy lock may differ on another run without indicating a correctness failure.",
        "pitfall": "A benchmark that asserts a nonzero wait count can be flaky when the scheduler runs workers mostly sequentially.",
        "question": "Which value is safe to assert exactly here?",
        "choices": [
          "The total processed requests",
          "The number of contended attempts"
        ],
        "answer": 0,
        "why": "Correctness is deterministic even when the schedule and contention metrics vary.",
        "tryit": "Record wait distributions and request latency under several client counts while preserving per-request correctness checks.",
        "input": "",
        "runtime": "native",
        "flags": [
          "-pthread"
        ]
      },
      "2": {
        "intro": "Allocation count, object locality, and cache behavior are different measurements. A pool can reduce allocation calls while introducing its own lifetime constraints.",
        "explanation": "The fixture performs eight separate row allocations and one allocation for an eight-row pool, checking every result and freeing every owner. It also exercises the small page-cache model and counts backing-read events. Fewer allocations or reads can motivate a design, but neither proves lower total runtime; fragmentation, contention, eviction, and workload patterns matter.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\ntypedef struct {\n  int id;\n  unsigned age;\n  bool valid, dirty;\n  int value;\n} Frame;\ntypedef struct {\n  Frame frames[2];\n  unsigned clock, reads, writes;\n} Cache;\nint *fetch(Cache *c, int id) {\n  size_t victim = 0;\n  for (size_t i = 0; i < 2; ++i)\n    if (c->frames[i].valid && c->frames[i].id == id) {\n      c->frames[i].age = ++c->clock;\n      return &c->frames[i].value;\n    }\n  for (size_t i = 0; i < 2; ++i)\n    if (!c->frames[i].valid) {\n      victim = i;\n      break;\n    } else if (c->frames[i].age < c->frames[victim].age)\n      victim = i;\n  Frame *f = &c->frames[victim];\n  if (f->valid && f->dirty)\n    ++c->writes;\n  *f = (Frame){id, ++c->clock, true, false, id * 10};\n  ++c->reads;\n  return &f->value;\n}\n\nint main(void) {\n  Row *separate[8] = {0};\n  unsigned calls = 0;\n  for (size_t i = 0; i < 8; ++i) {\n    separate[i] = malloc(sizeof *separate[i]);\n    ++calls;\n    if (!separate[i]) {\n      for (size_t j = 0; j < i; ++j)\n        free(separate[j]);\n      return 1;\n    }\n  }\n  Row *pool = malloc(8 * sizeof *pool);\n  if (!pool) {\n    for (size_t i = 0; i < 8; ++i)\n      free(separate[i]);\n    return 1;\n  }\n  Cache c = {0};\n  fetch(&c, 1);\n  fetch(&c, 2);\n  fetch(&c, 1);\n  printf(\"individual_allocations=%u pooled_allocations=1 cache_reads=%u\\n\",\n         calls, c.reads);\n  for (size_t i = 0; i < 8; ++i)\n    free(separate[i]);\n  free(pool);\n  return 0;\n}\n",
        "expected": "individual_allocations=8 pooled_allocations=1 cache_reads=2",
        "walkthrough": "Repeated access to page one hits in the two-frame model. The row pool has one owner, while separate rows have eight cleanup obligations.",
        "pitfall": "Returning a pointer to pooled storage requires a lifetime policy just as strict as returning an individually allocated row.",
        "question": "Does fewer malloc calls prove faster end-to-end queries?",
        "choices": [
          "Yes",
          "No"
        ],
        "answer": 1,
        "why": "It measures one possible cost component rather than the whole workload.",
        "tryit": "Instrument your assembled database’s allocation sites and page reads, then benchmark verified workloads with and without pooling.",
        "input": "",
        "runtime": "native"
      },
      "3": {
        "intro": "A release suite should combine targeted regressions, generated input, and failure-boundary tests while stating what remains untested.",
        "explanation": "This fixture checks all 25 prefixes of a transaction log, every too-short row length, and 256 deterministic bounded parser inputs. It preserves the distinction between format validation, recovery semantics, and parser robustness. Concurrency schedule tests and ThreadSanitizer belong alongside these checks; no finite run proves all schedules, all storage reorderings, or production reliability.",
        "code": "#include <limits.h>\n#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nenum { TABLE_CAP = 8 };\ntypedef struct {\n  uint32_t id;\n  char name[32];\n  uint32_t score;\n} Row;\ntypedef struct {\n  Row rows[TABLE_CAP];\n  size_t count;\n} Table;\ntypedef enum { OK, DUPLICATE, FULL, INVALID, MISSING } Status;\nint find_row(const Table *t, uint32_t id) {\n  for (size_t i = 0; i < t->count; ++i)\n    if (t->rows[i].id == id)\n      return (int)i;\n  return -1;\n}\nStatus insert_row(Table *t, Row row) {\n  if (row.id == 0 || !memchr(row.name, 0, sizeof row.name) || row.name[0] == 0)\n    return INVALID;\n  if (find_row(t, row.id) >= 0)\n    return DUPLICATE;\n  if (t->count == TABLE_CAP)\n    return FULL;\n  t->rows[t->count++] = row;\n  return OK;\n}\nStatus update_score(Table *t, uint32_t id, uint32_t score) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  t->rows[i].score = score;\n  return OK;\n}\nStatus delete_row(Table *t, uint32_t id) {\n  int i = find_row(t, id);\n  if (i < 0)\n    return MISSING;\n  for (size_t j = (size_t)i + 1; j < t->count; ++j)\n    t->rows[j - 1] = t->rows[j];\n  --t->count;\n  return OK;\n}\nvoid display(const Table *t) {\n  for (size_t i = 0; i < t->count; ++i)\n    printf(\"%u | %s | %u\\n\", (unsigned)t->rows[i].id, t->rows[i].name,\n           (unsigned)t->rows[i].score);\n}\nenum { ROW_BYTES = 40, HEADER_BYTES = 8, PAGE_BYTES = 128 };\nvoid put32(unsigned char *out, uint32_t value) {\n  for (unsigned i = 0; i < 4; ++i)\n    out[i] = (unsigned char)(value >> (8 * i));\n}\nuint32_t get32(const unsigned char *in) {\n  uint32_t value = 0;\n  for (unsigned i = 0; i < 4; ++i)\n    value |= (uint32_t)in[i] << (8 * i);\n  return value;\n}\nbool encode_row(unsigned char *out, const Row *row) {\n  if (!row->id || !memchr(row->name, 0, 32) || !row->name[0])\n    return false;\n  memset(out, 0, ROW_BYTES);\n  put32(out, row->id);\n  memcpy(out + 4, row->name, strlen(row->name));\n  put32(out + 36, row->score);\n  return true;\n}\nbool decode_row(const unsigned char *in, size_t n, Row *out) {\n  if (n != ROW_BYTES || get32(in) == 0 || !memchr(in + 4, 0, 32) || in[4] == 0)\n    return false;\n  Row row = {0};\n  row.id = get32(in);\n  memcpy(row.name, in + 4, 32);\n  row.score = get32(in + 36);\n  *out = row;\n  return true;\n}\nbool save(FILE *f, const Table *table) {\n  unsigned char header[HEADER_BYTES] = {0x54, 0x44,      0x42, 0x31,\n                                        1,    ROW_BYTES, 0,    0};\n  if (table->count > TABLE_CAP)\n    return false;\n  header[6] = (unsigned char)table->count;\n  if (fwrite(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  for (size_t i = 0; i < table->count; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    if (!encode_row(bytes, &table->rows[i]) ||\n        fwrite(bytes, 1, sizeof bytes, f) != sizeof bytes)\n      return false;\n  }\n  return fflush(f) == 0;\n}\nbool load(FILE *f, Table *out) {\n  unsigned char header[HEADER_BYTES];\n  if (fread(header, 1, sizeof header, f) != sizeof header)\n    return false;\n  if (memcmp(header, (const unsigned char[]){0x54, 0x44, 0x42, 0x31}, 4) || header[4] != 1 || header[5] != ROW_BYTES ||\n      header[6] > TABLE_CAP || header[7] != 0)\n    return false;\n  Table table = {0};\n  for (unsigned i = 0; i < header[6]; ++i) {\n    unsigned char bytes[ROW_BYTES];\n    Row row;\n    if (fread(bytes, 1, sizeof bytes, f) != sizeof bytes ||\n        !decode_row(bytes, sizeof bytes, &row) || insert_row(&table, row) != OK)\n      return false;\n  }\n  if (fgetc(f) != EOF || ferror(f))\n    return false;\n  *out = table;\n  return true;\n}\nenum { BEGIN_REC = 1, SET_REC = 2, COMMIT_REC = 3, LOG_BYTES = 8 };\nvoid log_record(unsigned char *out, unsigned kind, unsigned tx,\n                uint32_t value) {\n  memset(out, 0, LOG_BYTES);\n  out[0] = (unsigned char)kind;\n  out[1] = (unsigned char)tx;\n  put32(out + 4, value);\n}\nuint32_t recover(const unsigned char *log, size_t length, uint32_t base) {\n  unsigned active = 0;\n  uint32_t pending = base;\n  for (size_t at = 0; at <= length && length - at >= LOG_BYTES;\n       at += LOG_BYTES) {\n    const unsigned char *r = log + at;\n    if (!r[1] || r[2] || r[3])\n      break;\n    if (r[0] == BEGIN_REC) {\n      if (active)\n        break;\n      active = r[1];\n      pending = base;\n    } else if (r[0] == SET_REC) {\n      if (active != r[1])\n        break;\n      pending = get32(r + 4);\n    } else if (r[0] == COMMIT_REC) {\n      if (active != r[1])\n        break;\n      base = pending;\n      active = 0;\n    } else\n      break;\n  }\n  return base;\n}\ntypedef enum {\n  END,\n  WORD,\n  NUMBER,\n  STRING,\n  SEMI,\n  LP,\n  RP,\n  COMMA,\n  STAR,\n  EQUAL,\n  BAD\n} Token;\ntypedef struct {\n  const char *p;\n  char text[32];\n  uint32_t number;\n} Lexer;\nToken next(Lexer *l) {\n  while (*l->p == ' ' || *l->p == '\\t' || *l->p == '\\n' || *l->p == '\\r')\n    ++l->p;\n  unsigned char ch = (unsigned char)*l->p;\n  l->text[0] = 0;\n  if (!ch)\n    return END;\n  if (ch >= '0' && ch <= '9') {\n    uint32_t n = 0;\n    do {\n      unsigned digit = (unsigned)(*l->p - '0');\n      if (n > (UINT32_MAX - digit) / 10)\n        return BAD;\n      n = n * 10 + digit;\n      ++l->p;\n    } while (*l->p >= '0' && *l->p <= '9');\n    l->number = n;\n    return NUMBER;\n  }\n  if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch == '_') {\n    size_t n = 0;\n    while ((*l->p >= 'A' && *l->p <= 'Z') || (*l->p >= 'a' && *l->p <= 'z') ||\n           (*l->p >= '0' && *l->p <= '9') || *l->p == '_') {\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p++;\n    }\n    l->text[n] = 0;\n    return WORD;\n  }\n  ++l->p;\n  if (ch == '\\'') {\n    size_t n = 0;\n    for (;;) {\n      if (!*l->p)\n        return BAD;\n      if (*l->p == '\\'' && l->p[1] != '\\'') {\n        ++l->p;\n        l->text[n] = 0;\n        return STRING;\n      }\n      if (n + 1 == sizeof l->text)\n        return BAD;\n      l->text[n++] = *l->p;\n      if (*l->p == '\\'')\n        ++l->p;\n      ++l->p;\n    }\n  }\n  switch (ch) {\n  case ';':\n    return SEMI;\n  case '(':\n    return LP;\n  case ')':\n    return RP;\n  case ',':\n    return COMMA;\n  case '*':\n    return STAR;\n  case '=':\n    return EQUAL;\n  default:\n    return BAD;\n  }\n}\nbool keyword(Lexer *l, const char *word) {\n  return next(l) == WORD && strcmp(l->text, word) == 0;\n}\ntypedef enum { INSERT_STMT, SELECT_STMT } Kind;\ntypedef struct {\n  Kind kind;\n  Row row;\n  bool filtered;\n  uint32_t key;\n} Statement;\nbool parse(const char *sql, Statement *out) {\n  Lexer l = {sql, {0}, 0};\n  Statement s = {0};\n  if (next(&l) != WORD)\n    return false;\n  if (strcmp(l.text, \"INSERT\") == 0) {\n    s.kind = INSERT_STMT;\n    if (!keyword(&l, \"INTO\") || !keyword(&l, \"people\") ||\n        !keyword(&l, \"VALUES\") || next(&l) != LP || next(&l) != NUMBER)\n      return false;\n    s.row.id = l.number;\n    if (next(&l) != COMMA || next(&l) != STRING)\n      return false;\n    memcpy(s.row.name, l.text, sizeof s.row.name);\n    if (next(&l) != COMMA || next(&l) != NUMBER)\n      return false;\n    s.row.score = l.number;\n    if (next(&l) != RP || next(&l) != SEMI || next(&l) != END)\n      return false;\n  } else if (strcmp(l.text, \"SELECT\") == 0) {\n    s.kind = SELECT_STMT;\n    if (next(&l) != STAR || !keyword(&l, \"FROM\") || !keyword(&l, \"people\"))\n      return false;\n    Token t = next(&l);\n    if (t == WORD && strcmp(l.text, \"WHERE\") == 0) {\n      if (!keyword(&l, \"id\") || next(&l) != EQUAL || next(&l) != NUMBER)\n        return false;\n      s.filtered = true;\n      s.key = l.number;\n      t = next(&l);\n    }\n    if (t != SEMI || next(&l) != END)\n      return false;\n  } else\n    return false;\n  *out = s;\n  return true;\n}\nbool validate(const Statement *s) {\n  return s->kind != INSERT_STMT || (s->row.id > 0 && s->row.name[0] != 0);\n}\n\nint main(void) {\n  unsigned char log[24];\n  log_record(log, BEGIN_REC, 1, 0);\n  log_record(log + 8, SET_REC, 1, 42);\n  log_record(log + 16, COMMIT_REC, 1, 0);\n  for (size_t cut = 0; cut <= 24; ++cut)\n    if (recover(log, cut, 0) != (cut == 24 ? 42u : 0u))\n      return 1;\n  unsigned char record[ROW_BYTES] = {0};\n  for (size_t n = 0; n < ROW_BYTES; ++n) {\n    Row out = {9, \"Keep\", 0};\n    if (decode_row(record, n, &out) || out.id != 9)\n      return 1;\n  }\n  uint32_t seed = 23;\n  char input[17];\n  const char alphabet[] = \"SELECT 0123(),;xyz\";\n  for (unsigned trial = 0; trial < 256; ++trial) {\n    for (size_t i = 0; i < 16; ++i) {\n      seed = seed * 1664525u + 1013904223u;\n      input[i] = alphabet[(seed >> 24) % (sizeof alphabet - 1)];\n    }\n    input[trial % 16] = 0;\n    Statement s = {0};\n    if (parse(input, &s))\n      (void)validate(&s);\n  }\n  puts(\"recovery_prefixes=25 parser_cases=256 short_records=40\");\n  return 0;\n}\n",
        "expected": "recovery_prefixes=25 parser_cases=256 short_records=40",
        "walkthrough": "The pass line follows independent boundary expectations and decoder output-preservation checks. The fixed seeds make the generated corpus reproducible.",
        "pitfall": "A green suite is evidence under stated limits, not a reason to omit format, isolation, resource, or host-guarantee documentation.",
        "question": "What should happen to a newly discovered failing input?",
        "choices": [
          "Minimize it and retain it as a deterministic regression",
          "Discard it after one successful retry"
        ],
        "answer": 0,
        "why": "A preserved fixture prevents the same defect from quietly returning.",
        "tryit": "Run the complete course examples with both compilers and sanitizers, assemble your database’s own release suite, and publish the observed limits alongside its artifacts.",
        "input": "",
        "runtime": "native"
      }
    },
    "practicePlan": {
      "goal": "Evaluate an advanced TinyDB implementation against concurrent and fault-injected workloads.",
      "tasks": [
        "Evaluate concurrency, allocation, and recovery with reproducible workloads and clearly scoped evidence.",
        "Run the complete course examples with both compilers and sanitizers, assemble your database’s own release suite, and publish the observed limits alongside its artifacts.",
        "Write independent cases for empty input, boundaries, rejected operations, and the chapter’s stated invariants."
      ],
      "checks": [
        "Run the complete example and compare its output with the documented fixture.",
        "Predict and check at least one changed input, including a failing or absent case.",
        "Explain the time and extra-space costs, or the ordering and persistence guarantees for native systems work."
      ],
      "example": "reliability-3"
    }
  }
};
