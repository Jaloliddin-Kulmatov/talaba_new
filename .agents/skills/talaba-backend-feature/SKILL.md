---
name: talaba-backend-feature
description: Use when adding or changing Flask backend features in Talaba — models, blueprints, validation, privacy rules, caps, moderation, account deletion, and tests.
---

# Backend feature conventions

- **Models** go in `backend/models.py` (new tables are created by `db.create_all()` at boot; altering an existing table needs an entry in `_run_lightweight_migrations()` in `app.py`).
- **Routes**: one blueprint per feature in `backend/routes/<feature>.py`, registered in `app.py` as `url_prefix="/api/<feature>"`. JSON in/out, Uzbek error messages.
- **Use `routes/_common.py`**: `require_user()` (auth), `is_admin`, `clean(value, max_len, min_len)`, `int_in(...)`, `norm_key`, `like()` (escapes `%`/`_`), `paging`, `report()` (3 distinct reports auto-hide).
- **Validate everything** (type, length, range). Reject booleans where ints are expected. Never trust client-supplied URLs (push endpoints are allow-listed — SSRF).
- **Privacy**: contact details only to signed-in users; reviews anonymous (author id never serialised); sellers by first name only.
- **Abuse limits**: per-user caps on active content; owner-or-admin for edit/delete; hidden items can't be re-published by the owner.
- **Account deletion**: add your tables to `delete_me` in `routes/auth.py` (FK constraints + privacy).
- **Concurrency**: when two requests can race (sync merge, reminder dedupe) lock the row (`with_for_update()`) or *claim before acting* with a unique constraint.
- **Admin**: `routes/moderation.py` is admin-only; new moderated kinds go in its `KINDS` map.
- **Tests** in `backend/tests/` (temp SQLite, real JWT). Test the *negative* paths: anonymous, other user, bad types, oversize, wildcard search, duplicate submit.
- Target **Python 3.11**. Secrets only via env vars (see `talaba-deploy-checklist`). Don't commit `.db` files.
