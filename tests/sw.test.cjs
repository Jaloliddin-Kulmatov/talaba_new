// Service worker tests (caching strategy, offline fallback, Web Push). Run: npm run test:logic
const assert = require("assert"), fs = require("fs"), vm = require("vm");
const src = fs.readFileSync(process.argv[2] || require("path").join(__dirname, "..", "public", "sw.js"), "utf8");

function run(hostname = "talaba.uz") {
  const store = new Map();            // Cache storage: cacheName -> Map(url -> Response-like)
  let online = true; const netLog = [];
  const mkRes = (body, ok = true, type = "basic") => ({ body, ok, type, clone() { return mkRes(body, ok, type); } });
  const handlers = {};
  const cacheApi = {
    open: async (n) => { if (!store.has(n)) store.set(n, new Map()); const m = store.get(n); return { addAll: async (u) => u.forEach(x => m.set("https://talaba.uz" + x, mkRes("precached:" + x))), put: async (r, res) => { m.set(r.url, res); }, }; },
    match: async (req) => { const url = typeof req === "string" ? "https://talaba.uz" + req : req.url; for (const m of store.values()) if (m.has(url)) return m.get(url); },
    keys: async () => [...store.keys()], delete: async (k) => store.delete(k),
  };
  const notes = [], opened = [], clientsState = { list: [] };
  const ctx = { self: { location: { hostname, origin: "https://talaba.uz" }, addEventListener: (t, f) => (handlers[t] = f), skipWaiting() {}, registration: { showNotification: async (title, opts) => { notes.push({ title, opts }); } }, clients: { claim() {}, matchAll: async () => clientsState.list, openWindow: async (u) => { opened.push(u); } } },
    caches: cacheApi, URL, Promise, console,
    fetch: async (req) => { netLog.push(req.url); if (!online) throw new TypeError("Failed to fetch"); if (req.url.includes("/broken")) return mkRes("err", false); return mkRes("net:" + req.url); } };
  vm.createContext(ctx); vm.runInContext(src, ctx);
  const req = (path, mode = "cors", method = "GET", origin = "https://talaba.uz") => ({ url: origin + path, method, mode });
  const fetchEvt = async (r) => { let p; handlers.fetch({ request: r, respondWith: (x) => (p = x) }); if (!p) return "PASSTHROUGH"; return (await p); };
  const tick = () => new Promise(r => setTimeout(r, 5));
  return { handlers, store, netLog, req, fetchEvt, tick, setOnline: (v) => (online = v), mkRes, notes, opened, clientsState };
}
const ok = async (n, f) => { await f(); console.log("  ✓", n); };
(async () => {
  const t = run();
  await ok("install precaches the offline page", async () => { let p; t.handlers.install({ waitUntil: (x) => (p = x) }); await p; assert(t.store.get("talaba-v2").has("https://talaba.uz/offline.html")); });
  await ok("activate deletes the old ICOM cache", async () => { t.store.set("icom-v1", new Map([["x", 1]])); let p; t.handlers.activate({ waitUntil: (x) => (p = x) }); await p; assert(!t.store.has("icom-v1") && t.store.has("talaba-v2")); });
  await ok("online navigation → network, and copy cached", async () => { const r = await t.fetchEvt(t.req("/tools/timetable", "navigate")); assert.equal(r.body, "net:https://talaba.uz/tools/timetable"); await t.tick(); assert(t.store.get("talaba-v2").has("https://talaba.uz/tools/timetable")); });
  await ok("OFFLINE navigation to a visited page → cached copy", async () => { t.setOnline(false); const r = await t.fetchEvt(t.req("/tools/timetable", "navigate")); assert.equal(r.body, "net:https://talaba.uz/tools/timetable"); });
  await ok("OFFLINE navigation to an unvisited page → /offline.html", async () => { const r = await t.fetchEvt(t.req("/jobs", "navigate")); assert.equal(r.body, "precached:/offline.html"); });
  await ok("page is network-first: a deploy is picked up when online", async () => { t.setOnline(true); const before = t.netLog.length; await t.fetchEvt(t.req("/tools/timetable", "navigate")); assert.equal(t.netLog.length, before + 1); });
  await ok("hashed _next/static is cache-first (no network on 2nd hit)", async () => { await t.fetchEvt(t.req("/_next/static/chunks/a-123.js")); await t.tick(); const n = t.netLog.length; const r = await t.fetchEvt(t.req("/_next/static/chunks/a-123.js")); assert.equal(t.netLog.length, n); assert(r.body.startsWith("net:")); });
  await ok("API paths, POSTs and cross-origin are never intercepted", async () => { assert.equal(await t.fetchEvt(t.req("/api/x")), "PASSTHROUGH"); assert.equal(await t.fetchEvt(t.req("/tools/gpa", "navigate", "POST")), "PASSTHROUGH"); assert.equal(await t.fetchEvt(t.req("/ai/chat", "cors", "GET", "https://backend.example.com")), "PASSTHROUGH"); });
  await ok("failed (non-ok) responses are not cached", async () => { const r = await t.fetchEvt(t.req("/broken", "navigate")); assert.equal(r.ok, false); await t.tick(); assert(!t.store.get("talaba-v2").has("https://talaba.uz/broken")); });

  // ── Web Push ──
  const p = run(); const dispatchPush = async (data) => { let wait; p.handlers.push({ data, waitUntil: (x) => (wait = x) }); await wait; };
  const jsonData = (o) => ({ json: () => o, text: () => JSON.stringify(o) });
  await ok("push: shows a notification with title, body, tag and icon", async () => {
    await dispatchPush(jsonData({ title: "Algebra — 10 daqiqadan keyin", body: "08:30 · 204-xona", tag: "class:c1:2026-10-07", url: "/tools/timetable" }));
    const n = p.notes.pop(); assert.equal(n.title, "Algebra — 10 daqiqadan keyin"); assert.equal(n.opts.body, "08:30 · 204-xona"); assert.equal(n.opts.tag, "class:c1:2026-10-07"); assert.equal(n.opts.icon, "/icon-192.png"); assert.equal(n.opts.lang, "uz"); assert.equal(n.opts.data.url, "/tools/timetable");
  });
  await ok("push: an off-site or protocol-relative url can never become the click target", async () => {
    for (const u of ["https://evil.com/phish", "//evil.com", "javascript:alert(1)", "http://talaba.uz.evil.com", 42, null]) { await dispatchPush(jsonData({ title: "x", url: u })); assert.equal(p.notes.pop().opts.data.url, "/dashboard", String(u)); }
  });
  await ok("push: empty payload still shows a generic notification", async () => { await dispatchPush(null); const n = p.notes.pop(); assert.equal(n.title, "TALABA"); });
  await ok("push: a non-JSON body is shown as plain text", async () => { await dispatchPush({ json: () => { throw new Error("bad json"); }, text: () => "Oddiy matn" }); const n = p.notes.pop(); assert.equal(n.opts.body, "Oddiy matn"); });
  await ok("push: oversized title/body are truncated", async () => { await dispatchPush(jsonData({ title: "T".repeat(500), body: "B".repeat(2000), tag: "t".repeat(500) })); const n = p.notes.pop(); assert.equal(n.title.length, 120); assert.equal(n.opts.body.length, 240); assert.equal(n.opts.tag.length, 160); });
  await ok("push: wrong types for fields are ignored, not thrown", async () => { await dispatchPush(jsonData({ title: { a: 1 }, body: [1], tag: 5 })); const n = p.notes.pop(); assert.equal(n.title, "TALABA"); assert.equal(n.opts.body, ""); assert.equal(n.opts.tag, undefined); });
  const click = async (url) => { let closed = false, wait; p.handlers.notificationclick({ notification: { close: () => (closed = true), data: { url } }, waitUntil: (x) => (wait = x) }); await wait; return closed; };
  await ok("click: closes the notification and opens the app when no window exists", async () => { p.clientsState.list = []; p.opened.length = 0; assert(await click("/tools/planner")); assert.deepEqual(p.opened, ["https://talaba.uz/tools/planner"]); });
  await ok("click: focuses and navigates an existing app window instead of opening another", async () => {
    const calls = []; p.clientsState.list = [{ url: "https://talaba.uz/dashboard", focus: async () => calls.push("focus"), navigate: async (u) => calls.push("nav:" + u) }]; p.opened.length = 0;
    await click("/tools/timetable"); assert.deepEqual(calls, ["focus", "nav:https://talaba.uz/tools/timetable"]); assert.equal(p.opened.length, 0);
  });
  await ok("click: windows of other origins are never reused", async () => { const calls = []; p.clientsState.list = [{ url: "https://evil.com/", focus: async () => calls.push("focus"), navigate: async () => calls.push("nav") }]; p.opened.length = 0; await click("/tools"); assert.equal(calls.length, 0); assert.equal(p.opened.length, 1); });
  await ok("click: a tampered url in the notification data falls back to the dashboard", async () => { p.clientsState.list = []; p.opened.length = 0; await click("https://evil.com"); assert.deepEqual(p.opened, ["https://talaba.uz/dashboard"]); });
  const dev = run("localhost");

  await ok("dev (localhost) is never intercepted", async () => { assert.equal(await dev.fetchEvt(dev.req("/tools/timetable", "navigate")), "PASSTHROUGH"); });
  console.log("\nservice worker: all passed");
})().catch(e => { console.error("FAIL", e); process.exit(1); });
