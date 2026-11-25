# Visual design review of the recently added figures

Reviewed the 22 new figure definitions and revised stack/queue figure from the earlier course review. The supplied fgets design proposal informs the fixed-capacity principle; the implementation uses original HTML/CSS and draws no external artwork.

The checks ask whether a learner can see the relationship directly: keep the same objects in the same positions across state changes, label origins and outcomes, make units explicit, reserve colour for a named distinction, and show an actual structure instead of asking learners to reconstruct it from prose. All diagrams retain text alternatives.

| Figure | Decision | Implemented design / reason to retain |
| --- | --- |
| [How fgets fills a buffer](https://snowch.github.io/c-foundry/#/chapter/arrays-strings/3) | Rebuild | Fixed 32-cell map, constant positions across Before/Next/After, original/short/long inputs, proportional occupancy bar and unread suffix. Presets explicitly load editor Input; only an unchanged starter run updates the model from its captured input. Edited C is never described as inspected memory. |
| [Assignment stores a value at that moment](https://snowch.github.io/c-foundry/#/chapter/values/2) | Rebuild | Align quantity and total in the same two columns before and after assignment. Highlight only quantity; keep total 21 in place. Remove the long expression from the narrow table column. |
| [Continue and break take different paths](https://snowch.github.io/c-foundry/#/chapter/control-flow/4) | Rebuild | Show all six visited i values in order, with the actual printed values and directly labelled skip/exit states. On phones, numbered iterations preserve order across wrapping. |
| [Const can restrict two different objects](https://snowch.github.io/c-foundry/#/chapter/pointers/4) | Retain | A two-row permission comparison is the appropriate representation. Keep the exact declarations and distinct redirect/write questions; use readable labels. |
| [A shared declaration refers to one definition](https://snowch.github.io/c-foundry/#/chapter/larger-programs/2) | Rebuild | Draw the common header branching to the two source files. Label inclusion explicitly. Remove arrows that previously made declarations look like sequential execution. |
| [Clearing one flag preserves the other](https://snowch.github.io/c-foundry/#/chapter/files-bytes/2) | Rebuild | Draw eight equally sized indexed bit positions in both states. Keep bit 5 aligned and set; outline bit 2 where 1 changes to 0. Retain hex/decimal values. |
| [Each field has an explicit byte range](https://snowch.github.io/c-foundry/#/chapter/files-bytes/6) | Rebuild | Draw all ten equally sized indexed bytes. Show ID bytes 4–7 together with a range key that decodes each field. Wrapping preserves byte order and never shrinks the lettering. |
| [Partition fixes one pivot position](https://snowch.github.io/c-foundry/#/chapter/sorting/3) | Retain | The left range, fixed pivot and right range already expose the recursive boundary. Keep the exact first-partition values and intermediate-state note. Narrow layouts keep the regions in order. |
| [Equal keys keep their original order](https://snowch.github.io/c-foundry/#/chapter/sorting/4) | Retain | The same three tagged records remain visible in both sequences, so preserved A/C order can be checked directly. Keep tags separate from sort keys. |
| [Three earlier answers feed best[6]](https://snowch.github.io/c-foundry/#/chapter/strategies/3) | Retain | Three candidate subproblems visibly converge on their minimum. The last coin and candidate coin count are labelled directly; no additional animation is needed. |
| [Stacks and queues remove from different ends](https://snowch.github.io/c-foundry/#/chapter/queues/1) | Retain | The common enqueue/push order branches to different removal rules. Each branch explicitly names what leaves and remains, and only the stack branch is claimed as executed output. |
| [The same keys can have different heights](https://snowch.github.io/c-foundry/#/chapter/trees-heaps/3) | Retain | Actual tree links, left/right labels and the same three keys already support the comparison. Preserve height units as node levels. |
| [Rotations change links while preserving key order](https://snowch.github.io/c-foundry/#/chapter/trees-heaps/4) | Clarify | Keep both tree drawings, replace the terse left-at/right-at heading with a clear final-root heading, and name both rotations in the visible note. |
| [A cheaper route replaces a previous distance](https://snowch.github.io/c-foundry/#/chapter/graphs/5) | Rebuild | Draw each candidate and improved route using vertex circles and edge weights. Display total cost separately. This replaces wrapped arrow strings in a narrow table. |
| [An operator takes the right operand first](https://snowch.github.io/c-foundry/#/chapter/queues/5) | Rebuild | Draw the occupied stack entries after each token. The rightmost occupied entry is explicitly the top. Keep operand-pop order beside the minus/plus steps; do not invent a two-slot capacity. |
| [Both SELECT branches must reach the end](https://snowch.github.io/c-foundry/#/chapter/parsing/3) | Retain | Two clearly named alternatives share the SELECT prefix and each requires semicolon/end-of-input. The branches describe only the supported SQL subset. |
| [Sort the result before applying LIMIT](https://snowch.github.io/c-foundry/#/chapter/execution/4) | Retain | The three operator stages are already directly named. Make narrow stages a single ordered column with downward arrows, and retain the caveat that the original fixture returns the same rows if limited first. |
| [Reject a partial file before replacing the live table](https://snowch.github.io/c-foundry/#/chapter/persistence/6) | Rebuild | Keep all three live row fields aligned before and after rejection. Put the invalid candidate between the states with an explicit reject-before-replace explanation. |
| [A boundary key belongs to the right-hand leaf](https://snowch.github.io/c-foundry/#/chapter/bplus-trees/2) | Retain | A root and three leaf children already show ordered ranges. The selected equality boundary is explicit; retain the bounded in-memory-model caveat. |
| [Deletion can borrow first, then merge](https://snowch.github.io/c-foundry/#/chapter/bplus-trees/6) | Rebuild | Keep left/right positions aligned through insert, borrow and merge. Keep a labelled reusable-slot placeholder after the merge. Never imply released storage was zeroed or freed. |
| [Conversion can happen before or after arithmetic](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/4) | Retain | Separate conversion-before-comparison from addition-before-narrowing. Keep each calculation in order, with vertical arrows on narrow screens. |
| [Destroy synchronization objects only after joins](https://snowch.github.io/c-foundry/#/chapter/concurrent-storage/4) | Clarify | Name the completion milestone Both joins return. State that main may begin waiting earlier, so the lifecycle picture cannot be read as a literal call-order trace. |
| [One lock protects the whole transfer](https://snowch.github.io/c-foundry/#/chapter/isolation/1) | Rebuild | Enclose both decrement and increment in one writer-lock boundary. Show readers waiting across the intermediate total 99, followed by the readable complete total 100. |

The ten rebuilt figures besides fgets are assignment, loop exits, module ownership, bit flags, record fields, shortest paths, postfix stacks, failed loading, leaf repair and locked transfer. Two more figures receive wording corrections; the others retain their meaningful structure with consistent label sizing and narrow-screen flow.

## Interactive buffer boundaries

- The input presets change standard input for the next run, with this effect stated beside the control. They never replace source code.
- Before, Next byte and After change the illustration only. No hidden program run or completion mark is triggered.
- A completed run supplies a captured source/input snapshot. The diagram follows that input only when the source exactly matches the original 32-byte starter. An edited program gets an explicit fixed-model notice.
- Empty input leaves all bytes uninitialized. The long input copies 31 bytes, adds a terminator at index 31 and leaves 6789\n unread by that call. Another read in the same program could consume the suffix; starting a new run provides the input afresh.
- Byte counts use UTF-8 bytes, not JavaScript string length. Non-ASCII bytes use hexadecimal labels. Embedded input zero bytes are copied; they are not treated as end-of-input.
- Manual stepping illustrates the C contract, not Clang internals, execution timing or an inspected memory dump.

## Verification

Review tablet and phone screenshots in both themes; compare before/after cell coordinates; check exact bit/byte values against the examples; run short and long inputs through the real C/Wasm compiler; test the edited-source guard, saved drafts, explicit completion and model controls. Functional checks support implementation accuracy; they do not establish learning effectiveness.
