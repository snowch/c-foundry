# Course location review

Copyright © 2026 Christopher Snow.

Applied the shared course-style guide and the UX/learning-design review skills before implementation and after browser checks. The stated prerequisite remains no prior C experience. Course content, examples and outcomes are unchanged.

The original navigation called the same level Lab and Part. Lesson breadcrumbs omitted that level, progress counts did not identify their scope, part overviews flattened lessons across chapter boundaries, and the brand's destination changed with the current part. At boundaries, next-part links could be replaced by a link back to the current overview. Those choices made the current location and forward action hard to infer.

Use Course → Part → Chapter → Lesson. The shared row names parents and lesson position. Part overviews expose chapter groups; the contents selector describes its filtering behaviour. Progress names its scope. Direction cards show actual destinations, with an explicit next-part transition. The header brand always returns to All parts; legacy URLs and learner stores remain valid.

Verification: tests/navigation.cjs covers all 227 lessons in 44 chapters, all nine overviews and old part URLs, actual sequence destinations, saved edits/prediction/completion, Back/Forward/reload, keyboard focus, four widths and both themes. Existing hub and runner checks remain separate. Browser screenshots are functional/layout evidence, not evidence of learning effectiveness.

Following a reading with two practice pages also reproduced duplicate hidden prediction fields (one, then two, then three). The adapter now mounts a prediction only for a visible reading and does not duplicate an existing field. The navigation suite checks uniqueness through every practice route.
