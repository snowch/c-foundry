window.COURSE = {
  "parts": [
    "Learn the language",
    "Understand memory and practical C",
    "Learn to reason about algorithms",
    "Build data structures in C",
    "Build TinyDB",
    "Make the database faster and more reliable"
  ],
  "chapters": [
    {
      "id": "first-program",
      "title": "Your first C program",
      "part": 0,
      "number": 1,
      "topics": [
        {
          "id": "1",
          "title": "Source code, compilation, linking, and execution"
        },
        {
          "id": "2",
          "title": "main, statements, comments, and return values"
        },
        {
          "id": "3",
          "title": "Printing with printf"
        },
        {
          "id": "4",
          "title": "Reading compiler errors"
        },
        {
          "id": "5",
          "title": "C, WebAssembly, and standard input/output"
        }
      ],
      "project": "Print a greeting and explain how it reaches the console.",
      "labs": [
        "hello"
      ]
    },
    {
      "id": "values",
      "title": "Values, types, and expressions",
      "part": 0,
      "number": 2,
      "topics": [
        {
          "id": "1",
          "title": "Integers, floating-point numbers, characters, and Boolean values"
        },
        {
          "id": "2",
          "title": "Variables, initialization, and constants"
        },
        {
          "id": "3",
          "title": "Operators and precedence"
        },
        {
          "id": "4",
          "title": "Conversions, casts, and integer promotions"
        },
        {
          "id": "5",
          "title": "Integer ranges, signed overflow, and unsigned arithmetic"
        }
      ],
      "project": "Inspect numeric expressions and handle values at the limits of their types.",
      "labs": []
    },
    {
      "id": "control-flow",
      "title": "Decisions and repetition",
      "part": 0,
      "number": 3,
      "topics": [
        {
          "id": "1",
          "title": "if, else, and switch"
        },
        {
          "id": "2",
          "title": "Logical expressions and short-circuit evaluation"
        },
        {
          "id": "3",
          "title": "while, do, and for"
        },
        {
          "id": "4",
          "title": "break and continue"
        },
        {
          "id": "5",
          "title": "Number guessing and input validation"
        }
      ],
      "project": "Build a number-guessing program with validated input.",
      "labs": [
        "loops"
      ]
    },
    {
      "id": "functions",
      "title": "Functions and program structure",
      "part": 0,
      "number": 4,
      "topics": [
        {
          "id": "1",
          "title": "Parameters, return values, and prototypes"
        },
        {
          "id": "2",
          "title": "Passing arguments by value"
        },
        {
          "id": "3",
          "title": "Scope, lifetime, and storage duration"
        },
        {
          "id": "4",
          "title": "Decomposing a problem into functions"
        },
        {
          "id": "5",
          "title": "Testing functions independently"
        }
      ],
      "project": "Split a small program into functions with clear inputs and outputs.",
      "labs": []
    },
    {
      "id": "arrays-strings",
      "title": "Arrays and strings",
      "part": 0,
      "number": 5,
      "topics": [
        {
          "id": "1",
          "title": "Array indexing and bounds"
        },
        {
          "id": "2",
          "title": "Character arrays and zero termination"
        },
        {
          "id": "3",
          "title": "Reading lines with fgets"
        },
        {
          "id": "4",
          "title": "String comparison, copying, and parsing"
        },
        {
          "id": "5",
          "title": "Text statistics and word counting"
        }
      ],
      "project": "Count words and characters without reading past array boundaries.",
      "labs": []
    },
    {
      "id": "pointers",
      "title": "Pointers",
      "part": 1,
      "number": 6,
      "topics": [
        {
          "id": "1",
          "title": "Addresses, dereferencing, and null pointers"
        },
        {
          "id": "2",
          "title": "Pointers as function arguments"
        },
        {
          "id": "3",
          "title": "Arrays, pointers, and pointer arithmetic"
        },
        {
          "id": "4",
          "title": "const and pointer declarations"
        },
        {
          "id": "5",
          "title": "Swapping values through pointers"
        }
      ],
      "project": "Exchange two caller-owned values through pointers.",
      "labs": [
        "pointers"
      ]
    },
    {
      "id": "allocation",
      "title": "Dynamic memory and ownership",
      "part": 1,
      "number": 7,
      "topics": [
        {
          "id": "1",
          "title": "Stack storage and heap allocation"
        },
        {
          "id": "2",
          "title": "malloc, calloc, realloc, and free"
        },
        {
          "id": "3",
          "title": "Allocation failure and size calculations"
        },
        {
          "id": "4",
          "title": "Leaks, dangling pointers, and double frees"
        },
        {
          "id": "5",
          "title": "A growing array and string builder"
        }
      ],
      "project": "Build a growable collection with an explicit owner for each allocation.",
      "labs": [
        "heap"
      ]
    },
    {
      "id": "structured-data",
      "title": "Structured data",
      "part": 1,
      "number": 8,
      "topics": [
        {
          "id": "1",
          "title": "Structs, initialization, and member access"
        },
        {
          "id": "2",
          "title": "typedef, enums, and tagged unions"
        },
        {
          "id": "3",
          "title": "Padding, alignment, and sizeof"
        },
        {
          "id": "4",
          "title": "Pointers to structs and linked objects"
        },
        {
          "id": "5",
          "title": "An in-memory record collection"
        }
      ],
      "project": "Represent and inspect a collection of records.",
      "labs": [
        "rows"
      ]
    },
    {
      "id": "larger-programs",
      "title": "Building larger programs",
      "part": 1,
      "number": 9,
      "topics": [
        {
          "id": "1",
          "title": "Header files and separate compilation"
        },
        {
          "id": "2",
          "title": "Declarations, definitions, linkage, and static"
        },
        {
          "id": "3",
          "title": "Include guards and the preprocessor"
        },
        {
          "id": "4",
          "title": "Function pointers and callbacks"
        },
        {
          "id": "5",
          "title": "Interfaces, ownership contracts, and error reporting"
        }
      ],
      "project": "Divide a collection library into a public interface and an implementation.",
      "labs": []
    },
    {
      "id": "files-bytes",
      "title": "Files, bytes, and reliable C",
      "part": 1,
      "number": 10,
      "topics": [
        {
          "id": "1",
          "title": "Text and binary file I/O"
        },
        {
          "id": "2",
          "title": "Fixed-width integers, bitwise operations, and masks"
        },
        {
          "id": "3",
          "title": "Endianness and explicit serialization"
        },
        {
          "id": "4",
          "title": "Undefined behavior, assertions, and debugging"
        },
        {
          "id": "5",
          "title": "Testing, sanitizers, portability, and browser runtime limits"
        },
        {
          "id": "6",
          "title": "A portable binary record format"
        }
      ],
      "project": "Write and read a documented binary format without dumping raw structs.",
      "labs": []
    },
    {
      "id": "big-o",
      "title": "Correctness and Big O",
      "part": 2,
      "number": 11,
      "topics": [
        {
          "id": "1",
          "title": "Input size and counting work"
        },
        {
          "id": "2",
          "title": "O, Θ, and Ω notation"
        },
        {
          "id": "3",
          "title": "Constant, logarithmic, linear, linearithmic, and quadratic growth"
        },
        {
          "id": "4",
          "title": "Best, average, and worst cases"
        },
        {
          "id": "5",
          "title": "Time, auxiliary space, and amortized analysis"
        },
        {
          "id": "6",
          "title": "Loop invariants and correctness arguments"
        },
        {
          "id": "7",
          "title": "Predict growth before measuring it"
        }
      ],
      "project": "Compare counted search operations, then explain how doubling the input changes the work.",
      "labs": []
    },
    {
      "id": "searching",
      "title": "Searching",
      "part": 2,
      "number": 12,
      "topics": [
        {
          "id": "1",
          "title": "Linear search"
        },
        {
          "id": "2",
          "title": "Binary search and its sorted-input requirement"
        },
        {
          "id": "3",
          "title": "Inclusive versus half-open search intervals"
        },
        {
          "id": "4",
          "title": "Lower bounds, upper bounds, and duplicate values"
        },
        {
          "id": "5",
          "title": "Searching a sorted record collection"
        }
      ],
      "project": "Find records while maintaining a shrinking search interval.",
      "labs": [
        "search"
      ]
    },
    {
      "id": "sorting",
      "title": "Sorting",
      "part": 2,
      "number": 13,
      "topics": [
        {
          "id": "1",
          "title": "Selection sort and insertion sort"
        },
        {
          "id": "2",
          "title": "Merge sort"
        },
        {
          "id": "3",
          "title": "Quicksort and pivot selection"
        },
        {
          "id": "4",
          "title": "Stability, in-place algorithms, and memory costs"
        },
        {
          "id": "5",
          "title": "Using qsort safely"
        },
        {
          "id": "6",
          "title": "Comparisons, moves, and input order"
        }
      ],
      "project": "Implement and compare sorting algorithms on different input orders.",
      "labs": [
        "sort"
      ]
    },
    {
      "id": "recursion",
      "title": "Recursion and divide and conquer",
      "part": 2,
      "number": 14,
      "topics": [
        {
          "id": "1",
          "title": "Base cases and recursive progress"
        },
        {
          "id": "2",
          "title": "Drawing the call stack"
        },
        {
          "id": "3",
          "title": "Recursive versus iterative implementations"
        },
        {
          "id": "4",
          "title": "Recursion trees and simple recurrences"
        },
        {
          "id": "5",
          "title": "Recursive directory-like tree traversal"
        }
      ],
      "project": "Traverse a tree and account for the recursive call stack.",
      "labs": []
    },
    {
      "id": "strategies",
      "title": "Problem-solving strategies",
      "part": 2,
      "number": 15,
      "topics": [
        {
          "id": "1",
          "title": "Brute force and backtracking"
        },
        {
          "id": "2",
          "title": "Greedy choices and counterexamples"
        },
        {
          "id": "3",
          "title": "Memoization and dynamic programming"
        },
        {
          "id": "4",
          "title": "One-dimensional and two-dimensional state"
        },
        {
          "id": "5",
          "title": "Coin change, grid paths, and knapsack"
        }
      ],
      "project": "Choose and justify a strategy for a small optimization problem.",
      "labs": []
    },
    {
      "id": "lists",
      "title": "Dynamic arrays and linked lists",
      "part": 3,
      "number": 16,
      "topics": [
        {
          "id": "1",
          "title": "Capacity growth and amortized append"
        },
        {
          "id": "2",
          "title": "Singly and doubly linked lists"
        },
        {
          "id": "3",
          "title": "Insertion, removal, and traversal"
        },
        {
          "id": "4",
          "title": "Ownership and iterator invalidation"
        },
        {
          "id": "5",
          "title": "Locality, memory overhead, and operation costs"
        }
      ],
      "project": "Implement list operations and compare them with a dynamic array.",
      "labs": []
    },
    {
      "id": "queues",
      "title": "Stacks, queues, and deques",
      "part": 3,
      "number": 17,
      "topics": [
        {
          "id": "1",
          "title": "Array-backed and linked implementations"
        },
        {
          "id": "2",
          "title": "Circular buffers"
        },
        {
          "id": "3",
          "title": "Overflow, underflow, and resizing"
        },
        {
          "id": "4",
          "title": "Bracket matching"
        },
        {
          "id": "5",
          "title": "Expression evaluation"
        }
      ],
      "project": "Build a circular queue and use a stack to evaluate expressions.",
      "labs": []
    },
    {
      "id": "hash-tables",
      "title": "Hash tables",
      "part": 3,
      "number": 18,
      "topics": [
        {
          "id": "1",
          "title": "Hash functions for integers and strings"
        },
        {
          "id": "2",
          "title": "Separate chaining and open addressing"
        },
        {
          "id": "3",
          "title": "Collisions, load factor, and resizing"
        },
        {
          "id": "4",
          "title": "Deletion and tombstones"
        },
        {
          "id": "5",
          "title": "Average versus worst-case complexity"
        },
        {
          "id": "6",
          "title": "A word-frequency index"
        }
      ],
      "project": "Build a hash table that remains correct through collisions and resizing.",
      "labs": []
    },
    {
      "id": "trees-heaps",
      "title": "Trees, heaps, and ordered data",
      "part": 3,
      "number": 19,
      "topics": [
        {
          "id": "1",
          "title": "Binary trees and traversals"
        },
        {
          "id": "2",
          "title": "Binary search trees"
        },
        {
          "id": "3",
          "title": "Why balancing matters"
        },
        {
          "id": "4",
          "title": "Rotations and a balanced-tree implementation"
        },
        {
          "id": "5",
          "title": "Binary heaps and priority queues"
        },
        {
          "id": "6",
          "title": "A task scheduler"
        }
      ],
      "project": "Schedule tasks with a priority queue and investigate tree balance.",
      "labs": []
    },
    {
      "id": "graphs",
      "title": "Graphs",
      "part": 3,
      "number": 20,
      "topics": [
        {
          "id": "1",
          "title": "Adjacency matrices and adjacency lists"
        },
        {
          "id": "2",
          "title": "Breadth-first and depth-first search"
        },
        {
          "id": "3",
          "title": "Connected components and cycle detection"
        },
        {
          "id": "4",
          "title": "Topological sorting"
        },
        {
          "id": "5",
          "title": "Dijkstra’s shortest-path algorithm"
        },
        {
          "id": "6",
          "title": "Route finding with a priority queue"
        }
      ],
      "project": "Find routes in a graph and explain the cost of its representation.",
      "labs": []
    },
    {
      "id": "database-foundations",
      "title": "A database from first principles",
      "part": 4,
      "number": 21,
      "topics": [
        {
          "id": "1",
          "title": "Records, tables, schemas, and keys"
        },
        {
          "id": "2",
          "title": "Storage, indexes, and query execution"
        },
        {
          "id": "3",
          "title": "Designing a deliberately small database"
        },
        {
          "id": "4",
          "title": "Building a command loop"
        },
        {
          "id": "5",
          "title": "Defining behavior and writing acceptance tests"
        }
      ],
      "project": "Define TinyDB’s first commands and test their observable behavior.",
      "labs": []
    },
    {
      "id": "tables",
      "title": "Rows and in-memory tables",
      "part": 4,
      "number": 22,
      "topics": [
        {
          "id": "1",
          "title": "Representing rows with structs"
        },
        {
          "id": "2",
          "title": "Inserting and selecting records"
        },
        {
          "id": "3",
          "title": "Duplicate IDs and capacity limits"
        },
        {
          "id": "4",
          "title": "Updating and deleting rows"
        },
        {
          "id": "5",
          "title": "A working in-memory database"
        }
      ],
      "project": "Insert records, reject duplicates, and find rows by ID.",
      "labs": [
        "query"
      ]
    },
    {
      "id": "parsing",
      "title": "Tokenizing and parsing commands",
      "part": 4,
      "number": 23,
      "topics": [
        {
          "id": "1",
          "title": "Tokens, keywords, identifiers, and literals"
        },
        {
          "id": "2",
          "title": "Whitespace, quoted strings, and malformed input"
        },
        {
          "id": "3",
          "title": "A small SQL grammar"
        },
        {
          "id": "4",
          "title": "Building a statement representation"
        },
        {
          "id": "5",
          "title": "Clear syntax and validation errors"
        }
      ],
      "project": "Parse a small SQL subset and explain malformed statements.",
      "labs": []
    },
    {
      "id": "execution",
      "title": "Query execution",
      "part": 4,
      "number": 24,
      "topics": [
        {
          "id": "1",
          "title": "Table scans"
        },
        {
          "id": "2",
          "title": "Filtering with WHERE"
        },
        {
          "id": "3",
          "title": "Selecting columns"
        },
        {
          "id": "4",
          "title": "Ordering and limiting results"
        },
        {
          "id": "5",
          "title": "Simple aggregation"
        },
        {
          "id": "6",
          "title": "Separating parsing, validation, and execution"
        }
      ],
      "project": "Execute validated statements over an in-memory table.",
      "labs": []
    },
    {
      "id": "persistence",
      "title": "Persistent storage",
      "part": 4,
      "number": 25,
      "topics": [
        {
          "id": "1",
          "title": "Encoding a file header and schema"
        },
        {
          "id": "2",
          "title": "Serializing rows without dumping raw structs"
        },
        {
          "id": "3",
          "title": "Reading and writing fixed-size pages"
        },
        {
          "id": "4",
          "title": "Building a pager abstraction"
        },
        {
          "id": "5",
          "title": "Browser-backed files, import, and export"
        },
        {
          "id": "6",
          "title": "Testing truncated and corrupt input"
        }
      ],
      "project": "Persist rows through a pager and reject corrupt database input.",
      "labs": []
    },
    {
      "id": "pages",
      "title": "Organizing pages",
      "part": 5,
      "number": 26,
      "topics": [
        {
          "id": "1",
          "title": "Page IDs, headers, and record offsets"
        },
        {
          "id": "2",
          "title": "Fixed-length and variable-length records"
        },
        {
          "id": "3",
          "title": "Slotted pages"
        },
        {
          "id": "4",
          "title": "Free space and deleted records"
        },
        {
          "id": "5",
          "title": "A bounded page cache"
        },
        {
          "id": "6",
          "title": "Inspecting a database file visually"
        }
      ],
      "project": "Locate and manage records inside slotted storage pages.",
      "labs": []
    },
    {
      "id": "bplus-trees",
      "title": "B+ tree indexes",
      "part": 5,
      "number": 27,
      "topics": [
        {
          "id": "1",
          "title": "Why databases use page-oriented trees"
        },
        {
          "id": "2",
          "title": "Leaf pages and internal pages"
        },
        {
          "id": "3",
          "title": "Searching and ordered traversal"
        },
        {
          "id": "4",
          "title": "Inserting keys and splitting pages"
        },
        {
          "id": "5",
          "title": "Range queries and linked leaves"
        },
        {
          "id": "6",
          "title": "Deletion, redistribution, and merging"
        }
      ],
      "project": "Implement an ordered index that remains valid when pages split.",
      "labs": []
    },
    {
      "id": "planning",
      "title": "Choosing an execution plan",
      "part": 5,
      "number": 28,
      "topics": [
        {
          "id": "1",
          "title": "Table scans versus index lookups"
        },
        {
          "id": "2",
          "title": "Simple cost estimates and selectivity"
        },
        {
          "id": "3",
          "title": "Index-assisted filtering and ordering"
        },
        {
          "id": "4",
          "title": "Implementing EXPLAIN"
        },
        {
          "id": "5",
          "title": "Measuring page reads and comparisons"
        },
        {
          "id": "6",
          "title": "Optional: nested-loop joins"
        }
      ],
      "project": "Compare query plans using page reads and a simple cost model.",
      "labs": []
    },
    {
      "id": "recovery",
      "title": "Transactions and recovery",
      "part": 5,
      "number": 29,
      "topics": [
        {
          "id": "1",
          "title": "Atomicity, consistency, isolation, and durability"
        },
        {
          "id": "2",
          "title": "A single-writer transaction model"
        },
        {
          "id": "3",
          "title": "BEGIN, COMMIT, and ROLLBACK"
        },
        {
          "id": "4",
          "title": "Write-ahead logging"
        },
        {
          "id": "5",
          "title": "Recovery after an interrupted write"
        },
        {
          "id": "6",
          "title": "Browser storage guarantees and their limits"
        }
      ],
      "project": "Recover committed changes after simulated interruptions.",
      "labs": []
    },
    {
      "id": "ship",
      "title": "Final project: ship your database",
      "part": 5,
      "number": 30,
      "topics": [
        {
          "id": "1",
          "title": "End-to-end SQL tests"
        },
        {
          "id": "2",
          "title": "Property tests and fuzzing the parser"
        },
        {
          "id": "3",
          "title": "Fault injection and recovery tests"
        },
        {
          "id": "4",
          "title": "Benchmarks across growing datasets"
        },
        {
          "id": "5",
          "title": "Memory and resource audits"
        },
        {
          "id": "6",
          "title": "File-format documentation and compatibility"
        },
        {
          "id": "7",
          "title": "Exportable database files and a browser demonstration"
        }
      ],
      "project": "Ship a documented TinyDB build with tests, benchmarks, and exportable files.",
      "labs": []
    }
  ]
};
