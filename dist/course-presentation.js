// Copyright © 2026 Christopher Snow. Course → part → chapter → lesson.
// Navigation preserves existing URLs, completion keys and editor/workspace stores.
(() => {
  const $ = (id) => document.getElementById(id);
  const escape = (text) =>
    String(text).replace(
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
  const button = $("course-menu-button"),
    row = document.createElement("section");
  row.className = "course-navigation";
  row.innerHTML =
    '<div class="course-location"><span id="course-control-slot"></span><p id="course-row-progress"></p><nav id="course-breadcrumbs" aria-label="Course location"></nav></div><div id="course-contents" hidden></div>';
  document.querySelector("main").before(row);
  $("course-control-slot").append(button);
  button.innerHTML = "Course contents " + materialSymbol("expand_more");
  button.setAttribute("aria-controls", "course-contents");
  const star = document.querySelector(".github-star");
  star.textContent = "Source";
  document.querySelector(".copyright-notice").append(star);
  const brand = document.querySelector(".brand");
  brand.href = "#/course";
  brand.lastElementChild.textContent = "C Foundry";
  brand.lastElementChild.insertAdjacentHTML(
    "beforeend",
    "<small>C17 programming</small>",
  );
  const summaries = [
    "Write C programs using values, branches, loops, functions, arrays and strings.",
    "Use pointers, manage allocated memory, structure data and work with files.",
    "Measure algorithmic cost and implement searching, sorting and recursion.",
    "Build lists, queues, hash tables, trees, heaps and graphs.",
    "Define tables, parse commands, execute queries and save records.",
    "Organise pages and indexes, plan queries and test recovery.",
    "Make C programs and stored formats portable across compilers and platforms.",
    "Coordinate threads with locks, condition variables and atomic operations.",
    "Manage multiple clients, isolation, snapshots, queries and storage maintenance.",
  ];
  const courseParts = COURSE.parts.map((title, index) => {
    const chapters = COURSE.chapters
      .filter((c) => c.part === index && c.status === "ready")
      .map((c) => ({
        id: c.id,
        number: c.number,
        title: c.title,
        href: "#/chapter/" + c.id,
        lessons: c.topics.map((t, i) => ({
          id: c.id + "/" + t.id,
          title: t.title,
          number: i + 1,
          href: "#/chapter/" + c.id + "/" + t.id,
          chapter: c,
        })),
      }));
    return {
      id: String(index + 1),
      number: index + 1,
      total: COURSE.parts.length,
      title,
      href: "#/part/" + (index + 1),
      summary: summaries[index],
      requirement: index
        ? "Builds on Part " + index + ": " + COURSE.parts[index - 1] + "."
        : "No previous programming experience required.",
      chapters,
      lessons: chapters.flatMap((c) => c.lessons),
    };
  });
  const done = (id) => lessonCompletion.isDone(id);
  let savedLast;
  const last = () => {
    try {
      return localStorage.getItem("c-foundry:hub:last-lesson") || savedLast;
    } catch {
      return savedLast;
    }
  };
  function remember(id) {
    savedLast = id;
    try {
      localStorage.setItem("c-foundry:hub:last-lesson", id);
    } catch {}
  }
  const initialResume = $("course-start-link").getAttribute("href"),
    initialContinue = $("course-start-link").textContent.includes("Continue");
  const cover = $("curriculum-view").querySelector(".course-cover"),
    choices = $("curriculum-view").querySelector(".course-outline"),
    art = cover.querySelector("figure");
  choices.innerHTML =
    '<div class="hub-heading"><h2 id="course-outline-title" tabindex="-1">Choose a part</h2><p id="hub-count"></p></div><p class="course-hierarchy-note">Work through the parts in order. Open a part to see its chapters and lessons.</p><div class="foundry-lab-grid" id="course-cards"></div>';
  const partPage = document.createElement("section");
  partPage.id = "foundry-lab-page";
  $("curriculum-view").append(partPage);
  art.classList.add("hub-art");
  function arrange() {
    if (matchMedia("(max-width:900px)").matches) choices.after(art);
    else cover.append(art);
  }
  matchMedia("(max-width:900px)").addEventListener("change", arrange);
  arrange();
  function route() {
    const segments = location.hash.replace(/^#\/?/, "").split("/");
    const chapter =
      segments[0] === "chapter"
        ? COURSE.chapters.find((c) => c.id === segments[1])
        : segments[0] === "lesson"
          ? COURSE.chapters.find((c) => c.labs.includes(segments[1]))
          : null;
    const topic =
      chapter && segments[0] === "chapter"
        ? chapter.topics.find((t) => t.id === segments[2])
        : null;
    const part = chapter
      ? courseParts[chapter.part]
      : ["part", "lab"].includes(segments[0])
        ? courseParts.find((p) => p.id === segments[1])
        : null;
    return {
      segments,
      chapter,
      topic,
      part,
      practice:
        segments[0] === "lesson"
          ? LESSONS.find((l) => l.id === segments[1])
          : chapter && segments[2] === "practice"
            ? authoredLessons.practices(chapter).find(p=>p.project)
            : null,
    };
  }
  const partLabel = (p) => "Part " + p.number + ": " + p.title;
  const chapterLabel = (c) => "Chapter " + c.number + ": " + c.title;
  function hub() {
    const current = route(),
      isHub = current.segments[0] === "course",
      isPart = ["part", "lab"].includes(current.segments[0]) && current.part;
    cover.hidden = !isHub;
    choices.hidden = !isHub;
    art.hidden = !isHub;
    partPage.hidden = !isPart;
    if (isPart) {
      const part = current.part;
      partPage.innerHTML = foundryHub.overview(part, done, last(), "#/course");
      partPage.querySelectorAll('.part-chapter').forEach((section,index)=>{
        const chapter=COURSE.chapters.find(c=>c.id===part.chapters[index].id);
        section.insertAdjacentHTML('beforeend','<p class="outline-practice">Practice: '+authoredLessons.practices(chapter).map(p=>`<a href="${p.href}" data-completed="${practiceCompletion.isDone(p.id)}">${escape(p.title)}${practiceCompletion.isDone(p.id)?'<span class="practice-tick"> · ✓ Practice complete</span>':''}</a>`).join(' · ')+'</p>');
      });
      const previous = courseParts[part.number - 2],
        next = courseParts[part.number];
      partPage.insertAdjacentHTML(
        "beforeend",
        '<nav class="page-navigation part-sequence" aria-label="Part sequence">' +
          card(
            previous
              ? {
                  href: previous.href,
                  label: "Previous part",
                  title: partLabel(previous),
                }
              : {
                  href: "#/course",
                  label: "Course overview",
                  title: "All parts",
                },
          ) +
          card(
            next
              ? { href: next.href, label: "Next part", title: partLabel(next) }
              : {
                  href: "#/course",
                  label: "Course overview",
                  title: "All parts",
                },
          ) +
          "</nav>",
      );
      document.title = partLabel(part) + " · C Foundry";
    }
    if (isHub) {
      $("course-cards").className = "foundry-lab-grid";
      $("course-cards").innerHTML = foundryHub.cards(courseParts, done);
      $("hub-count").textContent =
        courseParts.filter((p) => p.lessons.every((l) => done(l.id))).length +
        " / " +
        courseParts.length +
        " parts complete";
      const target = foundryHub.destination(
          courseParts.flatMap((p) => p.lessons),
          done,
          last(),
        ),
        legacy =
          !last() && initialContinue && initialResume?.startsWith("#/lesson/");
      $("course-start-link").href = legacy ? initialResume : target.lesson.href;
      $("course-start-link").textContent = legacy
        ? "Continue your saved exercise →"
        : target.label + ": " + target.lesson.title;
      $("course-start-context").textContent =
        "This course has " +
        courseParts.length +
        " parts. Each part contains chapters; each chapter contains lessons.";
      document.title = "C Foundry · All parts";
    }
  }
  window.refreshFoundryHub = hub;
  let selectedPart;
  function close() {
    button.setAttribute("aria-expanded", "false");
    $("course-contents").hidden = true;
  }
  function outline() {
    const current = route(),
      part =
        courseParts[
          selectedPart ?? (current.part ? current.part.number - 1 : 0)
        ],
      scoped = current.part
        ? current.part.lessons
        : courseParts.flatMap((p) => p.lessons);
    $("course-row-progress").textContent =
      (current.part ? "Part " + current.part.number : "Course") +
      " progress: " +
      scoped.filter((l) => done(l.id)).length +
      " / " +
      scoped.length +
      " lessons complete";
    const activeChapter = part.chapters.find(c=>c.id===current.chapter?.id) || part.chapters[0];
    function outlineStep(step, number, completed, practice=false){
      return `<li><a href="${step.href}" ${location.hash===step.href?'aria-current="page"':''} data-completed="${completed}" aria-label="${escape((practice?'Practice: ':'Lesson '+number+': ')+step.title+(completed?', complete':''))}"><span class="outline-lesson-number" aria-hidden="true">${practice?materialSymbol('terminal'):number}</span><span class="outline-step-title">${escape(step.title)}${practice?'<small>Practice</small>':''}</span><span class="outline-step-status">${completed?materialSymbol('check')+'<span class="sr-only">'+(practice?'Practice complete':'Completed')+'</span>':''}</span></a></li>`;
    }
    $("course-contents").innerHTML =
      `<div class="outline-toolbar"><label for="outline-part">Browse a part<select id="outline-part">${courseParts.map((p,i)=>`<option value="${i}" ${p===part?'selected':''}>${escape(partLabel(p))}</option>`).join('')}</select></label>${part!==current.part?`<a href="${part.href}">Part overview ${materialSymbol('chevron_right')}</a>`:''}</div><div class="course-chapter-list">${part.chapters.map(c=>{
        const chapter=COURSE.chapters.find(ch=>ch.id===c.id),completed=c.lessons.filter(l=>done(l.id)).length;
        return `<details class="outline-chapter" name="course-chapters" ${c===activeChapter?'open':''}><summary><span class="outline-chapter-number" aria-hidden="true">${c.number}</span><span class="outline-chapter-title">${escape(c.title)}<small>${completed} of ${c.lessons.length} lessons complete</small></span>${materialSymbol('expand_more')}</summary><div class="outline-chapter-body"><ol>${c.lessons.map(l=>outlineStep(l,l.number,done(l.id))).join('')}${authoredLessons.practices(chapter).map(p=>outlineStep(p,null,practiceCompletion.isDone(p.id),true)).join('')}</ol><a class="outline-chapter-overview" href="${c.href}">Chapter overview ${materialSymbol('chevron_right')}</a></div></details>`;
      }).join('')}</div><details class="outline-workspaces"><summary>Independent workspaces</summary><p><a href="#/workspace">Command workspace</a> keeps files for independent C programs. <a href="#/linux">Browser Linux</a> provides the terminal and native tools.</p></details>`;
    $("outline-part").onchange = (event) => {
      selectedPart = Number(event.target.value);
      outline();
      $("outline-part").focus();
    };
  }
  button.onclick = () => {
    const opening = $("course-contents").hidden;
    button.setAttribute("aria-expanded", String(opening));
    $("course-contents").hidden = !opening;
    if (opening) outline();
  };
  $("course-contents").addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    close();
    if (link.hash === location.hash) {
      const heading = [
        ...document.querySelectorAll("main>section:not([hidden]) h1"),
      ].find((node) => !node.closest("[hidden]"));
      heading?.focus({ preventScroll: true });
    }
  });
  row.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      button.focus();
    }
  });
  function breadcrumbs(current) {
    const crumbs = [
      {
        title: "All parts",
        href: current.segments[0] === "course" ? null : "#/course",
      },
    ];
    if (current.part)
      crumbs.push({
        title: current.chapter
          ? partLabel(current.part)
          : "Part " + current.part.number + " of " + courseParts.length,
        href: current.chapter ? current.part.href : null,
      });
    if (current.chapter)
      crumbs.push({
        title:
          current.topic || current.practice
            ? chapterLabel(current.chapter)
            : "Chapter " + current.chapter.number,
        href:
          current.topic || current.practice
            ? "#/chapter/" + current.chapter.id
            : null,
      });
    if (current.topic)
      crumbs.push({
        title:
          "Lesson " +
          (current.chapter.topics.indexOf(current.topic) + 1) +
          " of " +
          current.chapter.topics.length,
      });
    else if (current.practice)
      crumbs.push({ title: current.practice.project ? "Chapter practice" : "Practice: " + current.practice.title });
    else if (!current.part && current.segments[0] !== "course")
      crumbs.push({
        title:
          document.querySelector("main>section:not([hidden]) h1")
            ?.textContent || "Course",
      });
    $("course-breadcrumbs").innerHTML = crumbs
      .map(
        (c, i) =>
          '<span class="breadcrumb-item">' + (i
            ? '<span class="breadcrumb-separator" aria-hidden="true">/</span>'
            : "") +
          (c.href
            ? `<a href="${c.href}">${escape(c.title)}</a>`
            : `<span${i === crumbs.length - 1 ? ' aria-current="page"' : ""}>${escape(c.title)}</span>`) + '</span>',
      )
      .join("");
  }
  function card({ href, label, title, detail }) {
    return `<a href="${href}"><small>${escape(label)}</small><strong>${escape(title)}</strong>${detail ? `<span class="navigation-detail">${escape(detail)}</span>` : ""}</a>`;
  }
  function lessonCard(lesson, label, currentChapter) {
    return {
      href: lesson.href,
      label:
        label +
        (lesson.chapter.id !== currentChapter.id
          ? " · Chapter " + lesson.chapter.number
          : ""),
      title: lesson.title,
      detail:
        "Lesson " + lesson.number + " in Chapter " + lesson.chapter.number,
    };
  }
  function paging(current) {
    const { part, chapter, topic } = current;
    if (!chapter || !part || current.practice) return;
    const host = $("preview-content"),
      nav = host.querySelector(".page-navigation");
    if (!nav) return;
    nav.setAttribute("aria-label", "Lesson sequence");
    nav.dataset.coursePaging = "true";
    if (!topic) {
      nav.innerHTML =
        card({
          href: part.href,
          label: "Part overview",
          title: partLabel(part),
        }) +
        card({
          href: "#/chapter/" + chapter.id + "/" + chapter.topics[0].id,
          label: "Start Chapter " + chapter.number,
          title: chapter.topics[0].title,
          detail: "Lesson 1 of " + chapter.topics.length,
        });
      const heading = host.querySelector(".eyebrow");
      if (heading)
        heading.textContent =
          chapter.topics.length +
          " lessons · " +
          chapter.topics.filter((t) => done(chapter.id + "/" + t.id)).length +
          " complete in this chapter";
      const list = host.querySelector(".topic-list");
      if (list?.previousElementSibling?.tagName === "H2")
        list.previousElementSibling.textContent = "Lessons in this chapter";
      return;
    }
    host.querySelector(":scope>.eyebrow")?.remove();
    const position = part.lessons.findIndex(
        (l) => l.id === chapter.id + "/" + topic.id,
      ),
      previous = part.lessons[position - 1],
      next = part.lessons[position + 1],
      nextPart = courseParts[part.number];
    const previousChapter=COURSE.chapters[chapter.number-2],
      previousPractice=chapter.topics[0].id===topic.id&&previousChapter?authoredLessons.practices(previousChapter).at(-1):null,
      nextPractice=chapter.topics.at(-1).id===topic.id?authoredLessons.practices(chapter)[0]:null;
    nav.innerHTML =
      card(
        previousPractice
          ? {href:previousPractice.href,label:'Previous practice',title:previousPractice.title}
          : previous
          ? lessonCard(previous, "Previous lesson", chapter)
          : { href: part.href, label: "Part overview", title: partLabel(part) },
      ) +
      card(
        nextPractice
          ? {href:nextPractice.href,label:'Next · Practice',title:nextPractice.title,detail:'Apply what you learned in this chapter'}
          : next
          ? lessonCard(next, "Next lesson", chapter)
          : nextPart
            ? {
                href: nextPart.href,
                label: "Next part",
                title: partLabel(nextPart),
                detail: "Open the part overview",
              }
            : {
                href: "#/course",
                label: "Course overview",
                title: "All parts",
              },
      );
    if (!next && !nextPractice) {
      const note = document.createElement("p");
      note.className = "part-boundary";
      note.textContent = "This is the last lesson in " + partLabel(part) + ".";
      nav.before(note);
    }
    document.title =
      "Lesson " +
      (chapter.topics.indexOf(topic) + 1) +
      ": " +
      topic.title +
      " · Chapter " +
      chapter.number +
      " · Part " +
      part.number +
      " · C Foundry";
  }
  function resources() {
    for (const details of document.querySelectorAll(
      "main .lesson-references",
    )) {
      const summary = details.querySelector(":scope > summary");
      const names = [...details.querySelectorAll(":scope > ul > li > a:first-child")].map(
        (a) => a.textContent.replace("(new tab)", "").trim(),
      );
      summary.innerHTML =
        materialSymbol("menu_book") +
        `<span><strong>References</strong><small>${escape(names.join(" · "))}</small></span>` +
        materialSymbol("chevron_right");
      details.classList.add("resource-row");
      const practice = details.parentElement.querySelector(
        ".documentation-practice",
      );
      if (practice) {
        const section = document.createElement("section");
        section.className = "documentation-practice";
        section.innerHTML =
          "<h3>Try the documentation</h3>" +
          [...practice.children]
            .filter((el) => el.tagName !== "SUMMARY")
            .map((el) => el.outerHTML)
            .join("");
        const consult = section.querySelector("p a");
        if (consult)
          consult.parentElement.textContent =
            "Use the " +
            consult.textContent.replace("(new tab)", "").trim() +
            " link above to find the rule. Write the rule and its conditions in Your answer below, then open Compare your answer.";
        details.append(section);
        practice.remove();
      }
    }
  }
  function prediction() {
    const host = document.querySelector("#inline-editor-host");
    if (
      document.querySelector(".help-practice") || !host ||
      host.closest("[hidden]") ||
      host.previousElementSibling?.id === "course-prediction"
    )
      return;
    const id = location.hash;
    const project = !!host.closest(".practice-content");
    host.insertAdjacentHTML(
      "beforebegin",
      `<label class="prediction-label" for="course-prediction">${project ? "Your next test prediction" : "Your prediction for Try a change"} (optional)</label><textarea id="course-prediction" rows="2" placeholder="${project ? "Name a test case and its expected result." : "Name the change above and the output you expect."}"></textarea>`,
    );
    const field = $("course-prediction");
    field.value = window.cFoundryApp.prediction(id);
    field.oninput = () => window.cFoundryApp.savePrediction(id, field.value);
  }
  function render() {
    close();
    selectedPart = undefined;
    const current = route();
    hub();
    row.hidden = false;
    brand.querySelector("small").textContent = current.part
      ? "Part " + current.part.number + " · " + current.part.title
      : "C17 programming";
    if (current.chapter && current.topic)
      remember(current.chapter.id + "/" + current.topic.id);
    breadcrumbs(current);
    outline();
    document.querySelector("main .reading-breadcrumb")?.remove();
    document.querySelector("main .chapter-controls")?.remove();
    resources();
    prediction();
    paging(current);
    for (const label of document.querySelectorAll(".completion-control")) {
      const text = [...label.childNodes].find(
        (n) => n.nodeType === Node.TEXT_NODE,
      );
      if (text) text.textContent = " Mark lesson complete";
    }
    if (current.practice) {
      document.title =
        "Practice: " +
        current.practice.title +
        " · Chapter " +
        current.chapter.number +
        " · Part " +
        current.part.number +
        " · C Foundry";
    }
    // Local source/fixture links follow the current document's immutable release.
    const id = document.querySelector('meta[name="gpu-release"]')?.content;
    if (id) {
      const base = new URL(
        document.querySelector('meta[name="gpu-base"]').content,
        location.href,
      );
      for (const el of document.querySelectorAll("main a[href]")) {
        const href = el.getAttribute("href");
        if (!/^(?:#|[a-z]+:|\/)/.test(href))
          el.href = new URL(
            `releases/${id}/` + href.replace(/^\.\//, ""),
            base,
          );
      }
    }
  }
  addEventListener("c-foundry:route", render);
  addEventListener("lessoncompletionchange", outline);
  addEventListener("practicecompletionchange",()=>{hub();outline();});
  render();
})();
