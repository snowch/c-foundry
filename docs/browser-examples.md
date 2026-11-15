# Browser and native execution

All 227 topic readings are available in the browser. **191 worked examples run directly in their lesson page; 36 require native tools.** The fifteen graded practice exercises are separate from these counts.

| Part | Inline examples | Native tools required | Scope |
| --- | ---: | ---: | --- |
| 1. Language | 26 | 0 | All worked examples |
| 2. Memory and practical C | 25 | 2 | Includes editable headers and separate source files; temporary streams and GDB remain native |
| 3. Algorithms | 28 | 0 | All worked examples |
| 4. Data structures | 28 | 0 | All worked examples |
| 5. TinyDB | 24 | 3 | Format, codec, and file-transfer examples; unsupported stream operations remain native |
| 6. Faster and more reliable TinyDB | 27 | 5 | Includes single-threaded recovery models and deterministic test fixtures; GDB and unsupported file APIs remain native |
| 7. Standards and portable C | 20 | 7 | Compatible probes and portable operations; selected stream and floating-point environment experiments remain native |
| 8. Concurrency | 0 | 14 | Real C11/POSIX threads and synchronization require native tools |
| 9. Advanced TinyDB | 13 | 5 | Single-threaded models run inline; threaded and host-specific examples remain native |
| **Total** | **191** | **36** | |

## Using inline examples

Run compiles the edited program with the browser's fixed C17 toolchain. For multi-file examples, switch files using the source-file buttons; Run compiles all `.c` files and includes the local headers. Each file has a saved draft. Reset restores all original files. Export downloads the selected source file, so export each file when transferring a multi-file example.

Compatible examples retain native commands and source links under **Native build and source files**. Native source paths, fixture manifests, and compiler flags remain unchanged.

Lesson program files last for one run. To keep files between runs, use the **CLI** action on a single-source example, run the suggested build command, then run `./program`. The command workspace supports file import, download, and browser storage. The Part 5 transfer lesson demonstrates exporting `people.tdb` and importing it in a later process. Saving drafts or transferring files does not establish crash durability.

## When native tools are necessary

An inline probe describes one browser compiler and target. Use a local toolchain or Codespaces for other language modes, compiler comparisons, optimization experiments, warnings, sanitizers, GDB, threads, unsupported system/library calls, and native filesystem behavior. Cross-platform portability checks still use the Linux, macOS, and Windows test matrix.

Running a bounded transaction, replay, snapshot, or query model inline does not make it a complete concurrent or durable database. The chapter project commands and native checks remain available for assembling and testing the larger system.

## Verification

`npm test` executes every inline example and all graded output cases through the real compiler worker. It also checks multi-file header/source edits, link errors and recovery, per-file draft reload and reset, selected-file export, all topic routes and completion controls, native source/command parity, and browser CLI file export/import with damaged-file rejection. The existing native and cross-host CI suites remain enabled.

To regenerate the native reading mirrors after editing course content, run `node tools/sync_readings.cjs`.
