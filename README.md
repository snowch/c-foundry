# C Foundry

[Open the course](https://snowch.github.io/c-foundry/)

A browser-only prototype of a C, algorithms, and database course. Eight interactive exercises compile real C17 into WebAssembly and execute it in a dedicated worker. Standard input, output checks, compiler diagnostics, cancellation, local progress, code export, a syllabus map, and a TinyDB capstone are included.

## Serve

Serve `dist/` using any static HTTP server. There is no app build step. Modern browsers with WebAssembly, Web Workers, and DecompressionStream are required. The first run fetches approximately 19 MB of compressed compiler assets from this same site.

## Publish to GitHub Pages

GitHub Pages is configured to use GitHub Actions. The workflow in `.github/workflows/pages.yml` installs dependencies, runs the interface and real Wasm compiler tests, and deploys `dist/` on every push to `main`. It can also be run manually from the Actions tab. No server or build step is needed. All app and compiler asset paths are relative, so the site works under `/c-foundry/`.

## Lesson flow and complete syllabus

The available exercises follow explanation → compact worked example → one prediction → coding task → output checks. Worked examples use the starter program’s names and sample input; they are fixed examples, not traces of edited code. Optional stepping is available for pointers, binary search, and the first insertion-sort operation. Each step labels only the destination actually written. The final step moves focus to the editor. Reference solutions are formatted C and remain collapsed until requested.

Lessons use a single reading column with 18 px prose and a full-width 17 px editor. The course menu opens as a drawer on every screen size. No persistent sidebar, complexity badges in introductory C, or mandatory visualization panel precedes the explanation.

`dist/course.js` defines the complete six-part, 30-chapter syllabus and 165 planned topic pages. Chapter and topic previews have stable hash URLs (for example `#/chapter/recovery/4`), explicit planned-content labels, prerequisites, chapter practice goals, available related exercises, and previous/next navigation. Preview pages do not expose a runnable editor or claim completion. The eight available exercises keep their original IDs, saved drafts, and output-check progress.

The Big O activity at `#/big-o` compares counted linear and binary search inspections on a sorted list, before and after doubling its size. It does not report real timings or use a logarithmic chart. Other growth classes and formal notation are optional detail.

## Verify

Run `npm ci` and `npm test`. The interface tests use jsdom. The compiler tests execute the actual worker under a Node adapter and check all 23 lesson cases, diagnostics, arbitrary C, nonzero exits, wrong answers, and worker cancellation. DOM tests also cover all 30 chapter and 165 topic preview routes, prediction feedback, optional example steps, routing during execution, draft preservation, and direct deep links.

## Architecture

`dist/lessons.js` contains lesson briefs, starter code, worked examples, and input/output checks. `dist/app.js` manages hash routing, the UI, and local storage. `dist/course.js` contains the chapter and topic previews. `dist/visuals.js` renders worked examples, predictions, optional steps, and the search comparison. `dist/compiler/worker.js` loads the compiler, creates a virtual filesystem, compiles C, links a Wasm module, and executes each case. Execution is limited to five seconds and output to 100 KB; compiler initialization is limited to two minutes. Worker termination handles cancellation and infinite loops.

The compiler is the experimental [binji/wasm-clang](https://github.com/binji/wasm-clang) Clang 8 / LLD toolchain, retrieved for this prototype. Its runtime is modified to compile C17 with warnings, no common symbols, and no optimization. Original runtime and LLVM licenses are distributed under `dist/compiler/`. Compressed binaries and sysroot are preserved from that project. This is an older experimental toolchain with incomplete WASI support, not a current production C development environment.

Source, standard input, and completion are stored in browser localStorage. Program files and TinyDB rows are temporary and reset on each run. Tests check observable output and do not prove algorithm complexity, correct allocation, or absence of undefined behavior. TinyDB accepts simple insert/select commands; persistent storage, SQL, indexes, and transactions are planned, not implemented. The course map distinguishes those future topics from the eight available lessons.

## Verification limits

The redesigned lesson and Big O pages were tested in headless Chromium at 390, 768, 1024, and 1440 px. Phone and tablet screenshots were inspected. Checks covered overflow, reading and code font sizes, course navigation, deep-linked previews, step-to-editor focus, page errors, and an actual browser compilation/output check. This does not establish behavior on every browser or physical tablet.
