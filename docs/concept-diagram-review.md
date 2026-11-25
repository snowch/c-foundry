# Concept-diagram review — complete course

Reviewed all 227 reading lessons in 44 chapters and all 15 practice exercises against their explanations, starter source, supplied input, expected output, understanding check and existing illustration. The learner starts without C knowledge; later lessons may rely on earlier parts. This is an instructional review, not a learner study or a claim of measured learning gains.

The decision is to add pictures for relationships that otherwise require mentally tracking objects, dependencies, boundaries or lifecycle order. Keep short arithmetic, exact syntax, actual diagnostics and existing visual output in their current forms. One static figure per selected reading remains the limit; no animations, extra navigation, new completion rules or automatic program execution are introduced.

This revision adds 22 original figure definitions, including three replacements for less specific figures, and revises the stack/queue comparison. The resulting catalogue has 76 definitions at 126 reading placements. Nineteen lessons gain a first figure; three gain a more relevant replacement.

## Implemented recommendations

The quotations below identify the passage that benefits. Each entry names the learning question, the visual specification, placement, retained caveats and any prose replacement. Labels and descriptions are original course material; no external figures or layouts were reused.

### 2.2 Variables, initialization, and constants — `values/2`

> Declare and initialize small local variables near their first use. An uninitialized automatic int has an indeterminate value; do not read it before assigning a valid value. const expresses that an object should not be modified through that declaration. It helps document intent and lets the compiler reject accidental writes. In C, a const-qualified object is not automatically an integer constant expression in every context; that distinction matters later for array bounds and declarations.

**Learning question:** Does total change when quantity changes later?

**Visual:** With unit_price equal to 7 and quantity equal to 3, the initialization stores 21 in total. The later assignment stores 4 in quantity. It does not repeat the multiplication: total still contains 21. The program therefore prints total 21 followed by quantity 4.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. These are values in the supplied example, not a live view of your edits. Reassign total to calculate a new product.

### 3.4 break and continue — `control-flow/4`

> break leaves the nearest enclosing loop or switch. continue skips the rest of the current loop iteration. In a for loop, continue proceeds to the update expression and then tests the condition again. In a while loop, it returns directly to the condition, so a necessary update below continue would be skipped. Trace these paths separately when debugging.

**Learning question:** Which values reach printf in the supplied for loop?

**Visual:** The loop prints 0 and 1. At i equal to 2, continue skips the remaining body and proceeds to the for loop update and next condition test. It then prints 3 and 4. At i equal to 5, break exits the loop without the for update. The output is 0, 1, 3, 4, one per line.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. This trace is for a for loop. A continue in a while loop returns to its condition; it does not supply an update statement.

### 5.3 Reading lines with fgets — `arrays-strings/3`

> With a positive capacity of at least two, fgets reads at most capacity minus one characters, keeps a newline if it fits, and appends a zero terminator on success. It returns NULL when it cannot return a string, such as end-of-input before any characters. It can also return a partial line when the buffer fills first. Check its result before using the buffer, and do not assume every successful call consumed a whole logical line.

**Learning question:** Which bytes come from the input, which does fgets add, and which remain untouched?

**Visual:** Before fgets, all 32 bytes of line are uninitialized; no initial byte values are assumed. After the successful read of the original input, bytes 0 through 11 contain Ada Lovelace, including its space. Byte 12 contains the newline from the input. Byte 13 contains the zero byte added by fgets to terminate the C string. Bytes 14 through 31, eighteen bytes, are untouched and remain uninitialized. In total, thirteen input bytes and one terminator occupy fourteen of the thirty-two bytes. The Read: prefix comes from printf and is not stored in line. For this 32-byte array, fgets can store at most 31 input bytes plus the terminator. Groups are not drawn to scale, and edits do not update this illustration. The text stays together as a readable name. Direct labels identify the newline, string end and untouched range. Green marks input bytes; amber marks the added terminator. The horizontal strip becomes an ordered vertical strip on phones.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Replaces the previous string figure.

**Prose and limits:** Preserve the successful-read condition, the original-input label, byte ranges and the 31-input-byte bound. Original example; byte groups are not to scale.

### 6.4 const and pointer declarations — `pointers/4`

> const int *read prevents modifying an int through read, but read may be redirected. int *const fixed fixes the pointer after initialization, while permitting writes through it to a modifiable int. These declarations do not create ownership or extend the target’s lifetime. A read-only interface can accept a modifiable object without promising that the entire program has no other writer.

**Learning question:** May the pointer move, and may it change its target?

**Visual:** For const int *read, read may be assigned another valid address, but the integer cannot be changed through read. For int *const fixed, fixed cannot be redirected after initialization, but it may change the modifiable integer it points to. These are restrictions on operations through each declared pointer, not ownership or synchronization guarantees.

**Placement:** After the conceptual explanation, before the worked example. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. Dereferencing either pointer requires a live int object at that address. A read-only pointer to a modifiable int does not prevent changes through another writable pointer.

### 9.2 Declarations, definitions, linkage, and static — `larger-programs/2`

> This header declares operations with extern. One source file provides its initialized definition. The file-scope static private_count has internal linkage, so other translation units cannot access it by that name; they use the exported functions. A static local also has persistent storage duration, but its name remains block-scoped. The same keyword participates in different declaration contexts, so describe the effect rather than memorizing one slogan.

**Learning question:** Which state can main name directly, and which stays inside counter.c?

**Visual:** counter.h declares extern int operations and the tick and read_private functions. counter.c defines the one operations object and a separate static private_count object. main.c calls tick twice, which increments both objects. main can name operations through the header, but obtains private_count only by calling read_private. Both reported counts are 2.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. Both counter objects remain alive between calls to tick. Only operations is exposed by name in the header.

### 10.2 Fixed-width integers, bitwise operations, and masks — `files-bytes/2`

> OR sets mask bits, AND selects them, XOR toggles them, and complement inverts them. Fixed-width uint32_t is available on our target platforms; its existence is a format requirement, not a promise for every imaginable C implementation. Use a suitably typed unsigned left operand for shifts and keep the shift count below the width. inttypes.h supplies portable printf format macros for fixed-width types.

**Learning question:** Which bit changes when the code clears bit 2?

**Visual:** Bits are numbered from zero at the least significant end. After setting bits 2 and 5, the low eight bits are 00100100, hexadecimal 24, decimal 36. Clearing bit 2 gives 00100000, hexadecimal 20, decimal 32. Bit 5 remains set. The upper 24 bits of the uint32_t value stay zero.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. This is a bit-position view of a uint32_t value, not its byte order in memory. The output hex=20 uses hexadecimal, not decimal.

### 10.6 A portable binary record format — `files-bytes/6`

> Our ten-byte format is: bytes 0–1 ASCII C and F, byte 2 version 1, byte 3 reserved zero, bytes 4–7 a little-endian uint32_t ID, and bytes 8–9 a little-endian uint16_t score. The API requires non-null pointers to valid objects, and eight-bit bytes. The decoder checks the length before inspecting fields and commits its output only after validation. IDs and scores may span their entire unsigned type ranges.

**Learning question:** Where do the decoder’s version, ID, and score come from?

**Visual:** The ten-byte record begins with hexadecimal 43 46, the ASCII magic CF. Offset 2 holds version 01 and offset 3 is reserved 00. Offsets 4 through 7 hold the little-endian ID 513 as 01 02 00 00. Offsets 8 and 9 hold the little-endian score 90 as 5a 00. Changing offset 2 to 02 makes the version unsupported and the decoder rejects the record.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Replaces the previous bytes figure.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. Byte values above are hexadecimal. Field boxes are not drawn to scale. This format assumes 8-bit bytes and the exact-width integer types used by the supplied code.

### 13.3 Quicksort and pivot selection — `sorting/3`

> The example uses the last value as pivot, keeping values smaller than it before boundary. After partitioning, the pivot is excluded from both recursive calls. Balanced partitions give O(n log n) work; persistently one-sided partitions give Θ(n²) work and Θ(n) stack depth. Randomization can improve expected behavior but does not eliminate the worst case.

**Learning question:** Which regions still need sorting after the first partition?

**Visual:** The supplied array starts as 5, 2, 4, 1, 3. The last value, 3, is the pivot. The first partition leaves 2, 1 to its left, 3 at index 2, and 5, 4 to its right. The left values are smaller than 3; the right values are greater than or equal to 3. Recursive calls sort the two outer regions and exclude the pivot. This intermediate state differs from the program’s final sorted output.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. This is the state after the first partition of the unchanged starter, not the final output or a trace of edited code.

### 13.4 Stability, in-place algorithms, and memory costs — `sorting/4`

> Sort records by key while keeping a distinguishing tag. The strict comparison in insertion sort moves only larger keys, preserving equal-key order. A common selection-sort swap can reverse equal records even when the final keys are sorted. Always specify whether stack storage is included when describing an algorithm as in-place.

