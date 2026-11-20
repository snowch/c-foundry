// Original C Foundry teaching diagrams. Authored here from the course concepts;
// no third-party artwork, diagram layouts, fonts, or icon libraries are embedded.
(() => {
  const diagrams = {
  "build": {
    "title": "Source becomes a runnable program",
    "caption": "Preprocessing, compilation, linking, and execution have different jobs.",
    "description": "Start with main.c. Preprocessing expands includes and macros. Compilation translates the resulting C into object code. The linker resolves references between objects and libraries and produces a program. A native operating system or a Wasm runtime executes the result. A successful translation is separate from a successful run.",
    "kind": "flow",
    "data": [
      {
        "label": "1 · Source",
        "value": "main.c",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "2 · Preprocess",
        "value": "#include, macros",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "3 · Compile",
        "value": "object code",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "4 · Link",
        "value": "program + support",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "5 · Execute",
        "value": "output or error",
        "detail": "",
        "state": "normal"
      }
    ],
    "routes": [
      "first-program/1",
      "first-program/5",
      "larger-programs/1"
    ],
    "note": "The target determines whether the final program is native code or a WebAssembly module."
  },
  "by-value": {
    "title": "A parameter is a separate object",
    "caption": "Changing a copied integer does not change the caller’s integer.",
    "description": "Before the call, caller variable x contains 10. The function receives a copy, parameter n, also containing 10. Assigning 42 to n changes n alone; x remains 10.",
    "kind": "link",
    "data": [
      {
        "label": "Caller object",
        "value": "x = 10",
        "detail": "remains 10",
        "state": "normal"
      },
      {
        "label": "Parameter object",
        "value": "n: 10 → 42",
        "detail": "assignment changes the copy",
        "state": "normal"
      }
    ],
    "routes": [
      "functions/2"
    ],
    "note": "The arrow represents copying a value, not shared storage."
  },
  "string": {
    "title": "Length is different from storage size",
    "caption": "\"cat\" uses three character positions and one terminating zero.",
    "description": "The array word initialized with the string cat has four elements. Indices 0, 1, and 2 contain c, a, and t. Index 3 contains the terminating zero byte. strlen(word) is 3. sizeof word is 4 for this declared char array.",
    "kind": "cells",
    "data": {
      "cells": [
        {
          "label": "[0]",
          "value": "c",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "[1]",
          "value": "a",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "[2]",
          "value": "t",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "[3]",
          "value": "\\0",
          "detail": "end",
          "state": "boundary"
        }
      ]
    },
    "routes": [
      "arrays-strings/2",
      "arrays-strings/3"
    ],
    "note": "Here sizeof is applied to the actual array, not to a pointer parameter."
  },
  "half-open": {
    "title": "A half-open range includes lo and excludes hi",
    "caption": "For [2, 5), the candidate indices are 2, 3, and 4.",
    "description": "Six array positions are labelled 0 through 5. The half-open interval begins at lo equal to 2 and ends before hi equal to 5. Positions 2, 3, and 4 are candidates. Positions 0, 1, and 5 are outside this interval. The range contains hi minus lo, or three, elements.",
    "kind": "cells",
    "data": {
      "cells": [
        {
          "label": "[0]",
          "value": "out",
          "detail": "",
          "state": "muted"
        },
        {
          "label": "[1]",
          "value": "out",
          "detail": "",
          "state": "muted"
        },
        {
          "label": "[2]",
          "value": "lo",
          "detail": "in",
          "state": "active"
        },
        {
          "label": "[3]",
          "value": "keep",
          "detail": "",
          "state": "active"
        },
        {
          "label": "[4]",
          "value": "keep",
          "detail": "",
          "state": "active"
        },
        {
          "label": "[5]",
          "value": "hi",
          "detail": "out",
          "state": "boundary"
        }
      ]
    },
    "routes": [
      "pointers/3",
      "searching/3"
    ],
    "note": "This marks a valid search interval within a six-element array; hi is not an index to dereference in this interval."
  },
  "pointer": {
    "title": "A pointer stores an address",
    "caption": "Dereferencing p accesses the object designated by the address it holds.",
    "description": "An int object x has value 42. Pointer object p holds the address of x, written as &x. Following that address makes *p designate x. The pointer object and its target are different objects. A null or dangling pointer has no valid target to access.",
    "kind": "link",
    "data": [
      {
        "label": "Pointer object",
        "value": "p = &x",
        "detail": "holds an address",
        "state": "normal"
      },
      {
        "label": "Target object",
        "value": "x = 42",
        "detail": "*p designates x",
        "state": "normal"
      }
    ],
    "routes": [
      "pointers/1"
    ],
    "note": "Object boxes show relationships, not physical addresses or sizes."
  },
  "pointer-copy": {
    "title": "Copying a pointer can preserve a shared target",
    "caption": "The parameter has its own pointer value and still points to the caller’s object.",
    "description": "The caller’s pointer p and the function’s pointer parameter a are separate pointer objects holding the same address &x. Both designate caller object x. Writing *a changes x. Assigning a different address to a alone does not reassign p.",
    "kind": "converge",
    "data": {
      "sources": [
        {
          "label": "Caller pointer",
          "value": "p = &x",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "Copied parameter",
          "value": "a = &x",
          "detail": "",
          "state": "normal"
        }
      ],
      "target": {
        "label": "One shared target",
        "value": "x: 10 → 42",
        "detail": "write through *a",
        "state": "normal"
      }
    },
    "routes": [
      "pointers/2",
      "pointers/5"
    ],
    "note": "C still passes the pointer argument by value."
  },
  "automatic-lifetime": {
    "title": "Scope entry and object lifetime",
    "caption": "An ordinary automatic local object cannot be used after its lifetime ends.",
    "description": "On entry to its associated block, an ordinary non-VLA automatic object’s lifetime begins. Its name follows C scope rules, and a value must be initialized before it is read. Leaving the block ends that object’s lifetime. Keeping a pointer does not extend it.",
    "kind": "flow",
    "data": [
      {
        "label": "1 · Enter block",
        "value": "lifetime begins",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "2 · Initialize and use",
        "value": "read only initialized values",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "3 · Leave block",
        "value": "lifetime ends",
        "detail": "old pointers cannot be used",
        "state": "boundary"
      }
    ],
    "routes": [
      "functions/3",
      "allocation/1"
    ],
    "note": "This models non-VLA automatic objects, not a required physical stack layout. Static and allocated storage have different lifetime rules."
  },
  "free-alias": {
    "title": "Freeing storage does not clear every alias",
    "caption": "Once the allocation is released, both pointers lose their valid target.",
    "description": "Before free(p), p and borrowed alias q designate the same live allocation. After free(p), that allocation’s lifetime has ended. Neither p nor q may be dereferenced. free does not automatically assign a null pointer to those variables.",
    "kind": "lanes",
    "data": [
      {
        "label": "Before free(p)",
        "cards": [
          {
            "label": "Owner",
            "value": "p",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Borrowed alias",
            "value": "q = p",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Target",
            "value": "live allocation",
            "detail": "may be used",
            "state": "normal"
          }
        ]
      },
      {
        "label": "After free(p)",
        "cards": [
          {
            "label": "Old pointer",
            "value": "p",
            "detail": "do not dereference",
            "state": "boundary"
          },
          {
            "label": "Old alias",
            "value": "q",
            "detail": "do not dereference",
            "state": "boundary"
          },
          {
            "label": "Old target",
            "value": "lifetime ended",
            "detail": "",
            "state": "muted"
          }
        ]
      }
    ],
    "routes": [
      "allocation/4",
      "lists/4"
    ],
    "note": ""
  },
  "realloc": {
    "title": "Reallocation has two different outcomes",
    "caption": "For a nonzero size, failure preserves the original allocation.",
    "description": "Call realloc with an existing valid allocation p and a checked nonzero new size, storing the result in tmp. On success, tmp identifies the resized allocation, which may have moved; assign p = tmp and stop using old aliases. On failure, tmp is null and the original allocation is still owned through p.",
    "kind": "branch",
    "data": {
      "root": {
        "label": "Checked nonzero size",
        "value": "tmp = realloc(p, bytes)",
        "detail": "",
        "state": "normal"
      },
      "children": [
        {
          "label": "Success",
          "value": "p = tmp",
          "detail": "old aliases are invalid",
          "state": "active"
        },
        {
          "label": "Failure",
          "value": "tmp == NULL",
          "detail": "original p remains valid",
          "state": "boundary"
        }
      ]
    },
    "routes": [
      "allocation/2",
      "allocation/3"
    ],
    "note": "Check size arithmetic before the call. Zero-size requests have different rules and are excluded from this model."
  },
  "builder": {
    "title": "A string builder reserves space for its terminator",
    "caption": "Length counts content; capacity includes every allocated character position.",
    "description": "A six-character allocation stores c, a, t, a zero terminator, and two spare positions. The string length is three and the capacity is six. Appending content must leave a position for the terminator, and uninitialized spare positions must not be read.",
    "kind": "cells",
    "data": {
      "cells": [
        {
          "label": "[0]",
          "value": "c",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "[1]",
          "value": "a",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "[2]",
          "value": "t",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "[3]",
          "value": "\\0",
          "detail": "end",
          "state": "boundary"
        },
        {
          "label": "[4]",
          "value": "spare",
          "detail": "not content",
          "state": "muted"
        },
        {
          "label": "[5]",
          "value": "spare",
          "detail": "not content",
          "state": "muted"
        }
      ]
    },
    "routes": [
      "allocation/5"
    ],
    "note": "Illustrative state: length = 3 and capacity = 6."
  },
  "vector": {
    "title": "Length and capacity answer different questions",
    "caption": "Only the live prefix contains elements belonging to the vector.",
    "description": "A vector has capacity four and length two. Positions 0 and 1 contain initialized elements 7 and 9. Positions 2 and 3 are spare capacity, not live vector elements. Appending can initialize a spare position; growing may reallocate the storage.",
    "kind": "cells",
    "data": {
      "cells": [
        {
          "label": "[0]",
          "value": "7",
          "detail": "live",
          "state": "active"
        },
        {
          "label": "[1]",
          "value": "9",
          "detail": "live",
          "state": "active"
        },
        {
          "label": "[2]",
          "value": "spare",
          "detail": "not a live element",
          "state": "muted"
        },
        {
          "label": "[3]",
          "value": "spare",
          "detail": "not a live element",
          "state": "muted"
        }
      ]
    },
    "routes": [
      "lists/1"
    ],
    "note": "Spare capacity is not permission to read uninitialized values."
  },
  "padding": {
    "title": "Object layout is not a portable file format",
    "caption": "Padding can separate members even when the source lists them together.",
    "description": "One possible layout for a struct containing char tag followed by int value has tag at byte offset 0, padding at offsets 1 through 3, and value at offsets 4 through 7. Its size is eight bytes on this illustrative target. Other implementations can use different int sizes, alignment, and padding.",
    "kind": "segments",
    "data": [
      {
        "label": "Byte 0",
        "value": "tag",
        "detail": "1 byte",
        "state": "normal"
      },
      {
        "label": "Bytes 1–3",
        "value": "padding",
        "detail": "3 bytes",
        "state": "boundary"
      },
      {
        "label": "Bytes 4–7",
        "value": "value",
        "detail": "4 bytes",
        "state": "normal"
      }
    ],
    "routes": [
      "structured-data/3"
    ],
    "note": "Illustrative target: 8-bit bytes, a 4-byte int, and 4-byte int alignment. Inspect sizeof and offsetof on the actual target. Boxes are not to scale."
  },
  "unsigned": {
    "title": "Unsigned wrap and signed overflow are different",
    "caption": "Only the unsigned result is defined to wrap modulo its type’s range.",
    "description": "Adding unsigned 1 to UINT_MAX yields unsigned zero by modular arithmetic. Evaluating signed INT_MAX plus signed 1 exceeds the signed int range and has undefined behavior. Do not evaluate that signed expression to test whether it overflowed; check beforehand.",
    "kind": "lanes",
    "data": [
      {
        "label": "Unsigned arithmetic",
        "cards": [
          {
            "label": "Largest value",
            "value": "UINT_MAX",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Operation",
            "value": "+ 1u",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Defined result",
            "value": "0",
            "detail": "wraps modulo UINT_MAX + 1",
            "state": "active"
          }
        ]
      },
      {
        "label": "Signed arithmetic",
        "cards": [
          {
            "label": "Largest value",
            "value": "INT_MAX",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Operation",
            "value": "+ 1",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Out of range",
            "value": "undefined behavior",
            "detail": "check before evaluating",
            "state": "boundary"
          }
        ]
      }
    ],
    "routes": [
      "values/5",
      "c-guarantees/1",
      "c-guarantees/6"
    ],
    "note": "No particular int width is assumed."
  },
  "short-circuit": {
    "title": "A guard can prevent an invalid operation",
    "caption": "&& evaluates its right operand only if its left operand is true.",
    "description": "For divisor != 0 && total / divisor > 2, first test the divisor. If it is zero, the whole expression is false and the division is not evaluated. If it is nonzero, the division expression is evaluated next, so it must also be valid for those operand values.",
    "kind": "branch",
    "data": {
      "root": {
        "label": "Evaluate first",
        "value": "divisor != 0",
        "detail": "",
        "state": "normal"
      },
      "children": [
        {
          "label": "False",
          "value": "skip division",
          "detail": "whole expression is false",
          "state": "boundary"
        },
        {
          "label": "True",
          "value": "evaluate division",
          "detail": "then test its result",
          "state": "active"
        }
      ]
    },
    "routes": [
      "control-flow/2"
    ],
    "note": "This guard addresses division by zero. Signed INT_MIN / -1 also needs its own range check."
  },
  "binary-search": {
    "title": "Sorted order lets us discard a whole region",
    "caption": "When the middle value is too small, all earlier values are too small as well.",
    "description": "Search the sorted values 2, 5, 8, 12, 16, 23, 38, 56 for 23. The first midpoint is index 3, value 12. Discard indices 0 through 3. Candidates at indices 4 through 7 are 16, 23, 38, and 56. Their next midpoint is index 5, value 23, which matches.",
    "kind": "lanes",
    "data": [
      {
        "label": "First comparison: 12 < 23",
        "cards": [
          {
            "label": "Indices 0–3",
            "value": "2, 5, 8, 12",
            "detail": "discard",
            "state": "muted"
          },
          {
            "label": "Indices 4–7",
            "value": "16, 23, 38, 56",
            "detail": "keep searching",
            "state": "active"
          }
        ]
      },
      {
        "label": "Next comparison",
        "cards": [
          {
            "label": "Midpoint",
            "value": "index 5",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Found value",
            "value": "23",
            "detail": "return the index",
            "state": "active"
          }
        ]
      }
    ],
    "routes": [
      "searching/2"
    ],
    "note": "The example uses an inclusive upper bound. Half-open bounds need their own consistent updates."
  },
  "growth": {
    "title": "Doubling the input changes the amount of work",
    "caption": "This search trace illustrates linear growth versus logarithmic growth.",
    "description": "Search a sorted array for its last element. At eight elements, linear search takes eight comparisons and this binary search takes four. At sixteen elements, linear search takes sixteen and binary search takes five. These are counts for this specified trace, not definitions of Big O or measured execution times.",
    "kind": "comparison",
    "data": {
      "headings": [
        "Input size",
        "Linear search",
        "Binary search"
      ],
      "rows": [
        [
          "8 elements",
          "8 comparisons",
          "4 comparisons"
        ],
        [
          "16 elements",
          "16 comparisons",
          "5 comparisons"
        ]
      ]
    },
    "routes": [
      "big-o/1",
      "big-o/3",
      "big-o/7"
    ],
    "note": "Counts use the course’s inclusive-bound binary search for the last element; other inputs can take fewer comparisons."
  },
  "merge": {
    "title": "Merge consumes the smaller next value",
    "caption": "Two sorted inputs can be combined into one sorted output.",
    "description": "The left input is 2, 7 and the right input is 3, 9. Compare their current first unconsumed values. Take 2, then 3, then 7, then the remaining 9. The output prefix stays sorted. On equality, choosing the left input first preserves relative order in a stable merge.",
    "kind": "converge",
    "data": {
      "sources": [
        {
          "label": "Left input",
          "value": "2, 7",
          "detail": "already sorted",
          "state": "normal"
        },
        {
          "label": "Right input",
          "value": "3, 9",
          "detail": "already sorted",
          "state": "normal"
        }
      ],
      "target": {
        "label": "Merged output",
        "value": "2, 3, 7, 9",
        "detail": "take the smaller next value",
        "state": "normal"
      }
    },
    "routes": [
      "sorting/2",
      "sorting/4"
    ],
    "note": ""
  },
  "recursion": {
    "title": "Recursive calls keep unfinished work",
    "caption": "Each call waits for the smaller subproblem to return.",
    "description": "factorial(3) needs 3 times factorial(2). factorial(2) needs 2 times factorial(1). The base case factorial(1) returns 1. Unwinding returns 2 to the waiting outer call, which returns 6. Each active call has its own local state.",
    "kind": "flow",
    "data": [
      {
        "label": "1 · Call",
        "value": "factorial(3)",
        "detail": "wait for 3 × result",
        "state": "normal"
      },
      {
        "label": "2 · Call",
        "value": "factorial(2)",
        "detail": "wait for 2 × result",
        "state": "normal"
      },
      {
        "label": "3 · Base case",
        "value": "factorial(1) = 1",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "4 · Return",
        "value": "2, then 6",
        "detail": "unwind waiting calls",
        "state": "normal"
      }
    ],
    "routes": [
      "recursion/1",
      "recursion/2"
    ],
    "note": "This illustrates the course’s small checked factorial domain, not an arbitrary-precision calculation."
  },
  "linked-list": {
    "title": "The links define the traversal order",
    "caption": "Nodes do not need to be adjacent in storage.",
    "description": "The head pointer designates the first node, whose value is 4. Its next pointer designates a different node with value 9. That node’s next pointer is null, so traversal ends. The arrows represent stored pointers, not physical adjacency.",
    "kind": "link",
    "data": [
      {
        "label": "Head target",
        "value": "value 4",
        "detail": "next points to node 9",
        "state": "normal"
      },
      {
        "label": "Next node",
        "value": "value 9",
        "detail": "next = NULL",
        "state": "normal"
      }
    ],
    "routes": [
      "lists/2",
      "lists/3"
    ],
    "note": "Removal must repair the appropriate link before releasing a removed node."
  },
  "fifo": {
    "title": "A queue removes the oldest waiting item",
    "caption": "FIFO behavior is independent of how the queue stores its elements.",
    "description": "Three waiting items are shown in logical removal order: A first, then B, then C. The next dequeue returns A. If an enqueue accepts D, it joins after C. A ring-buffer implementation can store this order across the end of its physical array.",
    "kind": "cells",
    "data": {
      "cells": [
        {
          "label": "Remove next",
          "value": "A",
          "detail": "front",
          "state": "active"
        },
        {
          "label": "Then",
          "value": "B",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "Newest waiting",
          "value": "C",
          "detail": "back",
          "state": "normal"
        },
        {
          "label": "Enqueue next",
          "value": "D",
          "detail": "after C, if admitted",
          "state": "boundary"
        }
      ]
    },
    "routes": [
      "queues/1"
    ],
    "note": "These are logical positions. Array indices can wrap around in a circular buffer."
  },
  "hash-collision": {
    "title": "Two keys can start at the same bucket",
    "caption": "A collision policy decides where the second key goes.",
    "description": "In a five-slot linear-probing table with bucket(key) equal to key modulo five, keys 1 and 6 both start at slot 1. Insert 1 at slot 1. Probing forward puts 6 in slot 2. A later lookup for 6 must follow the same probe sequence rather than stopping at slot 1.",
    "kind": "cells",
    "data": {
      "cells": [
        {
          "label": "Slot 0",
          "value": "empty",
          "detail": "",
          "state": "muted"
        },
        {
          "label": "Slot 1",
          "value": "key 1",
          "detail": "1 mod 5 = 1",
          "state": "active"
        },
        {
          "label": "Slot 2",
          "value": "key 6",
          "detail": "6 mod 5 = 1",
          "state": "active"
        },
        {
          "label": "Slot 3",
          "value": "empty",
          "detail": "",
          "state": "muted"
        },
        {
          "label": "Slot 4",
          "value": "empty",
          "detail": "",
          "state": "muted"
        }
      ]
    },
    "routes": [
      "hash-tables/2",
      "hash-tables/3"
    ],
    "note": "Illustrative five-slot table; this does not promise constant worst-case lookup cost."
  },
  "tombstone": {
    "title": "A deleted slot must not break a probe chain",
    "caption": "A tombstone keeps the search moving toward colliding keys.",
    "description": "Keys 1 and 6 originally collided at slot 1 in a five-slot linear-probing table. After deleting 1, mark slot 1 as deleted. Searching for 6 continues through that tombstone and finds key 6 at slot 2. Changing slot 1 to never-used empty would incorrectly stop this lookup.",
    "kind": "cells",
    "data": {
      "cells": [
        {
          "label": "Slot 0",
          "value": "empty",
          "detail": "",
          "state": "muted"
        },
        {
          "label": "Slot 1",
          "value": "DEL",
          "detail": "keep probing",
          "state": "boundary"
        },
        {
          "label": "Slot 2",
          "value": "key 6",
          "detail": "still reachable",
          "state": "active"
        },
        {
          "label": "Slot 3",
          "value": "empty",
          "detail": "can stop here",
          "state": "muted"
        },
        {
          "label": "Slot 4",
          "value": "empty",
          "detail": "",
          "state": "muted"
        }
      ]
    },
    "routes": [
      "hash-tables/4"
    ],
    "note": ""
  },
  "bst": {
    "title": "A search tree routes by ordered keys",
    "caption": "For this tree, smaller keys go left and larger keys go right.",
    "description": "The root key is 20. Its left child has key 8 and its right child has key 32. Searching for 8 follows the less-than branch; searching for 32 follows the greater-than branch. This shows the ordering property, not a guarantee of balanced height.",
    "kind": "branch",
    "data": {
      "root": {
        "label": "Root",
        "value": "20",
        "detail": "",
        "state": "normal"
      },
      "children": [
        {
          "label": "Less than 20",
          "value": "8",
          "detail": "left subtree",
          "state": "normal"
        },
        {
          "label": "Greater than 20",
          "value": "32",
          "detail": "right subtree",
          "state": "normal"
        }
      ]
    },
    "routes": [
      "trees-heaps/2"
    ],
    "note": "A plain binary search tree can become a chain; the ordering rule alone does not bound its height."
  },
  "heap": {
    "title": "A min-heap orders parents before children",
    "caption": "Sibling positions do not imply a fully sorted sequence.",
    "description": "A three-element min-heap has root priority 2, left child priority 8, and right child priority 5. The root is no larger than either child. The siblings need not be ordered relative to one another. Removing the minimum requires repairing the heap after moving another element into the root.",
    "kind": "branch",
    "data": {
      "root": {
        "label": "Minimum priority",
        "value": "2",
        "detail": "",
        "state": "normal"
      },
      "children": [
        {
          "label": "Left child",
          "value": "8",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "Right child",
          "value": "5",
          "detail": "",
          "state": "normal"
        }
      ]
    },
    "routes": [
      "trees-heaps/5",
      "trees-heaps/6",
      "graphs/6"
    ],
    "note": "This is a priority-queue property, not the binary-search-tree ordering property."
  },
  "graph": {
    "title": "One graph can have several routes to a vertex",
    "caption": "Traversal tracks visited vertices so shared destinations are handled deliberately.",
    "description": "The directed edges are A to B, A to C, B to D, and C to D. Breadth-first search from A reaches level zero A, level one B and C, then level two D. D has two incoming routes but is not two different vertices. The graph is acyclic, so A before B and C before D is also a valid dependency order.",
    "kind": "fork-join",
    "data": {
      "start": {
        "label": "Level 0",
        "value": "A",
        "detail": "",
        "state": "normal"
      },
      "middle": [
        {
          "label": "Level 1",
          "value": "B",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "Level 1",
          "value": "C",
          "detail": "",
          "state": "normal"
        }
      ],
      "end": {
        "label": "Level 2",
        "value": "D",
        "detail": "one shared vertex",
        "state": "normal"
      }
    },
    "routes": [
      "graphs/1",
      "graphs/2",
      "graphs/4"
    ],
    "note": "Edges point from each level to the next. B and C have no ordering edge between them."
  },
  "query": {
    "title": "A query passes through distinct responsibilities",
    "caption": "Parsing syntax is different from validating and executing it.",
    "description": "A SQL source string is tokenized and parsed into a statement representation. Validation checks supported operations and schema rules. Planning chooses a strategy such as a scan or index lookup. Execution performs that strategy and produces rows or an error. These boxes name responsibilities; small implementations can combine some stages.",
    "kind": "flow",
    "data": [
      {
        "label": "1 · Input",
        "value": "SQL text",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "2 · Parse",
        "value": "statement",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "3 · Validate",
        "value": "supported + meaningful",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "4 · Plan",
        "value": "scan or index",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "5 · Execute",
        "value": "rows or error",
        "detail": "",
        "state": "normal"
      }
    ],
    "routes": [
      "database-foundations/2",
      "parsing/4",
      "execution/6",
      "planning/4",
      "richer-queries/3"
    ],
    "note": "A conceptual pipeline, not evidence that every SQL feature or optimizer transformation is implemented."
  },
  "bytes": {
    "title": "A file format chooses its byte order",
    "caption": "The same unsigned value can be encoded independently of host layout.",
    "description": "Encoding the value 513 as an unsigned four-byte little-endian field produces bytes 01, 02, 00, 00 in hexadecimal at offsets 0, 1, 2, and 3. The least significant byte is first. A decoder reconstructs 1 plus 2 times 256, giving 513; it does not copy a raw host struct.",
    "kind": "cells",
    "data": {
      "cells": [
        {
          "label": "Byte 0",
          "value": "01",
          "detail": "hex",
          "state": "normal"
        },
        {
          "label": "Byte 1",
          "value": "02",
          "detail": "hex",
          "state": "normal"
        },
        {
          "label": "Byte 2",
          "value": "00",
          "detail": "hex",
          "state": "normal"
        },
        {
          "label": "Byte 3",
          "value": "00",
          "detail": "hex",
          "state": "normal"
        }
      ]
    },
    "routes": [
      "files-bytes/3",
      "files-bytes/6",
      "persistence/2",
      "portable-c/2",
      "hardening-tinydb/2"
    ],
    "note": "Illustrative uint32_t field in a format requiring 8-bit bytes. This is not the complete row or file header."
  },
  "slots": {
    "title": "A slot is an indirection to record bytes",
    "caption": "Moving a live record changes its offset, not necessarily its slot number.",
    "description": "Before compaction, live slot 0 points to record A at illustrative byte offset 96. After compaction moves A to offset 72, slot 0 is updated to point to the same record at 72. A locator using the page ID and live slot 0 can still find A. Deleting and reusing that slot is a separate identity problem.",
    "kind": "lanes",
    "data": [
      {
        "label": "Before compaction",
        "cards": [
          {
            "label": "Live directory entry",
            "value": "slot 0 → offset 96",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Payload",
            "value": "record A",
            "detail": "at byte 96",
            "state": "normal"
          }
        ]
      },
      {
        "label": "After compaction",
        "cards": [
          {
            "label": "Updated directory entry",
            "value": "slot 0 → offset 72",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Same payload",
            "value": "record A",
            "detail": "now at byte 72",
            "state": "normal"
          }
        ]
      }
    ],
    "routes": [
      "pages/1",
      "pages/3",
      "pages/4"
    ],
    "note": "Offsets are illustrative. Slot reuse can make an old locator refer to a different record."
  },
  "cache": {
    "title": "A cache lookup has a hit path and a miss path",
    "caption": "The cache is a bounded copy of selected backing pages.",
    "description": "Look up a page ID in the cache. A hit uses the resident copy. A miss must obtain the page from backing storage and install it in a cache slot, potentially evicting another page. Dirty pages need a writeback and error-handling policy before their storage is reused.",
    "kind": "branch",
    "data": {
      "root": {
        "label": "Lookup",
        "value": "page ID in cache?",
        "detail": "",
        "state": "normal"
      },
      "children": [
        {
          "label": "Hit",
          "value": "use resident copy",
          "detail": "no backing read for this lookup",
          "state": "active"
        },
        {
          "label": "Miss",
          "value": "load and install page",
          "detail": "choose a cache slot",
          "state": "boundary"
        }
      ]
    },
    "routes": [
      "pages/5",
      "reliability/2"
    ],
    "note": "A hit is not a durability guarantee. Dirty eviction and concurrency need additional protocols."
  },
  "bplus-split": {
    "title": "A leaf split creates two searchable key ranges",
    "caption": "Five entries become two in the left leaf and three in the right leaf.",
    "description": "An illustrative overflowing leaf contains keys 4, 9, 15, 22, 31. Split it into left leaf 4, 9 and right leaf 15, 22, 31. A routing boundary at 15 sends keys below 15 left and keys at or above 15 right. The left leaf’s next link points to the right leaf for ordered scans.",
    "kind": "branch",
    "data": {
      "root": {
        "label": "Routing boundary",
        "value": "15",
        "detail": "left < 15; right ≥ 15",
        "state": "normal"
      },
      "children": [
        {
          "label": "Left leaf",
          "value": "4, 9",
          "detail": "next → right leaf",
          "state": "normal"
        },
        {
          "label": "Right leaf",
          "value": "15, 22, 31",
          "detail": "continues ordered leaf chain",
          "state": "normal"
        }
      ]
    },
    "routes": [
      "bplus-trees/4",
      "bplus-trees/5"
    ],
    "note": "This illustrates one leaf split, not every internal split, root-growth, or deletion case."
  },
  "transaction": {
    "title": "A private working copy can commit or roll back",
    "caption": "Uncommitted edits do not replace the live table in this model.",
    "description": "The live table starts with a score of 10. Begin copies it into a private working table. Editing changes the working score to 42 while live remains 10. Commit publishes the working table, making live 42. Rollback discards the working changes and leaves live 10.",
    "kind": "branch",
    "data": {
      "root": {
        "label": "Uncommitted edit",
        "value": "live = 10; working = 42",
        "detail": "",
        "state": "normal"
      },
      "children": [
        {
          "label": "Commit",
          "value": "live becomes 42",
          "detail": "publish working state",
          "state": "active"
        },
        {
          "label": "Rollback",
          "value": "live stays 10",
          "detail": "discard working changes",
          "state": "boundary"
        }
      ]
    },
    "routes": [
      "recovery/1",
      "recovery/2",
      "recovery/3",
      "multi-client/2"
    ],
    "note": "An in-process, single-writer model. Publication alone provides neither crash durability nor concurrent isolation."
  },
  "redo": {
    "title": "Recovery keeps committed work and ignores an incomplete tail",
    "caption": "A complete commit record separates published work from tentative work.",
    "description": "Read a log containing BEGIN, SET score to 42, COMMIT, then a second BEGIN and SET score to 99 with no complete matching COMMIT. Recovery applies the first transaction. It ignores the incomplete second transaction, so the recovered score is 42. A short or invalid tail must be handled according to the log format.",
    "kind": "lanes",
    "data": [
      {
        "label": "Complete transaction · keep",
        "cards": [
          {
            "label": "Begin",
            "value": "BEGIN",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Tentative change",
            "value": "SET 42",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Boundary",
            "value": "COMMIT",
            "detail": "",
            "state": "active"
          }
        ]
      },
      {
        "label": "Incomplete transaction · ignore",
        "cards": [
          {
            "label": "Begin",
            "value": "BEGIN",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Tentative change",
            "value": "SET 99",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Tail",
            "value": "no complete COMMIT",
            "detail": "",
            "state": "boundary"
          }
        ]
      }
    ],
    "routes": [
      "recovery/4",
      "recovery/5",
      "ship/3",
      "maintenance/1"
    ],
    "note": "These are logical records, not their byte encoding. Checksums and host write ordering require separate mechanisms."
  },
  "portable-boundary": {
    "title": "Keep the portable rules behind an explicit host boundary",
    "caption": "The same data contract can have different storage adapters.",
    "description": "A portable core defines encoding, validation, and data-operation rules. It calls an explicit host interface for storage and environment-dependent behavior. Separate adapters implement that interface for native files, browser storage, or a test fixture. Each adapter must document its actual failure and durability guarantees.",
    "kind": "branch",
    "data": {
      "root": {
        "label": "Portable core",
        "value": "validate + encode + operate",
        "detail": "calls an explicit host interface",
        "state": "normal"
      },
      "children": [
        {
          "label": "Native adapter",
          "value": "file operations",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "Browser adapter",
          "value": "browser storage",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "Test adapter",
          "value": "controlled failures",
          "detail": "",
          "state": "normal"
        }
      ]
    },
    "routes": [
      "portable-c/1",
      "portable-c/4",
      "hardening-tinydb/5"
    ],
    "note": "Adapters do not make every OS API portable; their contracts must be implemented and tested for each target."
  },
  "narrowing": {
    "title": "Check the destination range before converting",
    "caption": "A defined conversion can still violate the application’s input policy.",
    "description": "For an implementation providing uint8_t, the representable range is zero through 255. A checked conversion accepts input 200 and converts it. It rejects input 300 before casting. Converting 300 directly to uint8_t would produce 44 modulo 256; rejection is the checked API’s chosen contract.",
    "kind": "branch",
    "data": {
      "root": {
        "label": "Check original value",
        "value": "0 ≤ value ≤ 255?",
        "detail": "",
        "state": "normal"
      },
      "children": [
        {
          "label": "200 · in range",
          "value": "convert to uint8_t",
          "detail": "preserve the value",
          "state": "active"
        },
        {
          "label": "300 · out of range",
          "value": "reject before casting",
          "detail": "preserve prior output",
          "state": "boundary"
        }
      ]
    },
    "routes": [
      "c-guarantees/5"
    ],
    "note": "This assumes uint8_t exists. It is not a claim that every narrowing conversion is undefined."
  },
  "mutex": {
    "title": "Mutual exclusion protects a complete critical section",
    "caption": "Every participating access must follow the same locking contract.",
    "description": "Thread A locks mutex m, reads and updates shared state, then unlocks m. Thread B must acquire that same mutex before accessing the protected state. If A holds m, B waits to acquire it. The mutex must cover the complete invariant-changing operation, not just one convenient line.",
    "kind": "lanes",
    "data": [
      {
        "label": "Thread A",
        "cards": [
          {
            "label": "Acquire",
            "value": "lock m",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Critical section",
            "value": "read + update",
            "detail": "holds m",
            "state": "active"
          },
          {
            "label": "Release",
            "value": "unlock m",
            "detail": "",
            "state": "normal"
          }
        ]
      },
      {
        "label": "Thread B",
        "cards": [
          {
            "label": "While A holds m",
            "value": "wait to acquire m",
            "detail": "",
            "state": "boundary"
          },
          {
            "label": "After acquiring m",
            "value": "access shared state",
            "detail": "holds m",
            "state": "active"
          },
          {
            "label": "Release",
            "value": "unlock m",
            "detail": "",
            "state": "normal"
          }
        ]
      }
    ],
    "routes": [
      "threads/3",
      "coordination/1"
    ],
    "note": "Mutual exclusion requires all relevant accesses to use the protocol. Unsynchronized ordinary C data races have undefined behavior."
  },
  "condition": {
    "title": "Wake up, reacquire, and recheck the predicate",
    "caption": "A condition-variable wakeup is not a stored promise that work is available.",
    "description": "With the queue mutex held, check whether the queue has an item or is closed. If waiting is needed, the condition-variable wait releases that mutex and blocks. Before the wait returns it reacquires the mutex. Recheck the predicate in a loop, then consume an item or handle the closed state while still holding the mutex.",
    "kind": "flow",
    "data": [
      {
        "label": "1 · Locked",
        "value": "check predicate",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "2 · Need to wait",
        "value": "release mutex + wait",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "3 · Wakeup",
        "value": "reacquire mutex",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "4 · Loop",
        "value": "recheck predicate",
        "detail": "consume only when allowed",
        "state": "normal"
      }
    ],
    "routes": [
      "coordination/2",
      "concurrent-storage/2"
    ],
    "note": "Spurious wakeups and competing consumers are reasons to recheck. Closed-and-empty needs an explicit exit path."
  },
  "deadlock": {
    "title": "Opposite lock orders can form a wait cycle",
    "caption": "Both threads can wait forever while retaining the lock the other needs.",
    "description": "Thread A holds lock L and waits for R. Thread B holds R and waits for L. Each thread needs the lock held by the other, forming a cycle. For these two locks, requiring all threads to acquire L before R prevents this opposite-order cycle.",
    "kind": "lanes",
    "data": [
      {
        "label": "Thread A",
        "cards": [
          {
            "label": "Already holds",
            "value": "L",
            "detail": "retains L",
            "state": "active"
          },
          {
            "label": "Waiting for",
            "value": "R",
            "detail": "held by B",
            "state": "boundary"
          }
        ]
      },
      {
        "label": "Thread B",
        "cards": [
          {
            "label": "Already holds",
            "value": "R",
            "detail": "retains R",
            "state": "active"
          },
          {
            "label": "Waiting for",
            "value": "L",
            "detail": "held by A",
            "state": "boundary"
          }
        ]
      }
    ],
    "routes": [
      "coordination/3"
    ],
    "note": "A global lock order addresses this cycle; shutdown, external resources, and other wait dependencies still need analysis."
  },
  "publication": {
    "title": "Release/acquire can publish earlier writes",
    "caption": "The acquiring load must observe the value from the releasing store.",
    "description": "A writer initializes payload, then stores true to ready with release ordering. A reader loads ready with acquire ordering. If that load reads the released true value, the release synchronizes with the acquire. The earlier payload write happens before the later reader access. Payload remains alive and is not changed again in this one-shot protocol.",
    "kind": "lanes",
    "data": [
      {
        "label": "Writer · program order",
        "cards": [
          {
            "label": "Before release",
            "value": "payload = 42",
            "detail": "",
            "state": "normal"
          },
          {
            "label": "Publish",
            "value": "store ready = true",
            "detail": "release",
            "state": "active"
          }
        ]
      },
      {
        "label": "Reader · program order",
        "cards": [
          {
            "label": "Observe publication",
            "value": "load ready == true",
            "detail": "acquire reads that release",
            "state": "active"
          },
          {
            "label": "After acquire",
            "value": "read payload",
            "detail": "sees the published 42",
            "state": "normal"
          }
        ]
      }
    ],
    "routes": [
      "atomics/1",
      "atomics/3"
    ],
    "note": "The ordering arrow between rows is conditional on that read-from relationship. Reusing the flag needs a new protocol.",
    "bridge": "If this acquire reads that release: synchronizes-with ↓"
  },
  "bounded-work": {
    "title": "A bounded queue separates admission from execution",
    "caption": "A single writer can own database mutations while callers submit work.",
    "description": "Producers submit requests to a queue with a fixed capacity. The single writer removes requests and performs database mutations. When the queue is full, the admission policy must block, reject, or otherwise apply a documented form of backpressure. Queue synchronization alone does not define transaction isolation or durable acknowledgement.",
    "kind": "flow",
    "data": [
      {
        "label": "1 · Submitters",
        "value": "requests",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "2 · Bounded queue",
        "value": "fixed capacity",
        "detail": "full → wait or reject",
        "state": "normal"
      },
      {
        "label": "3 · One writer",
        "value": "owns mutations",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "4 · Reply",
        "value": "result or error",
        "detail": "",
        "state": "normal"
      }
    ],
    "routes": [
      "concurrent-storage/3",
      "multi-client/1",
      "multi-client/3"
    ],
    "note": "The capacity policy and acknowledgement point must be explicit parts of the interface."
  },
  "lost-update": {
    "title": "Safe individual accesses can still lose a transaction’s update",
    "caption": "The full read–modify–write operation needs a suitable isolation contract.",
    "description": "Two transactions both read balance 100. Transaction A computes 110 and later writes 110. Transaction B computes 120 from its stale value 100 and writes 120 after A. The final result is 120, so A’s addition of 10 has been lost; a correctly serialized pair of additions would yield 130.",
    "kind": "comparison",
    "data": {
      "headings": [
        "Step",
        "Transaction A",
        "Transaction B"
      ],
      "rows": [
        [
          "Read",
          "100",
          "100"
        ],
        [
          "Compute",
          "100 + 10 = 110",
          "100 + 20 = 120"
        ],
        [
          "Write order",
          "write 110 first",
          "write 120 second"
        ],
        [
          "Final state",
          "A’s update lost",
          "balance = 120"
        ]
      ]
    },
    "routes": [
      "isolation/2"
    ],
    "note": "A conceptual schedule with individually safe accesses. It does not predict the result of an ordinary C data race, which has undefined behavior."
  },
  "snapshot": {
    "title": "A snapshot chooses a visible committed version",
    "caption": "Creation is inclusive; deletion is exclusive in this model.",
    "description": "An older committed version has value 10, created at timestamp 1 and deleted at 3. A newer committed version has value 42, created at 3 and not deleted. Snapshot 2 sees value 10. Snapshot 3 does not see the old version because 3 is not less than its deleted timestamp; it sees value 42.",
    "kind": "comparison",
    "data": {
      "headings": [
        "Committed version",
        "Visible interval",
        "Reader sees"
      ],
      "rows": [
        [
          "value 10",
          "1 ≤ snapshot < 3",
          "snapshot 2 → 10"
        ],
        [
          "value 42",
          "3 ≤ snapshot",
          "snapshot 3 → 42"
        ]
      ]
    },
    "routes": [
      "snapshots/1",
      "snapshots/2",
      "snapshots/3",
      "isolation/3"
    ],
    "note": "Only committed immutable versions are shown. Conflict handling and safe reclamation are separate responsibilities."
  },
  "checkpoint": {
    "title": "Checkpoint before retiring recovery information",
    "caption": "Log retirement depends on persisted state and the readers that still need it.",
    "description": "A checkpoint determines which logged changes are eligible, writes the required database state and recovery metadata, and establishes the host-specific persistence boundary. Only log or version data no longer needed for recovery or active readers can then be retired. A successful in-memory copy or stream flush alone does not establish this protocol.",
    "kind": "flow",
    "data": [
      {
        "label": "1 · Determine",
        "value": "eligible log range",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "2 · Write",
        "value": "database state + metadata",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "3 · Establish",
        "value": "persistence boundary",
        "detail": "",
        "state": "normal"
      },
      {
        "label": "4 · Retire",
        "value": "only data no longer needed",
        "detail": "",
        "state": "normal"
      }
    ],
    "routes": [
      "maintenance/2"
    ],
    "note": "A high-level dependency model, not a complete filesystem durability algorithm."
  },
  "feature-probe": {
    "title": "Select a facility using evidence from the actual toolchain",
    "caption": "A supported language mode and an available library API are separate checks.",
    "description": "Start with a required facility and the chosen C language baseline. Compile and, where necessary, link a small probe against the actual compiler and libraries. If supported, use the documented feature path. Otherwise select a tested fallback or report an unsupported target. A compiler name or revision macro alone is not sufficient evidence.",
    "kind": "branch",
    "data": {
      "root": {
        "label": "Probe exact facility",
        "value": "compile + link where needed",
        "detail": "",
        "state": "normal"
      },
      "children": [
        {
          "label": "Supported",
          "value": "use documented path",
          "detail": "retain its contract",
          "state": "active"
        },
        {
          "label": "Unsupported",
          "value": "fallback or reject",
          "detail": "do not silently change semantics",
          "state": "boundary"
        }
      ]
    },
    "routes": [
      "standards-evolution/3",
      "portable-c/3"
    ],
    "note": ""
  },
  "array-bounds": {
    "title": "A four-element array has indices 0 through 3",
    "caption": "Index 4 is the boundary, not another element.",
    "description": "A four-element array has values 3, 6, 9, and 12 at indices 0, 1, 2, and 3. Index 4 lies just past its end and cannot be read or written as an element. The dashed boundary box is a marker, not additional allocated array storage.",
    "kind": "cells",
    "data": {
      "cells": [
        {
          "label": "[0]",
          "value": "3",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "[1]",
          "value": "6",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "[2]",
          "value": "9",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "[3]",
          "value": "12",
          "detail": "",
          "state": "normal"
        },
        {
          "label": "Index 4",
          "value": "STOP",
          "detail": "not an element",
          "state": "boundary"
        }
      ]
    },
    "routes": [
      "arrays-strings/1"
    ],
    "note": "A one-past pointer may be formed for allowed operations, but it must not be dereferenced."
  },
  "record-table": {
    "title": "The row count identifies the valid prefix",
    "caption": "Capacity describes available slots; count describes rows actually stored.",
    "description": "An illustrative Table has eight row slots and count equal to two. Slot rows[0] contains ID 1, name Ada, score 90. Slot rows[1] contains ID 2, name Grace, score 80. The remaining six slots are spare capacity and must not be treated as six additional rows.",
    "kind": "branch",
    "data": {
      "root": {
        "label": "Table",
        "value": "count = 2; capacity = 8",
        "detail": "",
        "state": "normal"
      },
      "children": [
        {
          "label": "rows[0]",
          "value": "1 | Ada | 90",
          "detail": "live row",
          "state": "active"
        },
        {
          "label": "rows[1]",
          "value": "2 | Grace | 80",
          "detail": "live row",
          "state": "active"
        },
        {
          "label": "Slots 2–7",
          "value": "spare capacity",
          "detail": "not six more rows",
          "state": "muted"
        }
      ]
    },
    "routes": [
      "structured-data/5",
      "database-foundations/1",
      "tables/1",
      "tables/2",
      "tables/3"
    ],
    "note": "Row fields and the capacity limit follow the course’s bounded in-memory table model."
  },
  "duplicate-bounds": {
    "title": "Bounds bracket every occurrence of an equal key",
    "caption": "Lower bound is the first not-less value; upper bound is the first greater value.",
    "description": "In the sorted values 2, 5, 5, 5, 9, the lower bound for 5 is index 1 and the upper bound is index 4. The equal values occupy the half-open interval [1, 4), with three elements. A matching midpoint alone does not establish the first or last occurrence.",
    "kind": "cells",
    "data": {
      "cells": [
        {
          "label": "[0]",
          "value": "2",
          "detail": "less than 5",
          "state": "muted"
        },
        {
          "label": "[1]",
          "value": "5",
          "detail": "lower bound",
          "state": "active"
        },
        {
          "label": "[2]",
          "value": "5",
          "detail": "equal",
          "state": "active"
        },
        {
          "label": "[3]",
          "value": "5",
          "detail": "equal",
          "state": "active"
        },
        {
          "label": "[4]",
          "value": "9",
          "detail": "upper bound",
          "state": "boundary"
        }
      ]
    },
    "routes": [
      "searching/4"
    ],
    "note": "For an absent value, equal lower and upper bounds describe an empty matching interval."
  },
  "ring-buffer": {
    "title": "Logical queue order can wrap across array index zero",
    "caption": "With capacity 4, the next position after index 3 is index 0.",
    "description": "A four-slot ring buffer has head index 3, count 3, and next insertion index 2. Item A at index 3 is removed first, then B at index 0, then C at index 1. Slot 2 is the free position for the next accepted enqueue. The index update is modulo the capacity.",
    "kind": "cells",
    "data": {
      "cells": [
        {
          "label": "[0]",
          "value": "B",
          "detail": "remove second",
          "state": "normal"
        },
        {
          "label": "[1]",
          "value": "C",
          "detail": "remove third",
          "state": "normal"
        },
        {
          "label": "[2]",
          "value": "free",
          "detail": "next enqueue",
          "state": "boundary"
        },
        {
          "label": "[3]",
          "value": "A",
          "detail": "remove first",
          "state": "active"
        }
      ]
    },
    "routes": [
      "queues/2"
    ],
    "note": "Logical order is 3 → 0 → 1. Here tail means the next insertion index; other APIs may choose different terminology."
  },
  "file-header": {
    "title": "A header tells a decoder how to read the following bytes",
    "caption": "The course format uses an explicit eight-byte header before the rows.",
    "description": "The example header has magic TDB1 at offsets 0 through 3, version 1 at offset 4, row width 40 at offset 5, row count 2 at offset 6, and reserved zero at offset 7. Two forty-byte rows follow the eight-byte header, giving an eighty-eight-byte example file. A decoder validates the header before loading rows.",
    "kind": "cells",
    "data": {
      "cells": [
        {
          "label": "Bytes 0–3",
          "value": "TDB1",
          "detail": "magic",
          "state": "normal"
        },
        {
          "label": "Byte 4",
          "value": "1",
          "detail": "version",
          "state": "normal"
        },
        {
          "label": "Byte 5",
          "value": "40",
          "detail": "row bytes",
          "state": "normal"
        },
        {
          "label": "Byte 6",
          "value": "2",
          "detail": "row count",
          "state": "normal"
        },
        {
          "label": "Byte 7",
          "value": "0",
          "detail": "reserved",
          "state": "normal"
        }
      ]
    },
    "routes": [
      "persistence/1"
    ],
    "note": "This is the course’s small TDB1 format with 8-bit bytes, not a raw C struct. Boxes are not proportional to field widths."
  },
  "recursion-levels": {
    "title": "Count calls at each split depth",
    "caption": "For eight elements, four depths contain fifteen calls and eight leaves.",
    "description": "Start with one call of size eight at depth zero. It creates two calls of size four at depth one, then four calls of size two at depth two, then eight calls of size one at depth three. Size-one calls are leaves. Adding the call counts gives fifteen; the final depth has eight leaves. The table counts calls, not elapsed time or merge operations.",
    "kind": "comparison",
    "data": {
      "headings": [
        "Depth",
        "Elements per call",
        "Calls at this depth"
      ],
      "rows": [
        [
          "0",
          "8",
          "1"
        ],
        [
          "1",
          "4",
          "2"
        ],
        [
          "2",
          "2",
          "4"
        ],
        [
          "3 · leaves",
          "1",
          "8"
        ],
        [
          "Total",
          "—",
          "15 calls; 8 leaves"
        ]
      ]
    },
    "routes": [
      "recursion/4"
    ],
    "note": "This is the power-of-two split fixture. A merge-sort combine step adds work not counted by this program."
  },
  "grid-dependencies": {
    "title": "Two predecessor cells feed one result",
    "caption": "For the unchanged 3×3 grid, the last cell receives three paths from each predecessor.",
    "description": "In a three-by-three grid indexed from zero, ways[1][2] is three and is immediately above ways[2][2]. ways[2][1] is three and is immediately to its left. Their arrows converge on ways[2][2], whose value is six. A final down move comes from the upper cell; a final right move comes from the left cell. These two last-move cases are distinct.",
    "kind": "converge",
    "data": {
      "sources": [
        {
          "label": "Above · [1][2]",
          "value": "3 paths",
          "detail": "final move: down",
          "state": "normal"
        },
        {
          "label": "Left · [2][1]",
          "value": "3 paths",
          "detail": "final move: right",
          "state": "normal"
        }
      ],
      "target": {
        "label": "Destination · [2][2]",
        "value": "3 + 3 = 6 paths",
        "detail": "two disjoint last-move cases",
        "state": "active"
      }
    },
    "routes": [
      "strategies/4"
    ],
    "note": "Only right and down moves are allowed; the original grid has no obstacles. Blocking a cell changes these counts."
  },
  "knapsack-order": {
    "title": "Update direction controls item reuse",
    "caption": "One item of weight two and value three can contribute at most once in the 0/1 problem.",
    "description": "Consider only the first item, with weight two and value three; every best cell initially holds zero. Descending capacities visit four before two: best[4] reads the old best[2] of zero and becomes three, then best[2] becomes three. Ascending capacities visit two first: best[2] becomes three, then best[4] reads that changed cell and becomes six. Six counts the same item twice, so it belongs to an unbounded-use variant.",
    "kind": "lanes",
    "data": [
      {
        "label": "Descending · item used once",
        "cards": [
          {
            "label": "Visit w = 4 first",
            "value": "best[4] = 0 + 3",
            "detail": "reads old best[2]",
            "state": "normal"
          },
          {
            "label": "Then visit w = 2",
            "value": "best[2] = 0 + 3",
            "detail": "reads old best[0]",
            "state": "normal"
          }
        ]
      },
      {
        "label": "Ascending · item reused",
        "cards": [
          {
            "label": "Visit w = 2 first",
            "value": "best[2] = 0 + 3",
            "detail": "writes current-item state",
            "state": "normal"
          },
          {
            "label": "Then visit w = 4",
            "value": "best[4] = 3 + 3",
            "detail": "reads changed best[2]",
            "state": "danger"
          }
        ]
      }
    ],
    "routes": [
      "strategies/5"
    ],
    "note": "This isolates the first item of the fixture. Capacities count weight units; best values count value units. Upward updates solve a different, reusable-item problem."
  },
  "plan-cost": {
    "title": "Compare the estimated work of both paths",
    "caption": "A cheaper access path depends on how many data pages the matches require.",
    "description": "The model has one hundred table pages and an index with three levels. It charges one page unit for each index level and one distinct data-page fetch per matching row. For one match, the index costs three plus one, or four units, versus one hundred for a scan, so choose the index. For ninety-eight matches, the index costs one hundred and one units, versus one hundred for a scan, so choose the scan.",
    "kind": "comparison",
    "data": {
      "headings": [
        "Matches",
        "Index: 3 + matches",
        "Scan",
        "Lower estimated work"
      ],
      "rows": [
        [
          "1",
          "4 page units",
          "100 page units",
          "Index"
        ],
        [
          "98",
          "101 page units",
          "100 page units",
          "Scan"
        ]
      ]
    },
    "routes": [
      "planning/1"
    ],
    "note": "Cold cache; each match needs a different data page. These are estimated page units, not measured disk reads or timings; both paths must return the same rows."
  },
  "skew-estimates": {
    "title": "Data frequency changes the match estimate",
    "caption": "The same eight rows support very different estimates under uniform and observed frequencies.",
    "description": "There are eight score rows: seven have score one and one has score nine. A uniform model over ten possible score values predicts eight divided by ten, or zero point eight matches for either queried value. A histogram counted from the same rows predicts seven matches for score one and one match for score nine, equal to the actual counts in this fixture. The row total is eight in both cases.",
    "kind": "comparison",
    "data": {
      "headings": [
        "Queried score",
        "Uniform estimate",
        "Histogram estimate",
        "Actual matches"
      ],
      "rows": [
        [
          "1",
          "0.8 rows",
          "7 rows",
          "7 rows"
        ],
        [
          "9",
          "0.8 rows",
          "1 row",
          "1 row"
        ]
      ]
    },
    "routes": [
      "richer-queries/2"
    ],
    "note": "The histogram is built from this fixed data. Later updates can make it stale, and single-column counts do not capture correlations between fields."
  },
  "float-range": {
    "title": "Tiny positive results can become subnormal or zero",
    "caption": "Binary64 gradual underflow extends below DBL_MIN without unsigned-style wraparound.",
    "description": "Read the boxes in increasing value, starting at zero. Zero is followed by the smallest positive subnormal, two to the power minus one thousand seventy-four. Half of DBL_MIN is two to the power minus one thousand twenty-three and remains subnormal. DBL_MIN is two to the power minus one thousand twenty-two and is the smallest positive normal binary64 double. Halving the smallest positive subnormal rounds to zero under round-to-nearest. The picture shows value categories, not proportional distances.",
    "kind": "cells",
    "data": {
      "cells": [
        {
          "label": "Zero",
          "value": "0",
          "detail": "smallest subnormal / 2 rounds here",
          "state": "boundary"
        },
        {
          "label": "Smallest subnormal",
          "value": "2^−1074",
          "detail": "nextafter(0, 1)",
          "state": "normal"
        },
        {
          "label": "Still subnormal",
          "value": "2^−1023",
          "detail": "DBL_MIN / 2",
          "state": "normal"
        },
        {
          "label": "Smallest normal",
          "value": "2^−1022",
          "detail": "DBL_MIN",
          "state": "active"
        }
      ]
    },
    "routes": [
      "c-guarantees/10"
    ],
    "note": "The experiment requires binary64, gradual subnormals, and round-to-nearest. Boxes are not to scale; the C classification functions determine the printed results."
  }
};
  const routes=new Map();
  for(const [id,diagram] of Object.entries(diagrams))for(const route of diagram.routes){
    if(routes.has(route))throw Error('Duplicate concept diagram route: '+route);
    routes.set(route,id);
  }
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function node(item){return `<div class="concept-node concept-${escape(item.state)}"><span class="concept-node-label">${escape(item.label)}</span><strong class="concept-node-value">${escape(item.value)}</strong>${item.detail?`<span class="concept-node-detail">${escape(item.detail)}</span>`:''}</div>`;}
  function cards(items,cls=''){return `<div class="concept-cards ${cls}" style="--concept-count:${items.length}">${items.map(node).join('')}</div>`;}
  function connector(direction,count=2){
    const xs=count===3?[33,100,167]:[50,150];
    const paths=direction==='fork'
      ?`M100 0V8 M${xs[0]} 8H${xs.at(-1)} `+xs.map(x=>`M${x} 8V26 M${x-4} 21L${x} 26L${x+4} 21`).join(' ')
      :xs.map(x=>`M${x} 0V8`).join(' ')+` M${xs[0]} 8H${xs.at(-1)} M100 8V26 M96 21L100 26L104 21`;
    return `<div class="concept-connector"><span class="concept-arrow-wide"><svg viewBox="0 0 200 28" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${paths}" fill="none" stroke="currentColor" stroke-width="1.7" vector-effect="non-scaling-stroke"/></svg></span><span class="concept-arrow-narrow">↓</span></div>`;
  }
  function art(d){
    const data=d.data;
    switch(d.kind){
      case 'flow':return cards(data,'concept-flow');
      case 'cells':return cards(data.cells,'concept-cells');
      case 'segments':return cards(data,'concept-segments');
      case 'link':return `<div class="concept-linked">${node(data[0])}<span class="concept-arrow"><span class="concept-arrow-wide">→</span><span class="concept-arrow-narrow">↓</span></span>${node(data[1])}</div>`;
      case 'converge':return `${cards(data.sources,'concept-sources')}${connector('join',data.sources.length)}<div class="concept-root">${node(data.target)}</div>`;
      case 'branch':return `<div class="concept-root">${node(data.root)}</div>${connector('fork',data.children.length)}${cards(data.children,'concept-children')}`;
      case 'lanes':return data.map((lane,i)=>`<div class="concept-lane"><span class="concept-lane-label">${escape(lane.label)}</span>${cards(lane.cards,'concept-flow')}</div>${d.bridge&&i<data.length-1?`<div class="concept-bridge">${escape(d.bridge)}</div>`:''}`).join('');
      case 'fork-join':return `<div class="concept-root">${node(data.start)}</div>${connector('fork',data.middle.length)}${cards(data.middle,'concept-children')}${connector('join',data.middle.length)}<div class="concept-root">${node(data.end)}</div>`;
      case 'comparison':return `<div class="concept-table-scroll"><table class="concept-table"><thead><tr>${data.headings.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${data.rows.map(row=>`<tr>${row.map((value,i)=>i?`<td>${escape(value)}</td>`:`<th scope="row">${escape(value)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      default:throw Error('Unknown concept diagram kind: '+d.kind);
    }
  }
  function get(chapterId,topicId){const id=routes.get(chapterId+'/'+topicId);return id?{id,...diagrams[id]}:null;}
  function render(chapter,topic){
    const d=get(chapter.id,topic.id);if(!d)return '';
    const prefix='concept-'+d.id;
    return `<figure class="concept-diagram" data-concept="${escape(d.id)}"><figcaption id="${prefix}-caption"><strong>${escape(d.title)}</strong><p>${escape(d.caption)}</p></figcaption><div class="concept-art concept-kind-${d.kind}" role="img" aria-labelledby="${prefix}-caption" aria-describedby="${prefix}-description">${art(d)}</div>${d.note?`<p class="concept-note">${escape(d.note)}</p>`:''}<details class="concept-text"><summary>Diagram in words</summary><p id="${prefix}-description">${escape(d.description)}</p></details></figure>`;
  }
  window.conceptDiagrams={diagrams,get,render};
})();
