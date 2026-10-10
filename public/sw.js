// TALABA service worker — installable PWA, offline access to pages the student has already opened
// (the timetable matters most: it must open on a bad connection) and Web Push reminders.
//
// Strategy
//  - Pages (navigations):      network-first, fall back to the cached copy, then /offline.html
//  - /_next/static/* (hashed): cache-first — file names change with content, so they never go stale
//  - Other same-origin GETs:   stale-while-revalidate
//  - API calls / cross-origin: never touched
const VERSION = "talaba-v2";
const PRECACHE = ["/offline.html", "/manifest.json", "/logo.svg", "/favicon.svg", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

// Dev server chunks are not content-hashed, so caching them would serve stale code.
const IS_DEV = ["localhost", "127.0.0.1", "[::1]"].includes(self.location.hostname);

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const put = (req, res) => {
  if (!res || !res.ok || res.type === "opaque") return;
  const copy = res.clone();
  caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
};

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (IS_DEV || req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api")) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => { put(req, res); return res; })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/offline.html"))),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => { put(req, res); return res; })),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => { put(req, res); return res; }).catch(() => hit);
      return hit || net;
    }),
  );
});

// ── Web Push: class / exam / task reminders sent by the server ──────────────
// Only same-site paths are honoured as the click target, so a push can never send a student off-site.
const safePath = (u) => (typeof u === "string" && u.startsWith("/") && !u.startsWith("//") ? u : "/dashboard");

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; }
  catch (_) { try { d = { body: e.data.text() }; } catch (__) { d = {}; } }
  const title = typeof d.title === "string" && d.title ? d.title.slice(0, 120) : "TALABA";
  e.waitUntil(
    self.registration.showNotification(title, {
      body: typeof d.body === "string" ? d.body.slice(0, 240) : "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      lang: "uz",
      tag: typeof d.tag === "string" ? d.tag.slice(0, 160) : undefined,
      data: { url: safePath(d.url) },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(safePath(e.notification.data && e.notification.data.url), self.location.origin).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const mine = wins.find((c) => new URL(c.url).origin === self.location.origin);
      if (mine) return mine.focus().then(() => ("navigate" in mine ? mine.navigate(url) : undefined));
      return self.clients.openWindow(url);
    }),
  );
});