**Learning question:** After sorting by key, does tag A still come before tag C?

**Visual:** The input records are key 2 tag A, key 1 tag B, and key 2 tag C. Stable insertion sorting produces 1B, 2A, 2C. The equal-key records 2A and 2C retain their input order. The comparison moves only strictly greater keys. Moving greater-or-equal keys instead would allow C to pass A.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Replaces the previous merge figure.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. Tags identify records; they are not an additional sort key. The supplied code demonstrates insertion sort with a strict > comparison.

### 15.3 Memoization and dynamic programming — `strategies/3`

> Let best[x] be the minimum number of coins needed for amount x, with best[0]=0. For each coin c≤x, try best[x−c]+1. The fixed bounded table and positive denominations make dependencies point to smaller states. With A amounts and C denominations, this version uses O(AC) time and O(A) space.

**Learning question:** Which last coin gives the fewest coins for amount 6?

**Visual:** With coin values 1, 3, and 4, best[a] means the minimum number of coins for amount a. For amount 6, choosing last coin 1 gives best[5] plus 1, or 3 coins. Last coin 3 gives best[3] plus 1, or 2 coins. Last coin 4 gives best[2] plus 1, or 3 coins. The minimum is 2 coins, achieved by 3 plus 3.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. Coin values are positive and reusable in this example. The numbers on the arrows’ endpoints count coins, not time or currency units.

### 17.1 Array-backed and linked implementations — `queues/1`

> An array-backed stack keeps its next free position in count. Push checks capacity before writing; pop checks count before decrementing and reading. A linked implementation avoids a fixed array limit but introduces allocation failure and node ownership. Both can implement constant-time push/pop when their required node locations are known.

**Learning question:** After adding 10 then 20, which item leaves first?

**Visual:** Both structures receive 10 followed by 20. A stack removes the most recently added item, 20, leaving 10. A queue removes the oldest item, 10, leaving 20. The supplied worked program implements the stack branch and prints popped=20 remaining=1; the queue branch illustrates the contrasting removal rule.

**Placement:** After the conceptual explanation, before the worked example. Revises the existing comparison.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. The starter executes the stack branch. The queue branch is a conceptual comparison, not additional output from that program.

### 17.5 Expression evaluation — `queues/5`

> For a binary operator, pop the right operand and then the left. The example intentionally recognizes only single decimal digits and + or −, ignoring spaces. It rejects unknown characters, insufficient operands, excess stack depth, and extra final operands. It also checks signed arithmetic before each addition or subtraction; a bounded stack alone would not bound a long expression’s accumulated value.

**Learning question:** Why does the minus token compute 8 − 3 rather than 3 − 8?

**Visual:** Read tokens 8, 3, minus, 2, plus from left to right. Push 8, then 3. For minus, pop right operand 3, then left operand 8, and push 8 minus 3 equal to 5. Push 2. For plus, pop right 2 then left 5, and push 7. One value remains, so the evaluation succeeds with result 7.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. Stacks are shown bottom to top, left to right. The starter accepts single-digit operands and + or −, checks bounds and arithmetic, and requires exactly one final value.

### 19.3 Why balancing matters — `trees-heaps/3`

> The fixture compares a three-node right chain with a balanced three-node tree. Both satisfy BST ordering and have the same inorder sequence, but maximum path lengths differ. For n sorted insertions into a naive BST, the final height is n; an AVL tree keeps each node’s child heights within one level of each other, giving O(log n) height.

**Learning question:** How many node levels must a root-to-leaf path cross?

**Visual:** The chain has root 1, right child 2, and right grandchild 3: height 3. The balanced tree has root 2, left child 1, and right child 3: height 2. Both have inorder traversal 1, 2, 3. In this program height counts node levels, and an empty tree has height zero.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. These are the two shapes constructed by the starter. Height bounds a search path; this picture does not measure runtime.

### 19.4 Rotations and a balanced-tree implementation — `trees-heaps/4`

> The implementation recursively inserts a borrowed fresh node, refreshes heights on the return path, and handles single or double rotations when the child-height difference exceeds one. Duplicate keys retain the existing node; ownership of a rejected node remains with the caller. This fixture uses an array of nodes rather than allocating them.

**Learning question:** How does inserting 2 rebalance the keys 3, 1, 2?

**Visual:** Immediately after linking the third key, root 3 has left child 1, whose right child is 2. This left-right shape is unbalanced. A left rotation at 1 followed by a right rotation at 3 gives root 2 with left child 1 and right child 3. Inorder traversal remains 1, 2, 3; the resulting height is 2 after height metadata is refreshed.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. The first tree is an intermediate insertion state. The program prints the final root, height, and inorder order; the picture explains the links behind that output.

### 20.5 Dijkstra’s shortest-path algorithm — `graphs/5`

> The matrix implementation scans for the next minimum, giving O(V²) time. Distances start at a sentinel larger than every possible path in this bounded fixture. Relaxation replaces a distance only when a shorter path is found. A general implementation must represent unreachable separately or check addition before combining path cost and weight.

**Learning question:** Why are the final distances to vertices 2 and 3 smaller than the first candidates?

**Visual:** Starting at vertex 0, the direct edge to vertex 2 costs 5. Going through vertex 1 costs 1 plus 2, or 3, so distance[2] becomes 3. A route to vertex 3 through vertex 1 costs 1 plus 7, or 8. Going through vertices 1 and 2 costs 1 plus 2 plus 1, or 4, so distance[3] becomes 4. The output distances for vertices 0 through 3 are 0, 1, 3, 4.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. Weights are nonnegative costs, not measured time. A zero matrix entry means no edge in this fixture; these are selected relaxation steps, not every loop iteration.

### 23.3 A small SQL grammar — `parsing/3`

> The subset is INSERT INTO people VALUES (number, string, number); and SELECT * FROM people optionally followed by WHERE id = number. Both require a semicolon and end of input. The parser builds a temporary statement and assigns it to the output only after success, preserving output state after rejection.

**Learning question:** Where may the optional WHERE clause appear?

**Visual:** For the SELECT grammar in this lesson, begin with SELECT * FROM people. Either follow it directly with a semicolon, or add WHERE id = a number and then a semicolon. Both branches must then reach end of input. The keywords and table name are case-sensitive. INSERT follows its own grammar and is not drawn here.

**Placement:** After the conceptual explanation, before the worked example. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. This shows only the supported SELECT subset, not general SQL. Both paths require a semicolon and complete input consumption.

### 24.4 Ordering and limiting results — `execution/4`

> Copy the initialized rows into a result buffer, sort by score then ID, and return the first two. The table itself retains its storage order. This full-sort approach needs O(n) result storage; more advanced top-k or index-order plans can reduce work under additional assumptions. The C qsort interface does not guarantee stability.

**Learning question:** Which two records survive ORDER BY score LIMIT 2?

**Visual:** The source records are Ada with ID 1 score 90, Grace with ID 2 score 80, and Ken with ID 3 score 90. The copied result is sorted by ascending score with ID as a tie-breaker: Grace, Ada, Ken. LIMIT 2 then keeps Grace and Ada. The original table order remains unchanged.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. This starter happens to return the same two rows if it limits first. The diagram explains operator order; a changed score can make that order affect which rows survive.

### 25.6 Testing truncated and corrupt input — `persistence/6`

> load constructs a temporary table, validates the header, reads exact record lengths, checks decoded rows and duplicate IDs, and rejects trailing bytes. Only after reaching a clean end does it assign the output table. This fixed-size approach bounds memory use. A production format should also document checksums, limits, and evolution rules; checksums detect accidental corruption, not malicious authenticity.

**Learning question:** What happens to the existing Keep row when the load fails?

**Visual:** Before loading, the live table contains one row: ID 9, name Keep, score 1. The supplied file declares one forty-byte row but contains only one payload byte, 7. The loader reads into temporary candidate storage, detects the truncated row, and rejects the load. It never assigns the candidate to the live table, which still contains the same Keep row with count 1.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. This illustrates failure-atomic replacement in memory. It does not establish crash durability or validate every possible malformed file.

### 27.2 Leaf pages and internal pages — `bplus-trees/2`

> This root chooses the rightmost child whose first key is no greater than the search key. Separators are derived from child minima after updates rather than stored separately. That makes separator maintenance observable without an extra cached array, but reading empty nonroot leaves would be invalid; deletion repairs underflow before returning.

**Learning question:** Which leaf does the routing rule choose for key 5?

**Visual:** After inserting keys 1 through 7, the root points to leaves containing 1,2; 3,4; and 5,6,7. The child minima are 1, 3, and 5. The loop advances while the next child minimum is at most the search key. Key 5 therefore passes the boundary 3 and then the boundary 5, selecting child 2, whose leaf contains 5,6,7.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. The starter derives boundaries from leaf minima rather than storing a separate separator array. It is a bounded in-memory model with at most eight leaves.

### 27.6 Deletion, redistribution, and merging — `bplus-trees/6`

