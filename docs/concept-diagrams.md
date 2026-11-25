# Original concept diagrams

The concept figures introduced in `dist/concepts.js` are original material authored for C Foundry. Their labels, explanations, illustrative values, and HTML/CSS arrangements were created for this course. They were not copied, traced, or adapted from diagrams on the external reference sites.

The module contains no third-party artwork, downloaded figures, icon library, or embedded fonts. It uses text, simple boxes, borders, tables, and locally drawn connector paths, styled with the course’s existing UI fonts. Copyright and licensing follow the repository’s [LICENSE](../LICENSE). External reference links remain separate reading aids, rather than sources of reused artwork.

## Teaching and accessibility

Each selected lesson gets at most one figure beside its conceptual explanation, or after its worked example when the figure explains the resulting state. A short caption identifies the relationship. A full **Diagram in words** description provides the same information without the visual layout and is also available to assistive technology. Text remains live text at normal reading sizes, and active/deleted/boundary states have explicit labels and border distinctions in addition to colour. Narrow screens reflow the boxes instead of shrinking lettering.

These figures explain concepts; they do not execute the learner’s current source. Assumptions and limits are stated where needed: illustrative object layout, checked nonzero realloc sizes, inclusive versus half-open search bounds, one-shot atomic publication, committed-only version records, and the difference between a transaction model and host durability. They introduce no controls, dependencies, or completion requirements for running examples.

The reading exporter mirrors the captions, descriptions, and model notes into the native chapter and example READMEs. No course topic, bookmark, draft key, or completion key is renumbered.

## Figure inventory

