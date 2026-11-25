// Shared hub contract: navigation only; never starts a runtime or changes learner data.
(() => {
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  function destination(items, done, last) {
    const complete = items.every((x) => done(x.id));
    if (complete) return { lesson: items[0], label: "Review" };
    const previous = items.find((x) => x.id === last);
    const lesson =
      previous && !done(previous.id)
        ? previous
        : items
            .slice(previous ? items.indexOf(previous) + 1 : 0)
            .find((x) => !done(x.id)) || items.find((x) => !done(x.id));
    return {
      lesson,
      label: previous || items.some((x) => done(x.id)) ? "Continue" : "Start",
    };
  }
  function cards(groups, done) {
    return groups
      .map(
        (g, i) =>
          `<article class="foundry-lab-card"><p class="lab-number">Part ${g.number}</p><h3><a href="${escape(g.href)}">${escape(g.title)}</a></h3><p>${escape(g.summary)}</p><p class="part-scope">Chapters ${g.chapters[0].number}–${g.chapters.at(-1).number} · ${g.lessons.length} lessons</p><p class="lab-requirement">${escape(g.requirement)}</p><p class="lab-progress">${g.lessons.filter((l) => done(l.id)).length} / ${g.lessons.length} lessons complete</p><a class="lab-open" href="${escape(g.href)}">Open Part ${g.number} →</a></article>`,
      )
      .join("");
  }
  function overview(g, done, last, hub) {
    const next = destination(g.lessons, done, last);
    return `<section class="foundry-lab-intro"><p class="lab-number">${g.chapters.length} chapters · ${g.lessons.length} lessons</p><h1 tabindex="-1">${escape(g.title)}</h1><p>${escape(g.summary)}</p><p>${escape(g.requirement)}</p><p>${g.lessons.filter((l) => done(l.id)).length} / ${g.lessons.length} lessons complete in this part</p><a class="lab-primary" href="${escape(next.lesson.href)}">${next.label}: ${escape(next.lesson.title)} →</a></section><section class="foundry-lab-outline" aria-label="Chapters and lessons in this part"><h2>Chapters in this part</h2>${g.chapters.map((c) => `<section class="part-chapter"><h3><a href="${escape(c.href)}">Chapter ${c.number}: ${escape(c.title)}</a></h3><p class="chapter-progress">${c.lessons.filter((l) => done(l.id)).length} / ${c.lessons.length} lessons complete in this chapter</p><ol>${c.lessons.map((l) => `<li><a href="${escape(l.href)}">${escape(l.title)}</a>${done(l.id) ? ' <span class="lesson-done">Complete</span>' : ""}</li>`).join("")}</ol></section>`).join("")}</section>`;
  }
  globalThis.foundryHub = { escape, destination, cards, overview };
})();
