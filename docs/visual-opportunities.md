# Visual opportunities across the whole course

Reviewed on 25 November 2026 against `d7a720fb9ba660532f2e4a3a6f2c5b398883b0a1`. This extends the review beyond existing diagrams: 227 lessons have coverage records, including 9 newly illustrated lessons and 13 revised models.

Follow the [shared course-design guide](https://github.com/snowch/cuda-python-lab/blob/main/docs/course-design-guide.md). No dedicated UX or learning skill was available; this records equivalent design and learning reviews.

## Learning review

Look for references to shared objects, changing slots, exclusive bounds, call/return state, alternative branches, dependency edges, occupancy thresholds and publication/retention boundaries. Add a model when it answers a named question more directly than code/output alone. Keep simple syntax, API lookup and one-step results concise. The JSON companion quotes the passage, pins the starter source, and records each selected question, parts, connections, values, units and assumptions. Keep prerequisite definitions visible. Static models explicitly describe the supplied example, not arbitrary source edits.

## Presentation review

Before: spatial relationships were sometimes encoded in prose cards, small labels or a differently sized example. After: stable indexed cells for storage/ranges, converging name-to-object edges for aliases, actual graph/tree links, explicit alternatives, and labelled dependency tables. Essential model labels use live text at 16px or larger. Use theme roles and text/shape cues as well as color. Retain local scroll only where needed; never shrink the whole model to conceal small type.

## Reading order and scope

Keep the course’s existing reading order and compact lesson navigation. Put models next to the worked explanation/result without moving the editor into another page. Models never execute code, modify source/Input, write storage or mark completion. Keep the existing fgets interaction in C. A model can replace repeated relationship narration; it does not replace preconditions, definitions or caveats.

## Curated additions and revisions

| Lesson | Decision | Question answered |
| --- | --- | --- |
| [String comparison, copying, and parsing](https://snowch.github.io/c-foundry/#/chapter/arrays-strings/4) | Added | Which position must end reach before accepting the complete integer field? |
| [Text statistics and word counting](https://snowch.github.io/c-foundry/#/chapter/arrays-strings/5) | Added | Which transition increments words? |
| [Leaks, dangling pointers, and double frees](https://snowch.github.io/c-foundry/#/chapter/allocation/4) | Revised | Why does changing and freeing copy leave original unchanged? |
| [typedef, enums, and tagged unions](https://snowch.github.io/c-foundry/#/chapter/structured-data/2) | Added | Which member is valid for each established tag? |
| [An in-memory record collection](https://snowch.github.io/c-foundry/#/chapter/structured-data/5) | Revised | Which row changes when the caller writes found->score = 99? |
| [Text and binary file I/O](https://snowch.github.io/c-foundry/#/chapter/files-bytes/1) | Added | Why does fseek(file,0,SEEK_SET) come before fgets? |
| [Binary search and its sorted-input requirement](https://snowch.github.io/c-foundry/#/chapter/searching/2) | Revised | Why does lower(a, 5, 8) return position 3? |
| [Records, tables, schemas, and keys](https://snowch.github.io/c-foundry/#/chapter/database-foundations/1) | Revised | Which slots may display inspect after this insertion? |
| [Representing rows with structs](https://snowch.github.io/c-foundry/#/chapter/tables/1) | Revised | Why does changing source.name leave the stored name unchanged? |
| [Inserting and selecting records](https://snowch.github.io/c-foundry/#/chapter/tables/2) | Revised | Why does display print Grace before Ada? |
| [Duplicate IDs and capacity limits](https://snowch.github.io/c-foundry/#/chapter/tables/3) | Revised | Why do both attempts fail while count stays 8? |
| [NaN, infinity, and finite numeric input](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/9) | Added | Why must the parser test isfinite after strtod succeeds? |
| [Text and binary streams, LF and CRLF](https://snowch.github.io/c-foundry/#/chapter/portable-c/5) | Added | Which bytes does strip_line_ending remove? |
| [Encodings, locale, and safe byte classification](https://snowch.github.io/c-foundry/#/chapter/portable-c/7) | Added | Why are there 6 UTF-8 bytes but only 4 ASCII letters? |
| [Auditing assumptions about types and memory](https://snowch.github.io/c-foundry/#/chapter/hardening-tinydb/1) | Added | Why must the guard run before count * sizeof(int)? |
| [Thread lifetimes and shared memory](https://snowch.github.io/c-foundry/#/chapter/threads/2) | Added | When may main read result and let job leave scope? |
| [Producer–consumer queues](https://snowch.github.io/c-foundry/#/chapter/coordination/2) | Revised | Why can a woken consumer still need to wait? |
| [Lock ordering, deadlocks, and starvation](https://snowch.github.io/c-foundry/#/chapter/coordination/3) | Revised | What cycle would opposite lock orders permit? |
| [Defining and testing an isolation contract](https://snowch.github.io/c-foundry/#/chapter/isolation/3) | Revised | Which commit happens between the two reads? |
| [Snapshot reads](https://snowch.github.io/c-foundry/#/chapter/snapshots/1) | Revised | Why does snapshot 2 see 10 while snapshot 3 sees 20? |
| [An introduction to MVCC](https://snowch.github.io/c-foundry/#/chapter/snapshots/2) | Revised | Why does snapshot 2 see 10 while snapshot 3 sees 20? |
| [Visibility rules and reclaiming old versions](https://snowch.github.io/c-foundry/#/chapter/snapshots/3) | Revised | Why does snapshot 2 see 10 while snapshot 3 sees 20? |

## Complete coverage

See [all per-lesson decisions, passages and model specifications](visual-opportunities.json). “Keep prose” means no additional visual is selected for that focused objective in this pass; it is not a claim that no possible illustration could help. Existing figures outside the changed set remain available.

## Verification

- `npm test` passed, including source/export parity, compiler/run behavior, completion and bundle provenance.
- `node tests/concept-browser.cjs` passed for all 94 distinct figures at three widths in both themes, with expanded text, saved drafts/progress and real fgets compilation.
- `node tests/navigation.cjs` passed for all parts, chapters and lesson destinations; opening navigation starts no runtime.
- `npm run build` passed. The source bundle was regenerated after updating its included reading documents and its provenance checks passed again.

These checks verify presentation and behavior; they do not measure learner comprehension.
