# Course location review

Copyright © 2026 Christopher Snow.

Applied the shared course-style guide and the UX/learning-design review skills before implementation and after browser checks. The stated prerequisite remains no prior C experience. Course content, examples and outcomes are unchanged.

The original navigation called the same level Lab and Part. Lesson breadcrumbs omitted that level, progress counts did not identify their scope, part overviews flattened lessons across chapter boundaries, and the brand's destination changed with the current part. At boundaries, next-part links could be replaced by a link back to the current overview. Those choices made the current location and forward action hard to infer.

Use Course → Part → Chapter → Lesson. The shared row names parents and lesson position. Part overviews expose chapter groups; the contents selector describes its filtering behaviour. Progress names its scope. Direction cards show actual destinations, with an explicit next-part transition. The header brand always returns to All parts; legacy URLs and learner stores remain valid.

Verification: tests/navigation.cjs covers all 227 lessons in 44 chapters, all nine overviews and old part URLs, actual sequence destinations, saved edits/prediction/completion, Back/Forward/reload, keyboard focus, four widths and both themes. Existing hub and runner checks remain separate. Browser screenshots are functional/layout evidence, not evidence of learning effectiveness.

Following a reading with two practice pages also reproduced duplicate hidden prediction fields (one, then two, then three). The adapter now mounts a prediction only for a visible reading and does not duplicate an existing field. The navigation suite checks uniqueness through every practice route.

## Chapter practice handoff — 2026-11-25

Practice previously navigated through a separate global exercise list: the first practice had no backward button, the last had no forward button, and the pages lacked an explicit completion control. A reading's practice link also preceded its completion row.

The reading completion row now comes before chapter practice. An explicit “Mark lesson complete and start practice” action saves that reading's mark before opening the first exercise; a separate link leaves the reading unmarked. Practice has its own reversible completion mark, a named reading link/mark, and previous/next destinations within its chapter. After the last exercise, Next opens the following chapter's first lesson. Reading paging and the contents reflect that sequence, including boundaries and chapters with two exercises. Practice marks appear beside practice links; the existing 227-reading count and 15 output-check records keep their separate meanings and storage keys.

Passing output checks does not infer reading or practice completion. Direct links and browser history preserve saved code/input. Marking practice requires an explicit checkbox action and has per-key storage reconciliation and session-only feedback when saving fails. The change does not start a runtime during navigation. Verification covers every practice destination, mark/check independence, saved reading/practice drafts, reload/history, contents marks, storage failure, a genuine C output check and phone/tablet widths.
