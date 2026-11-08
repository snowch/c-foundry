# C Foundry in Codespaces

The web course is at https://snowch.github.io/c-foundry/#/course. All nine parts are authored: 44 chapters and 218 topic lessons. There are 139 inline browser examples, 79 native examples, fifteen practice exercises, and two editable native Part 2 projects. Later chapter workshops assemble and extend checked components and bounded models; they do not imply a complete production SQL engine.

## Start or reuse a workspace

Follow a chapter’s **Open in Codespaces** link, or open https://codespaces.new/snowch/c-foundry?quickstart=1. The link opens GitHub’s Codespaces creation flow; it does not create a workspace merely by visiting a lesson. Sign in, then wait for setup. The smallest requested machine has two CPUs. Existing workspaces can be reused at https://github.com/codespaces.

The dev container installs GCC 14.3, Debian’s Clang, GDB, Make, CMake, Ninja, Python 3, and Node 24. Standard support varies by compiler: `make standards-matrix` probes actual modes and a C23 feature instead of promising full C23 conformance. Startup installs JavaScript test dependencies and runs `make check-native`.

A Codespace runs on your own GitHub account and consumes its compute and storage allowance. Check [GitHub’s current terms](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces). Stop it when finished; a stopped workspace still uses storage. Push your changes before deleting it.

## Run a chapter

Copy the command shown on the web page, then paste it into the editor’s terminal, for example:

```sh
make chapter CHAPTER=coordination
make queue
```

`make chapter` shows the chapter workspace README: complete readings, source examples, questions, experiments, project goals, and commands for all nine parts. The advanced examples document their bounds and remaining assembly work. All 44 chapter workspaces are in `native/chapters/`.

## Available native foundations

```sh
make hello             # native compiler check
make standards         # standard macro and explicit byte encoding
make counter           # joined POSIX threads, mutex and C11 atomic counters
make queue             # bounded producer/consumer queue with condition variables
make tinydb            # in-memory table, coarse mutex, copy-out reads
make check-native      # build and check all five, with repeated threaded runs
make check-native-clang
make standards-matrix
make sanitize          # AddressSanitizer + UndefinedBehaviorSanitizer
make tsan              # ThreadSanitizer; needs compatible runtime/kernel support
```

The queue uses predicate loops and drains before shutdown. The original TinyDB foundation uses one coarse mutex per operation and has no persistence or transaction protocol. Later topic examples separately implement the documented SQL subset, file codec, recovery and checkpoint sequences, version visibility, and reader/writer locking. The foundation should not be mistaken for their assembled result. The foundations use pthreads and C11 atomics; topic concurrent-storage-1 also exercises the separate C11 threads.h interface.

## Existing exercises

Starter files for the fifteen browser exercises are in `native/exercises/`. Edit a file, then run its output checks:

```sh
make exercise EXERCISE=pointers
```

An uncompleted starter is expected to fail. Checks compare observable output; they do not prove memory ownership, algorithm choice, complexity, or race freedom.

Browser drafts are local to that browser and are not automatically copied into a Codespace. Use the web editor’s Export button and upload or paste the file into your workspace. Use your own fork or branch, and commit and push work you want to retain.

## Preview the course and run checks

```sh
make serve             # forwarded port 8000 opens the static course
npm test               # DOM routing checks and real Wasm compiler checks
make check-native
```

You can use this dev container locally too, or install the named tools yourself. Native demonstrations default to C17 with warnings as errors. Codespaces is an optional execution environment, not a requirement to read any part of the course.

## Part 1 readings and examples

```sh
make chapter CHAPTER=arrays-strings
make example EXAMPLE=arrays-strings-3
make check-part1
make check-part1 CC=clang
```

The complete Part 1 examples are in `native/examples/`. They are demonstrations, not unfinished exercise starters. Running or modifying one does not mark a browser practice exercise as completed.

## Part 2 modules, files, and projects

Chapter 9 provides multi-file programs with headers and source modules. Chapter 10 uses native file operations, explicit byte encodings, assertions, and sanitizer checks. Each topic has a ready-to-run command and a link to its actual example files:

