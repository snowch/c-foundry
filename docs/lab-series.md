# C Foundry parts, chapters and lessons

Copyright © 2026 Christopher Snow.

Follow the [shared course design guide](https://github.com/snowch/cuda-python-lab/blob/main/docs/course-design-guide.md). C Foundry is one course containing nine parts, 44 chapters and 227 lessons. Each part contains several chapters; each chapter contains lessons. Use these names consistently in cards, menus, breadcrumbs, progress, page titles and previous/next controls. Reserve exercise or practice for hands-on tasks; do not introduce module as another navigation level.

## Location and selection

The brand always leads to All parts. Its subtitle names the current part. A single course row contains Course contents, progress explicitly labelled Course or Part N, and the location trail. A lesson identifies its parent part and chapter, plus Lesson N of M within that chapter. Parent links open the actual overviews. Only the current page receives aria-current=page.

The homepage offers numbered part cards. A part overview groups lessons beneath numbered chapter headings and links to each chapter overview. The chapter overview lists its lessons and Start chapter. Chapter numbers remain the existing course-wide numbers, preserving the reading/native-source references.

The contents selector says Show chapters in: changing it changes the outline, not the open reading or editor. Highlight the current reading. Direct links close the outline; Escape returns focus to Course contents. Keep the outline inline and readable at phone widths, using more columns only when headings fit.

## Progress and sequence

Completion remains the learner's explicit, reversible reading mark. Practice checks and successful runs do not complete lessons. Part counts include only their lessons. Course counts include all 227 lessons. Existing drafts, predictions, completion and workspace stores remain unchanged.

Within a part, Previous lesson and Next lesson lead to the actual adjacent readings, including chapter boundaries. The cards name the destination and its chapter. The first reading returns to its part overview. The last reading identifies the end of the part and offers Next part, opening the following part overview; the course's final lesson leads to All parts. Never silently replace a next-part destination with the current part overview. Part overviews also expose previous/next part links.

A saved legacy practice link still opens that exercise, labelled Practice in the location trail; its controls say Previous practice and Next practice. Preferred part URLs are #/part/N. Existing #/lab/N links still render the same part; reading and practice URLs and saved storage keys are unchanged.

## Verification and limits

The browser navigation suite follows all 227 reading routes and validates their actual parent links and previous/next destinations. It covers all nine part overviews and legacy aliases, chapter grouping, keyboard focus, Back/Forward/reload, retained editor drafts/predictions/completion, four widths and both themes. Navigation must not start the code runner. The built-site and shared-runner journeys check the same chrome with immutable offline asset URLs and real saved work.

Functional verification does not establish learning effectiveness. Naming and grouping aim to make location and scope explicit; learner feedback is still needed to evaluate that goal.
