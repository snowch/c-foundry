# UX review


## Focused lab hubs — 2026-11-23

The previous entry page exposed the full curriculum before learners could choose a manageable sequence. The hub now offers 9 numbered labs containing the existing 227 lessons. Each lab has its own URL, prerequisite, progress, direct Start / Continue / Review and lesson list. Lesson routes, drafts and completion keys retain their existing identities. First and last lesson navigation returns to the lab.

Reading order is compact introduction → primary resume → lab choices → optional illustration on narrow screens. On wide screens the illustration sits beside the introduction. The lab list uses one/two/three columns at 390/820/1440 px; theme surfaces and keyboard focus use the shared design tokens. The reusable decision checks cover unfinished resume, advancing after completion, earlier gaps and review. Browser checks exercise actual completion controls, reload, Back/Forward and zero automatic runtime starts. Existing real compiler/offline/saved-work suites provide separate execution evidence. None of these checks establishes learning effectiveness.

CI exposed a native Background Fetch stall at exactly 222.7 MB of 242.6 MB after both three and six minutes. Extending the timeout did not fix the stall. A visible, online page now takes over after 45 seconds without byte progress. The worker imports only hash-valid completed responses, bounds unresolved native records, and resumes remaining files through foreground fetch. Download consent and the same job ID survive this handoff; explicit Cancel still revokes consent. Protocol and browser transport checks cover the handoff, preservation of earlier complete releases, pending updates, drafts and prediction. The real Linux journey must still complete the full save, boot a fresh offline guest and restore exported files; a failure reports status and byte counts.


## Visual opportunities, 25 November 2026

See [the whole-course visual review](visual-opportunities.md) and its source-pinned lesson records. This pass adds source-specific models as well as revising existing diagrams; the model renderer has no runner, navigation, draft or completion side effects.

## Console visibility and offline documentation — 2026-11-25

The lesson Console now grows with its results, wraps diagnostics and long lines, and avoids a second vertical scrolling viewport. Failed attempts show one expanded diagnostic block. If there is an earlier successful result, it is explicitly labelled as previous output; a first failure does not duplicate the message as program output. The semicolon exercise names the diagnostic source line, and the string-edit exercise quotes the exact old and new text. Chapter practice explicitly opens an interactive coding exercise.

References now lead first to bundled C manuals or original course notes. Full third-party references remain separately labelled as requiring internet access. The course includes 96 selected Linux man-pages entries in the offline release, an indexed browser reader, local cross-references, original roff sources, per-page provenance and all upstream licence texts. They describe Linux/glibc contracts and extensions; the reader keeps the ISO C/POSIX/Linux and musl/WASI distinction visible. Course notes are identified as course explanations, not offline copies of the linked third-party reference.

Browser Linux provides `man 3 printf`, `man 3 fgets` and `man -k keyword` through a selected-page reader and its existing less pager. The help lesson now asks learners to search RETURN VALUE, compare two different function contracts and leave the pager with q. The C library manual is section 3; the shell printf(1) reference is separate. Optional documentation questions accept a written answer, preserve it while opening a reference, and offer comparison feedback without marking the lesson done.

Verification covers source hashes/licence retention, local manual cross-references and search, command-line section/keyword lookup, offline reference navigation, real compiler errors and longer output at phone/tablet widths, and the actual Linux pager search/quit flow. Existing course, saved-work and offline-update suites remain required. This is interface and execution evidence, not a measured learning-outcome claim.

## Tablet manual exercise and terminal — 2026-11-25

The supplied screenshots show three usability failures: keyboard-only pager exit, cropped native output and a full-screen terminal without an obvious touch exit. The exercise also sends a new learner away from the C program and into unrelated project setup. No UX or instructional-design skill is installed in this session; this equivalent review applies the canonical shared course-design guide and the learner's no-prior-C prerequisites directly.

The core lesson now follows one observable learning sequence: choose RETURN VALUE in the actual bundled manual, predict printf's character count and error result, run the unchanged program, compare count= with the prediction, then predict and test a C%% string. Feedback distinguishes a newline, the string terminator and a literal percent sign. Predictions survive navigation/reload; only actual completed C runs supply result comparisons. Neither lookup nor feedback marks the lesson done. The standard generic prediction field is omitted in this lesson to avoid two competing predictions. The manual shows one selected section in normal page flow, has an explicit Close manual action and restores focus when closed.

The Linux continuation practises man and keyword search against the same contract, with a direct return to the saved C task. Its focused launch removes unrelated source-editing and project-failure instructions. The actual terminal provides touch previous/next page, swipe/wheel line navigation, a manual search field and Close manual (q). A separate command field supports tablet keyboards and is disabled while a manual owns the terminal. Commands and source-apply requests are rejected while a manual is open. Pager controls wait for its first rendered screen; search input is paced, and Close targets only the reader’s child process, cancels pending search input and restores the TTY even during a search.

Full screen is a CSS focus view of the existing iframe, with one visible Exit full screen button. It preserves the guest, restores page scrolling/focus, supports Escape from inside the iframe and limits background focus. A bounded 9p size message updates the guest serial TTY with TIOCSWINSZ; resizing while reading sends SIGWINCH instead of injecting a stty command into the pager. Guest/source changes remain explicit and no runtime starts during navigation or manual reading in the lesson.

Verification includes real C prediction/transfer, saved answers, touch lookup/paging/search/quit, a touch swipe, visible full-screen exit, phone/tablet native stty size matching the frontend, unchanged explicit completion, and return to the retained guest. Evidence establishes interface and execution behaviour, not measured learning outcomes.
