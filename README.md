# C Foundry

[Open the course](https://snowch.github.io/c-foundry/)

A browser-only prototype of a C, algorithms, and database course. Eight interactive exercises compile real C17 into WebAssembly and execute it in a dedicated worker. Standard input, output checks, compiler diagnostics, cancellation, local progress, code export, a syllabus map, and a TinyDB capstone are included.

## Serve

Serve `dist/` using any static HTTP server. There is no app build step. Modern browsers with WebAssembly, Web Workers, and DecompressionStream are required. The first run fetches approximately 19 MB of compressed compiler assets from this same site.

## Publish to GitHub Pages

GitHub Pages is configured to use GitHub Actions. The workflow in `.github/workflows/pages.yml` installs dependencies, runs the interface and real Wasm compiler tests, and deploys `dist/` on every push to `main`. It can also be run manually from the Actions tab. No server or build step is needed. All app and compiler asset paths are relative, so the site works under `/c-foundry/`.

## Visual learning and responsive layout

Each lesson includes a collapsible, manually stepped illustration. These examples are separate from the learner’s edited code. The course map includes a Big O explorer with adjustable input size and logarithmic bars for five growth classes, plus time/space and case-analysis explanations. On viewports at or below 1,200 px, the persistent sidebar is replaced by a modal lesson drawer. At 700 px and below, the lesson brief and editor stack vertically. Motion respects the reduced-motion preference.

## Verify

Run `npm ci` and `npm test`. The interface tests use jsdom. The compiler tests execute the actual worker under a Node adapter and check all 23 lesson cases, diagnostics, arbitrary C, nonzero exits, wrong answers, and worker cancellation. These are not visual browser tests.

## Architecture

`dist/lessons.js` contains lesson briefs, starter code, worked examples, and input/output checks. `dist/app.js` manages the UI and local storage. `dist/compiler/worker.js` loads the compiler, creates a virtual filesystem, compiles C, links a Wasm module, and executes each case. Execution is limited to five seconds and output to 100 KB; compiler initialization is limited to two minutes. Worker termination handles cancellation and infinite loops.

The compiler is the experimental [binji/wasm-clang](https://github.com/binji/wasm-clang) Clang 8 / LLD toolchain, retrieved for this prototype. Its runtime is modified to compile C17 with warnings, no common symbols, and no optimization. Original runtime and LLVM licenses are distributed under `dist/compiler/`. Compressed binaries and sysroot are preserved from that project. This is an older experimental toolchain with incomplete WASI support, not a current production C development environment.

Source, standard input, and completion are stored in browser localStorage. Program files and TinyDB rows are temporary and reset on each run. Tests check observable output and do not prove algorithm complexity, correct allocation, or absence of undefined behavior. TinyDB accepts simple insert/select commands; persistent storage, SQL, indexes, and transactions are planned, not implemented. The course map distinguishes those future topics from the eight available lessons.

## Verification limits

This prototype is verified with Node Wasm and DOM tests. Visual/browser QA remains unverified.
