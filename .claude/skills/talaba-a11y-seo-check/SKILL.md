---
name: talaba-a11y-seo-check
description: Use to audit or improve Talaba's accessibility (axe-core WCAG 2.1 AA), SEO metadata, social previews, and performance of pages. Includes a runnable axe audit snippet and the known gotchas.
---

# A11y / SEO / performance check

## Accessibility audit with axe-core (works in the in-app browser)
Run the dev server, open any page of the app, then execute (loads each page in a same-origin iframe, light + dark):
```js
const sleep = (ms) => new Promise(res => { const end = Date.now() + ms; const ch = new MessageChannel(); ch.port1.onmessage = () => (Date.now() >= end ? res() : ch.port2.postMessage(0)); ch.port2.postMessage(0); });
window.__axe = {}; window.__axeDone = false;
(async () => {
  const pages = ["/", "/tools", "/tools/timetable", "/jobs", "/market", "/login"];   // extend as needed
  const src = await (await fetch("https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js")).text();
  for (const theme of ["light", "dark"]) for (const path of pages) {
    localStorage.setItem("talaba-theme", theme);
    const f = document.createElement("iframe"); f.style.cssText = "position:fixed;left:-10000px;width:1280px;height:900px;border:0"; document.body.appendChild(f);
    await new Promise(r => { f.onload = r; f.src = path; }); await sleep(2500);
    f.contentWindow.eval(src);
    const r = await f.contentWindow.axe.run(f.contentDocument, { runOnly: { type: "tag", values: ["wcag2a","wcag2aa","wcag21a","wcag21aa","best-practice"] }, resultTypes: ["violations"] });
    window.__axe[theme + " " + path] = r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0].target.join(" ") }));
    f.remove();
  }
  window.__axeDone = true;
})();
```
Poll `window.__axeDone` (tool calls time out at ~45 s; the script keeps running). Use `MessageChannel` sleeps — plain `setTimeout` is throttled in a hidden pane. Group results by rule; fix **causes** (a token or shared component), not single nodes.

## Known gotchas (all previously fixed — don't reintroduce)
- `viewport` must not set `maximumScale`/`userScalable=no`.
- Muted text token ≥ 4.5:1 on tinted surfaces; no `text-*/50..80` opacity text.
- Icon-only buttons without `aria-label` (sidebar toggle). `<aside>`/`<nav>` need unique `aria-label`s.
- Heading order: `EmptyState` titles are `h2`; pages start with one `h1`. Every page needs one `<main>` (auth pages wrap in `<main>`).
- Links inside paragraphs need an underline (not colour alone).
- Skip link (`SkipLink`) is in the root layout.

## SEO
- Client pages can't export `metadata` → add a `layout.tsx` in the route folder with `metadata` (title, Uzbek description, `alternates.canonical`). Private areas (`dashboard`, `admin`, `onboarding`) are `noindex`.
- Root layout sets OG/Twitter (`/og.png`, 1200×630) and Organization JSON-LD; `/tools` has an ItemList JSON-LD. Add new public routes to `src/app/sitemap.ts` — and only routes that exist.
- `robots.ts` disallows `/dashboard/ /admin/ /onboarding/ /api/`.

## Performance
- Heavy widgets load lazily (`components/layout/lazy-widgets.tsx`); fonts come from `next/font` only (no CSS `@import`); give `<img>` explicit `width/height`.
- Compare the `First Load JS` column of `npm run build` before/after changes; shared baseline ≈ 87 kB.
