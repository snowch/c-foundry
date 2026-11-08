# C Foundry in Codespaces

The web course is at https://snowch.github.io/c-foundry/#/course. The nine-part syllabus has 44 chapters and 211 topics. Part 1 now contains five authored chapters and 25 topic lessons; the remaining content is labeled as planned. Twelve browser exercises, 25 ungraded examples, and five native foundations are runnable.

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

`make chapter` shows the chapter workspace README: complete readings for Part 1, and planned topics, practice goals, execution needs, and available foundations for later parts. It does not claim the chapter’s advanced implementation is complete. All 44 chapter workspaces are in `native/chapters/`.

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

The queue uses predicate loops and drains before shutdown. TinyDB currently uses one coarse mutex for each operation. It has no persistence, transaction protocol, SQL parser, MVCC, checkpointing, or reader/writer locking; those are tasks in the planned syllabus. The demonstrations use POSIX threads and C11 atomics, not the separate C11 `<threads.h>` interface.

## Existing exercises

Starter files for the twelve browser exercises are in `native/exercises/`. Edit a file, then run its output checks:

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
