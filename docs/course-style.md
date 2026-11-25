# Shared course style in C Foundry

Follow the [shared course design guide](https://github.com/snowch/cuda-python-lab/blob/main/docs/course-design-guide.md). This adapter keeps C Foundry’s C17 baseline, 44 chapters, 227 readings, 191 inline examples, 36 Browser Linux examples and 15 separate practice exercises.

Use one hierarchy: **C Foundry (the course) → Part → Chapter → Lesson**. A part is a large sequence containing several chapters; a chapter groups lessons on one subject. Hands-on tasks are practice or exercises. Do not add “module” or use “lab” as another name for these levels. Existing technical uses of C modules and small debugging labs are separate from navigation labels.

The header offers Code runner, App status and theme. Its subtitle identifies the current part, and the brand always returns to All parts. One course row combines Course contents, explicitly scoped reading progress and the full location trail. Part overviews group lessons beneath numbered, linked chapter headings. The outline's “Show chapters in” selector filters the outline without moving the current lesson; selecting a link navigates. Escape closes the outline and returns focus.

The existing home illustration is original C Foundry artwork. It sits beside the intro above 900 px and below the intro and Start controls at narrower widths.

Readings retain their explanations, complete editable programs, understanding checks and explicit completion. Optional saved predictions precede inline experiments. References use the existing topic-specific catalogue and official Material Symbols Rounded. A documentation question refers to the link above it; its answer remains optional. Navigation cards name the actual destination and distinguish course/chapter overviews from lessons.

Reading marks, practice output checks and program execution remain separate. Running a valid edited program does not fail because its output differs from the starter. A stopped or failed attempt keeps the previous genuine result and labels it as earlier output. Compiler errors and infrastructure failures have different recovery behaviour.

IBM Plex Sans and Mono and Material icons are bundled with their licences for offline use. Both themes use semantic colour roles, including live-text concept diagrams; code remains approximately 16px on phones. Required instructions stay visible. Browser Linux is self-hosted with the course. The source editor sends edits directly to its guest; exports remain available for backup.

Verify the homepage and first, middle, final, multi-file and Linux lessons; all reading destinations; resources/completion; phones and desktop; themes; keyboard navigation; and saved work. Run the real compiler and workspace as well as the DOM checks. Functional verification does not establish learning effectiveness.

The Foundry uses the [part and chapter overview](lab-series.md): numbered part cards, grouped chapter/lesson lists, scoped progress and stable reading links.

The header contains Code runner, App status and Theme. The lesson editor remains the primary interface. Command workspace and Browser Linux remain available through Independent workspaces in the Course contents outline and through quiet footer links. Course overview uses the part overview routes, rather than a second header control. This changes navigation placement only; all existing URLs and saved workspace files remain valid.
