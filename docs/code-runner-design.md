# Shared C compiler runner

`dist/course-controls.js` owns one compiler worker per reading window. The existing hash navigation preserves it between inline lessons and the C workspace. `compiler/worker.js` dispatches inline and workspace requests and shares the compiled Wasm modules and raw sysroot bytes. Each request creates a fresh memfs: a workspace file never silently enters an ordinary lesson. Standalone worker URLs remain compatible with existing tabs and developer checks.

The header shows Stopped, Starting, Compiling, Running and Ready. Start runner loads the toolchain without running learner code. Run starts it automatically. Free memory terminates the worker and keeps drafts, predictions, previous results, reading marks and saved workspace files. Ordinary compiler errors keep reusable compiled modules; failed loader promises are discarded.

Default idle time is 30 minutes, with saved choices of 5, 15, 30 or 60 minutes. Wall-clock expiry is checked when the document becomes visible again. Idle release never interrupts a running job. Build/startup has a two-minute limit; an executing program has five seconds.

The first implicit startup opens a persistent native modal before work starts. Continue run acknowledges it; Escape cancels without downloading the compiler. Explicit startup through the header also acknowledges it, so the next lesson Run does not repeat the notice. Keep the background dimmed and retain keyboard focus inside the modal. Reliable per-worker CPU percentages or portable total memory figures are unavailable; do not invent them.

Browser Linux is outside this runner. Its external VM retains guest files between hash routes and has separate Start/Stop controls. Idle compiler release must not stop it. Restart/reload is vetoed while it is active because the course cannot snapshot or export a cross-origin guest filesystem. Export a Linux work backup, then choose Stop Linux before updating.

Runtime-file failures use the shared persistent recovery dialog. See [offline/update design](offline-update-design.md). Compiler errors, practice comparisons and understanding checks retain their own feedback.
