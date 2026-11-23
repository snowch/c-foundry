const { chromium } = require("playwright"),
  { start } = require("./server.cjs"),
  assert = require("node:assert/strict"),
  fs = require("node:fs/promises"),
  os = require("node:os"),
  path = require("node:path");
(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "c-background-")),
    { buildOffline } = await import("../tools/offline.mjs");
  await fs.cp("dist", dir, { recursive: true });
  const release = await buildOffline(dir, { commit: null, date: null });
  const { server, url } = await start({ root: dir }),
    browser = await chromium.launch({
      executablePath:
        process.env.CHROMIUM_PATH ||
        (require("node:fs").existsSync("/usr/bin/chromium")
          ? "/usr/bin/chromium"
          : chromium.executablePath()),
      headless: true,
    });
  try {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      let job;
      Object.defineProperty(
        ServiceWorkerRegistration.prototype,
        "backgroundFetch",
        {
          configurable: true,
          get() {
            return {
              async get(id) {
                return job?.id === id ? job : null;
              },
              async fetch(id) {
                job = new EventTarget();
                Object.assign(job, {
                  id,
                  downloaded: 0,
                  result: "",
                  async abort() {
                    job.result = "failure";
                    return true;
                  },
                });
                window.backgroundStarted = true;
                return job;
              },
            };
          },
        },
      );
    });
    const page = await context.newPage();
    await page.goto(url + "#/chapter/first-program/1");
    await page
      .locator("#editor")
      .fill(
        '// draft stays\n#include <stdio.h>\nint main(void){puts("73");return 0;}',
      );
    await page.locator("#course-prediction").fill("73");
    await page.locator("#app-status-open").click();
    await page.locator("#download-update").click();
    await page.waitForFunction(() => window.backgroundStarted);
    await page.evaluate(() => {
      const now = Date.now;
      Date.now = () => now() + 60000;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForFunction(
      () =>
        document
          .querySelector("#version-status")
          .textContent.includes("Downloaded and ready"),
      null,
      { timeout: 120000 },
    );
    const job = await page.evaluate(async () => {
      const base = new URL(
          document.querySelector('meta[name="gpu-base"]').content,
          location.href,
        ),
        cache = await caches.open("c-foundry:" + base.href + ":status-v1");
      return (
        await cache.match(new URL("__download_request_v1__", base))
      ).json();
    });
    assert(job.foregroundOnly);
    assert.equal(job.state, "ready");
    assert.equal(job.wanted, false);
    assert.equal(job.bytes, release.bytes);
    await page.locator("#app-status-close").click();
    assert.match(await page.locator("#editor").inputValue(), /draft stays/);
    assert.equal(await page.locator("#course-prediction").inputValue(), "73");
    await context.setOffline(true);
    const plane = await context.newPage();
    await plane.goto(url + "#/chapter/values/1");
    await plane.locator(".topic-content").waitFor();
    await context.close();
    console.log(
      "PASS stalled native download hands off to verified foreground save, reaches ready, preserves draft/prediction and opens a fresh offline lesson",
    );
  } finally {
    await browser.close();
    server.closeAllConnections?.();
    await new Promise((r) => server.close(r));
    await fs.rm(dir, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
