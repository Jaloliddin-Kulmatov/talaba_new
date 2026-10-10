---
name: talaba-add-tool
description: Use when adding a new local-first student tool (like timetable, GPA, planner, focus, attendance, skills, CV) to Talaba — the full checklist so it shows up in the hub, nav, landing, sitemap and syncs.
---

# Add a local-first tool

A "tool" works without an account, saves on the device, and (when signed in) syncs. Follow every step — missing one leaves a half-integrated feature.

1. **Logic** `src/lib/toolkit/<id>.ts` — pure functions + types + `export const <ID>_KEY = "talaba:<id>:v1"` + an `EMPTY_<ID>` constant (a *stable reference*: `useLocalStore` needs it). No React, no `Date.now()` inside logic (pass `now`).
2. **Tests** in `tests/toolkit.test.cjs`; add the file to `include` in `tsconfig.test.json`. Cover edge cases (empty, malformed, boundaries). Run `npm run test:logic`.
3. **UI** `src/components/tools/<id>-app.tsx` ("use client"). Pattern: `const hydrated = useHydrated(); const [data, setData] = useLocalStore(KEY, EMPTY)`; render skeletons until hydrated. Use `ToolHeader`, `Panel`, `EmptyState`, `Dialog`, `Field`, `NumInput`, `Segmented` from `components/tools/ui.tsx`. All edits via `setData(prev => ...)`.
4. **Route** `src/app/tools/<id>/page.tsx` — server component: `export const metadata` (Uzbek title/description/canonical) wrapping `<ToolsShell><XApp/></ToolsShell>`.
5. **Registry** `src/lib/toolkit/tools.ts` — add to the `id` union and `TOOLS` (icon from lucide-react — check it exists in the installed version; gradient + tint as **full** Tailwind strings).
6. **Hub line** `src/components/tools/tools-hub.tsx` `liveLine()` — add a `case` (the switch is exhaustive; TypeScript will complain otherwise). Extend `useToolkitSummary` (`lib/toolkit/summary.ts`) if the line needs data.
7. **Landing** `src/components/landing/toolkit-section.tsx` — add entries to `PREVIEW`, `LAYOUT` (and `order` if it should be on the landing page).
8. **Sitemap** `src/app/sitemap.ts`.
9. **Sync** — add the key to `SYNC_KEYS` in `src/lib/store.ts` **and** `backend/routes/sync.py`, plus a label in `components/tools/sync-card.tsx`. Add a line to the backend sync test.
10. **Backup** works automatically (all `talaba:*` keys except sync bookkeeping).
11. Verify with the `talaba-run-verify` skill; check light/dark/phone and keyboard use.