> The implementation first tries a sibling with more than two entries, transferring one entry and preserving order. Otherwise it merges adjacent leaves, releases a pool slot, shifts root children, and repairs the forward link. The sole root leaf may be empty. This two-level model has no internal underflow beyond shrinking its root child array.

**Learning question:** Why do these two deletions leave one leaf?

**Visual:** After inserting keys 1 through 5, the leaves contain 1,2 and 3,4,5. Deleting 1 leaves the first leaf below the two-key minimum, so it borrows 3 from the right leaf: 2,3 and 4,5. Deleting 2 leaves the first leaf short again; the right leaf cannot lend while retaining two keys. The leaves merge into 3,4,5, the right pool slot is released, and the root has one child.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. The two-key minimum applies to non-root leaves in this bounded model. The root’s only remaining leaf may hold fewer keys; persistent trees also need page-write and recovery rules.

### 32.4 Signed/unsigned comparisons and integer promotions — `c-guarantees/4`

> For operands of type int and unsigned int, the usual arithmetic conversions convert the int operand to unsigned int. Thus the mathematical comparison −1 < 1 differs from its mixed-type C counterpart. The program makes that conversion explicit so strict compiler warnings remain enabled. For index validation, first reject negatives, then compare in an unsigned type that can represent both nonnegative operands. Small integer types are promoted too: uint8_t operands commonly add as int, so a later narrowing cast is a separate operation.

**Learning question:** Which conversion turns −1 into an unsigned value, and which turns 260 into 4?

**Visual:** The starter explicitly casts int minus one to unsigned int, producing UINT_MAX. Comparing that value with unsigned one is false; an uncast mixed comparison would apply the same conversion here. In the uint8_t example, 250 and 10 are added as int to produce 260, then conversion back to uint8_t produces 4 modulo 256. The narrowing occurs after the addition.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. This example has uint8_t and an int type that represents all its values. UINT_MAX depends on unsigned int width; signed overflow has different rules.

### 38.4 Shutdown, cancellation, and concurrency testing — `concurrent-storage/4`

> The queue’s close flag rejects future puts and lets takes drain existing items before returning false. Both condition variables are broadcast so blocked producers and consumers recheck their predicates. All workers join before mutex and condition-variable destruction. The fixture repeats startup and shutdown to expose lifecycle mistakes without using scheduling sleeps. Read the optional ThreadSanitizer note for detector scope and limitations; this is not an extra lab.

**Learning question:** What must finish between closing the queue and destroying its locks?

**Visual:** The producer closes the queue after offering eight items. Closing sets closed, rejects future puts, and broadcasts both condition variables so blocked participants recheck their conditions. The consumer drains accepted items, then an empty closed queue ends its take loop. main joins producer and consumer before destroying the two condition variables and the mutex. The fixture checks eight received items with sum 36 in each of twenty cycles.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. This is cooperative shutdown in the supplied queue. Twenty successful cycles do not test every thread schedule or prove freedom from all concurrency bugs.

### 40.1 Reader/writer locking — `isolation/1`

> The account transfer updates two fields under an exclusive lock; readers compute their sum under a shared lock. No reader may observe the half-completed transfer. The test verifies an invariant rather than a particular scheduling order. Lock fairness and starvation behavior depend on the implementation and policy, not merely the use of a reader/writer lock.

**Learning question:** Can a reader observe the state between the two field updates?

**Visual:** At the first transfer, accounts a and b start at 100 and 0. With the writer lock held, decrementing a produces the intermediate state 99,0. Incrementing b completes the transfer at 99,1. A reader holding the required reader lock cannot overlap that writer critical section, so it cannot observe the intermediate total 99. Before or after the transfer the protected total is 100.

**Placement:** After the worked example’s actual console, optional expected output and walkthrough, before the next task. Adds the first figure to this lesson.

**Prose and limits:** No essential explanation is removed; the figure externalizes the relationship rather than adding a second set of instructions. This shows the first transfer, not the final account values after all iterations. Every participating reader and writer must use the same lock; no C data race is executed.

## Lesson-by-lesson decisions

“Retain” means the existing figure answers the lesson’s relationship question. “Add” and “Replace” refer to the recommendations above. “Keep text/output” names why another diagram would not improve the current task. All existing figures were checked against their stated illustrative assumptions; they are not live memory inspectors.

### Part 1: Learn the language

