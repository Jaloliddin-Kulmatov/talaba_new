---
name: talaba-deploy-checklist
description: Use before deploying Talaba or setting up a new environment — env vars for frontend and backend, one-time setup (admin, VAPID keys), DNS/hosting notes, smoke tests, and known caveats.
---

# Deploy checklist

## Frontend (Next.js on Vercel)
Import the repo in Vercel (framework Next.js is auto-detected; `vercel.json`, `engines.node` 20.x and `.env.example` are already in the repo). Then set env vars, **one backend mode**:
- **Proxy (recommended):** `BACKEND_URL=https://<backend-origin>` — the browser calls same-origin `/api/...` and `next.config.mjs` forwards it. No CORS, works on preview URLs. Leave `NEXT_PUBLIC_API_URL` unset.
- **Direct:** `NEXT_PUBLIC_API_URL=https://<backend-origin>/api`, and put the site origin(s) in the backend's `FRONTEND_URL` (comma-separated list allowed).
Optional: `NEXT_PUBLIC_SITE_URL` (canonical origin for sitemap/robots/OG, default `https://talaba.uz`), `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (add the site origin in the Google OAuth client).
`NEXT_PUBLIC_*` and `BACKEND_URL` are read at **build** time → change one, redeploy. All API/site URLs come from `src/lib/config.ts` — never write `process.env.NEXT_PUBLIC_API_URL || "http://localhost…"` in a component.
Vercel hosts only the frontend: the Flask backend (Postgres, scheduler, push) needs its own host (Render/Railway/Fly/VPS).
After the first deploy: `/sw.js` must answer `Cache-Control: no-cache` (set in `next.config.mjs`), `/robots.txt` and `/sitemap.xml` must show your domain.

## Backend (Flask — Procfile `gunicorn app:app`, Python 3.11, install from `requirements.txt`)
Required: `SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL` (Postgres; `postgres://` is auto-fixed), `FRONTEND_URL` (exact frontend origin — CORS).
Optional: `GROQ_API_KEY` (AI chat/translation), `ADMIN_SECRET` (+ `/api/admin/bootstrap`), `ADMIN_EMAIL`, `SCRAPER_SECRET`, `HH_UZ_QUERY`, `HH_UZ_TRANSLATE_MODEL`,
email: `RESEND_API_KEY`/`RESEND_FROM` or `SMTP_HOST`/`SMTP_PORT`/`SENDER_EMAIL`/`SENDER_PASSWORD`, `ABSTRACT_EMAIL_API_KEY` (email validation),
push reminders: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (generate **once**: `python backend/make_vapid_keys.py`; rotating them kills every subscription).
`DISABLE_SCHEDULER=1` on all but one process if you run several workers/instances (scraper + reminder jobs).

## One-time setup
- Make an admin: `python backend/make_admin.py you@example.com`.
- New tables are created automatically on boot; column changes on existing tables need `_run_lightweight_migrations()` in `app.py`.

## Smoke test after deploy
Register/login → add a class → open `/tools` on a second device (sync) → post a market item → report it 3× from other accounts (auto-hide) → `/admin/moderation` as admin →
turn on reminders and press "Sinov" → open the site offline after one visit → run `npm run build` output check, `/sitemap.xml`, `/robots.txt`, share link preview (`/og.png`).

## Caveats to resolve before announcing
- Seeded jobs in `backend/talaba_jobs.py` are **illustrative placeholders** (their own docstring says so): replace with real listings before presenting as live.
- Landing page numbers/testimonials in `src/lib/constants.ts` / `testimonials-section.tsx` must be real.
- `backend/requirements-render.txt` is stale (missing APScheduler, requests, pywebpush) — use `requirements.txt`.
- Web Push needs HTTPS; iOS only works for home-screen installed apps. Delivery can't be tested without real devices.
