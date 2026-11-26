# Course location review

Copyright © 2026 Christopher Snow.

Applied the shared course-style guide and the UX/learning-design review skills before implementation and after browser checks. The stated prerequisite remains no prior C experience. Course content, examples and outcomes are unchanged.

The original navigation called the same level Lab and Part. Lesson breadcrumbs omitted that level, progress counts did not identify their scope, part overviews flattened lessons across chapter boundaries, and the brand's destination changed with the current part. At boundaries, next-part links could be replaced by a link back to the current overview. Those choices made the current location and forward action hard to infer.

Use Course → Part → Chapter → Lesson. The shared row names parents and lesson position. Part overviews expose chapter groups; the contents selector describes its filtering behaviour. Progress names its scope. Direction cards show actual destinations, with an explicit next-part transition. The header brand always returns to All parts; legacy URLs and learner stores remain valid.

Verification: tests/navigation.cjs covers all 227 lessons in 44 chapters, all nine overviews and old part URLs, actual sequence destinations, saved edits/prediction/completion, Back/Forward/reload, keyboard focus, four widths and both themes. Existing hub and runner checks remain separate. Browser screenshots are functional/layout evidence, not evidence of learning effectiveness.

Following a reading with two practice pages also reproduced duplicate hidden prediction fields (one, then two, then three). The adapter now mounts a prediction only for a visible reading and does not duplicate an existing field. The navigation suite checks uniqueness through every practice route.

## Chapter practice handoff — 2026-11-25

Practice previously navigated through a separate global exercise list: the first practice had no backward button, the last had no forward button, and the pages lacked an explicit completion control. A reading's practice link also preceded its completion row.

Practice is a normal step in the course sequence. The final reading has its completion checkbox and a single Next link into practice; there is no additional launch panel or automatic completion action. The 15 checked exercises and 36 chapter projects all have backward and forward destinations. In chapters with both an exercise and a project, Next visits both before the following chapter. Browser Linux project links return to the project even after a terminal-page reload. Reading paging and the contents reflect these destinations. The existing 227-reading count, 15 output-check records, and explicit practice marks retain their separate meanings and existing keys.

Passing output checks does not infer reading or practice completion. Direct links and browser history preserve saved code/input. Marking practice requires an explicit checkbox action and has per-key storage reconciliation and session-only feedback when saving fails. The change does not start a runtime during navigation. Verification covers every practice destination, mark/check independence, saved reading/practice drafts, reload/history, contents marks, storage failure, a genuine C output check and phone/tablet widths.

## Compact contents and numeric explanations — 2026-11-26

The open contents menu uses a single chapter accordion rather than exposing every lesson in several columns. Only the current chapter opens by default. Native summary controls support keyboard activation; Escape closes the menu and returns focus to its button. The part selector changes the browsed part, without changing the current lesson or its draft. Breadcrumb destinations are not repeated inside the menu. Lesson and practice completion ticks occupy a consistent column.

The first types lesson highlights C’s minimum range guarantees and distinguishes optional exact-width types from at-least-width types. It links to the fixed-width format example and the later portability chapter. Its real C example prints the same stored decimal tenth with one and seventeen fractional digits, then asks learners to compare an exact binary half. The text identifies the browser target rather than claiming all C floating-point implementations produce those digits. The numeric practice explicitly says its integer-total choice belongs to that program; it is not a rule about all totals.