| Original figure | Lesson placements |
| --- | --- |
| Source becomes a runnable program | `first-program/1`, `first-program/5`, `larger-programs/1` |
| A parameter is a separate object | `functions/2` |
| Length is different from storage size | `arrays-strings/2` |
| A half-open range includes lo and excludes hi | `pointers/3`, `searching/3` |
| A pointer stores an address | `pointers/1` |
| Copying a pointer can preserve a shared target | `pointers/2`, `pointers/5` |
| Scope entry and object lifetime | `functions/3`, `allocation/1` |
| Freeing storage does not clear every alias | `allocation/4`, `lists/4` |
| Reallocation has two different outcomes | `allocation/2`, `allocation/3` |
| A string builder reserves space for its terminator | `allocation/5` |
| Length and capacity answer different questions | `lists/1` |
| Object layout is not a portable file format | `structured-data/3` |
| Unsigned wrap and signed overflow are different | `values/5`, `c-guarantees/1`, `c-guarantees/6` |
| A guard can prevent an invalid operation | `control-flow/2` |
| Sorted order lets us discard a whole region | `searching/2` |
| Doubling the input changes the amount of work | `big-o/1`, `big-o/3`, `big-o/7` |
| Merge consumes the smaller next value | `sorting/2` |
| Recursive calls keep unfinished work | `recursion/1`, `recursion/2` |
| The links define the traversal order | `lists/2`, `lists/3` |
| Stacks and queues remove from different ends | `queues/1` |
| Two keys can start at the same bucket | `hash-tables/2`, `hash-tables/3` |
| A deleted slot must not break a probe chain | `hash-tables/4` |
| A search tree routes by ordered keys | `trees-heaps/2` |
| A min-heap orders parents before children | `trees-heaps/5`, `trees-heaps/6`, `graphs/6` |
| One graph can have several routes to a vertex | `graphs/1`, `graphs/2`, `graphs/4` |
| A query passes through distinct responsibilities | `database-foundations/2`, `parsing/4`, `execution/6`, `planning/4`, `richer-queries/3` |
| A file format chooses its byte order | `files-bytes/3`, `persistence/2`, `portable-c/2`, `hardening-tinydb/2` |
| A slot is an indirection to record bytes | `pages/1`, `pages/3`, `pages/4` |
| A cache lookup has a hit path and a miss path | `pages/5`, `reliability/2` |
| A leaf split creates two searchable key ranges | `bplus-trees/4`, `bplus-trees/5` |
| A private working copy can commit or roll back | `recovery/1`, `recovery/2`, `recovery/3`, `multi-client/2` |
| Recovery keeps committed work and ignores an incomplete tail | `recovery/4`, `recovery/5`, `ship/3`, `maintenance/1` |
| Keep the portable rules behind an explicit host boundary | `portable-c/1`, `portable-c/4`, `hardening-tinydb/5` |
| Check the destination range before converting | `c-guarantees/5` |
| Mutual exclusion protects a complete critical section | `threads/3`, `coordination/1` |
| Wake up, reacquire, and recheck the predicate | `coordination/2`, `concurrent-storage/2` |
| Opposite lock orders can form a wait cycle | `coordination/3` |
| Release/acquire can publish earlier writes | `atomics/1`, `atomics/3` |
| A bounded queue separates admission from execution | `concurrent-storage/3`, `multi-client/1`, `multi-client/3` |
| Safe individual accesses can still lose a transaction’s update | `isolation/2` |
| A snapshot chooses a visible committed version | `snapshots/1`, `snapshots/2`, `snapshots/3`, `isolation/3` |
| Checkpoint before retiring recovery information | `maintenance/2` |
| Select a facility using evidence from the actual toolchain | `standards-evolution/3`, `portable-c/3` |
| A four-element array has indices 0 through 3 | `arrays-strings/1` |
| The row count identifies the valid prefix | `structured-data/5`, `database-foundations/1`, `tables/1`, `tables/2`, `tables/3` |
| Bounds bracket every occurrence of an equal key | `searching/4` |
| Logical queue order can wrap across array index zero | `queues/2` |
| A header tells a decoder how to read the following bytes | `persistence/1` |
| Count calls at each split depth | `recursion/4` |
| Two predecessor cells feed one result | `strategies/4` |
| Update direction controls item reuse | `strategies/5` |
| Compare the estimated work of both paths | `planning/1` |
| Data frequency changes the match estimate | `richer-queries/2` |
| Tiny positive results can become subnormal or zero | `c-guarantees/10` |
| How fgets fills a buffer | `arrays-strings/3` · after worked example |
| Assignment stores a value at that moment | `values/2` · after worked example |
| Continue and break take different paths | `control-flow/4` · after worked example |
| Const can restrict two different objects | `pointers/4` |
| A shared declaration refers to one definition | `larger-programs/2` · after worked example |
| Clearing one flag preserves the other | `files-bytes/2` · after worked example |
| Each field has an explicit byte range | `files-bytes/6` · after worked example |
| Partition fixes one pivot position | `sorting/3` · after worked example |
| Equal keys keep their original order | `sorting/4` · after worked example |
| Three earlier answers feed best[6] | `strategies/3` · after worked example |
| The same keys can have different heights | `trees-heaps/3` · after worked example |
| Rotations change links while preserving key order | `trees-heaps/4` · after worked example |
| A cheaper route replaces a previous distance | `graphs/5` · after worked example |
| An operator takes the right operand first | `queues/5` · after worked example |
| Both SELECT branches must reach the end | `parsing/3` |
| Sort the result before applying LIMIT | `execution/4` · after worked example |
| Reject a partial file before replacing the live table | `persistence/6` · after worked example |
| A boundary key belongs to the right-hand leaf | `bplus-trees/2` · after worked example |
| Deletion can borrow first, then merge | `bplus-trees/6` · after worked example |
| Conversion can happen before or after arithmetic | `c-guarantees/4` · after worked example |
| Destroy synchronization objects only after joins | `concurrent-storage/4` · after worked example |
| One lock protects the whole transfer | `isolation/1` · after worked example |

76 original figure definitions serve 126 selected lessons across all nine parts. See the [complete lesson-by-lesson review](concept-diagram-review.md) for the additions, replacements and decisions to keep prose or existing output.

## Maintaining the figures

Edit the descriptive data or rendering helpers in `dist/concepts.js`, then run `node tools/sync_readings.cjs`. `npm test` checks placement, accessible descriptions, local-only rendering, source/draft preservation, reading parity, and the illustrated search counts. Browser checks additionally cover reflow, readable text, text alternatives, and page overflow on phone and tablet widths.

## Recent visual-design pass

See [the design review](visual-design-review.md) for all 23 recently added or revised figures. The fgets figure is an interactive, fixed-capacity model; its controls live outside the accessible image. All other figures remain static. Step controls do not run C. Input presets explicitly prepare the editor’s next input, and source/input provenance keeps the model distinct from inspected memory.
