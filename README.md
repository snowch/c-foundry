# C Foundry

[Open the course](https://snowch.github.io/c-foundry/#/course) · [Command workspace](https://snowch.github.io/c-foundry/#/workspace) · [Codespaces setup](docs/codespaces.md)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/snowch/c-foundry?quickstart=1)

A C, algorithms, and database course with **nine parts, 44 chapters, and 220 authored topic lessons**. Every topic includes an explanation, complete worked program, expected output and walkthrough, pitfall, understanding question with feedback, and an experiment. There are **139 inline browser examples**, **81 native examples**, and **15 separate practice exercises** with 82 output cases.

| Part | Chapters | Lessons | Focus |
| --- | ---: | ---: | --- |
| 1 | 5 | 25 | The C language |
| 2 | 5 | 27 | Memory and practical C |
| 3 | 5 | 28 | Big O, correctness, searching, sorting, recursion, strategies |
| 4 | 5 | 28 | Lists, queues, hashing, balanced trees, heaps, graphs |
| 5 | 5 | 27 | TinyDB tables, a SQL subset, execution, persistence |
| 6 | 5 | 32 | Pages, B+ trees, planning, transactions, recovery, release work |
| 7 | 4 | 21 | C standards, numeric boundaries, guarantees, portability, hardening |
| 8 | 4 | 14 | Threads, coordination, atomics, storage ownership |
| 9 | 6 | 18 | Multi-client contracts, isolation, snapshots, maintenance, richer queries, reliability |

## Read, run, and track progress

Ready chapter links open the first lesson directly. Contents expands the current part and highlights the current topic. Breadcrumbs, a chapter selector, and Previous/Next links support moving through lessons without repeatedly visiting overview pages. A sidebar is not permanently reserved on tablets.

Portable examples mount the shared editor directly in their reading page with Run, Stop, Reset, Export, input, and console output. Drafts have stable per-example IDs. Native examples show source files, an actual repository command, Codespaces launch/copy controls, and a source link. Expected output is an optional disclosure. Examples are not graded practice and do not automatically mark a lesson done.

At each topic’s end, **Mark lesson as done** explicitly records reading completion; uncheck to undo. Following video-lab’s pattern, independent per-topic localStorage keys reconcile updates across tabs. Ticks appear in Contents, chapter outlines, and the selector, with chapter and part counts. Marks persist in this browser/device until site storage is cleared. Failed saves retain the choice for the session and explain the limitation. Earlier drafts and exercise output-check progress retain their original storage format.

## Run programs from the CLI

Open the [command workspace](https://snowch.github.io/c-foundry/#/workspace). It runs real C/Wasm binaries with arguments and a shared flat filesystem:

```text
cc hello.c -o hello
./hello Ada
tinydb people.db
INSERT INTO people VALUES (1, 'Ada', 90);
SELECT * FROM people;
UPDATE people SET score=95 WHERE id=1;
SELECT COUNT(*) FROM people;
.quit
```

TinyDB is a bundled C17 program, not a JavaScript SQL simulation. Its browser prompt invokes the C executable once per statement against the same file. It implements a single `people` table with unique positive uint32 IDs, 1–31 UTF-8 byte names, uint32 scores, 128 rows, INSERT/SELECT/UPDATE/DELETE/COUNT, optional ID filters, and case-insensitive SQL keywords. It uses autocommit and scans; indexes, transactions, concurrency, and crash recovery remain course models/project extensions. Its TDB1 format accepts the course sample; the earlier transfer lesson accepts at most eight rows, so it cannot import a larger CLI database.

Files save independently in IndexedDB, survive reloads, and can be imported or downloaded byte-for-byte. A stale tab cannot overwrite a newer saved snapshot. Storage failures leave files available for download and report unsaved status. Clearing browser site data removes saved work. Lesson editor **CLI** copies the current draft into a unique source file. **Add TinyDB source** provides the same source used for the bundled binary, ready to edit and compile. Use `./tinydb` to invoke your own file with that name; bare `tinydb` selects the included program.

`cc` supports multiple C sources and local headers with fixed C17 flags. Quoted arguments and preloaded stdin work; shell expansion, pipes, native Linux binaries, networking, and threads require Codespaces. Compatible binaries must target this runtime’s older `wasi_unstable` ABI. Limits are 32 files, 2 MB per file, 8 MB total, 256 KB per source, 100 KB output, and five seconds per program. Failed builds, traps, and Stop retain the previous files; normal exits (including nonzero status) commit file changes. This is a teaching workspace, not a crash-durable database service.

Run the same C source as a genuine stdin REPL in Codespaces or locally:

```sh
make tinydb-cli DB=people.db
# Or build once, then invoke directly:
make .build/native/tinydb-cli
.build/native/tinydb-cli people.db --execute "SELECT * FROM people;"
make check-cli
```

## Optional GDB investigations

The browser course remains usable without a native debugger. Two optional lessons provide real GDB sessions in Codespaces, the local dev container, or Linux/WSL:

- [End of Part 2: Debugging C with GDB](https://snowch.github.io/c-foundry/#/chapter/files-bytes/7) — reproduce a logical failure, inspect variables and arrays, step through calls, inspect the call stack, and watch a value change. Fix the editable starter and verify ordinary, single, empty, and negative cases.
- [End of Part 6: Repair a broken TinyDB](https://snowch.github.io/c-foundry/#/chapter/ship/8) — investigate wrong-row UPDATE and lost-row DELETE failures in an isolated copy of the real CLI. Each launch seeds a new database. Regression checks reopen the saved file and verify neighbor/survivor preservation.

```sh
make debug-lab LAB=basics       # build and show the guide
make debug-gdb LAB=basics       # real GDB; stops inside sum_values
make debug-check LAB=basics     # initially fails until you repair the starter
make debug-gdb LAB=tinydb
make debug-gdb LAB=tinydb CASE=delete
make debug-check LAB=tinydb
```

Edit `native/debugging/<lab>/main.c`. Separate references live under `.reference/`; `make debug-check LAB=basics REFERENCE=1` checks the reference rather than the student copy. Lab artifacts and unique fixture sessions live under `.build/debugging/`. These labs do not alter the browser CLI, its files, or the canonical `native/cli/tinydb.c`. Compiler warnings, logging, assertions, hypothesis testing, and regressions remain part of the browser learning path; GDB sessions are an optional extension. No GDB-in-Wasm runtime is loaded by the site.

Maintainers run `make check-debugging` (also with `CC=clang`) to verify frozen fault reproductions, the repaired reference contracts, and actual GDB breakpoint, stepping, stack, and software-watchpoint observations. Acceptance fixtures are built separately so repairing a student copy does not invalidate these maintainer checks. This is distinct from the student `debug-check` command. The course dev container already includes GDB; GitHub Actions runs these checks before deployment.

## Numeric boundaries

[Part 7, Chapter 32](https://snowch.github.io/c-foundry/#/chapter/c-guarantees/4) extends the Part 1 introduction with seven focused lessons: signed/unsigned comparisons and promotions; checked narrowing; checked addition/subtraction/multiplication; exceptional division, remainder, and negation; floating rounding and tolerances; NaN/infinity and finite parsing; and underflow/subnormals.

Four integer examples run inline. Three floating examples run natively with `-lm`, explicitly require the demonstrated binary64/subnormal facilities, and establish round-to-nearest where needed. They do not manufacture NaN or infinity through undefined arithmetic or assume that all C implementations share IEEE behavior.

The checked-calculator practice has 24 output cases. The independent native reference oracle checks 2,391 boundary/random cases against arbitrary-precision arithmetic, including output preservation on rejection, plus finite-input and tolerance policies. It checks the repository reference, not a learner’s unfinished starter:

```sh
make exercise EXERCISE=arithmetic
make example EXAMPLE=c-guarantees-8
make check-numeric
make check-numeric CC=clang
make check-numeric SANITIZE=1
```

## Database scope and chapter projects

The course provides complete, executable **components and bounded teaching models**, with guided chapter projects to assemble and extend them. It does not automatically assemble a production database engine merely by marking readings complete.

The implemented examples include:

- A bounded row table with insertion, lookup, update, deletion, uniqueness, and failure preservation.
- A lexer/parser for a documented, case-sensitive SQL subset: `INSERT INTO people VALUES (number, 'name', number);` and `SELECT * FROM people` with an optional `WHERE id = number`, followed by a semicolon. Ordering, aggregates, joins, and prepared-query examples are separate operators/models to integrate into the grammar as project work.
- A documented 40-byte little-endian row codec, versioned eight-byte file header, validated imports, named exports, and a checked fixed-page pager.
- Slotted-page and cache models; a bounded two-level B+ index with real split, borrow, merge, range, and pool-ownership behavior. The model’s routing root supports at most eight four-entry leaf pages; it is not an arbitrary-height serialized index.
- Single-writer transaction state, fixed-record redo-log prefix recovery, a checked POSIX log-sync ordering example, and a checked Linux checkpoint publication sequence. The redo models retain explicit one-value/single-writer limits.
- Joined pthread and C11-thread examples, a bounded draining queue, atomic counters and acquire/release publication, reader/writer protection, optimistic stale-write rejection, committed-version visibility, and an active-snapshot reclamation model.

Every later chapter has a build-it-yourself goal, concrete extension tasks, and checks. Its baseline command verifies the original example output, not every learner extension. The two Part 2 native projects additionally provide student TODO modules, public header contracts, executable checks, and separate `.reference/` implementations. Their initial student checks intentionally fail.

The first five native foundations remain in `native/demos/`; they are independent demonstrations rather than the full assembled capstone. Lesson-run files reset between runs; CLI workspace files persist independently. Browser drafts and reading marks are not database durability mechanisms. The isolation, MVCC, recovery, statistics, and checkpoint pages state their model and host limits explicitly.

## Run locally or in Codespaces

Serve `dist/` using any static HTTP server; there is no app build step. Modern browsers need WebAssembly, Web Workers, and DecompressionStream. The first compiler run fetches about 19 MB of compressed assets from the same site.

The dev container provides GCC 14.3, Clang 19, GDB, Make, Python, and Node 24. A desktop computer is not required: Codespaces runs Linux and an editor in the browser. It consumes your GitHub account’s compute/storage allowance; [check the current terms](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces). No workspace is created automatically by visiting a lesson.

```sh
make serve
make chapter CHAPTER=hash-tables
make example EXAMPLE=graphs-6
make example EXAMPLE=atomics-3
make example EXAMPLE=hardening-tinydb-4 SANITIZE=1
make project PROJECT=record-store
```

All 44 chapter workspace READMEs contain complete exported readings. Student browser exercise starters also have native copies under `native/exercises/`.

## Export and inspect files

```sh
make example EXAMPLE=persistence-5 KEEP_FILES=1
make example EXAMPLE=maintenance-2 KEEP_FILES=1
```

`KEEP_FILES=1` retains files under `.build/files/<example>/`; normal runs execute in a temporary working directory. Download retained files through the Codespaces explorer. The [persistence lesson](https://snowch.github.io/c-foundry/#/chapter/persistence/5) also offers the 88-byte two-row sample in `dist/assets/tinydb-sample.tdb`. Its transfer program accepts `import <path>` when compiled directly, with complete validation before replacing state. Native files and browser drafts are not automatically synchronized.

Use your own fork/branch and commit and push work you want to retain before deleting a Codespace. See the setup guide for local development, reuse, and storage details.

## Verify and publish

```sh
npm ci
npm test                       # all page routes and the actual Wasm compiler
make check-examples            # all 220 complete programs, strict GCC
make check-examples CC=clang
make check-examples PART=8      # one part
make check-examples SANITIZE=1
make check-structures           # independent B+ and AVL invariant workloads
make check-structures SANITIZE=1
make check-numeric              # numeric reference oracle and floating policies
make check-projects             # the two native project references
make check-projects SANITIZE=1
make check-debugging           # real GDB and the two repair lab contracts
make check-cli                 # native CLI persistence and boundary tests
make check-native
make check-native-clang
make standards-matrix
make sanitize
make tsan                       # optional; runtime/kernel support required
```

Browser tests execute 139 worked examples and 82 practice cases through the real compiler worker, plus diagnostics, nonzero exits, malformed input, rejected starters, cancellation, and recovery. Command tests additionally compile multiple files and check argv/stdin UTF-8, shared file append/EOF, nonzero exits, failed builds, TinyDB CRUD, corrupt-file preservation, and the bundled binary’s reproducibility. DOM checks cover all 44 chapters and 220 topics, answer feedback, inline editor state, explicit completion, per-key tab reconciliation, unsaved feedback, native commands, and the downloadable fixture. Independent native workloads check 32,000 mixed B+ operations and 32 AVL insertion permutations against ordering, occupancy, reachability, height, and ownership properties.

GitHub Actions deploys `dist/` on pushes to `main` only after the browser/interface and native jobs pass. Native CI builds the dev container, runs all examples under GCC and Clang, checks structural workloads, and runs the existing native foundations/project references with sanitizer checks.

## Content maintenance and runtime

`dist/part1.js` through `part9.js` hold the authored content. `dist/course.js` defines the syllabus/execution metadata and mirrors `native/course.json`. `dist/readings.js` renders readings and registers portable examples; `dist/completion.js` stores reading marks; `dist/app.js` handles routing/editor state; `dist/execution.js` renders native launch controls. `dist/workspace.js`, `dist/command-model.js`, and `dist/compiler/workspace-worker.js` implement the CLI; `native/cli/tinydb.c` is its canonical database source. Run `node tools/build_browser_programs.cjs` after editing that source, then commit the generated source copy, Wasm, and manifest in `dist/programs/`. `npm test` checks reproducibility. `dist/visuals.js` retains the optional original exercise traces and counted-search comparison.

Run `node tools/sync_readings.cjs` after content edits to regenerate all chapter READMEs, 220 native examples, the checked-output/source/flag manifest, and the sample file. It does not overwrite student exercise/project modules. Multi-file or native examples have their own directories; portable examples have flat `.c` exports.

The browser compiler is the experimental [binji/wasm-clang](https://github.com/binji/wasm-clang) Clang 8 / LLD toolchain with incomplete older WASI support. The runtime bridge corrects legacy file-read/EOF bounds and append handling, and encodes argv/stdin/output as UTF-8. Original runtime and LLVM licenses are distributed in `dist/compiler/`. Compilation and execution happen locally in a worker; no compilation server is involved. Runs have a five-second execution limit and 100 KB output cap; compiler initialization has a two-minute limit. Native threads, arbitrary host files, and native sanitizer runtimes require the Linux toolchain.

## Verification limits

Phone/tablet Chromium checks cover 390, 768, and 1024 px, representative lessons from every later part, actual inline B+ tree compilation, native launch/copy controls, sample downloads, completion persistence, and overflow. Earlier navigation/completion checks also covered 320 px. Screenshots were inspected. This does not establish behavior on every physical device or browser.

All 220 programs pass strict GCC, Clang, and native ASan/UBSan checks in the selected Codespaces image. Threaded examples check deterministic contracts while allowing schedule-dependent contention metrics. Hosted Codespace creation and real power-loss/device-failure recovery were not exercised. A green finite suite is not proof of algorithm complexity, memory safety for all inputs, race freedom under every schedule, durable behavior on every filesystem, or a production-ready database.
