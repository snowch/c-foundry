# Learner wording and interface review

The review starts from the first chapter’s prerequisite of no prior C. Each later topic assumes its earlier lessons in the published order. It covered 227 reading topics, 44 chapter overviews, 15 separate practices and the contents, setup, command workspace, counted search, TinyDB project and missing-page views. The chapter mirrors and native example guides were regenerated from the same authored text.

## Reading and execution

Each worked example introduces the prepared source and input, identifies the run action, and puts the literal edit and relevant evidence before the editor or native command. The original result remains available for voluntary comparison. The exercise check tests supplied cases. The reading checkbox records learner progress separately.

Browser editors use normal Tab navigation and retain Ctrl or Command with Enter to run. Editor tools contains export, replacement and recovery. A draft and its recovery snapshot are saved together. If permanent storage rejects a save, the editor reports whether the draft is available in this tab or only on the page. The editor retains the former durable draft when the new state cannot be saved. Console labels an earlier result after a code or input edit. Build and runtime errors show diagnostics for the attempted run.

Native lesson commands build the named files and show their output with `RUN_ONLY=1`. The original frozen-output comparison remains available by omitting that setting. GCC resolves required libraries after reading the sources. The file readers, thread fixtures, and checked POSIX sync examples name the evidence and conditions they exercise. The bundled command workspace runs an actual C/Wasm TinyDB. The indexes, logging, and transaction examples elsewhere use separate scoped fixtures.

| Parts | Examples checked during the wording review |
| --- | --- |
| 1 and 2 | Greeting, standard input, compiler diagnostic, runtime assertion, multi-file function, serialized bytes, and the first optional GDB investigation |
| 3 and 4 | Search and copy counts, stability, queue bounds, tombstone reuse, traversal and shortest paths |
| 5 and 6 | Lexer token categories, row selection, file export/import, page slots, B+ bounds, modeled plan costs and log prefixes |
| 7 | Native rounding, finite parsing, byte format, portable paths, capability probes and independent file fixtures |
| 8 and 9 | Joined threads, the lock-protected increment, queue capacity, publication, version visibility, checkpoints and workload counts |

## Functional verification

- Chromium checked 292 views at each of 320, 390, 820 and 1440 pixels with light and dark OS preferences. The site uses a light reading palette and dark editors. The sweep checked page overflow and script errors and covered all 191 inline worked examples and 36 native-only topic variants. Alias redirects are covered by the existing interface suite.
- The browser suite runs the 191 original examples and 82 practice cases through the real Wasm compiler. Browser walkthroughs also exercised the literal greeting edit, a syntax failure, a different valid practice result, keyboard navigation, an edited function in a second source file, and TinyDB persistence.
- A 320-pixel walkthrough blocked durable writes after a successful multi-file edit. It exported the exact edited source, restored the starter, recovered the prior draft after reload, and checked the previous durable file value before re-enabling normal writes.
- The native GCC run checked all 227 original examples. A separate isolated run checked 222 edited sources or inputs, including deliberate compiler and runtime failures. The other five lessons use standards, portability or optional GDB commands. Local runs checked the GCC standards and portability fixtures plus both real GDB acceptance suites. The hosted matrix covers the configured Clang, sanitizer and cross-platform file-exchange jobs.
- The earlier external-workspace launch flow has since been replaced by Browser Linux. See [the browser validation record](browser-linux-validation.json) for real hosted-terminal, concurrency, editing and backup/restore checks.

These checks establish functional behavior for the exercised examples. Learner understanding, assistive-technology usability, and physical-device coverage remain unmeasured.
