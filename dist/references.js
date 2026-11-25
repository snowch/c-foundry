// Curated reading aids: external references never gate running code or completion.
(() => {
  const catalog = {
  "main": {
    "title": "C reference: main",
    "url": "https://en.cppreference.com/w/c/language/main_function.html",
    "note": "Check the supported forms of main and what returning a status means."
  },
  "types": {
    "title": "C reference: arithmetic types",
    "url": "https://en.cppreference.com/w/c/language/arithmetic_types.html",
    "note": "Compare integer ranges, signedness, and floating-point types."
  },
  "init": {
    "title": "C reference: initialization",
    "url": "https://en.cppreference.com/w/c/language/initialization.html",
    "note": "Find the rules for explicit initializers and omitted aggregate members."
  },
  "operators": {
    "title": "C reference: operator precedence",
    "url": "https://en.cppreference.com/w/c/language/operator_precedence.html",
    "note": "Use the precedence table, then check the operator’s own semantics."
  },
  "conversions": {
    "title": "C reference: conversions",
    "url": "https://en.cppreference.com/w/c/language/conversion.html",
    "note": "Check integer promotions, usual arithmetic conversions, and narrowing."
  },
  "selection": {
    "title": "C reference: if",
    "url": "https://en.cppreference.com/w/c/language/if.html",
    "note": "Read how the controlling expression selects a branch."
  },
  "evaluation": {
    "title": "C reference: evaluation order",
    "url": "https://en.cppreference.com/w/c/language/eval_order.html",
    "note": "Distinguish sequencing rules from operator precedence."
  },
  "functions": {
    "title": "C reference: functions",
    "url": "https://en.cppreference.com/w/c/language/functions.html",
    "note": "Read declarations, parameter types, and the rules for calling functions."
  },
  "lifetime": {
    "title": "C reference: object lifetime",
    "url": "https://en.cppreference.com/w/c/language/lifetime.html",
    "note": "Check when an object exists and when access through a pointer becomes invalid."
  },
  "arrays": {
    "title": "C reference: arrays",
    "url": "https://en.cppreference.com/w/c/language/array.html",
    "note": "Check array bounds, element types, and array-to-pointer conversion."
  },
  "pointers": {
    "title": "C reference: pointers",
    "url": "https://en.cppreference.com/w/c/language/pointer.html",
    "note": "Check pointer declarations, null pointers, and valid pointer operations."
  },
  "structs": {
    "title": "C reference: structures",
    "url": "https://en.cppreference.com/w/c/language/struct.html",
    "note": "Find member access, layout constraints, and padding rules."
  },
  "preprocessor": {
    "title": "C reference: preprocessing",
    "url": "https://en.cppreference.com/w/c/preprocessor.html",
    "note": "Find inclusion, conditional compilation, and macro replacement rules."
  },
  "storage": {
    "title": "C reference: storage duration and linkage",
    "url": "https://en.cppreference.com/w/c/language/storage_duration.html",
    "note": "Separate an object’s lifetime from which declarations name it."
  },
  "behavior": {
    "title": "C reference: behavior categories",
    "url": "https://en.cppreference.com/w/c/language/behavior.html",
    "note": "Distinguish undefined, unspecified, and implementation-defined behavior."
  },
  "limits": {
    "title": "C reference: numeric limits",
    "url": "https://en.cppreference.com/w/c/types/limits.html",
    "note": "Find the macros that describe the selected implementation’s ranges."
  },
  "fixed": {
    "title": "C reference: fixed-width integers",
    "url": "https://en.cppreference.com/w/c/types/integer.html",
    "note": "Check when exact-width types exist and which format macros match them."
  },
  "strings": {
    "title": "C reference: byte strings",
    "url": "https://en.cppreference.com/w/c/string/byte.html",
    "note": "Find the required terminators, buffer contracts, and comparison functions."
  },
  "threads": {
    "title": "C reference: C11 concurrency",
    "url": "https://en.cppreference.com/w/c/thread.html",
    "note": "Check thread creation, joining, mutexes, and optional implementation support."
  },
  "atomics": {
    "title": "C reference: atomics",
    "url": "https://en.cppreference.com/w/c/atomic.html",
    "note": "Read atomic operations and their memory-order contracts."
  },
  "standards": {
    "title": "C reference: language history",
    "url": "https://en.cppreference.com/w/c/language/history.html",
    "note": "Separate C17 facilities from later additions and compiler extensions."
  },
  "floating": {
    "title": "C reference: floating-point limits",
    "url": "https://en.cppreference.com/w/c/types/limits.html",
    "note": "Find precision, exponent-range, and subnormal-support macros."
  },
  "math": {
    "title": "C reference: mathematical functions",
    "url": "https://en.cppreference.com/w/c/numeric/math.html",
    "note": "Find finite/NaN classification and library error-handling contracts."
  },
  "fenv": {
    "title": "C reference: floating-point environment",
    "url": "https://en.cppreference.com/w/c/numeric/fenv.html",
    "note": "Check rounding modes and implementation support before relying on them."
  },
  "io": {
    "title": "C reference: input/output",
    "url": "https://en.cppreference.com/w/c/io.html",
    "note": "Compare stream modes, positioning, error indicators, and formatted I/O."
  },
  "locale": {
    "title": "C reference: locales",
    "url": "https://en.cppreference.com/w/c/locale.html",
    "note": "Check which operations depend on the active locale."
  },
  "memory": {
    "title": "C reference: dynamic memory",
    "url": "https://en.cppreference.com/w/c/memory.html",
    "note": "Check allocation, reallocation, failure, ownership, and deallocation contracts."
  },
  "printf": {
    "title": "C reference: printf family",
    "url": "https://en.cppreference.com/w/c/io/fprintf.html",
    "note": "Read conversion specifiers, required argument types, and the return value."
  },
  "fgets": {
    "title": "C reference: fgets",
    "url": "https://en.cppreference.com/w/c/io/fgets.html",
    "note": "Check the buffer-size argument, newline retention, terminator, and failure result."
  },
  "malloc": {
    "title": "C reference: malloc",
    "url": "https://en.cppreference.com/w/c/memory/malloc.html",
    "note": "Check allocation failure and which values in newly allocated storage are initialized."
  },
  "realloc": {
    "title": "C reference: realloc",
    "url": "https://en.cppreference.com/w/c/memory/realloc.html",
    "note": "Check what happens to the original allocation on success and failure."
  },
  "free": {
    "title": "C reference: free",
    "url": "https://en.cppreference.com/w/c/memory/free.html",
    "note": "Check valid pointer arguments and access after deallocation."
  },
  "strcmp": {
    "title": "C reference: strcmp",
    "url": "https://en.cppreference.com/w/c/string/byte/strcmp.html",
    "note": "Check the meaning of negative, zero, and positive results."
  },
  "memcpy": {
    "title": "C reference: memcpy",
    "url": "https://en.cppreference.com/w/c/string/byte/memcpy.html",
    "note": "Check byte counts, valid object ranges, and the non-overlap requirement."
  },
  "strtol": {
    "title": "C reference: strtol family",
    "url": "https://en.cppreference.com/w/c/string/byte/strtol.html",
    "note": "Check endptr, accepted syntax, range errors, and full-input validation."
  },
  "ctype": {
    "title": "C reference: isspace",
    "url": "https://en.cppreference.com/w/c/string/byte/isspace.html",
    "note": "Check which argument values are valid and how locale affects classification."
  },
  "fopen": {
    "title": "C reference: fopen",
    "url": "https://en.cppreference.com/w/c/io/fopen.html",
    "note": "Read text/binary modes, creation behavior, and the failure result."
  },
  "fread": {
    "title": "C reference: fread",
    "url": "https://en.cppreference.com/w/c/io/fread.html",
    "note": "Check the difference between bytes and complete elements, and detect short reads."
  },
  "fwrite": {
    "title": "C reference: fwrite",
    "url": "https://en.cppreference.com/w/c/io/fwrite.html",
    "note": "Check the element count returned and handle partial writes."
  },
  "fflush": {
    "title": "C reference: fflush",
    "url": "https://en.cppreference.com/w/c/io/fflush.html",
    "note": "Read the stream-buffer contract; it does not promise storage-device durability."
  },
  "ferror": {
    "title": "C reference: ferror",
    "url": "https://en.cppreference.com/w/c/io/ferror.html",
    "note": "Distinguish a stream error from ordinary end-of-file."
  },
  "qsort": {
    "title": "C reference: qsort",
    "url": "https://en.cppreference.com/w/c/algorithm/qsort.html",
    "note": "Check comparator results, element widths, and the absence of a stability guarantee."
  },
  "printf-man": {
    "title": "Linux manual: printf(3)",
    "url": "https://man7.org/linux/man-pages/man3/printf.3.html",
    "note": "Use SYNOPSIS, conversion specifications, RETURN VALUE, and STANDARDS; note POSIX extensions.",
    "man": "man 3 printf"
  },
  "printf-command": {
    "title": "Linux manual: printf(1)",
    "url": "https://man7.org/linux/man-pages/man1/printf.1.html",
    "note": "Compare the command-line utility with the C library function in section 3.",
    "man": "man 1 printf"
  },
  "man": {
    "title": "Linux manual: man(1)",
    "url": "https://man7.org/linux/man-pages/man1/man.1.html",
    "note": "Find manual sections and keyword searching; the pager controls depend on the selected pager.",
    "man": "man man"
  },
  "pthread": {
    "title": "Linux/POSIX manual: pthread_create(3)",
    "url": "https://man7.org/linux/man-pages/man3/pthread_create.3.html",
    "note": "Read thread start arguments, error returns, and the required native threading environment.",
    "man": "man 3 pthread_create"
  },
  "mutex": {
    "title": "Linux/POSIX manual: pthread_cond_wait(3)",
    "url": "https://man7.org/linux/man-pages/man3/pthread_cond_wait.3.html",
    "note": "Read the predicate-loop and mutex rules for waiting on a condition variable.",
    "man": "man 3 pthread_cond_wait"
  },
  "fsync": {
    "title": "Linux/POSIX manual: fsync(2)",
    "url": "https://man7.org/linux/man-pages/man2/fsync.2.html",
    "note": "Compare an OS synchronization request with C stream flushing; read filesystem-specific limitations.",
    "man": "man 2 fsync"
  },
  "warnings": {
    "title": "GCC manual: warning options",
    "url": "https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html",
    "note": "Look up a diagnostic option and the conditions it reports."
  },
  "stages": {
    "title": "GCC manual: compilation stages",
    "url": "https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html",
    "note": "Compare preprocessing, compilation, assembly, and linking; inspect -E, -S, and -c."
  },
  "dialect": {
    "title": "GCC manual: C dialect options",
    "url": "https://gcc.gnu.org/onlinedocs/gcc/C-Dialect-Options.html",
    "note": "Check -std modes and distinguish standard language facilities from GNU extensions."
  },
  "sanitizers": {
    "title": "GCC manual: instrumentation",
    "url": "https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html",
    "note": "Read what each sanitizer observes and which runtime/toolchain it needs."
  },
  "gdb": {
    "title": "GDB manual: debugging a program",
    "url": "https://sourceware.org/gdb/current/onlinedocs/gdb.html/",
    "note": "Look up breakpoints, stepping, backtraces, and watchpoints in the native debugger."
  },
  "wasm": {
    "title": "WebAssembly concepts",
    "url": "https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Concepts",
    "note": "Distinguish source code, a Wasm module, and the host/runtime that supplies its environment."
  },
  "big-o": {
    "title": "NIST DADS: Big O",
    "url": "https://xlinux.nist.gov/dads/HTML/bigOnotation.html",
    "note": "Read an asymptotic bound as a growth claim, not an exact operation count."
  },
  "binary": {
    "title": "NIST DADS: binary search",
    "url": "https://xlinux.nist.gov/dads/HTML/binarySearch.html",
    "note": "Check the ordering precondition and how the candidate interval shrinks."
  },
  "sort": {
    "title": "NIST DADS: sorting",
    "url": "https://xlinux.nist.gov/dads/HTML/sort.html",
    "note": "Compare ordering, stability, and algorithm families with the course models."
  },
  "recursion": {
    "title": "NIST DADS: recursion",
    "url": "https://xlinux.nist.gov/dads/HTML/recursion.html",
    "note": "Identify base cases and progress toward them."
  },
  "dynamic": {
    "title": "NIST DADS: dynamic programming",
    "url": "https://xlinux.nist.gov/dads/HTML/dynamicprog.html",
    "note": "Check how overlapping subproblems and stored results change the work."
  },
  "list": {
    "title": "NIST DADS: linked lists",
    "url": "https://xlinux.nist.gov/dads/HTML/linkedList.html",
    "note": "Compare representation, traversal, and insertion costs."
  },
  "queue": {
    "title": "NIST DADS: queues",
    "url": "https://xlinux.nist.gov/dads/HTML/queue.html",
    "note": "Check FIFO behavior separately from implementation and capacity policy."
  },
  "hash": {
    "title": "NIST DADS: hash tables",
    "url": "https://xlinux.nist.gov/dads/HTML/hashtab.html",
    "note": "Check collisions and the assumptions behind expected lookup cost."
  },
  "tree": {
    "title": "NIST DADS: binary search trees",
    "url": "https://xlinux.nist.gov/dads/HTML/binarySearchTree.html",
    "note": "Identify the ordering invariant and how tree shape affects height."
  },
  "graph": {
    "title": "NIST DADS: graphs",
    "url": "https://xlinux.nist.gov/dads/HTML/graph.html",
    "note": "Identify vertices, edges, and directed versus undirected representations."
  },
  "sql": {
    "title": "SQLite documentation: SELECT",
    "url": "https://www.sqlite.org/lang_select.html",
    "note": "Compare SQL clause behavior with the deliberately smaller TinyDB grammar."
  },
  "fileformat": {
    "title": "SQLite documentation: database file format",
    "url": "https://www.sqlite.org/fileformat.html",
    "note": "Compare explicit headers, page layouts, and encoding rules with the teaching format."
  },
  "planner": {
    "title": "SQLite documentation: query planning",
    "url": "https://www.sqlite.org/queryplanner.html",
    "note": "Compare scans, index lookups, sorting, and cost choices; TinyDB implements a smaller model."
  },
  "explain": {
    "title": "SQLite documentation: EXPLAIN QUERY PLAN",
    "url": "https://www.sqlite.org/eqp.html",
    "note": "Compare a plan explanation with measured execution work."
  },
  "wal": {
    "title": "SQLite documentation: write-ahead logging",
    "url": "https://www.sqlite.org/wal.html",
    "note": "Compare logging, checkpoints, and durability assumptions with the bounded redo models."
  },
  "atomiccommit": {
    "title": "SQLite documentation: atomic commit",
    "url": "https://www.sqlite.org/atomiccommit.html",
    "note": "Read the failure assumptions and ordering required for a durable commit protocol."
  },
  "isolation": {
    "title": "SQLite documentation: isolation",
    "url": "https://www.sqlite.org/isolation.html",
    "note": "Compare committed visibility and snapshot behavior with the lesson’s explicit contract."
  },
  "prepared": {
    "title": "SQLite C interface: prepared statements",
    "url": "https://www.sqlite.org/c3ref/prepare.html",
    "note": "Read preparation and statement lifecycle contracts; these are design comparisons, not TinyDB APIs."
  },
  "integrity": {
    "title": "SQLite documentation: integrity checks",
    "url": "https://www.sqlite.org/pragma.html#pragma_integrity_check",
    "note": "Compare structural checks with the invariants tested in the teaching database."
  },
  "enum": {
    "title": "C reference: enumerations",
    "url": "https://en.cppreference.com/w/c/language/enum.html",
    "note": "Check enumeration constants and how a tagged union can identify its active representation."
  },
  "assert": {
    "title": "C reference: assert",
    "url": "https://en.cppreference.com/w/c/error/assert.html",
    "note": "Check what the diagnostic macro does and how NDEBUG changes its behavior."
  },
  "strtod": {
    "title": "C reference: strtof, strtod, strtold",
    "url": "https://en.cppreference.com/w/c/string/byte/strtof.html",
    "note": "Check endptr, range errors, and acceptance of infinity/NaN before enforcing a finite-input policy."
  },
  "statements": {
    "title": "C reference: statements",
    "url": "https://en.cppreference.com/w/c/language/statements.html",
    "note": "Compare selection, iteration, and jump statements and the control flow each permits."
  },
  "backtracking": {
    "title": "NIST DADS: backtracking",
    "url": "https://xlinux.nist.gov/dads/HTML/backtrack.html",
    "note": "Identify the choices explored, rejected partial candidates, and restoration of state."
  },
  "greedy": {
    "title": "NIST DADS: greedy algorithms",
    "url": "https://xlinux.nist.gov/dads/HTML/greedyalgo.html",
    "note": "Distinguish a locally attractive choice from a proof of global correctness."
  },
  "stack": {
    "title": "NIST DADS: stacks",
    "url": "https://xlinux.nist.gov/dads/HTML/stack.html",
    "note": "Check LIFO behavior and how it differs from a FIFO queue."
  },
  "heap": {
    "title": "NIST DADS: binary heaps",
    "url": "https://xlinux.nist.gov/dads/HTML/binaryheap.html",
    "note": "Read the heap-order and complete-tree properties used by a priority queue."
  },
  "fuzz": {
    "title": "LLVM documentation: libFuzzer",
    "url": "https://llvm.org/docs/LibFuzzer.html",
    "note": "Compare a native coverage-guided fuzzing engine with the bounded deterministic parser fixture."
  },
  "transactions": {
    "title": "SQLite documentation: transactions",
    "url": "https://www.sqlite.org/lang_transaction.html",
    "note": "Compare BEGIN, COMMIT, and ROLLBACK with the deliberately smaller transaction model."
  }
};
  const chapters = {
  "first-program": {
    "refs": [
      "main",
      "printf-man"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "printf",
      "question": "What does printf return on success, and how many characters does printf(\"Hi!\\n\") report?",
      "answer": "On success printf returns the number of characters transmitted, excluding the terminating null byte. H, i, !, and the newline make four. A negative result reports an output or encoding error."
    }
  },
  "values": {
    "refs": [
      "types",
      "limits"
    ],
    "exerciseAt": "1",
    "exercise": {
      "reference": "printf",
      "question": "Which argument type does printf expect for %d, and which type does %f receive?",
      "answer": "%d receives int. printf’s %f receives double; a float argument is promoted to double. Input functions such as scanf have different contracts."
    }
  },
  "control-flow": {
    "refs": [
      "evaluation",
      "selection"
    ],
    "exerciseAt": "2",
    "exercise": {
      "reference": "evaluation",
      "question": "Does && evaluate its right operand when the left operand is zero? How does that help guard a division?",
      "answer": "It does not: && short-circuits after a false left operand. Put the nonzero-divisor check on the left before evaluating the division on the right."
    }
  },
  "functions": {
    "refs": [
      "functions",
      "lifetime"
    ],
    "exerciseAt": "1",
    "exercise": {
      "reference": "functions",
      "question": "Does a function’s return type tell you every error condition or ownership rule?",
      "answer": "No. The type states the returned value’s type. The function’s documented contract must explain error results, ownership, preconditions, and any side effects."
    }
  },
  "arrays-strings": {
    "refs": [
      "arrays",
      "strings"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "fgets",
      "question": "If fgets has room for eight characters including its terminator, how many input characters can it store, and does it retain a newline?",
      "answer": "At most seven input characters plus the terminating null character. A newline is retained if it is read before the limit. A successful call does not prove the whole logical line fit."
    }
  },
  "pointers": {
    "refs": [
      "pointers",
      "lifetime"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "pointers",
      "question": "May you form a pointer one past an array, and may you dereference it?",
      "answer": "A one-past pointer can be formed and used within the permitted comparison/arithmetic rules for that array. It does not designate an array element and must not be dereferenced."
    }
  },
  "allocation": {
    "refs": [
      "memory",
      "lifetime"
    ],
    "exerciseAt": "2",
    "exercise": {
      "reference": "realloc",
      "question": "If realloc fails for a nonzero requested size, what happens to the original allocation?",
      "answer": "It remains allocated and unchanged. Preserve the original pointer until success is known; assigning realloc directly to your only pointer can lose access to the old allocation."
    }
  },
  "structured-data": {
    "refs": [
      "structs",
      "init"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "structs",
      "question": "Does the order of struct members guarantee that sizeof(struct) equals the sum of their sizes?",
      "answer": "No. Members preserve their declared order, but an implementation may insert internal and trailing padding. External file formats need an explicit encoding."
    }
  },
  "larger-programs": {
    "refs": [
      "preprocessor",
      "storage"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "preprocessor",
      "question": "Does an include guard stop duplicate external function definitions in different source files?",
      "answer": "No. It prevents repeated inclusion within a translation unit. Each source file is preprocessed separately; shared external definitions still need one definition and compatible declarations."
    }
  },
  "files-bytes": {
    "refs": [
      "io",
      "fixed"
    ],
    "exerciseAt": "1",
    "exercise": {
      "reference": "fread",
      "question": "How can fread return fewer complete elements than requested, and how do you distinguish EOF from an I/O error?",
      "answer": "Both EOF and an I/O error can cause a short read. Inspect the stream’s feof and ferror indicators; do not treat every short read as ordinary EOF."
    }
  },
  "big-o": {
    "refs": [
      "big-o"
    ],
    "exerciseAt": "2",
    "exercise": {
      "reference": "big-o",
      "question": "Does an O(n) bound mean the program performs exactly n operations for every input?",
      "answer": "No. It gives an asymptotic upper bound up to constants beyond a threshold. State the input size, operation being counted, and the case or assumptions."
    }
  },
  "searching": {
    "refs": [
      "binary"
    ],
    "exerciseAt": "2",
    "exercise": {
      "reference": "binary",
      "question": "Which input property does binary search require, and what must remain true of the candidate interval?",
      "answer": "The searched sequence must be ordered consistently with the comparison. The candidate interval must contain any remaining possible match, and every unsuccessful step must shrink it."
    }
  },
  "sorting": {
    "refs": [
      "sort"
    ],
    "exerciseAt": "5",
    "exercise": {
      "reference": "qsort",
      "question": "What signs must a qsort comparator return, and does qsort promise stable ordering of equal elements?",
      "answer": "Return a negative value, zero, or a positive value for less than, equivalent, or greater than. qsort does not promise stability. Avoid subtraction that can overflow in a comparator."
    }
  },
  "recursion": {
    "refs": [
      "recursion"
    ],
    "exerciseAt": "1",
    "exercise": {
      "reference": "recursion",
      "question": "Which two parts of a recursive algorithm prevent the same subproblem from recurring forever?",
      "answer": "A terminating base case and recursive steps that make progress toward it. A base case alone is insufficient if reachable steps never approach it."
    }
  },
  "strategies": {
    "refs": [
      "dynamic"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "dynamic",
      "question": "What does memoization retain, and how can it change repeated recursive work?",
      "answer": "It retains results for previously solved states. Reusing those results avoids recomputing overlapping subproblems; the state definition and dependency structure still determine correctness and space use."
    }
  },
  "lists": {
    "refs": [
      "list",
      "memory"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "list",
      "question": "Why is deleting the node after a known node different from locating a node by value in a singly linked list?",
      "answer": "Relinking after a known node can take constant pointer work. Finding that predecessor or value can require traversing the list, so the complete operation may be linear."
    }
  },
  "queues": {
    "refs": [
      "queue"
    ],
    "exerciseAt": "2",
    "exercise": {
      "reference": "queue",
      "question": "Does FIFO behavior specify what a bounded queue should do when it is full?",
      "answer": "No. FIFO describes removal order. A bounded implementation must separately specify rejection, blocking, growth, or another explicit capacity policy."
    }
  },
  "hash-tables": {
    "refs": [
      "hash"
    ],
    "exerciseAt": "5",
    "exercise": {
      "reference": "hash",
      "question": "Is constant-time hash lookup an unconditional worst-case guarantee?",
      "answer": "No. Expected performance depends on hashing and occupancy assumptions. Collisions can make individual operations or a workload substantially more expensive."
    }
  },
  "trees-heaps": {
    "refs": [
      "tree"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "tree",
      "question": "What happens to search cost when a binary search tree degenerates into a chain?",
      "answer": "Its height can become linear in the number of nodes, and a search may visit that many nodes. The ordering invariant alone does not guarantee logarithmic height."
    }
  },
  "graphs": {
    "refs": [
      "graph"
    ],
    "exerciseAt": "1",
    "exercise": {
      "reference": "graph",
      "question": "Does an adjacency matrix use space proportional to the number of edges or to all possible vertex pairs?",
      "answer": "A full matrix has a position for every vertex pair, using quadratic space in the vertex count. A sparse adjacency list can instead use space proportional to vertices plus edges."
    }
  },
  "database-foundations": {
    "refs": [
      "sql",
      "fileformat"
    ],
    "exerciseAt": "1",
    "exercise": {
      "reference": "sql",
      "question": "Does SQLite’s full SQL reference imply that the course’s TinyDB parser accepts every documented clause?",
      "answer": "No. SQLite is a comparison reference. TinyDB accepts only its explicitly implemented and tested grammar; unsupported syntax must be rejected."
    }
  },
  "tables": {
    "refs": [
      "structs",
      "sql"
    ],
    "exerciseAt": "1",
    "exercise": {
      "reference": "structs",
      "question": "Does a C struct declaration serialize a portable database row by itself?",
      "answer": "No. It describes a C object layout that can include padding and target-specific representation. A portable stored row needs explicit field widths and byte encoding."
    }
  },
  "parsing": {
    "refs": [
      "sql",
      "strings"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "sql",
      "question": "Which SQL clauses on the reference page are deliberately absent from the lesson’s grammar?",
      "answer": "Compare the actual grammar in this lesson with the reference and list the differences. For example, supporting a small SELECT/WHERE subset does not add SQLite’s complete expression, join, grouping, or compound-query syntax."
    }
  },
  "execution": {
    "refs": [
      "sql",
      "planner"
    ],
    "exerciseAt": "5",
    "exercise": {
      "reference": "sql",
      "question": "Is a query’s specified result order the same thing as the order in which a scan happens to visit rows?",
      "answer": "No. Read the reference’s ORDER BY contract. A current scan order is an implementation detail unless the query contract explicitly specifies ordering."
    }
  },
  "persistence": {
    "refs": [
      "fileformat",
      "io"
    ],
    "exerciseAt": "2",
    "exercise": {
      "reference": "fileformat",
      "question": "Why does an on-disk format document field widths and byte order rather than sizeof a host struct?",
      "answer": "Readers on different targets must interpret the same bytes. Host padding, alignment, integer widths, and byte order can differ; an explicit format separates those choices from the C object layout."
    }
  },
  "pages": {
    "refs": [
      "fileformat"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "fileformat",
      "question": "Which information must a reader have before it can safely interpret a page’s record offsets?",
      "answer": "It needs the page size, header/layout version, offset encoding, and validated record bounds. Compare the reference’s page and cell rules with the smaller course format."
    }
  },
  "bplus-trees": {
    "refs": [
      "fileformat",
      "tree"
    ],
    "exerciseAt": "2",
    "exercise": {
      "reference": "fileformat",
      "question": "Does SQLite’s documented B-tree page layout define the exact layout of the course’s B+ tree?",
      "answer": "No. Use it to compare interior/leaf pages, keys, and page references. The course defines an in-memory B+ model with its own occupancy and routing rules. A serialized version would need a separate specified page format."
    }
  },
  "planning": {
    "refs": [
      "planner",
      "explain"
    ],
    "exerciseAt": "4",
    "exercise": {
      "reference": "planner",
      "question": "Does an EXPLAIN plan by itself establish how many pages the execution actually reads?",
      "answer": "No. It describes a chosen plan. Actual reads depend on execution, input, and caching; instrument and measure the operation counts separately."
    }
  },
  "recovery": {
    "refs": [
      "atomiccommit",
      "wal"
    ],
    "exerciseAt": "4",
    "exercise": {
      "reference": "atomiccommit",
      "question": "Does a successful fflush alone establish that a committed record survives power loss?",
      "answer": "No. fflush addresses C stream buffering. Durable commit needs a host/storage protocol and explicit failure assumptions; read how the reference separates these layers."
    }
  },
  "ship": {
    "refs": [
      "atomiccommit",
      "integrity"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "atomiccommit",
      "question": "Can a finite fault-injection test prove durability for every filesystem and device?",
      "answer": "No. It checks modeled failures on selected targets. Publish the tested failure model and retain independent invariants; stronger storage guarantees need additional evidence."
    }
  },
  "standards-evolution": {
    "refs": [
      "standards",
      "dialect"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "standards",
      "question": "Does selecting a newer -std mode prove that every facility from that C revision is implemented?",
      "answer": "No. Check the compiler’s documented mode and probe the exact language/library facility needed. A revision macro or an accepted flag is not complete conformance evidence."
    }
  },
  "c-guarantees": {
    "refs": [
      "behavior",
      "limits"
    ],
    "exerciseAt": "4",
    "exercise": {
      "reference": "conversions",
      "question": "Does an unsigned operand always convert a signed operand to unsigned, regardless of their ranks and ranges?",
      "answer": "No. Integer promotions and the usual arithmetic conversions depend on rank and representable range. Work through the types and values before deciding how the comparison is evaluated."
    }
  },
  "portable-c": {
    "refs": [
      "io",
      "fixed"
    ],
    "exerciseAt": "9",
    "exercise": {
      "reference": "ferror",
      "question": "When a stream read returns EOF, how do you tell ordinary end-of-file from an I/O error?",
      "answer": "Inspect the stream indicators: feof identifies end-of-file and ferror identifies an error. A returned EOF value alone does not distinguish them."
    }
  },
  "hardening-tinydb": {
    "refs": [
      "warnings",
      "sanitizers"
    ],
    "exerciseAt": "4",
    "exercise": {
      "reference": "sanitizers",
      "question": "Does a sanitizer report establish that every possible memory bug has been found?",
      "answer": "No. Instrumentation checks selected classes of behavior in executed paths. Read the chosen sanitizer’s contract, retain independent fixtures, and test other toolchains and targets."
    }
  },
  "threads": {
    "refs": [
      "threads",
      "pthread"
    ],
    "exerciseAt": "2",
    "exercise": {
      "reference": "pthread",
      "question": "Does creating a thread copy or transfer ownership of every object its start argument points to?",
      "answer": "No. The argument is a pointer value. The referenced storage needs a suitable lifetime and a documented ownership/synchronization contract."
    }
  },
  "coordination": {
    "refs": [
      "mutex",
      "threads"
    ],
    "exerciseAt": "1",
    "exercise": {
      "reference": "mutex",
      "question": "Why should a condition-variable wait be inside a loop that rechecks a predicate?",
      "answer": "A wakeup does not establish that the desired state currently holds. Recheck the shared predicate while holding the associated mutex; the wait releases and reacquires that mutex."
    }
  },
  "atomics": {
    "refs": [
      "atomics",
      "threads"
    ],
    "exerciseAt": "4",
    "exercise": {
      "reference": "atomics",
      "question": "Does volatile make ordinary shared accesses atomic or establish inter-thread synchronization?",
      "answer": "No. volatile is not a substitute for atomic operations or synchronization. Use documented atomic ordering or mutex-based rules to establish the required relationships."
    }
  },
  "concurrent-storage": {
    "refs": [
      "threads",
      "mutex"
    ],
    "exerciseAt": "4",
    "exercise": {
      "reference": "threads",
      "question": "What must remain valid until workers have finished using the queue and shared state?",
      "answer": "The shared objects, synchronization primitives, and storage they access. Signal shutdown, let workers finish, join them, then destroy or free resources according to the API contracts."
    }
  },
  "multi-client": {
    "refs": [
      "mutex",
      "isolation"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "mutex",
      "question": "Does a thread-safe queue guarantee that a transaction composed of several requests is isolated?",
      "answer": "No. Queue synchronization protects its own operations. Transaction admission, ownership, visibility, and commit boundaries require their own contract and implementation."
    }
  },
  "isolation": {
    "refs": [
      "isolation"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "isolation",
      "question": "Can a reader infer a database’s isolation guarantee merely because each individual access uses a lock?",
      "answer": "No. The isolation contract concerns the visibility and ordering of complete operations or transactions. Lock scope, publication, and the permitted schedules determine the guarantee."
    }
  },
  "snapshots": {
    "refs": [
      "isolation",
      "wal"
    ],
    "exerciseAt": "2",
    "exercise": {
      "reference": "isolation",
      "question": "How can a snapshot reader keep seeing an older committed view while another transaction changes data?",
      "answer": "The implementation retains or reconstructs the reader’s visible version. Read SQLite’s snapshot example as a comparison; the bounded course model has its own visibility and reclamation rules."
    }
  },
  "maintenance": {
    "refs": [
      "wal",
      "integrity"
    ],
    "exerciseAt": "2",
    "exercise": {
      "reference": "wal",
      "question": "What is the role of a checkpoint, and can active readers affect reclaiming log data?",
      "answer": "A checkpoint transfers eligible log changes toward the main database representation. A live reader can still need an older view, so reclaiming log/version data must respect the implementation’s reader rules."
    }
  },
  "richer-queries": {
    "refs": [
      "planner",
      "prepared"
    ],
    "exerciseAt": "1",
    "exercise": {
      "reference": "prepared",
      "question": "Does preparing a statement automatically mean every value is a safe parameter, or that the program can ignore its lifecycle?",
      "answer": "No. Read the API’s prepare, bind, step, reset, and finalize contracts. Preparation, parameter binding, and resource ownership are distinct responsibilities."
    }
  },
  "reliability": {
    "refs": [
      "integrity",
      "atomiccommit"
    ],
    "exerciseAt": "3",
    "exercise": {
      "reference": "integrity",
      "question": "What does a structural integrity check add beyond comparing one SELECT result?",
      "answer": "It can check reachability, ordering, ownership, page relationships, and other representation invariants. Passing it still covers only its documented scope and the inspected state."
    }
  }
};
  const apiNames = ['printf','fgets','realloc','malloc','free','qsort','strtol','strtod','strcmp','memcpy','fopen','fread','fwrite','fflush','ferror'];
  const overrides = {
    'values/2':['init','types'], 'values/3':['operators'], 'values/4':['conversions'], 'values/5':['limits','behavior'],
    'control-flow/3':['statements'], 'control-flow/4':['statements'],
    'functions/3':['storage','lifetime'], 'larger-programs/4':['functions','pointers'], 'larger-programs/5':['functions','lifetime'],
    'recursion/4':['recursion','big-o'], 'strategies/1':['backtracking'], 'strategies/2':['greedy'],
    'lists/1':['memory','big-o'], 'lists/4':['lifetime','pointers'],
    'queues/4':['stack'], 'queues/5':['stack'], 'trees-heaps/5':['heap'], 'trees-heaps/6':['heap'],
    'ship/1':['sql','integrity'], 'ship/2':['fuzz','sanitizers'], 'ship/4':['big-o','planner'],
    'ship/5':['memory','sanitizers'], 'ship/6':['fileformat','fixed'], 'ship/7':['fileformat','io'],
    'recovery/2':['transactions','atomiccommit'], 'recovery/3':['transactions','atomiccommit'],
    'c-guarantees/5':['conversions','limits'], 'portable-c/3':['preprocessor','standards'],
    'portable-c/4':['functions','io'], 'portable-c/8':['strtol','strings'],
    'hardening-tinydb/1':['limits','behavior'], 'hardening-tinydb/2':['fileformat','fixed'],
    'hardening-tinydb/5':['fileformat','io','warnings'], 'concurrent-storage/1':['threads','pthread'],
    'multi-client/2':['transactions','isolation'], 'richer-queries/3':['explain','planner'],
    'first-program/1':['stages','wasm'], 'first-program/2':['main','functions'],
    'first-program/3':['printf','printf-man'], 'first-program/4':['warnings'],
    'first-program/5':['wasm','io'], 'first-program/6':['printf','printf-man','printf-command'],
    'structured-data/2':['enum','structs'], 'larger-programs/1':['stages','storage'],
    'files-bytes/4':['behavior','assert'], 'files-bytes/5':['sanitizers','warnings','wasm'],
    'files-bytes/7':['gdb'], 'ship/8':['gdb','integrity'],
    'c-guarantees/8':['floating','fenv'], 'c-guarantees/9':['math','strtod'],
    'c-guarantees/10':['floating','math'], 'portable-c/7':['locale','ctype'],
    'recovery/4':['wal','fsync'], 'recovery/6':['atomiccommit','wasm']
  };
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function get(chapter,topic,content){
    const plan=chapters[chapter.id];
    if(!plan)throw Error('Missing reference plan: '+chapter.id);
    const exercise=topic.id===plan.exerciseAt?plan.exercise:null;
    const specified=overrides[chapter.id+'/'+topic.id];
    const prose=topic.title+' '+content.intro+' '+content.explanation;
    const mentioned=apiNames.filter(name=>new RegExp('\\b'+name+'\\b').test(prose));
    const ids=[...new Set([...(exercise?[exercise.reference]:[]),...(specified||[plan.refs[0],...mentioned,...plan.refs.slice(1)])])].slice(0,3);
    return {links:ids.map(id=>{if(!catalog[id])throw Error('Missing reference: '+id);return {id,...catalog[id]};}),exercise};
  }
  function render(chapter,topic,content){
    const {links,exercise}=get(chapter,topic,content);
    const local=id=>window.cManuals?cManuals.href(id):'#/reference/'+id;
    const label=link=>link.title+(window.cManuals?.entry(link.id)?' — bundled manual':' — course notes');
    return `<section class="lesson-resources" aria-label="Documentation and help"><details class="lesson-references"><summary>References and help</summary><p>The bundled manuals and course notes below work offline after you download the course. Full external references require internet access.</p><ul>${links.map(link=>`<li><a href="${escape(local(link.id))}">${escape(label(link))}</a><p>${escape(link.note)}</p><a href="${escape(link.url)}" target="_blank" rel="noopener noreferrer">Full online reference (internet required, new tab)</a></li>`).join('')}</ul><p><a href="#/manual">Search the bundled C manual pages →</a></p><p class="supporting">C17 is the course baseline. Check STANDARDS for POSIX or Linux extensions. <a href="#/chapter/first-program/6">How to find and read C documentation →</a></p></details>${exercise?`<details class="documentation-practice"><summary>Use the documentation <span class="supporting">· optional</span></summary><p>${escape(exercise.question)}</p><p>Open <a href="${escape(local(exercise.reference))}">${escape(label({id:exercise.reference,...catalog[exercise.reference]}))}</a>. Find the relevant section, write your answer below, then choose Compare your answer.</p><label>Your answer<textarea class="documentation-response" data-documentation-key="${chapter.id}/${topic.id}" rows="3" placeholder="Name the section you used and explain your answer."></textarea></label><details class="documentation-answer"><summary>Compare your answer</summary><p>${escape(exercise.answer)}</p><p>Does your answer identify the same rule and its limits? Revise it if you missed a condition.</p></details></details>`:''}</section>`;
  }

  document.addEventListener('input',event=>{const key=event.target.dataset.documentationKey;if(key)try{localStorage.setItem('c-foundry:documentation-answer:v1:'+key,event.target.value);}catch(_){};});
  window.addEventListener?.('c-foundry:route',()=>{document.querySelectorAll('[data-documentation-key]').forEach(node=>{try{node.value=localStorage.getItem('c-foundry:documentation-answer:v1:'+node.dataset.documentationKey)||'';}catch(_){};});});
  window.lessonReferences={catalog,chapters,get,render};
})();