```sh
make example EXAMPLE=larger-programs-1
make example EXAMPLE=files-bytes-1
make example EXAMPLE=files-bytes-5 SANITIZE=1
make check-part2
make check-part2 CC=clang
```

The browser still provides all readings and question feedback. For the first three Part 2 chapters, run and edit the examples directly in the reading page. Browser drafts do not synchronize into native examples automatically.

Complete the TODOs in `native/projects/record-store/store.c` and `native/projects/binary-record/record.c`, guided by their headers and READMEs:

```sh
make project PROJECT=record-store
make project PROJECT=record-store SANITIZE=1
make project PROJECT=binary-record
```

The student starters intentionally fail. After attempting them, compare the separate `.reference/` implementations using `REFERENCE=1`. `make check-projects` checks both references; it does not mark student work complete. Tests run outside the repository tree and include ownership, validation, exact-format fixtures, error paths, and temporary-file I/O. They are evidence for exercised cases rather than a proof of memory safety or crash durability.

Maintainers regenerate all authored native readings and examples with `node tools/sync_readings.cjs`. This leaves editable student exercises and project modules untouched.

## Parts 3–9 and complete example checks

Portable algorithm, data-structure, table/query, and page/index models run inline. Native filesystem, standards, and threading examples show a Codespaces command on the lesson page. All examples also have native exports:

```sh
make example EXAMPLE=graphs-6
make example EXAMPLE=bplus-trees-6
make example EXAMPLE=recovery-4
make example EXAMPLE=snapshots-3
make check-examples
make check-examples CC=clang
make check-examples PART=8
make check-examples SANITIZE=1
make check-structures
make check-structures SANITIZE=1
```

All 218 topic lessons can be explicitly marked done in the web course. Those marks remain in that browser’s storage, separately from example results and native project work.

## Retain and download program files

By default example checks use a temporary working directory. To inspect or export the examples that write named files, opt into a dedicated retained directory:

```sh
make example EXAMPLE=persistence-5 KEEP_FILES=1
make example EXAMPLE=maintenance-2 KEEP_FILES=1
```

The first produces `.build/files/persistence-5/people.tdb`; the second produces checkpoint/log artifacts under `.build/files/maintenance-2/`. Right-click a file in the Codespaces explorer to download it. The persistence lesson also provides a downloadable 88-byte two-row sample.

To validate an uploaded file with the transfer tool, compile its complete source and pass the import path:

```sh
mkdir -p .build
gcc -std=c17 -Wall -Wextra -Wpedantic -Werror native/examples/persistence-5/main.c -o .build/transfer
.build/transfer import path/to/downloaded.tdb
```

Imports validate magic/version, lengths, rows, uniqueness, and clean end-of-input before assigning a new table. Browser runner files are still temporary; browser download and native fsync are distinct host operations with different guarantees. The checkpoint example uses Linux/POSIX file and directory synchronization and a stopped writer; it is not a tested power-failure guarantee for every filesystem.

Retained files under `.build/` are build artifacts: copy or download the files you want to keep before `make clean`.

## Numeric pitfalls and floating-point probes

Chapter 32 now includes four portable integer-boundary examples directly in its reading pages and three native floating-point lessons. Use the chapter’s commands for the native math-library probes:

```sh
make example EXAMPLE=c-guarantees-8
make example EXAMPLE=c-guarantees-9
make example EXAMPLE=c-guarantees-10
make exercise EXERCISE=arithmetic
make check-numeric
make check-numeric CC=clang
make check-numeric SANITIZE=1
```

The manifest supplies `-lm` automatically. The floating examples state their format, subnormal, rounding, and non-fast-math requirements. The arithmetic exercise derives guards from INT_MIN/INT_MAX; its provided output fixtures target the 32-bit int range of the supported native and Wasm toolchains. The numeric oracle validates the checked-in reference against arbitrary-precision expectations and tests finite-value parsing and tolerance nontransitivity; it does not grade edits in the student starter.
