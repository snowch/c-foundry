const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict"),
  { webcrypto, createHash } = require("node:crypto");
(async () => {
  const origin = "https://example.test/c-foundry/",
    a = "a".repeat(64),
    b = "b".repeat(64),
    id = "c-foundry-stalled",
    good = "verified native bytes",
    bad = "canonical remaining bytes";
  const files = {
    "index.html": "<html>new course</html>",
    "good.bin": good,
    "missing.bin": bad,
    "pending.bin": "canonical pending bytes",
  };
  const hash = (s) => createHash("sha256").update(s).digest("hex");
  const release = (id, entries) => ({
    schema: 1,
    id,
    commit: null,
    date: null,
    bytes: Object.values(entries).reduce((n, s) => n + Buffer.byteLength(s), 0),
    files: Object.entries(entries).map(([path, body]) => ({
      path,
      bytes: Buffer.byteLength(body),
      sha256: hash(body),
    })),
  });
  const old = release(a, { "index.html": "old complete course" }),
    next = release(b, files),
    stores = new Map(),
    url = (value) =>
      typeof value === "string"
        ? value
        : value.url || value.href || String(value);
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const data = stores.get(name);
      return {
        async match(request) {
          return data.get(url(request))?.clone();
        },
        async put(request, response) {
          data.set(url(request), response.clone());
        },
        async delete(request) {
          return data.delete(url(request));
        },
        async keys() {
          return [...data.keys()].map((u) => new Request(u));
        },
      };
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name) {
      return stores.delete(name);
    },
  };
  const prefix = "c-foundry:" + origin + ":",
    meta = await caches.open(prefix + "status-v1"),
    older = await caches.open(prefix + "release-" + a),
    current = await caches.open(prefix + "release-" + b);
  await older.put(
    origin + "__release_manifest__",
    new Response(JSON.stringify(old)),
  );
  await older.put(origin + "index.html", new Response("old complete course"));
  await current.put(
    origin + "__release_manifest__",
    new Response(JSON.stringify(next)),
  );
  await meta.put(
    origin + "__app_status_state__",
    new Response(JSON.stringify({ active: a, saved: true, partial: b })),
  );
  await meta.put(
    origin + "__download_request_v1__",
    new Response(
      JSON.stringify({
        id,
        release: b,
        running: a,
        mode: "update",
        save: true,
        wanted: true,
        state: "background",
        started: Date.now(),
        bytes: 0,
        cachedBytes: 0,
        total: next.bytes,
      }),
    ),
  );
  const native = {
    id,
    result: "",
    recordsAvailable: true,
    async abort() {
      this.result = "failure";
      return true;
    },
    async matchAll() {
      return [
        {
          request: new Request(origin + "releases/" + b + "/good.bin"),
          responseReady: Promise.resolve(new Response(good)),
        },
        {
          request: new Request(origin + "releases/" + b + "/missing.bin"),
          responseReady: Promise.resolve(
            new Response("incomplete wrong bytes"),
          ),
        },
        {
          request: new Request(origin + "releases/" + b + "/pending.bin"),
          responseReady: new Promise(() => {}),
        },
      ];
    },
  };
  const handlers = {},
    requested = [];
  const context = {
    URL,
    Request,
    Response,
    Headers,
    TextEncoder,
    TextDecoder,
    crypto: webcrypto,
    caches,
    setTimeout,
    clearTimeout,
    AbortController,
    AbortSignal,
    console,
    fetch: async (request) => {
      const path = new URL(url(request)).pathname.split("/").at(-1);
      requested.push(path);
      return new Response(files[path], { status: path in files ? 200 : 404 });
    },
    self: {
      registration: {
        scope: origin,
        backgroundFetch: {
          get: async (candidate) => (candidate === id ? native : null),
        },
      },
      clients: { matchAll: async () => [], claim: async () => {} },
      addEventListener: (name, fn) => (handlers[name] = fn),
      skipWaiting: async () => {},
    },
  };
  vm.createContext(context);
  const code =
    fs
      .readFileSync("dist/release-contract.mjs", "utf8")
      .replace(/export /g, "") +
    "\n" +
    fs.readFileSync("dist/media-range.mjs", "utf8").replace(/export /g, "") +
    "\n" +
    fs.readFileSync("tools/service-worker.js", "utf8");
  vm.runInContext(code, context);
  const rpc = async (data) => {
    let reply, work;
    handlers.message({
      data,
      source: { id: "tab", url: origin + "index.html" },
      ports: [
        {
          postMessage: (value) => {
            if (!value.progress) reply = value;
          },
        },
      ],
      waitUntil: (value) => (work = value),
    });
    await work;
    if (reply?.error) throw Error(reply.error);
    return reply;
  };
  await rpc({ type: "FALLBACK_BACKGROUND", id, running: a });
  const job = await (
    await meta.match(origin + "__download_request_v1__")
  ).json();
  assert(job.wanted && job.foregroundOnly);
  assert.equal(job.state, "paused");
  assert.equal(await (await current.match(origin + "good.bin")).text(), good);
  assert.equal(await current.match(origin + "missing.bin"), undefined);
  assert.equal(await current.match(origin + "pending.bin"), undefined);
  assert.equal(
    (await (await meta.match(origin + "__app_status_state__")).json()).active,
    a,
  );
  await rpc({
    type: "PREPARE",
    release: next,
    save: true,
    requestDownload: true,
    mode: "update",
    downloadId: id,
    running: a,
  });
  const done = await (
      await meta.match(origin + "__download_request_v1__")
    ).json(),
    state = await (await meta.match(origin + "__app_status_state__")).json();
  assert.equal(done.state, "ready");
  assert.equal(done.wanted, false);
  assert.equal(state.active, a);
  assert.equal(state.pending, b);
  assert(
    !requested.includes("good.bin"),
    "verified native file must be reused",
  );
  for (const [path, body] of Object.entries(files))
    assert.equal(await (await current.match(origin + path)).text(), body);
  assert.equal(
    await (await older.match(origin + "index.html")).text(),
    "old complete course",
  );
  console.log(
    "PASS native abort handoff keeps consent, imports only verified responses, bounds unresolved records, resumes missing files, retains earlier complete course and stages a verified update",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
