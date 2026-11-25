// Copyright © 2026 Christopher Snow. Follow the public hierarchy and real links.
const { chromium, expect } = require("playwright/test"),
  { start } = require("./server.cjs"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
(async () => {
  const { server, url } = await start({ root: process.env.NAV_SITE || "dist" }),
    browser = await chromium.launch({
      headless: true,
      executablePath:
        process.env.CHROMIUM_PATH ||
        (fs.existsSync("/usr/bin/chromium")
          ? "/usr/bin/chromium"
          : chromium.executablePath()),
    });
  const context = await browser.newContext({
      viewport: { width: 390, height: 1000 },
    }),
    page = await context.newPage(),
    errors = [];
  let workers = 0;
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("worker", () => workers++);
  async function go(hash) {
    await page.goto(url + hash);
    await expect(page.locator("#course-breadcrumbs")).toBeVisible();
  }
  try {
    await go("#/course");
    await expect(page.locator("#course-outline-title")).toHaveText(
      "Choose a part",
    );
    const chapters = await page.evaluate(() =>
        COURSE.chapters.map((c) => ({
          id: c.id,
          number: c.number,
          part: c.part,
          title: c.title,
          topics: c.topics,
          labs: c.labs,
        })),
      ),
      parts = await page.evaluate(() => COURSE.parts);
    assert.equal(await page.locator(".lab-open").count(), parts.length);
    await page.locator(".lab-open").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#foundry-lab-page h1")).toBeFocused();
    for (let part = 0; part < parts.length; part++) {
      await go("#/part/" + (part + 1));
      await expect(
        page.locator("#course-breadcrumbs [aria-current]"),
      ).toHaveText("Part " + (part + 1) + " of " + parts.length);
      const expected = chapters.filter((c) => c.part === part);
      assert.equal(
        await page.locator(".part-chapter").count(),
        expected.length,
      );
      assert.deepEqual(
        await page
          .locator(".part-chapter h3 a")
          .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href"))),
        expected.map((c) => "#/chapter/" + c.id),
      );
      assert.equal(
        await page.locator(".foundry-lab-outline li a").count(),
        expected.reduce((n, c) => n + c.topics.length, 0),
      );
      await page.locator("#course-menu-button").click();
      await expect(page.locator("#outline-part")).toHaveValue(String(part));
      await page.keyboard.press("Escape");
      await expect(page.locator("#course-menu-button")).toBeFocused();
      await go("#/lab/" + (part + 1));
      await expect(page.locator("#foundry-lab-page h1")).toHaveText(
        parts[part],
      );
    }
    let visited = 0;
    for (const chapter of chapters) {
      const sequence = chapters
        .filter((c) => c.part === chapter.part)
        .flatMap((c) =>
          c.topics.map((t, i) => ({
            href: "#/chapter/" + c.id + "/" + t.id,
            chapter: c,
            number: i + 1,
            title: t.title,
          })),
        );
      for (let i = 0; i < chapter.topics.length; i++) {
        const topic = chapter.topics[i],
          href = "#/chapter/" + chapter.id + "/" + topic.id;
        await go(href);
        await expect(page.locator("[data-lesson-complete]")).toHaveAttribute(
          "data-lesson-complete",
          chapter.id + "/" + topic.id,
        );
        await expect(
          page.locator("#course-breadcrumbs [aria-current]"),
        ).toHaveText("Lesson " + (i + 1) + " of " + chapter.topics.length);
        await expect(
          page.locator(
            '#course-breadcrumbs a[href="#/part/' + (chapter.part + 1) + '"]',
          ),
        ).toHaveText("Part " + (chapter.part + 1) + ": " + parts[chapter.part]);
        await expect(
          page.locator(
            '#course-breadcrumbs a[href="#/chapter/' + chapter.id + '"]',
          ),
        ).toHaveText("Chapter " + chapter.number + ": " + chapter.title);
        const index = sequence.findIndex((l) => l.href === href),
          previous = sequence[index - 1],
          next = sequence[index + 1];
        const links = await page
          .locator("[data-course-paging] a")
          .evaluateAll((nodes) =>
            nodes.map((n) => ({
              href: n.getAttribute("href"),
              text: n.textContent,
            })),
          );
        assert.equal(
          links[0].href,
          (i===0&&chapters[chapter.number-2]?.labs.length?'#/lesson/'+chapters[chapter.number-2].labs.at(-1):previous?.href || "#/part/" + (chapter.part + 1)),
        );
        assert.equal(
          links[1].href,
          (i===chapter.topics.length-1&&chapter.labs.length?'#/lesson/'+chapter.labs[0]:next?.href ||
            (chapter.part < parts.length - 1
              ? "#/part/" + (chapter.part + 2)
              : "#/course")),
        );
        if(i===chapter.topics.length-1&&chapter.labs.length)assert.match(links[1].text,/Chapter practice/);
        else if (next) assert.ok(links[1].text.includes(next.title));
        else
          assert.match(
            links[1].text,
            chapter.part < parts.length - 1 ? /Next part/ : /Course overview/,
          );
        await expect(page.locator("#course-row-progress")).toContainText(
          "Part " + (chapter.part + 1) + " progress:",
        );
        assert.equal(
          await page.locator(".brand").getAttribute("href"),
          "#/course",
        );
        visited++;
      }
    }
    assert.equal(visited, 227);
    await go("#/chapter/first-program/1");
    await page
      .locator("#editor")
      .fill("// navigation draft\nint main(void){return 0;}");
    await page.locator("#course-prediction").fill("My prediction is kept.");
    await page.locator("[data-lesson-complete]").check();
    await page.locator("#course-menu-button").click();
    await page.locator('#course-contents a[aria-current="page"]').click();
    await expect(page.locator("#course-contents")).toBeHidden();
    await expect(page.locator("#preview-content h1")).toBeFocused();
    await page.locator("#course-menu-button").click();
    await page.locator("#outline-part").selectOption("7");
    assert.equal(new URL(page.url()).hash, "#/chapter/first-program/1");
    await expect(page.locator("#editor")).toHaveValue(
      "// navigation draft\nint main(void){return 0;}",
    );
    await expect(page.locator("#course-breadcrumbs")).toContainText("Part 1:");
    await page.keyboard.press("Escape");
    await expect(page.locator("#course-menu-button")).toBeFocused();
    await page.locator('#course-breadcrumbs a[href="#/part/1"]').click();
    await expect(page.locator("#foundry-lab-page h1")).toBeFocused();
    await page.goBack();
    await expect(page.locator("#editor")).toHaveValue(
      "// navigation draft\nint main(void){return 0;}",
    );
    await expect(page.locator("#course-prediction")).toHaveValue(
      "My prediction is kept.",
    );
    await expect(page.locator("[data-lesson-complete]")).toBeChecked();
    await page.goForward();
    await expect(page.locator("#foundry-lab-page h1")).toHaveText(parts[0]);
    await page.reload();
    await expect(page.locator("#course-breadcrumbs [aria-current]")).toHaveText(
      "Part 1 of " + parts.length,
    );
    let practiceCount = 0;
    for (const chapter of chapters)
      for (const id of chapter.labs) {
        await go("#/lesson/" + id);
        await expect(
          page.locator("#course-breadcrumbs [aria-current]"),
        ).toContainText("Practice:");
        await expect(
          page.locator(
            '#course-breadcrumbs a[href="#/chapter/' + chapter.id + '"]',
          ),
        ).toHaveText("Chapter " + chapter.number + ": " + chapter.title);
        await expect(page.locator("#next-button")).toHaveText(
          (chapter.labs.indexOf(id)<chapter.labs.length-1?'Next practice: ':'Next lesson: ')+ (chapter.labs.indexOf(id)<chapter.labs.length-1?await page.evaluate(id=>LESSONS.find(l=>l.id===id).title,chapter.labs[chapter.labs.indexOf(id)+1]):chapters[chapter.number].topics[0].title)+' →',
        );
        assert.ok(
          (await page.locator("#course-prediction").count()) <= 1,
          "Practice navigation must not duplicate saved prediction fields",
        );
        practiceCount++;
      }
    assert.equal(practiceCount, 15);
    fs.mkdirSync("test-results", { recursive: true });
    for (const width of [320, 390, 820, 1440])
      for (const theme of ["light", "dark"]) {
        await page.setViewportSize({ width, height: 1000 });
        if ((await page.locator("html").getAttribute("data-theme")) !== theme)
          await page.locator("#theme").click();
        for (const hash of [
          "#/course",
          "#/part/9",
          "#/chapter/first-program/1",
          "#/chapter/reliability/3",
        ]) {
          await go(hash);
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
            width + " " + theme + " " + hash,
          );
        }
        await page.locator("#course-menu-button").click();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        await page.screenshot({
          path: "test-results/navigation-" + width + "-" + theme + ".png",
        });
        await page.keyboard.press("Escape");
      }
    await go("#/part/999");
    await expect(page.locator("main>section:not([hidden]) h1")).toHaveText(
      "Page not found",
    );
    assert.equal(workers, 0, "Navigation must not start the code runner");
    assert.deepEqual(errors, []);
    console.log(
      "PASS all 9 part overviews and legacy URLs, 44 chapters/227 lesson locations and destinations, chapter/part boundaries, grouped outlines, saved drafts/predictions/completion, Back/Forward/reload, keyboard focus and 4 widths × 2 themes; no runtime startup.",
    );
  } finally {
    await context.close();
    await browser.close();
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
