# Learner content review — 20 November 2026

The review uses Chapter 1’s stated prerequisite of no prior C. Later material assumes the preceding lessons, without assuming prior Linux command-line experience. It covers 227 topic lessons, 44 chapter overviews, 15 practices, 44 documentation questions, the existing figures, and the contents, editor, command workspace, Linux launcher, setup, completion, and feedback text.

The review distinguishes context, explanation, learner action, automatic preparation, and interpretation of results. Correct wording is retained. The [change ledger](content-review-2026-11.json) records the quoted before/after passages, project revisions, and figure specifications. Its baseline is `9d41ba2`.

## Findings implemented

- The contents no longer repeat runtime labels. Execution instructions stay at the lesson’s launch controls.
- Instructions distinguish prepared starter files and input from the edits the learner must make. The Linux source listing is explicitly read-only; the browser source editor and its transfer steps are named.
- Linux setup and source transfer now identify the copy button, terminal paste, Enter key, destination directory, and point at which an edited file replaces the guest copy. The C workspace’s Command field has a visible label.
- Revised experiments name source expressions, output fields, and the question answered by a comparison. B+ insertion tasks name the actual loop bound; the range description now agrees with the executed [2,8) fixture.
- The greeting lesson describes replaced Console output rather than implying that two runs remain visible together. Sorting checks distinguish observed order from preservation of duplicate values.
- A parser returning normally is no longer described as establishing memory safety. Atomic fetch-add is distinguished from a plain read/write sequence that can lose an increment. Equal result counts are distinguished from equal complete result rows.
- First uses define graph vertices and edges, BFS/DFS, BST, an invariant, a condition predicate, MVCC, and LSN. Composite-key order is explained without relying on “lexicographic” as an unexplained term.
- Repeated project introductions and generic checks are replaced by chapter-specific extensions, test cases, and evidence. The selected starting example is linked directly; these are learner-built extensions rather than automatic features. Edited Linux examples use RUN_ONLY=1 so an intentional new output is not rejected as a mismatch with the original.
- Required browser work no longer asks learners to run TSan or obtain macOS/Windows. GCC/Clang comparisons run in Browser Linux; the repository’s automated matrix supplies separate cross-host evidence.
- Repeated notes suggesting that a full native engine already exists are removed. Component bounds, numeric target assumptions, lifecycle rules, and durability limits remain visible.
- Rendered C escape sequences were checked and retained: newline, tab, quoted quote, and backslash spellings were already correct.

## Concept diagrams

Six additional figures are original course material. The cost comparison replaces the generic query pipeline on `planning/1`; the other five fill previously unillustrated relationships. There are now 54 original figure definitions and 107 placements. No external artwork or reference-site layouts were copied. Each figure has readable text, an equivalent Diagram in words, and visible assumptions.

### 1. `recursion/4`

> Every level contributes Θ(n) work, and the tree has Θ(log n) levels. Count leaves separately from the total number of nodes; for the example’s power-of-two input, there are n leaves and 2n−1 nodes.

**Question:** Why does splitting eight inputs produce fifteen calls but only eight leaves?

**Show:** Start with one call of size eight at depth zero. It creates two calls of size four at depth one, then four calls of size two at depth two, then eight calls of size one at depth three. Size-one calls are leaves. Adding the call counts gives fifteen; the final depth has eight leaves. The table counts calls, not elapsed time or merge operations.

**Placement and prose:** Immediately after the conceptual explanation, before the worked example. Can replace the repeated sentence “This program counts the split tree only” by carrying that scope in the figure note. Keep the recurrence and the merge-combine work assumption in prose.

**Keep visible:** This is the power-of-two split fixture. A merge-sort combine step adds work not counted by this program.

### 2. `strategies/4`

> For obstacle-free grid paths moving right or down, ways[r][c] depends on the cell above and the cell to the left.

**Question:** Which two previously computed cells contribute to the destination’s six paths?

**Show:** In a three-by-three grid indexed from zero, ways[1][2] is three and is immediately above ways[2][2]. ways[2][1] is three and is immediately to its left. Their arrows converge on ways[2][2], whose value is six. A final down move comes from the upper cell; a final right move comes from the left cell. These two last-move cases are distinct.

**Placement and prose:** Immediately after the conceptual explanation, before the worked example. Replaces “The table itself is the dependency diagram.” The revised walkthrough names the bottom-right output and its incoming moves.

**Keep visible:** Only right and down moves are allowed; the original grid has no obstacles. Blocking a cell changes these counts.

### 3. `strategies/5`

> For each item, visit capacities downward so best[w−weight] still refers to the solution before this item. Updating upward would solve an unbounded-use variant instead.

**Question:** Which earlier write would let an upward update use the same item twice?

