---
name: talaba-deploy-checklist
description: Use before deploying Talaba or setting up a new environment — env vars for frontend and backend, one-time setup (admin, VAPID keys), DNS/hosting notes, smoke tests, and known caveats.
---

# Deploy checklist

## Frontend (Next.js — e.g. Vercel)
`NEXT_PUBLIC_API_URL` (backend `/api` base, e.g. `https://api.talaba.uz/api`), `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (optional; Google sign-in). Domain `talaba.uz` (metadata assumes it).

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
