# TALABA — O'zbek talabalari uchun platforma

**Live:** [talaba-zeta.vercel.app](https://talaba-zeta.vercel.app) · **Code:** [github.com/Jaloliddin-Kulmatov/talaba_new](https://github.com/Jaloliddin-Kulmatov/talaba_new)

A platform for students in Uzbekistan, in Uzbek (Latin): study tools that work without an account, a student community, jobs and internships, and a phone app.

## What's inside

- **Tools** (work offline, no account needed): timetable, GPA calculator, planner for tasks and exams, focus timer, attendance, skills, CV builder and job matching. Signed-in students get two-way sync between devices.
- **Community**: anonymous reviews, a market, lost and found, clubs, chat (questions and answers) and direct messages. Anyone can read; writing needs an account.
- **Jobs**: internships and jobs collected by a scraper, with real deadlines.
- **Guides**: daily life, universities, news.
- **Reminders**: push notifications for classes, exams and tasks (Asia/Tashkent time), worked out on the server from the synced timetable and planner.
- **Admin panel** and an installable PWA (offline support through a service worker).

## Stack

- **Website:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI. Deployed on Vercel.
- **Backend:** Flask + SQLAlchemy (Python 3.11), Web Push, scrapers. Deployed on Render.
- **Phone app:** Expo SDK 57 + Expo Router in `mobile/` (see [mobile/README.md](mobile/README.md)). It shares the tool logic in `src/lib/toolkit`.

## Layout

```
src/app/          pages (tools, community, jobs, guides, admin, auth)
src/components/   UI by area (tools, community, landing, layout, ui)
src/lib/toolkit/  pure, tested logic for the tools
backend/          Flask API (routes/*.py under /api), reminders, push, scrapers, tests
mobile/           Expo phone app
public/           service worker (sw.js), PWA manifest
promo/            promo videos
```

## Run it

```bash
npm ci && npm run dev            # Node 24
npx tsc --noEmit                 # typecheck
npm run test:logic               # tool, matching and service-worker tests
npm run build

cd backend && pip install -r requirements.txt && python run.py      # API on :5001
python tests/test_community.py && python tests/test_push.py
```

API and site URLs come from `src/lib/config.ts` (`API_BASE`, `SITE_URL`). On Vercel set `BACKEND_URL` (proxy) or `NEXT_PUBLIC_API_URL`.