| Lesson | Decision | Learner benefit or reason |
| --- | --- | --- |
| [1.1 Source code, compilation, linking, and execution](https://snowch.github.io/c-foundry/#/chapter/first-program/1) | Retain | Preprocessing, compilation, linking, and execution have different jobs. |
| [1.2 main, statements, comments, and return values](https://snowch.github.io/c-foundry/#/chapter/first-program/2) | Keep text/output | Follow the short main function in code; a second process picture would repeat lesson 1. |
| [1.3 Printing with printf](https://snowch.github.io/c-foundry/#/chapter/first-program/3) | Keep text/output | The two printf calls and their exact output show substitution and the literal percent sign directly. |
| [1.4 Reading compiler errors](https://snowch.github.io/c-foundry/#/chapter/first-program/4) | Keep text/output | The diagnostic already names the file, line and error; practise reading that real evidence. |
| [1.5 C, WebAssembly, and standard input/output](https://snowch.github.io/c-foundry/#/chapter/first-program/5) | Retain | Preprocessing, compilation, linking, and execution have different jobs. |
| [1.6 Finding and reading C documentation](https://snowch.github.io/c-foundry/#/chapter/first-program/6) | Keep text/output | The reference page and declaration are the objects to inspect; a navigation illustration would go stale. |
| [2.1 Integers, floating-point numbers, characters, and Boolean values](https://snowch.github.io/c-foundry/#/chapter/values/1) | Keep text/output | The declarations and printed values introduce the scalar types directly; avoid implying a universal object layout. |
| [2.2 Variables, initialization, and constants](https://snowch.github.io/c-foundry/#/chapter/values/2) | Add | Does total change when quantity changes later? |
| [2.3 Operators and precedence](https://snowch.github.io/c-foundry/#/chapter/values/3) | Keep text/output | Parentheses and evaluated expressions show precedence more precisely than another flow. |
| [2.4 Conversions, casts, and integer promotions](https://snowch.github.io/c-foundry/#/chapter/values/4) | Keep text/output | The arithmetic example distinguishes integer division and a cast directly; the conversion relationship is revisited with a diagram in c-guarantees/4. |
| [2.5 Integer ranges, signed overflow, and unsigned arithmetic](https://snowch.github.io/c-foundry/#/chapter/values/5) | Retain | Only the unsigned result is defined to wrap modulo its type’s range. |
| [3.1 if, else, and switch](https://snowch.github.io/c-foundry/#/chapter/control-flow/1) | Keep text/output | The two short if/switch blocks and selected output expose each alternative without a separate branch chart. |
| [3.2 Logical expressions and short-circuit evaluation](https://snowch.github.io/c-foundry/#/chapter/control-flow/2) | Retain | && evaluates its right operand only if its left operand is true. |
| [3.3 while, do, and for](https://snowch.github.io/c-foundry/#/chapter/control-flow/3) | Keep text/output | Each small loop keeps its condition and update visible; the nonlocal loop paths get a trace in lesson 4. |
| [3.4 break and continue](https://snowch.github.io/c-foundry/#/chapter/control-flow/4) | Add | Which values reach printf in the supplied for loop? |
| [3.5 Number guessing and input validation](https://snowch.github.io/c-foundry/#/chapter/control-flow/5) | Keep text/output | The input check and lower/higher feedback are the actual decision evidence; retain the interactive guessing task. |
| [4.1 Parameters, return values, and prototypes](https://snowch.github.io/c-foundry/#/chapter/functions/1) | Keep text/output | The prototype, call and return value are adjacent in the short program; retain their concrete syntax. |
| [4.2 Passing arguments by value](https://snowch.github.io/c-foundry/#/chapter/functions/2) | Retain | Changing a copied integer does not change the caller’s integer. |
| [4.3 Scope, lifetime, and storage duration](https://snowch.github.io/c-foundry/#/chapter/functions/3) | Retain | An ordinary automatic local object cannot be used after its lifetime ends. |
| [4.4 Decomposing a problem into functions](https://snowch.github.io/c-foundry/#/chapter/functions/4) | Keep text/output | Named helper functions already show the decomposition; an architecture chart would add navigation without explaining a hidden state. |
| [4.5 Testing functions independently](https://snowch.github.io/c-foundry/#/chapter/functions/5) | Keep text/output | The individual expected/actual checks are the evidence; a figure would repeat their pass/fail output. |
| [5.1 Array indexing and bounds](https://snowch.github.io/c-foundry/#/chapter/arrays-strings/1) | Retain | Index 4 is the boundary, not another element. |
| [5.2 Character arrays and zero termination](https://snowch.github.io/c-foundry/#/chapter/arrays-strings/2) | Retain | "cat" uses three character positions and one terminating zero. |
| [5.3 Reading lines with fgets](https://snowch.github.io/c-foundry/#/chapter/arrays-strings/3) | Replace | What does the supplied input put into the 32-byte line buffer? |
| [5.4 String comparison, copying, and parsing](https://snowch.github.io/c-foundry/#/chapter/arrays-strings/4) | Keep text/output | The string comparisons and checked copy show the operations directly; termination already has figures in lessons 2 and 3. |
| [5.5 Text statistics and word counting](https://snowch.github.io/c-foundry/#/chapter/arrays-strings/5) | Keep text/output | Counts and the word-boundary condition are inspectable in the short program; do not add a second tokenization model to the chapter project. |

### Part 2: Understand memory and practical C

| Lesson | Decision | Learner benefit or reason |
| --- | --- | --- |
| [6.1 Addresses, dereferencing, and null pointers](https://snowch.github.io/c-foundry/#/chapter/pointers/1) | Retain | Dereferencing p accesses the object designated by the address it holds. |
| [6.2 Pointers as function arguments](https://snowch.github.io/c-foundry/#/chapter/pointers/2) | Retain | The parameter has its own pointer value and still points to the caller’s object. |
| [6.3 Arrays, pointers, and pointer arithmetic](https://snowch.github.io/c-foundry/#/chapter/pointers/3) | Retain | For [2, 5), the candidate indices are 2, 3, and 4. |
| [6.4 const and pointer declarations](https://snowch.github.io/c-foundry/#/chapter/pointers/4) | Add | May the pointer move, and may it change its target? |
| [6.5 Swapping values through pointers](https://snowch.github.io/c-foundry/#/chapter/pointers/5) | Retain | The parameter has its own pointer value and still points to the caller’s object. |
| [7.1 Stack storage and heap allocation](https://snowch.github.io/c-foundry/#/chapter/allocation/1) | Retain | An ordinary automatic local object cannot be used after its lifetime ends. |
| [7.2 malloc, calloc, realloc, and free](https://snowch.github.io/c-foundry/#/chapter/allocation/2) | Retain | For a nonzero size, failure preserves the original allocation. |
| [7.3 Allocation failure and size calculations](https://snowch.github.io/c-foundry/#/chapter/allocation/3) | Retain | For a nonzero size, failure preserves the original allocation. |
| [7.4 Leaks, dangling pointers, and double frees](https://snowch.github.io/c-foundry/#/chapter/allocation/4) | Retain | Once the allocation is released, both pointers lose their valid target. |
| [7.5 A growing array and string builder](https://snowch.github.io/c-foundry/#/chapter/allocation/5) | Retain | Length counts content; capacity includes every allocated character position. |
| [8.1 Structs, initialization, and member access](https://snowch.github.io/c-foundry/#/chapter/structured-data/1) | Keep text/output | The aggregate initializer and named fields are directly visible; byte layout is intentionally deferred to lesson 3. |
| [8.2 typedef, enums, and tagged unions](https://snowch.github.io/c-foundry/#/chapter/structured-data/2) | Keep text/output | The tag and selected union member are explicit in the small switch; a storage drawing could distract from the active-member rule. |
| [8.3 Padding, alignment, and sizeof](https://snowch.github.io/c-foundry/#/chapter/structured-data/3) | Retain | Padding can separate members even when the source lists them together. |
| [8.4 Pointers to structs and linked objects](https://snowch.github.io/c-foundry/#/chapter/structured-data/4) | Keep text/output | The two node objects and next pointer fit in the example; pointer links already have a figure in pointers/5 and later list traversal. |
| [8.5 An in-memory record collection](https://snowch.github.io/c-foundry/#/chapter/structured-data/5) | Retain | Capacity describes available slots; count describes rows actually stored. |
| [9.1 Header files and separate compilation](https://snowch.github.io/c-foundry/#/chapter/larger-programs/1) | Retain | Preprocessing, compilation, linking, and execution have different jobs. |
| [9.2 Declarations, definitions, linkage, and static](https://snowch.github.io/c-foundry/#/chapter/larger-programs/2) | Add | Which state can main name directly, and which stays inside counter.c? |
| [9.3 Include guards and the preprocessor](https://snowch.github.io/c-foundry/#/chapter/larger-programs/3) | Keep text/output | The include guard is a short literal preprocessor pattern; retain the real header instead of another build-stage chart. |
| [9.4 Function pointers and callbacks](https://snowch.github.io/c-foundry/#/chapter/larger-programs/4) | Keep text/output | The callback parameter and calls are visible in the compact example; follow the function signature directly. |
| [9.5 Interfaces, ownership contracts, and error reporting](https://snowch.github.io/c-foundry/#/chapter/larger-programs/5) | Keep text/output | The interface signature, ownership contract and returned status are the actual reference; no additional state diagram is needed. |
| [10.1 Text and binary file I/O](https://snowch.github.io/c-foundry/#/chapter/files-bytes/1) | Keep text/output | The write, reposition and read calls plus actual bytes demonstrate stream sequencing; later stream-error work makes its conditions explicit. |
| [10.2 Fixed-width integers, bitwise operations, and masks](https://snowch.github.io/c-foundry/#/chapter/files-bytes/2) | Add | Which bit changes when the code clears bit 2? |
| [10.3 Endianness and explicit serialization](https://snowch.github.io/c-foundry/#/chapter/files-bytes/3) | Retain | The same unsigned value can be encoded independently of host layout. |
| [10.4 Undefined behavior, assertions, and debugging](https://snowch.github.io/c-foundry/#/chapter/files-bytes/4) | Keep text/output | The assertion and invalid-operation explanation require code evidence; a success path could imply undefined behavior is predictable. |
| [10.5 Testing, sanitizers, portability, and browser runtime limits](https://snowch.github.io/c-foundry/#/chapter/files-bytes/5) | Keep text/output | The check output and stated tool limits are clearer than a graphic suggesting safety is proved. |
| [10.6 A portable binary record format](https://snowch.github.io/c-foundry/#/chapter/files-bytes/6) | Replace | Where do the decoder’s version, ID, and score come from? |
| [10.7 Optional lab: Debugging C with GDB](https://snowch.github.io/c-foundry/#/chapter/files-bytes/7) | Keep text/output | The optional GDB lab already exposes source, breakpoint and variable state in the debugger; use that genuine view. |

### Part 3: Learn to reason about algorithms

| Lesson | Decision | Learner benefit or reason |
| --- | --- | --- |
| [11.1 Input size and counting work](https://snowch.github.io/c-foundry/#/chapter/big-o/1) | Retain | This search trace illustrates linear growth versus logarithmic growth. |
| [11.2 O, Θ, and Ω notation](https://snowch.github.io/c-foundry/#/chapter/big-o/2) | Keep text/output | The inequalities and definitions distinguish upper, lower and tight bounds; avoid another growth graphic being mistaken for a proof. |
| [11.3 Constant, logarithmic, linear, linearithmic, and quadratic growth](https://snowch.github.io/c-foundry/#/chapter/big-o/3) | Retain | This search trace illustrates linear growth versus logarithmic growth. |
| [11.4 Best, average, and worst cases](https://snowch.github.io/c-foundry/#/chapter/big-o/4) | Keep text/output | The concrete inputs and comparison counts already distinguish cases without implying a universal average distribution. |
| [11.5 Time, auxiliary space, and amortized analysis](https://snowch.github.io/c-foundry/#/chapter/big-o/5) | Keep text/output | The stated total work and storage counts support amortized reasoning; capacity already has a figure in lists/1. |
| [11.6 Loop invariants and correctness arguments](https://snowch.github.io/c-foundry/#/chapter/big-o/6) | Keep text/output | The invariant and before/after reasoning are the learning evidence; a trace alone cannot establish correctness. |
| [11.7 Predict growth before measuring it](https://snowch.github.io/c-foundry/#/chapter/big-o/7) | Retain | This search trace illustrates linear growth versus logarithmic growth. |
| [12.1 Linear search](https://snowch.github.io/c-foundry/#/chapter/searching/1) | Keep text/output | A linear traversal is explicit in the short loop and count output; save the range picture for binary search. |
| [12.2 Binary search and its sorted-input requirement](https://snowch.github.io/c-foundry/#/chapter/searching/2) | Retain | When the middle value is too small, all earlier values are too small as well. |
| [12.3 Inclusive versus half-open search intervals](https://snowch.github.io/c-foundry/#/chapter/searching/3) | Retain | For [2, 5), the candidate indices are 2, 3, and 4. |
| [12.4 Lower bounds, upper bounds, and duplicate values](https://snowch.github.io/c-foundry/#/chapter/searching/4) | Retain | Lower bound is the first not-less value; upper bound is the first greater value. |
| [12.5 Searching a sorted record collection](https://snowch.github.io/c-foundry/#/chapter/searching/5) | Keep text/output | Reuse the sorted-range concepts from lessons 2–4 while inspecting actual record IDs; another search diagram would repeat them. |
| [13.1 Selection sort and insertion sort](https://snowch.github.io/c-foundry/#/chapter/sorting/1) | Keep text/output | The short loops and sorted array provide the starting algorithm; more complex partition and stability relationships now have figures. |
| [13.2 Merge sort](https://snowch.github.io/c-foundry/#/chapter/sorting/2) | Retain | Two sorted inputs can be combined into one sorted output. |
| [13.3 Quicksort and pivot selection](https://snowch.github.io/c-foundry/#/chapter/sorting/3) | Add | Which regions still need sorting after the first partition? |
| [13.4 Stability, in-place algorithms, and memory costs](https://snowch.github.io/c-foundry/#/chapter/sorting/4) | Replace | After sorting by key, does tag A still come before tag C? |
| [13.5 Using qsort safely](https://snowch.github.io/c-foundry/#/chapter/sorting/5) | Keep text/output | The comparator signature and three-way result need exact C syntax, not another sorting picture. |
| [13.6 Comparisons, moves, and input order](https://snowch.github.io/c-foundry/#/chapter/sorting/6) | Keep text/output | The counted comparisons and moves are already the comparison display; do not replace them with a timing-like graphic. |
| [14.1 Base cases and recursive progress](https://snowch.github.io/c-foundry/#/chapter/recursion/1) | Retain | Each call waits for the smaller subproblem to return. |
| [14.2 Drawing the call stack](https://snowch.github.io/c-foundry/#/chapter/recursion/2) | Retain | Each call waits for the smaller subproblem to return. |
| [14.3 Recursive versus iterative implementations](https://snowch.github.io/c-foundry/#/chapter/recursion/3) | Keep text/output | The side-by-side implementations and equal results already support the comparison; call storage is pictured in lesson 1. |
| [14.4 Recursion trees and simple recurrences](https://snowch.github.io/c-foundry/#/chapter/recursion/4) | Retain | For eight elements, four depths contain fifteen calls and eight leaves. |
| [14.5 Recursive directory-like tree traversal](https://snowch.github.io/c-foundry/#/chapter/recursion/5) | Keep text/output | The indented directory-like output is already a tree visualization with names and depth. |
| [15.1 Brute force and backtracking](https://snowch.github.io/c-foundry/#/chapter/strategies/1) | Keep text/output | The returned candidates and small search space are directly inspectable; the lesson tests feasibility rather than needing another recursion picture. |
| [15.2 Greedy choices and counterexamples](https://snowch.github.io/c-foundry/#/chapter/strategies/2) | Keep text/output | The greedy counterexample is a short numerical comparison; the dependency choice gets a diagram in the next lesson. |
| [15.3 Memoization and dynamic programming](https://snowch.github.io/c-foundry/#/chapter/strategies/3) | Add | Which last coin gives the fewest coins for amount 6? |
| [15.4 One-dimensional and two-dimensional state](https://snowch.github.io/c-foundry/#/chapter/strategies/4) | Retain | For the unchanged 3×3 grid, the last cell receives three paths from each predecessor. |
| [15.5 Coin change, grid paths, and knapsack](https://snowch.github.io/c-foundry/#/chapter/strategies/5) | Retain | One item of weight two and value three can contribute at most once in the 0/1 problem. |

### Part 4: Build data structures in C

| Lesson | Decision | Learner benefit or reason |
| --- | --- | --- |
| [16.1 Capacity growth and amortized append](https://snowch.github.io/c-foundry/#/chapter/lists/1) | Retain | Only the live prefix contains elements belonging to the vector. |
| [16.2 Singly and doubly linked lists](https://snowch.github.io/c-foundry/#/chapter/lists/2) | Retain | Nodes do not need to be adjacent in storage. |
| [16.3 Insertion, removal, and traversal](https://snowch.github.io/c-foundry/#/chapter/lists/3) | Retain | Nodes do not need to be adjacent in storage. |
| [16.4 Ownership and iterator invalidation](https://snowch.github.io/c-foundry/#/chapter/lists/4) | Retain | Once the allocation is released, both pointers lose their valid target. |
| [16.5 Locality, memory overhead, and operation costs](https://snowch.github.io/c-foundry/#/chapter/lists/5) | Keep text/output | The storage/cost discussion explicitly separates operation counts from hardware timing; a locality cartoon would not measure a cache effect. |
| [17.1 Array-backed and linked implementations](https://snowch.github.io/c-foundry/#/chapter/queues/1) | Revise | After adding 10 then 20, which item leaves first? |
| [17.2 Circular buffers](https://snowch.github.io/c-foundry/#/chapter/queues/2) | Retain | With capacity 4, the next position after index 3 is index 0. |
| [17.3 Overflow, underflow, and resizing](https://snowch.github.io/c-foundry/#/chapter/queues/3) | Keep text/output | The Boolean rejection and count values expose overflow/underflow directly; the ring positions are already pictured in lesson 2. |
| [17.4 Bracket matching](https://snowch.github.io/c-foundry/#/chapter/queues/4) | Keep text/output | The input brackets and exact mismatch result are sufficient for the short case; the multi-step stack trace is reserved for postfix evaluation. |
| [17.5 Expression evaluation](https://snowch.github.io/c-foundry/#/chapter/queues/5) | Add | Why does the minus token compute 8 − 3 rather than 3 − 8? |
| [18.1 Hash functions for integers and strings](https://snowch.github.io/c-foundry/#/chapter/hash-tables/1) | Keep text/output | The code computes an actual hash value; a decorative bucket picture would not explain that arithmetic. |
| [18.2 Separate chaining and open addressing](https://snowch.github.io/c-foundry/#/chapter/hash-tables/2) | Retain | A collision policy decides where the second key goes. |
| [18.3 Collisions, load factor, and resizing](https://snowch.github.io/c-foundry/#/chapter/hash-tables/3) | Retain | A collision policy decides where the second key goes. |
| [18.4 Deletion and tombstones](https://snowch.github.io/c-foundry/#/chapter/hash-tables/4) | Retain | A tombstone keeps the search moving toward colliding keys. |
| [18.5 Average versus worst-case complexity](https://snowch.github.io/c-foundry/#/chapter/hash-tables/5) | Keep text/output | The probe counts and collision assumptions are the relevant evidence; existing collision figures cover the spatial relationship. |
| [18.6 A word-frequency index](https://snowch.github.io/c-foundry/#/chapter/hash-tables/6) | Keep text/output | The word/count output is already the index result; reuse the earlier probe-chain model rather than repeat it. |
| [19.1 Binary trees and traversals](https://snowch.github.io/c-foundry/#/chapter/trees-heaps/1) | Keep text/output | The small traversal functions and printed visit order are directly traceable; ordered routing and shape receive separate figures in lessons 2–4. |
| [19.2 Binary search trees](https://snowch.github.io/c-foundry/#/chapter/trees-heaps/2) | Retain | For this tree, smaller keys go left and larger keys go right. |
| [19.3 Why balancing matters](https://snowch.github.io/c-foundry/#/chapter/trees-heaps/3) | Add | How many node levels must a root-to-leaf path cross? |
| [19.4 Rotations and a balanced-tree implementation](https://snowch.github.io/c-foundry/#/chapter/trees-heaps/4) | Add | How does inserting 2 rebalance the keys 3, 1, 2? |
| [19.5 Binary heaps and priority queues](https://snowch.github.io/c-foundry/#/chapter/trees-heaps/5) | Retain | Sibling positions do not imply a fully sorted sequence. |
| [19.6 A task scheduler](https://snowch.github.io/c-foundry/#/chapter/trees-heaps/6) | Retain | Sibling positions do not imply a fully sorted sequence. |
| [20.1 Adjacency matrices and adjacency lists](https://snowch.github.io/c-foundry/#/chapter/graphs/1) | Retain | Traversal tracks visited vertices so shared destinations are handled deliberately. |
| [20.2 Breadth-first and depth-first search](https://snowch.github.io/c-foundry/#/chapter/graphs/2) | Retain | Traversal tracks visited vertices so shared destinations are handled deliberately. |
| [20.3 Connected components and cycle detection](https://snowch.github.io/c-foundry/#/chapter/graphs/3) | Keep text/output | The graph topology already appears in this chapter; the component/cycle result and visited checks are the new evidence. |
| [20.4 Topological sorting](https://snowch.github.io/c-foundry/#/chapter/graphs/4) | Retain | Traversal tracks visited vertices so shared destinations are handled deliberately. |
| [20.5 Dijkstra’s shortest-path algorithm](https://snowch.github.io/c-foundry/#/chapter/graphs/5) | Add | Why are the final distances to vertices 2 and 3 smaller than the first candidates? |
| [20.6 Route finding with a priority queue](https://snowch.github.io/c-foundry/#/chapter/graphs/6) | Retain | Sibling positions do not imply a fully sorted sequence. |

### Part 5: Build TinyDB

| Lesson | Decision | Learner benefit or reason |
| --- | --- | --- |
| [21.1 Records, tables, schemas, and keys](https://snowch.github.io/c-foundry/#/chapter/database-foundations/1) | Retain | Capacity describes available slots; count describes rows actually stored. |
| [21.2 Storage, indexes, and query execution](https://snowch.github.io/c-foundry/#/chapter/database-foundations/2) | Retain | Parsing syntax is different from validating and executing it. |
| [21.3 Designing a deliberately small database](https://snowch.github.io/c-foundry/#/chapter/database-foundations/3) | Keep text/output | The feature boundary is a scope contract, not a data flow; a larger architecture picture could imply unsupported SQL behavior. |
| [21.4 Building a command loop](https://snowch.github.io/c-foundry/#/chapter/database-foundations/4) | Keep text/output | The prompt, command and response are already an interaction trace; keep the executable command loop primary. |
| [21.5 Defining behavior and writing acceptance tests](https://snowch.github.io/c-foundry/#/chapter/database-foundations/5) | Keep text/output | The acceptance checks explicitly define behavior; a success diagram would add no evidence of correctness. |
| [22.1 Representing rows with structs](https://snowch.github.io/c-foundry/#/chapter/tables/1) | Retain | Capacity describes available slots; count describes rows actually stored. |
| [22.2 Inserting and selecting records](https://snowch.github.io/c-foundry/#/chapter/tables/2) | Retain | Capacity describes available slots; count describes rows actually stored. |
| [22.3 Duplicate IDs and capacity limits](https://snowch.github.io/c-foundry/#/chapter/tables/3) | Retain | Capacity describes available slots; count describes rows actually stored. |
| [22.4 Updating and deleting rows](https://snowch.github.io/c-foundry/#/chapter/tables/4) | Keep text/output | The changed row collection is visible in output; the valid-prefix model already explains count and capacity in lessons 1–3. |
| [22.5 A working in-memory database](https://snowch.github.io/c-foundry/#/chapter/tables/5) | Keep text/output | Use the integrated command loop and actual table output to combine the preceding operations rather than add another overview. |
| [23.1 Tokens, keywords, identifiers, and literals](https://snowch.github.io/c-foundry/#/chapter/parsing/1) | Keep text/output | The token-kind/text output is already a structured representation of lexical input. |
| [23.2 Whitespace, quoted strings, and malformed input](https://snowch.github.io/c-foundry/#/chapter/parsing/2) | Keep text/output | The quoted input and rejection output directly expose the boundary; retain exact characters instead of an approximate string drawing. |
| [23.3 A small SQL grammar](https://snowch.github.io/c-foundry/#/chapter/parsing/3) | Add | Where may the optional WHERE clause appear? |
| [23.4 Building a statement representation](https://snowch.github.io/c-foundry/#/chapter/parsing/4) | Retain | Parsing syntax is different from validating and executing it. |
| [23.5 Clear syntax and validation errors](https://snowch.github.io/c-foundry/#/chapter/parsing/5) | Keep text/output | The syntax/validation status and location are the evidence to inspect; a branch graphic would repeat the error categories. |
| [24.1 Table scans](https://snowch.github.io/c-foundry/#/chapter/execution/1) | Keep text/output | The scanned rows and comparison loop are directly visible; the shared query pipeline already locates a scan. |
| [24.2 Filtering with WHERE](https://snowch.github.io/c-foundry/#/chapter/execution/2) | Keep text/output | The predicate and matched rows show filtering directly without another data-flow panel. |
| [24.3 Selecting columns](https://snowch.github.io/c-foundry/#/chapter/execution/3) | Keep text/output | The emitted field names and values demonstrate projection directly. |
| [24.4 Ordering and limiting results](https://snowch.github.io/c-foundry/#/chapter/execution/4) | Add | Which two records survive ORDER BY score LIMIT 2? |
| [24.5 Simple aggregation](https://snowch.github.io/c-foundry/#/chapter/execution/5) | Keep text/output | The counts and sums are the aggregate summary; the short accumulator loop explains the transition without a second model. |
| [24.6 Separating parsing, validation, and execution](https://snowch.github.io/c-foundry/#/chapter/execution/6) | Retain | Parsing syntax is different from validating and executing it. |
| [25.1 Encoding a file header and schema](https://snowch.github.io/c-foundry/#/chapter/persistence/1) | Retain | The course format uses an explicit eight-byte header before the rows. |
| [25.2 Serializing rows without dumping raw structs](https://snowch.github.io/c-foundry/#/chapter/persistence/2) | Retain | The same unsigned value can be encoded independently of host layout. |
| [25.3 Reading and writing fixed-size pages](https://snowch.github.io/c-foundry/#/chapter/persistence/3) | Keep text/output | The file offset calculation and page-sized read are the concrete evidence; page structure is pictured in the next chapter. |
| [25.4 Building a pager abstraction](https://snowch.github.io/c-foundry/#/chapter/persistence/4) | Keep text/output | The pager API and calls expose the abstraction; cache hit/miss gets its own existing figure in pages/5. |
| [25.5 Browser-backed files, import, and export](https://snowch.github.io/c-foundry/#/chapter/persistence/5) | Keep text/output | Import/export controls and actual files are the task; a host-storage chart could overstate durability. |
| [25.6 Testing truncated and corrupt input](https://snowch.github.io/c-foundry/#/chapter/persistence/6) | Add | What happens to the existing Keep row when the load fails? |

### Part 6: Make the database faster and more reliable

| Lesson | Decision | Learner benefit or reason |
| --- | --- | --- |
| [26.1 Page IDs, headers, and record offsets](https://snowch.github.io/c-foundry/#/chapter/pages/1) | Retain | Moving a live record changes its offset, not necessarily its slot number. |
| [26.2 Fixed-length and variable-length records](https://snowch.github.io/c-foundry/#/chapter/pages/2) | Keep text/output | The sizes and capacity calculation are explicit; the existing slot/record figure is reused in neighboring lessons. |
| [26.3 Slotted pages](https://snowch.github.io/c-foundry/#/chapter/pages/3) | Retain | Moving a live record changes its offset, not necessarily its slot number. |
| [26.4 Free space and deleted records](https://snowch.github.io/c-foundry/#/chapter/pages/4) | Retain | Moving a live record changes its offset, not necessarily its slot number. |
| [26.5 A bounded page cache](https://snowch.github.io/c-foundry/#/chapter/pages/5) | Retain | The cache is a bounded copy of selected backing pages. |
| [26.6 Inspecting a database file visually](https://snowch.github.io/c-foundry/#/chapter/pages/6) | Keep text/output | The worked program already prints a visual slot/offset map; a static duplicate would hide the actual inspector output. |
| [27.1 Why databases use page-oriented trees](https://snowch.github.io/c-foundry/#/chapter/bplus-trees/1) | Keep text/output | The fanout calculation states the page/key assumptions; existing root and split figures explain shape in the next lessons. |
| [27.2 Leaf pages and internal pages](https://snowch.github.io/c-foundry/#/chapter/bplus-trees/2) | Add | Which leaf does the routing rule choose for key 5? |
| [27.3 Searching and ordered traversal](https://snowch.github.io/c-foundry/#/chapter/bplus-trees/3) | Keep text/output | The actual range output plus root-routing figure in lesson 2 establish traversal; no second generic ordered-tree view. |
| [27.4 Inserting keys and splitting pages](https://snowch.github.io/c-foundry/#/chapter/bplus-trees/4) | Retain | Five entries become two in the left leaf and three in the right leaf. |
| [27.5 Range queries and linked leaves](https://snowch.github.io/c-foundry/#/chapter/bplus-trees/5) | Retain | Five entries become two in the left leaf and three in the right leaf. |
| [27.6 Deletion, redistribution, and merging](https://snowch.github.io/c-foundry/#/chapter/bplus-trees/6) | Add | Why do these two deletions leave one leaf? |
| [28.1 Table scans versus index lookups](https://snowch.github.io/c-foundry/#/chapter/planning/1) | Retain | A cheaper access path depends on how many data pages the matches require. |
| [28.2 Simple cost estimates and selectivity](https://snowch.github.io/c-foundry/#/chapter/planning/2) | Keep text/output | The numeric estimate and selectivity are already concrete quantities; the scan/index comparison is pictured in lesson 1. |
| [28.3 Index-assisted filtering and ordering](https://snowch.github.io/c-foundry/#/chapter/planning/3) | Keep text/output | Inspect the indexed results against the scan result; the chapter already has access-path and pipeline figures. |
| [28.4 Implementing EXPLAIN](https://snowch.github.io/c-foundry/#/chapter/planning/4) | Retain | Parsing syntax is different from validating and executing it. |
| [28.5 Measuring page reads and comparisons](https://snowch.github.io/c-foundry/#/chapter/planning/5) | Keep text/output | Counters for reads/comparisons are the evidence; an illustrative performance graphic could be mistaken for measured time. |
| [28.6 Optional: nested-loop joins](https://snowch.github.io/c-foundry/#/chapter/planning/6) | Keep text/output | The paired-row output and nested loops show the small join directly; a full join-planner graphic would imply broader support. |
| [29.1 Atomicity, consistency, isolation, and durability](https://snowch.github.io/c-foundry/#/chapter/recovery/1) | Retain | Uncommitted edits do not replace the live table in this model. |
| [29.2 A single-writer transaction model](https://snowch.github.io/c-foundry/#/chapter/recovery/2) | Retain | Uncommitted edits do not replace the live table in this model. |
| [29.3 BEGIN, COMMIT, and ROLLBACK](https://snowch.github.io/c-foundry/#/chapter/recovery/3) | Retain | Uncommitted edits do not replace the live table in this model. |
| [29.4 Write-ahead logging](https://snowch.github.io/c-foundry/#/chapter/recovery/4) | Retain | A complete commit record separates published work from tentative work. |
| [29.5 Recovery after an interrupted write](https://snowch.github.io/c-foundry/#/chapter/recovery/5) | Retain | A complete commit record separates published work from tentative work. |
| [29.6 Browser storage guarantees and their limits](https://snowch.github.io/c-foundry/#/chapter/recovery/6) | Keep text/output | Storage guarantees and missing guarantees are claims to read explicitly; no diagram can make this model establish host crash durability. |
| [30.1 End-to-end SQL tests](https://snowch.github.io/c-foundry/#/chapter/ship/1) | Keep text/output | Acceptance output records real checks; a pass/fail graphic would duplicate the report. |
| [30.2 Property tests and fuzzing the parser](https://snowch.github.io/c-foundry/#/chapter/ship/2) | Keep text/output | Seeds, generated inputs and failures are the useful evidence; a diagram must not suggest exhaustive fuzz coverage. |
| [30.3 Fault injection and recovery tests](https://snowch.github.io/c-foundry/#/chapter/ship/3) | Retain | A complete commit record separates published work from tentative work. |
| [30.4 Benchmarks across growing datasets](https://snowch.github.io/c-foundry/#/chapter/ship/4) | Keep text/output | Dataset sizes and counters support the benchmark comparison; avoid an invented timing curve. |
| [30.5 Memory and resource audits](https://snowch.github.io/c-foundry/#/chapter/ship/5) | Keep text/output | The resource checks and cleanup paths are explicit in code; existing lifetime figures cover the core relationship. |
| [30.6 File-format documentation and compatibility](https://snowch.github.io/c-foundry/#/chapter/ship/6) | Keep text/output | The format specification is already a byte-level reference; retain exact version and field rules. |
| [30.7 Exportable database files and a browser demonstration](https://snowch.github.io/c-foundry/#/chapter/ship/7) | Keep text/output | The exported file and reloaded rows are directly inspectable through the working interface. |
| [30.8 Optional workshop: Repair a broken TinyDB with GDB](https://snowch.github.io/c-foundry/#/chapter/ship/8) | Keep text/output | The repair workshop already uses GDB to reveal the real broken state; retain the debugger as the visual tool. |

### Part 7: Writing portable C

| Lesson | Decision | Learner benefit or reason |
| --- | --- | --- |
| [31.1 C89/C90, C99, C11, C17, and C23](https://snowch.github.io/c-foundry/#/chapter/standards-evolution/1) | Keep text/output | The named revisions and feature guards are the reference; a date timeline would not change the portability decision. |
| [31.2 Language standards versus compiler extensions](https://snowch.github.io/c-foundry/#/chapter/standards-evolution/2) | Keep text/output | Compiler mode and accepted/rejected constructs provide direct evidence; facility selection has an existing figure in lesson 3. |
| [31.3 Choosing a baseline and checking feature support](https://snowch.github.io/c-foundry/#/chapter/standards-evolution/3) | Retain | A supported language mode and an available library API are separate checks. |
| [32.1 Defined, implementation-defined, unspecified, and undefined behavior](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/1) | Retain | Only the unsigned result is defined to wrap modulo its type’s range. |
| [32.2 Integer representation, alignment, object lifetime, and aliasing](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/2) | Keep text/output | Keep the distinct alignment/lifetime/aliasing rules explicit rather than suggest one universal byte layout. |
| [32.3 Why code can behave differently under optimization](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/3) | Keep text/output | The same defined program under two builds is the evidence; no picture can assign a stable result to undefined behavior. |
| [32.4 Signed/unsigned comparisons and integer promotions](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/4) | Add | Which conversion turns −1 into an unsigned value, and which turns 260 into 4? |
| [32.5 Narrowing conversions and range-checked casts](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/5) | Retain | A defined conversion can still violate the application’s input policy. |
| [32.6 Checked addition, subtraction, and multiplication](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/6) | Retain | Only the unsigned result is defined to wrap modulo its type’s range. |
| [32.7 Division, remainder, and negating INT_MIN](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/7) | Keep text/output | The exact division, remainder and INT_MIN guards need arithmetic bounds, not another generic overflow diagram. |
| [32.8 Floating-point rounding, cancellation, and tolerances](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/8) | Keep text/output | The printed rounded values and tolerance formula are the comparison; a number line would introduce scale without resolving the error test. |
| [32.9 NaN, infinity, and finite numeric input](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/9) | Keep text/output | The finite/NaN/infinity classifications are printed directly; keep validation conditions explicit. |
| [32.10 Floating-point underflow, subnormals, and range errors](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/10) | Retain | Binary64 gradual underflow extends below DBL_MIN without unsigned-style wraparound. |
| [33.1 Standard library versus operating-system APIs](https://snowch.github.io/c-foundry/#/chapter/portable-c/1) | Retain | The same data contract can have different storage adapters. |
| [33.2 Fixed-width types, endianness, and binary compatibility](https://snowch.github.io/c-foundry/#/chapter/portable-c/2) | Retain | The same unsigned value can be encoded independently of host layout. |
| [33.3 Feature detection and conditional compilation](https://snowch.github.io/c-foundry/#/chapter/portable-c/3) | Retain | A supported language mode and an available library API are separate checks. |
| [33.4 A portable core and explicit host adapters](https://snowch.github.io/c-foundry/#/chapter/portable-c/4) | Retain | The same data contract can have different storage adapters. |
| [33.5 Text and binary streams, LF and CRLF](https://snowch.github.io/c-foundry/#/chapter/portable-c/5) | Keep text/output | The byte escape output already makes LF/CRLF visible; another memory picture would repeat it. |
| [33.6 Paths, filenames, case, and bounded construction](https://snowch.github.io/c-foundry/#/chapter/portable-c/6) | Keep text/output | The bounded path construction and rejection status directly show the contract; no universal filesystem layout is assumed. |
| [33.7 Encodings, locale, and safe byte classification](https://snowch.github.io/c-foundry/#/chapter/portable-c/7) | Keep text/output | The unsigned-byte conversion and classification results are precise; a character chart could imply ASCII/Unicode guarantees not provided. |
| [33.8 Bounded records and reliable numeric parsing](https://snowch.github.io/c-foundry/#/chapter/portable-c/8) | Keep text/output | The accepted/rejected text and numeric range checks are the useful representation; retain exact parsing conditions. |
| [33.9 Stream errors, EOF, and saved positions](https://snowch.github.io/c-foundry/#/chapter/portable-c/9) | Keep text/output | The return counts, EOF/error flags and saved positions are already the evidence to compare. |
| [34.1 Auditing assumptions about types and memory](https://snowch.github.io/c-foundry/#/chapter/hardening-tinydb/1) | Keep text/output | The assumption checks print the actual target properties; a universal layout illustration would undermine that audit. |
| [34.2 Versioning the database format](https://snowch.github.io/c-foundry/#/chapter/hardening-tinydb/2) | Retain | The same unsigned value can be encoded independently of host layout. |
| [34.3 Multiple compilers and warning settings](https://snowch.github.io/c-foundry/#/chapter/hardening-tinydb/3) | Keep text/output | Compiler diagnostics and build flags are the real comparison; no diagram can substitute for those reports. |
| [34.4 Sanitizers and portability checks](https://snowch.github.io/c-foundry/#/chapter/hardening-tinydb/4) | Keep text/output | The tool output and its limitations are explicit; avoid suggesting passing checks prove portability or safety. |
| [34.5 Audit and exchange TinyDB files across platforms](https://snowch.github.io/c-foundry/#/chapter/hardening-tinydb/5) | Retain | The same data contract can have different storage adapters. |

### Part 8: Concurrency in C

| Lesson | Decision | Learner benefit or reason |
| --- | --- | --- |
| [35.1 Concurrency versus parallelism](https://snowch.github.io/c-foundry/#/chapter/threads/1) | Keep text/output | Worker results and joins establish completion; a parallel-lanes graphic could incorrectly imply simultaneous execution or speedup. |
| [35.2 Thread lifetimes and shared memory](https://snowch.github.io/c-foundry/#/chapter/threads/2) | Keep text/output | The Job scope and join are visible in the short code; the course already pictures object lifetime and copied pointers. |
| [35.3 Data races and reproducible interleavings](https://snowch.github.io/c-foundry/#/chapter/threads/3) | Retain | Every participating access must follow the same locking contract. |
| [36.1 Mutexes and condition variables](https://snowch.github.io/c-foundry/#/chapter/coordination/1) | Retain | Every participating access must follow the same locking contract. |
| [36.2 Producer–consumer queues](https://snowch.github.io/c-foundry/#/chapter/coordination/2) | Retain | A condition-variable wakeup is not a stored promise that work is available. |
| [36.3 Lock ordering, deadlocks, and starvation](https://snowch.github.io/c-foundry/#/chapter/coordination/3) | Retain | Both threads can wait forever while retaining the lock the other needs. |
| [37.1 Atomic operations and happens-before relationships](https://snowch.github.io/c-foundry/#/chapter/atomics/1) | Retain | The acquiring load must observe the value from the releasing store. |
| [37.2 Sequential consistency first](https://snowch.github.io/c-foundry/#/chapter/atomics/2) | Keep text/output | The single exchange result and subsequent load are a short direct sequence; the publication relationship already has a separate figure. |
| [37.3 Acquire/release through concrete examples](https://snowch.github.io/c-foundry/#/chapter/atomics/3) | Retain | The acquiring load must observe the value from the releasing store. |
| [37.4 Why volatile does not provide thread synchronization](https://snowch.github.io/c-foundry/#/chapter/atomics/4) | Keep text/output | The local volatile and shared atomic output distinguish their roles; an interleaving picture must not imply volatile provides synchronization. |
| [38.1 C11 threading facilities versus POSIX threads](https://snowch.github.io/c-foundry/#/chapter/concurrent-storage/1) | Keep text/output | The C11 return values and API names are the contract; a diagram could suggest C11 and POSIX handles are interchangeable. |
| [38.2 A bounded work queue](https://snowch.github.io/c-foundry/#/chapter/concurrent-storage/2) | Retain | A condition-variable wakeup is not a stored promise that work is available. |
| [38.3 A single writer processing requests](https://snowch.github.io/c-foundry/#/chapter/concurrent-storage/3) | Retain | A single writer can own database mutations while callers submit work. |
| [38.4 Shutdown, cancellation, and concurrency testing](https://snowch.github.io/c-foundry/#/chapter/concurrent-storage/4) | Add | What must finish between closing the queue and destroying its locks? |

### Part 9: Advanced TinyDB

| Lesson | Decision | Learner benefit or reason |
| --- | --- | --- |
| [39.1 Request scheduling](https://snowch.github.io/c-foundry/#/chapter/multi-client/1) | Retain | A single writer can own database mutations while callers submit work. |
| [39.2 Transaction boundaries](https://snowch.github.io/c-foundry/#/chapter/multi-client/2) | Retain | Uncommitted edits do not replace the live table in this model. |
| [39.3 Contention and backpressure](https://snowch.github.io/c-foundry/#/chapter/multi-client/3) | Retain | A single writer can own database mutations while callers submit work. |
| [40.1 Reader/writer locking](https://snowch.github.io/c-foundry/#/chapter/isolation/1) | Add | Can a reader observe the state between the two field updates? |
| [40.2 Lost updates and inconsistent reads](https://snowch.github.io/c-foundry/#/chapter/isolation/2) | Retain | The full read–modify–write operation needs a suitable isolation contract. |
| [40.3 Defining and testing an isolation contract](https://snowch.github.io/c-foundry/#/chapter/isolation/3) | Retain | Creation is inclusive; deletion is exclusive in this model. |
| [41.1 Snapshot reads](https://snowch.github.io/c-foundry/#/chapter/snapshots/1) | Retain | Creation is inclusive; deletion is exclusive in this model. |
| [41.2 An introduction to MVCC](https://snowch.github.io/c-foundry/#/chapter/snapshots/2) | Retain | Creation is inclusive; deletion is exclusive in this model. |
| [41.3 Visibility rules and reclaiming old versions](https://snowch.github.io/c-foundry/#/chapter/snapshots/3) | Retain | Creation is inclusive; deletion is exclusive in this model. |
| [42.1 Extending the write-ahead log](https://snowch.github.io/c-foundry/#/chapter/maintenance/1) | Retain | A complete commit record separates published work from tentative work. |
| [42.2 Checkpoints and log truncation](https://snowch.github.io/c-foundry/#/chapter/maintenance/2) | Retain | Log retirement depends on persisted state and the readers that still need it. |
| [42.3 Free-page reuse, compaction, and integrity checking](https://snowch.github.io/c-foundry/#/chapter/maintenance/3) | Keep text/output | The checker’s valid/invalid counts and reuse result are the evidence; page-slot and checkpoint relationships already have figures. |
| [43.1 Joins, composite indexes, and prepared statements](https://snowch.github.io/c-foundry/#/chapter/richer-queries/1) | Keep text/output | The fixture’s output demonstrates the supported join/index operation; avoid a general optimizer architecture beyond the example. |
| [43.2 Better statistics and query planning](https://snowch.github.io/c-foundry/#/chapter/richer-queries/2) | Retain | The same eight rows support very different estimates under uniform and observed frequencies. |
| [43.3 Explaining and measuring execution choices](https://snowch.github.io/c-foundry/#/chapter/richer-queries/3) | Retain | Parsing syntax is different from validating and executing it. |
| [44.1 Concurrent workloads and contention measurements](https://snowch.github.io/c-foundry/#/chapter/reliability/1) | Keep text/output | Measured counters and stated scheduling limits are the evidence; do not draw illustrative timing as multicore performance. |
| [44.2 Cache behavior and allocation costs](https://snowch.github.io/c-foundry/#/chapter/reliability/2) | Retain | The cache is a bounded copy of selected backing pages. |
| [44.3 Fault injection, fuzzing, and recovery testing](https://snowch.github.io/c-foundry/#/chapter/reliability/3) | Keep text/output | Named fault cases and recovery checks are concrete; existing recovery figures already distinguish committed work from incomplete tails. |

## Practice exercises

The 15 practice pages already contain an example or an optional illustration. Keep those displays and the executable editor primary rather than duplicating reading figures. The decision below covers each exercise.

| Practice | Decision |
| --- | --- |
| `hello` — Your first C program | Retain the source → program → console illustration; the first reading also has the build pipeline. |
| `loops` — Variables & loops | Retain the loop’s sum progression and actual console; a second loop diagram adds no new relationship. |
| `pointers` — Pointers & memory | Retain the step-through swap and target cells; it already contrasts pointer address and stored value. |
| `heap` — Allocate & release | Retain allocation/release ownership steps; the reading figures cover lifetime and reallocation failure. |
| `search` — Binary search | Retain the shrinking candidate range; it already shows discarded halves and comparisons. |
| `sort` — Insertion sort | Retain the step-through insertion example; separate readings now picture partitioning and tagged stability. |
| `rows` — Your first database row | Retain the struct-to-row illustration and actual fields; this is the concrete representation task. |
| `query` — Insert & query rows | Retain the insert/scan illustration and actual table output; no larger database architecture is needed. |
| `numbers` — Calculate a total and a share | Retain the concrete total/share calculation; the new values/2 snapshot explains assignment without duplicating it here. |
| `guess` — Build a guessing game | Retain the guess-to-feedback example; the real lower/higher responses already reveal the branch. |
| `functions` — Build a rectangle calculator | Retain the rectangle input/result example; the function definition is directly inspectable. |
| `textstats` — Count characters and words | Retain the bounded text/count example; the new fgets figure supplies byte-level context in the reading. |
| `grow` — Build a growable int array | Retain the length/capacity snapshot; the allocation and vector readings already explain storage changes. |
| `records` — Update a record collection | Retain the before/after record update example; the valid-prefix figure explains which rows exist. |
| `arithmetic` — Build a checked integer calculator | Retain the accepted/rejected arithmetic example; numeric-boundary figures are linked through the reading sequence. |

## Verification and boundaries

The source/output checks establish whether the illustrated states match the unchanged examples. Responsive checks inspect phone, tablet and desktop layouts, both themes, text alternatives, one-figure placement and absence of page overflow. Existing source, predictions and explicit reading completion must survive opening a diagram. The `fgets` example is also run through the real C/WebAssembly toolchain.

The full catalogue and provenance are maintained in [concept-diagrams.md](concept-diagrams.md). Revisit these decisions if a starter program, prerequisite, format or UI control changes. In particular, intermediate partition/rotation states must not be presented as printed output; concurrency drawings must not imply measured parallelism; and database models must not imply host crash durability.