**Show:** Consider only the first item, with weight two and value three; every best cell initially holds zero. Descending capacities visit four before two: best[4] reads the old best[2] of zero and becomes three, then best[2] becomes three. Ascending capacities visit two first: best[2] becomes three, then best[4] reads that changed cell and becomes six. Six counts the same item twice, so it belongs to an unbounded-use variant.

**Placement and prose:** Immediately after the conceptual explanation, before the worked example. Can replace “Each item contributes at most once because capacities descend” with the first-item trace. Keep the explanation of capacity5=7, the state definition, and the complexity caveat.

**Keep visible:** This isolates the first item of the fixture. Capacities count weight units; best values count value units. Upward updates solve a different, reusable-item problem.

### 4. `planning/1`

> The teaching estimate charges one unit per page, assumes a cold cache and one distinct data-page fetch per match, and adds three index levels.

**Question:** When do scattered matches make index navigation plus row fetches cost more than a scan?

**Show:** The model has one hundred table pages and an index with three levels. It charges one page unit for each index level and one distinct data-page fetch per matching row. For one match, the index costs three plus one, or four units, versus one hundred for a scan, so choose the index. For ninety-eight matches, the index costs one hundred and one units, versus one hundred for a scan, so choose the scan.

**Placement and prose:** Immediately after the conceptual explanation, before the worked example. Replaces the generic query-pipeline figure on this lesson. The two numeric walkthrough sentences can be replaced by the named narrow= and wide= output interpretation; keep the cost assumptions and result-equivalence rule.

**Keep visible:** Cold cache; each match needs a different data page. These are estimated page units, not measured disk reads or timings; both paths must return the same rows.

### 5. `richer-queries/2`

> The fixture has seven score-one rows and one score-nine row. A ten-value uniform model estimates 0.8 matches for score one, while a per-value histogram records seven.

**Question:** Why does a histogram estimate seven matches when a uniform model estimates less than one?

**Show:** There are eight score rows: seven have score one and one has score nine. A uniform model over ten possible score values predicts eight divided by ten, or zero point eight matches for either queried value. A histogram counted from the same rows predicts seven matches for score one and one match for score nine, equal to the actual counts in this fixture. The row total is eight in both cases.

**Placement and prose:** Immediately after the conceptual explanation, before the worked example. Replaces the two quoted numeric setup sentences with the comparison table. Keep the data-refresh and correlation caveats.

**Keep visible:** The histogram is built from this fixed data. Later updates can make it stale, and single-column counts do not capture correlations between fields.

### 6. `c-guarantees/10`

> DBL_MIN is the smallest positive normal double, not the most negative value and not the smallest positive subnormal. On the explicitly required binary64 target with gradual underflow, nextafter(0,1) produces the smallest positive representable value.

**Question:** Which threshold separates a positive normal value from a subnormal value, and when can halving produce zero?

**Show:** Read the boxes in increasing value, starting at zero. Zero is followed by the smallest positive subnormal, two to the power minus one thousand seventy-four. Half of DBL_MIN is two to the power minus one thousand twenty-three and remains subnormal. DBL_MIN is two to the power minus one thousand twenty-two and is the smallest positive normal binary64 double. Halving the smallest positive subnormal rounds to zero under round-to-nearest. The picture shows value categories, not proportional distances.

**Placement and prose:** Immediately after the conceptual explanation, before the worked example. Can replace “Half of DBL_MIN remains a finite subnormal on these targets” and “Halving the smallest subnormal through scalbn rounds to zero under the chosen rounding mode” with the ordered boxes and their note. Keep target, rounding, classification, and math-error reporting assumptions visible.

**Keep visible:** The experiment requires binary64, gradual subnormals, and round-to-nearest. Boxes are not to scale; the C classification functions determine the printed results.

## Wording fixes preferred over extra diagrams

The one-line unsigned quotient identity, first-run Console replacement, missing-result handling, command labels, and the B+ upper endpoint can be resolved directly in text. They do not need another figure. Existing diagrams already show pointer aliasing, ownership after realloc/free, short-circuit guards, half-open bounds, splits, publication, snapshots, and checkpoint ordering. Repeating them in every nearby lesson would add reading and scrolling without a new relationship.

## Verification

The release checks cover authored/native mirror parity, all lesson and project links, explicit completion, saved drafts, original-output comparisons, and diagram accessibility. The full browser suite compiles the 191 inline examples and 82 practice cases. Responsive Chromium checks exercise all 293 views at 320, 390, 768, and 1024 pixels, plus all six new figures with their text alternatives expanded. Selected revised source edits are compiled and their output inspected. GitHub’s existing native, sanitizer, and cross-platform exchange gates remain required before deployment.

Viewport emulation does not establish usability on every physical tablet or comprehension by learners. The real hosted Linux validation is recorded separately in [browser-linux-validation.json](browser-linux-validation.json); this editorial release does not change those C sources.
