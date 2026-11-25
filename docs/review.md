# UX review


## Focused lab hubs — 2026-11-23

The previous entry page exposed the full curriculum before learners could choose a manageable sequence. The hub now offers 9 numbered labs containing the existing 227 lessons. Each lab has its own URL, prerequisite, progress, direct Start / Continue / Review and lesson list. Lesson routes, drafts and completion keys retain their existing identities. First and last lesson navigation returns to the lab.

Reading order is compact introduction → primary resume → lab choices → optional illustration on narrow screens. On wide screens the illustration sits beside the introduction. The lab list uses one/two/three columns at 390/820/1440 px; theme surfaces and keyboard focus use the shared design tokens. The reusable decision checks cover unfinished resume, advancing after completion, earlier gaps and review. Browser checks exercise actual completion controls, reload, Back/Forward and zero automatic runtime starts. Existing real compiler/offline/saved-work suites provide separate execution evidence. None of these checks establishes learning effectiveness.

CI exposed a native Background Fetch stall at exactly 222.7 MB of 242.6 MB after both three and six minutes. Extending the timeout did not fix the stall. A visible, online page now takes over after 45 seconds without byte progress. The worker imports only hash-valid completed responses, bounds unresolved native records, and resumes remaining files through foreground fetch. Download consent and the same job ID survive this handoff; explicit Cancel still revokes consent. Protocol and browser transport checks cover the handoff, preservation of earlier complete releases, pending updates, drafts and prediction. The real Linux journey must still complete the full save, boot a fresh offline guest and restore exported files; a failure reports status and byte counts.


## Visual opportunities, 25 November 2026

See [the whole-course visual review](visual-opportunities.md) and its source-pinned lesson records. This pass adds source-specific models as well as revising existing diagrams; the model renderer has no runner, navigation, draft or completion side effects.
