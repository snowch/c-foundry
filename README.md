# C Foundry

[Open the course](https://snowch.github.io/c-foundry/#/course) · [Command workspace](https://snowch.github.io/c-foundry/#/workspace) · [Browser Linux](https://snowch.github.io/c-foundry/#/linux)

A browser-only C, algorithms, and database course with **nine parts, 44 chapters, and 227 authored topic lessons**. Every topic includes an explanation, complete program, expected output, walkthrough, pitfall, understanding check, and an experiment. **191 examples run inline; the remaining 36 run in Browser Linux.** Fifteen separate practice exercises provide 82 output cases.

| Part | Chapters | Lessons | Focus |
| --- | ---: | ---: | --- |
| 1 | 5 | 26 | Language, build stages, and finding documentation |
| 2 | 5 | 27 | Memory, practical C, multi-file projects, optional GDB |
| 3 | 5 | 28 | Big O, correctness, searching, sorting, recursion, strategies |
| 4 | 5 | 28 | Lists, queues, hashing, trees, heaps, graphs |
| 5 | 5 | 27 | Build TinyDB: rows, parsing, execution, persistence |
| 6 | 5 | 32 | Pages, indexes, planning, recovery, optional GDB repair |
| 7 | 4 | 27 | Standards, numeric boundaries, portability and file exchange |
| 8 | 4 | 14 | Threads, locks, atomics, concurrent storage — Browser Linux |
| 9 | 6 | 18 | Isolation, snapshots, maintenance, richer queries, reliability |

## Everything runs in a browser

The inline compiler mounts directly in compatible lessons with Run code, Stop, Editor tools, input, and console output. Multi-file examples have source-file buttons and separate saved drafts. Restore starter restores the complete example; Undo replacement recovers the draft. Export in Editor tools downloads the selected file. Example runs, reading completion, and graded practice checks are independent.

The **Browser Linux** launcher carries a lesson’s actual command to an on-demand terminal embedded in the course. The JSLinux x86-64/Alpine VM executes on the learner’s device inside the browser and already contains GCC, Clang, GDB, Make, Python, and nano. Import the supplied course archive once, paste the setup command, then run the selected lab. The Linux page also offers a browser source editor with saved drafts, edited-file download/import, and explicit apply commands; terminal-editor shortcuts are optional. Every Part 8 concurrency example uses this Linux path. No account or local installation is required.

The terminal’s filesystem is temporary. The course page provides commands to export a complete work archive and restore it in a new session. Navigating among course pages retains the active terminal; reloading, closing, or stopping it does not. See [Browser Linux setup, saving, and provenance](docs/browser-linux.md) and the [live validation record](docs/browser-linux-validation.json).

The site embeds the externally hosted terminal and credits its provider. It does not redistribute the emulator or OS image. The provider’s availability, first-load download, and device performance remain external dependencies. The inline compiler and course readings are independent of that service.

## Projects and debugging

Two editable Part 2 projects provide TODO modules, executable tests, and separate references. Initial starter failure is expected. Later chapters provide bounded executable components and workshops for assembling and extending TinyDB; a production SQL engine is not already assembled.

Two optional Browser Linux investigations teach GDB:

- [Investigate a small C bug](https://snowch.github.io/c-foundry/#/chapter/files-bytes/7): breakpoints, stepping, variables, call stacks, and a watchpoint.
- [Repair a broken TinyDB](https://snowch.github.io/c-foundry/#/chapter/ship/8): investigate update/delete bugs and verify saved rows.

The course bundle contains both broken programs, guide files, regression checks, and reference repairs. Normal concurrency and GDB labs do not require a sanitizer runtime.

## Database scope and chapter projects

The course provides complete, executable **components and bounded teaching models**, with guided chapter projects to assemble and extend them. It does not automatically assemble a production database engine merely by marking readings complete.

The implemented examples include:

- A bounded row table with insertion, lookup, update, deletion, uniqueness, and failure preservation.
- A lexer/parser for a documented, case-sensitive SQL subset: `INSERT INTO people VALUES (number, 'name', number);` and `SELECT * FROM people` with an optional `WHERE id = number`, followed by a semicolon. Ordering, aggregates, joins, and prepared-query examples are separate operators/models to integrate into the grammar as project work.
- A documented 40-byte little-endian row codec, versioned eight-byte file header, validated imports, named exports, and a checked fixed-page pager.
- Slotted-page and cache models; a bounded two-level B+ index with real split, borrow, merge, range, and pool-ownership behavior. The model’s routing root supports at most eight four-entry leaf pages; it is not an arbitrary-height serialized index.
- Single-writer transaction state, fixed-record redo-log prefix recovery, a checked POSIX log-sync ordering example, and a checked Linux checkpoint publication sequence. The redo models retain explicit one-value/single-writer limits.
- Joined pthread and C11-thread examples, a bounded draining queue, atomic counters and acquire/release publication, reader/writer protection, optimistic stale-write rejection, committed-version visibility, and an active-snapshot reclamation model.

Every later chapter has a build-it-yourself goal, concrete extension tasks, and checks. Its baseline command verifies the original example output, not every learner extension. The two Part 2 Browser Linux projects additionally provide student TODO modules, public header contracts, executable checks, and separate `.reference/` implementations. Their initial student checks intentionally fail.

The first five Linux foundations remain in `native/demos/`; they are independent demonstrations rather than the full assembled capstone. Lesson-run files reset between runs; CLI workspace files persist independently. Browser drafts and reading marks are not database durability mechanisms. The isolation, MVCC, recovery, statistics, and checkpoint pages state their model and host limits explicitly.

## ThreadSanitizer is reading, not another lab

[What ThreadSanitizer can tell you](https://snowch.github.io/c-foundry/#/tools/threadsanitizer) is an optional reading page outside the TOC’s required labs and completion counts. It distinguishes data races from logical lost updates, explains detector limitations, and shows optional external compiler instructions. The hosted Linux image does not currently provide all sanitizer runtime combinations. No learner has to install tools or run TSan to complete the course.

The browser labs teach concurrency through thread lifetimes, ownership, synchronization, cooperative shutdown, and invariant checks. Emulated timings do not demonstrate physical multicore speedup, every possible schedule, or real-device durability.

## Command workspace and files

The small [browser command workspace](https://snowch.github.io/c-foundry/#/workspace) builds portable C programs with the checked-in C17 compiler, supports multiple sources and headers, and runs the bundled `tinydb people.db` command. Its shared files use IndexedDB and support import and download. It is separate from the full Linux terminal, which supplies Linux processes, threads, and GDB.

`cc` has fixed C17 options. Quoted arguments and preloaded stdin work; shell expansion, pipes, and Linux binaries belong in Browser Linux. Compatible Wasm binaries must target this runtime’s older `wasi_unstable` ABI. Workspace limits are 32 files, 2 MB per file, 8 MB total, 256 KB per source, 100 KB output, and five seconds per program. Failed builds, traps, and Stop retain previous files; normal exits commit file changes. This is a teaching workspace, not a crash-durable database service.

The persistence lesson demonstrates creating and importing `people.tdb`. Its matching 88-byte sample is downloadable. Linux-produced files can be exported from the guest and imported into the command workspace where the format is supported. Drafts, lesson marks, shared workspace files, and Linux guest files are separate stores.

## Original concept diagrams and references

48 original static diagrams support 102 selected lessons across all nine parts. They reflow at small widths, retain readable text, and include **Diagram in words** descriptions. No external artwork or copied reference-site diagrams are included. See [the figure inventory and provenance](docs/concept-diagrams.md).

Every topic has a collapsed **References and help** section with one to three curated references and a purpose for each link. Forty-four topics include an optional documentation question with a locally available answer comparison. [Finding and reading C documentation](https://snowch.github.io/c-foundry/#/chapter/first-program/6) teaches signatures, argument types, returns, errors, and standards labels using online references and a runnable printf example. Optional `man` commands illustrate an equivalent lookup on systems with manual pages; the hosted image does not include them.

## Portable C and numeric boundaries

Part 7 separates ISO C facilities from host APIs. It covers explicit field widths and byte order, checked arithmetic and narrowing, finite floating-point policies, parsing, UTF-8, stream errors, filenames, adapters, feature probes, and a concrete TinyDB portability audit.

The audited target in `native/portability/` uses an explicit TDB1 codec and ISO C binary-file access. It requires octets, uint32_t, ASCII-compatible execution characters, and UTF-8 names. It creates new files under a restricted basename policy. Tests check exact independent bytes, invalid/truncated input, output preservation, existing-file refusal, and capacity. The audit documents remaining host gaps in the larger CLI; it does not claim universal Unicode paths or cross-platform crash durability.

Four CI producers—Linux GCC/Clang, macOS Clang, Windows MSVC—exchange files with every consumer host. This provides cross-host evidence for the audited slice, not a promise that every POSIX or threading example is portable to every OS.

## Maintainer verification

The Docker toolchain in `.github/native/Dockerfile` exists for automated verification. It provides GCC 14.3, Clang, GDB, Python, Node 24, and manual pages. It is not a learner setup requirement. Public Browser Linux uses its provider’s installed toolchain; feature probes report that actual target.

```sh
npm ci
npm test
make check-native
make check-native-clang
make check-examples
make check-examples CC=clang
make check-examples SANITIZE=1
make check-debugging
make check-projects
make check-structures
make check-numeric
make check-portability
make standards-matrix
```

The optional developer targets `make sanitize` and `make tsan` require suitable external toolchain/runtime support and are not part of completing the browser course. `make tsan` checks the five foundations rather than every topic program.

Run `node tools/sync_readings.cjs` after content changes to regenerate the native reading mirrors, example sources, manifest, and fixture. This preserves student TODO modules. Then run `python3 tools/build_browser_linux.py` to rebuild the deterministic browser course archive. `npm test` verifies both the bundled Wasm program and Linux archive reproducibility.

GitHub Actions deploys `dist/` after browser, native, and cross-platform exchange checks pass. Browser tests compile all 191 inline examples and 82 practice cases through the real worker and require supplied programs to compile without diagnostics. Learner diagnostics remain visible. Interface checks cover routes, saved edits, explicit completion, references, original diagrams, Browser Linux launch selection, and optional reading pages.

Finite green suites do not prove complexity, correctness for every input, race freedom for every schedule, physical storage durability, or production readiness. Physical tablets and browser versions still require ongoing device testing.

Copyright © 2026 Christopher Snow. See [LICENSE](LICENSE).
