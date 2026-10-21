# TALABA — O'zbek talabalari uchun platforma

Next.js 14 (App Router, TypeScript, Tailwind) frontend + Flask/SQLAlchemy backend. UI language is **Uzbek (Latin)**.
Live domain: `talaba.uz`. Repo started as a fork of "ICOM" (a Korea-focused app) — if you find "ICOM", "Korea" or `icon_*` keys, that is leftover and a bug.

## Map
- `src/app/` routes. `src/components/{tools,community,landing,layout,ui,...}`. `src/lib/` helpers.
- `src/lib/toolkit/` **pure, tested logic** for the local-first tools (timetable, GPA, planner, focus, attendance, skills, CV, job matching).
- `src/lib/store.ts` localStorage store (`useLocalStore`) + backup/restore; `src/lib/sync.ts` account sync.
- `backend/` Flask: `models.py`, `routes/*.py` (blueprints registered in `app.py` under `/api/...`), `reminders.py` + `push_service.py` (Web Push), `tests/`.
- `mobile/` Expo (SDK 57) phone app — own `package.json`, see `mobile/README.md`; shares `src/lib/toolkit`, `events.ts`, `guide-topics.ts` as `@shared/...`. Typecheck: `cd mobile && npx tsc --noEmit`.
- `public/sw.js` service worker (offline + push). `public/manifest.json` PWA. `promo/` promo videos.

## How the product works
- **Tools work without an account**; data lives in the browser (`talaba:<tool>:v1` keys). Signed-in students get automatic
  two-way sync (last-write-wins per key). Anything stored per-device goes through `useLocalStore` — never raw `localStorage`
  (raw writes skip the edit timestamp, so they never sync).
- Community pages (reviews, market, lost & found) are public to read, need an account to write; contact details are only
  returned to signed-in users; reviews are anonymous.
- Reminders (class/exam/task push) are computed on the server from the synced timetable/planner (Asia/Tashkent, UTC+5).

## Commands
```bash
npm ci && npm run dev            # needs Node 24 (.nvmrc; Vercel dropped 20.x)
npx tsc --noEmit                 # typecheck — must stay clean
npm run test:logic               # toolkit + matching + service-worker tests (no extra deps)
npm run build
cd backend && python tests/test_community.py && python tests/test_push.py   # Python 3.11, temp SQLite DB
```
There is no ESLint config in the repo. To lint with the standard rules:
`echo '{"extends":"next/core-web-vitals","rules":{"react/no-unescaped-entities":"off","@next/next/no-img-element":"off"}}' > .eslintrc.json && npx eslint src --ext .ts,.tsx; rm .eslintrc.json`

## Rules that have bitten us
1. **Uzbek copy only** in UI (see `talaba-uzbek-copy` skill). No invented statistics or testimonials.
2. **Tailwind `content` must include every folder that holds class names** (`src/lib` was missing once → colours silently absent). Use full class strings, never `` `bg-${c}-500` ``.
3. **Dark and light must both work.** No raw `bg-white/5`, `text-white/60`, or hex backgrounds in components; use tokens (`bg-card`, `border-border`, `text-muted-foreground`).
4. **Contrast ≥ 4.5:1**: don't fade text with `/50`–`/80` opacity; status text uses the 700 shade (`text-emerald-700`) in light mode.
5. **Auth token key is `talaba_token`.** (`icon_token` was a fork leftover that broke the admin panel.)
6. New synced data keys must be added in **both** `src/lib/store.ts` (`SYNC_KEYS`) and `backend/routes/sync.py` (`SYNC_KEYS`).
7. Anything that deletes a user must be added to `delete_me` in `backend/routes/auth.py`.
8. Backend targets Python 3.11 (`runtime.txt`); `requirements-render.txt` is stale — `requirements.txt` is the source of truth.
9. API/site URLs come from `src/lib/config.ts` (`API_BASE`, `SITE_URL`) — see the deploy skill for the Vercel env vars (`BACKEND_URL` proxy vs `NEXT_PUBLIC_API_URL`).
10. The repo lives in iCloud Drive: `node_modules`/`.next` there sync slowly. Prefer building from a copy outside iCloud.

## Skills (in `.Codex/skills/`)
`talaba-run-verify` · `talaba-add-tool` · `talaba-backend-feature` · `talaba-uzbek-copy` · `talaba-design-system` ·
`talaba-a11y-seo-check` · `talaba-promo-video` · `talaba-deploy-checklist`
