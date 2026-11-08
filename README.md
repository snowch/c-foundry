# C Foundry

[Open the course](https://snowch.github.io/c-foundry/#/course) · [Codespaces setup guide](docs/codespaces.md)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/snowch/c-foundry?quickstart=1)

A browser-first prototype of a C, algorithms, and database course, with Linux execution through GitHub Codespaces where native facilities are needed. Fourteen interactive exercises compile real C17 into WebAssembly and execute it in a dedicated worker. Standard input, output checks, compiler diagnostics, cancellation, local progress, code export, a syllabus map, and a TinyDB capstone are included.

## Serve

Serve `dist/` using any static HTTP server. There is no app build step. Modern browsers with WebAssembly, Web Workers, and DecompressionStream are required. The first run fetches approximately 19 MB of compressed compiler assets from this same site.

## Publish to GitHub Pages

GitHub Pages is configured to use GitHub Actions. The workflow in `.github/workflows/pages.yml` installs dependencies, runs the interface and real Wasm compiler tests, and deploys `dist/` on every push to `main`. It can also be run manually from the Actions tab. No server or build step is needed. All app and compiler asset paths are relative, so the site works under `/c-foundry/`.

## Lesson flow and complete syllabus

The available exercises follow explanation → compact worked example → one prediction → coding task → output checks. Worked examples use the starter program’s names and sample input; they are fixed examples, not traces of edited code. Optional stepping is available for pointers, binary search, and the first insertion-sort operation. Each step labels only the destination actually written. The final step moves focus to the editor. Reference solutions are formatted C and remain collapsed until requested.

Lessons use a single reading column with 18 px prose and a full-width 17 px editor. The Contents menu opens as a drawer on every screen size and expands the current part with direct topic links. Ready chapters open their first lesson from the menu or course map. A labeled chapter selector, breadcrumbs, and Previous/Next links support jumping between topics without returning to an overview. No persistent sidebar, complexity badges in introductory C, or mandatory visualization panel precedes the explanation.

`dist/course.js` defines the complete nine-part, 44-chapter syllabus and 211 topic pages: 51 authored lessons across Parts 1–2 and 160 planned lessons. Chapter and topic previews have stable hash URLs (for example `#/chapter/recovery/4`), explicit planned-content labels, prerequisites, chapter practice goals, available related exercises, and previous/next navigation. Preview pages do not expose a runnable editor or claim completion. Existing exercises keep their IDs, saved drafts, and output-check progress. Four chapter projects complete Part 1 practice; Part 2 adds growing arrays and record validation.

Lesson completion follows video-lab’s explicit reading-mark pattern. At the end of each authored topic, use **Mark lesson as done**; uncheck it to undo. Completed topics have accessible checkmarks in Contents, chapter outlines, and the topic selector. Chapter and part totals appear in Contents and the course map. These marks are separate from exercise output checks and are never awarded automatically by visiting, running code, or answering a question. Preview topics cannot be marked done.

Reading marks use separate localStorage keys per topic, so independent browser tabs reconcile individual changes without overwriting other marks. They persist on this browser/device; clearing site storage removes them. If storage fails, the choice remains for the current session and the page explains that it was not saved. Existing code drafts and exercise progress retain their original storage format.

The Big O activity at `#/big-o` compares counted linear and binary search inspections on a sorted list, before and after doubling its size. It does not report real timings or use a logarithmic chart. Other growth classes and formal notation are optional detail.

## Part 1: Learn the language

The five authored chapters cover the first program; values, types, and expressions; decisions and repetition; functions; and arrays and strings. Their 25 topic pages include explanations, complete runnable C17 programs, output walkthroughs, pitfalls, answer feedback, and suggested experiments. Chapter projects are a greeting, numeric-expression calculation, guessing game, rectangle calculator, and ASCII text statistics. The existing loop exercise is available as a follow-up after functions have been introduced.

`dist/part1.js` holds Part 1 readings. The shared `dist/readings.js` renderer mounts the shared editable compiler panel directly inside each of the 25 topic pages, with Run, Stop, Reset, Export, input, and console output. Expected output for the original program is an optional disclosure. Examples do not count as completed practice. Editable example drafts and the original exercise drafts use separate stable IDs. The previous standalone example links redirect to the matching topic and retain those drafts. Available practice follows chapter order.

Part 1 has native equivalents too. `node tools/sync_readings.cjs` regenerates all ten authored chapter readings and 51 complete examples from the authored source; it deliberately does not overwrite editable exercise starters. Run an example with `make example EXAMPLE=values-4` and check every example with `make check-part1` (or `make check-part1 CC=clang`).

Numeric scanf scaffolds state their bounded-input contract; the string lesson also demonstrates checked strtol parsing. The text-statistics project explicitly counts ASCII bytes in one bounded line, not Unicode text or arbitrarily long files.

## Part 2: Understand memory and practical C

Five more authored chapters cover pointers, dynamic memory and ownership, structs/enums/unions, multi-file modules, and files and byte encodings. Their 26 readings follow the same explain → run → change → check sequence. Fifteen examples run inline in the browser; eleven use native source files and Codespaces commands for multi-file builds, filesystem operations, assertions, and sanitizer work.

Two browser projects add a growing integer array and validated record updates. Two native projects provide editable TODO modules, public header contracts, executable checks, and separate reference implementations: an owned record-store module and a versioned, ten-byte binary codec. They are exercises rather than completed database features. Their default checks should fail until the student implements the module.

```sh
make example EXAMPLE=larger-programs-1
make example EXAMPLE=files-bytes-5 SANITIZE=1
make project PROJECT=record-store
make project PROJECT=binary-record
make check-part2
make check-part2 CC=clang
make check-projects             # checks references, not student TODOs
make check-projects SANITIZE=1
```

`dist/part2.js` holds the readings. Native examples with multiple files have their own directories in `native/examples/`; the export manifest lists the sources to compile. `make check-part1` and `make check-part2` compile every authored example with strict warnings. CI also checks native project references with both compilers and sanitizers. Allocation-failure injection is demonstrated, but not exhaustively tested in every project.

## Native C and Codespaces

Following parquet-book’s launch-and-copy pattern, chapter pages label their execution needs and provide **Open in Codespaces**, a visible command, **Copy command**, source-file links, setup instructions, and account-allowance information. No Codespace is created automatically. Reading and previews always work in the browser. Multi-file builds and diagnostics use Linux; parts 7–9 add standards, portability, concurrency, and advanced TinyDB.

The dev container builds from GCC 14.3 / Debian Trixie plus Node 24 and installs Clang 19, GDB, CMake, Ninja, Python, and Make. `npm ci && make check-native` prepares it after creation. A Codespace is not needed for the fourteen Wasm exercises. Local dev containers use the same configuration.

Five runnable foundations live in `native/demos/`: a greeting, explicit byte encoding and compiler probe, mutex/atomic counters, a bounded producer–consumer queue, and a coarse-lock in-memory TinyDB table. Parts 1–2 have complete chapter readings; the remaining 34 chapters have workspace README stubs in `native/chapters/`, and the fourteen exercise starters have native copies and output checks. Instruction beyond Part 2 and advanced database features are still planned; the foundations do not implement persistence, MVCC, checkpoints, or a SQL engine.

```sh
make chapter CHAPTER=coordination
make queue
make check-native
make check-native-clang
make standards-matrix
make sanitize
```

Use your own fork or branch to retain changes. Codespaces consumes your GitHub account’s compute/storage allowance; [see current terms](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces). See [the setup guide](docs/codespaces.md) for saving work, copying browser drafts, and reusing an existing Codespace.

## Verify

Run `npm ci` and `npm test`. The interface tests use jsdom. The compiler tests execute the actual worker under a Node adapter and check 58 practice cases and 40 complete browser example outputs, diagnostics, arbitrary C, nonzero exits, wrong answers, and worker cancellation. DOM tests also cover all 44 chapter and 211 topic routes, prediction feedback, optional example steps, routing during execution, draft preservation, and direct deep links.

## Architecture

`dist/lessons.js` contains lesson briefs, starter code, worked examples, and input/output checks. `dist/app.js` manages hash routing, the UI, and local storage. `dist/course.js` contains the chapter and topic previews and execution metadata; `native/course.json` mirrors it for the command-line workspace helper. `dist/execution.js` renders launch/copy controls. `dist/visuals.js` renders worked examples, predictions, optional steps, and the search comparison. `dist/compiler/worker.js` loads the compiler, creates a virtual filesystem, compiles C, links a Wasm module, and executes each case. Execution is limited to five seconds and output to 100 KB; compiler initialization is limited to two minutes. Worker termination handles cancellation and infinite loops.

The compiler is the experimental [binji/wasm-clang](https://github.com/binji/wasm-clang) Clang 8 / LLD toolchain, retrieved for this prototype. Its runtime is modified to compile C17 with warnings, no common symbols, and no optimization. Original runtime and LLVM licenses are distributed under `dist/compiler/`. Compressed binaries and sysroot are preserved from that project. This is an older experimental toolchain with incomplete WASI support, not a current production C development environment.

Source, standard input, and completion are stored in browser localStorage. Program files and TinyDB rows are temporary and reset on each run. Tests check observable output and do not prove algorithm complexity, correct allocation, or absence of undefined behavior. TinyDB accepts simple insert/select commands; persistent storage, SQL, indexes, and transactions are planned, not implemented. The course map distinguishes those future topics from the available practice.

Native CI builds the dev container and checks the foundations with GCC, Clang, and AddressSanitizer/UndefinedBehaviorSanitizer before Pages deployment. `make tsan` is available separately because ThreadSanitizer depends on kernel/runtime support. A standards-matrix command probes compiler support rather than assuming full C23 conformance.

## Verification limits

The redesigned lesson and Big O pages were tested in headless Chromium at 390, 768, 1024, and 1440 px. Phone and tablet screenshots were inspected. Checks covered overflow, reading and code font sizes, course navigation, deep-linked previews, step-to-editor focus, page errors, and an actual browser compilation/output check. This does not establish behavior on every browser or physical tablet.

The Codespaces image was built and exercised locally with Docker: Node 24, GCC 14.3, Clang 19, native checks, the standards matrix, sanitizers, and the post-create commands. Hosted Codespace creation was not performed. Launch/copy controls (with the external creation URL intercepted), advanced routes, reloads, setup, and overflow were checked in Chromium at 390, 768, and 1024 px.

Part 1 browser QA covered chapter reading, question feedback, previous/next topics and browser back, inline editable examples, chapter practice, and layout at 390, 768, and 1024 px. A real browser fgets example and all six text-statistics output cases passed. The 25 complete programs also pass with native GCC and Clang.

Inline editor checks cover all 25 mounts, preserving the shared DOM node and its listeners, running without changing the topic URL, drafts and input across navigation, Reset without leaving the lesson, errors, Stop, and legacy example redirects.

Part 2 and the revised navigation were checked in Chromium at 390, 768, and 1024 px: direct chapter entry, chapter selector, current-topic menu, inline compilation, native launch commands and clipboard feedback, and both new graded exercises. All 26 Part 2 programs pass GCC and Clang; both native references pass their contract checks and ASan/UBSan. Student TODO modules were also confirmed to fail their initial checks. Hosted Codespace creation was not performed.
