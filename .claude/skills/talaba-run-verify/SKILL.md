---
name: talaba-run-verify
description: Use to run, test and verify changes in the Talaba repo — typecheck, logic tests, backend tests, production build, and checking the real UI in a browser. Use before claiming any change works.
---

# Run & verify Talaba

Verify in this order; stop and fix at the first failure. Never report "done" from a typecheck alone.

1. `npx tsc --noEmit` (frontend types).
2. `npm run test:logic` — toolkit/matching/service-worker logic. Add a test here whenever you touch `src/lib/toolkit/*` or `public/sw.js`.
3. Backend (Python 3.11): `cd backend && python tests/test_community.py && python tests/test_push.py`. They use a temp SQLite DB and real JWTs.
   If you only have Python < 3.10, existing files use `X | None` annotations: test in a scratch copy with `from __future__ import annotations` prepended — never edit the repo for that.
4. `npm run build` — all routes must prerender.
5. Lint (no config in repo): see the one-liner in `CLAUDE.md`.
6. **Look at it in a browser.** `npm run dev` (port 3000) + backend on 5001 (`FRONTEND_URL` must match the dev origin for CORS).

## Backend for UI checks
Run the Flask app against a throw-away DB (`DATABASE_URL=sqlite:////tmp/x.db DISABLE_SCHEDULER=1 GROQ_API_KEY=`). Create users in an app context and mint a JWT with
`create_access_token(identity=str(user.id))`, then put it in `localStorage["talaba_token"]` in the browser. Never use real credentials.

## Browser tips
- Take the page text/accessibility tree first; screenshots lag by ~1 frame — wait a moment before capturing.
- If the browser pane is **hidden** (`document.visibilityState === "hidden"`) timers are throttled, `<video>` won't play, and `captureStream` records nothing.
  Use DOM `.click()`, `MessageChannel`-based sleeps, and offline rendering instead of real-time capture.
- Editing storage directly (`localStorage.setItem`) bypasses `useLocalStore`'s edit timestamps: it won't sync. Drive the real UI to test sync.
- Data seeding for demos: set the `talaba:<tool>:v1` keys then reload.

## Checklist before saying "done"
- [ ] typecheck, `test:logic`, backend tests, build all green (state any you could not run)
- [ ] the changed screen looked at in light **and** dark, and at phone width
- [ ] no new console errors; keyboard reachable; Uzbek copy reviewed
