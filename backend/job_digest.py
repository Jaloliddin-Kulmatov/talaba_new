"""Daily e-mail with new internships / part-time jobs for students who switched alerts on.

Sent at 10:00 Tashkent time (05:00 UTC). A user is *claimed* (job_digest_at set, committed) before the
e-mail goes out, so two workers can never send the same digest; a failed send releases the claim.
"""
import html
import os
from datetime import datetime, timedelta

WINDOW_HOURS = 26      # a little over a day so a missed run never loses a job
MAX_JOBS = 6
RESEND_AFTER_HOURS = 20


def unsubscribe_token(secret, user_id):
    from itsdangerous import URLSafeSerializer
    return URLSafeSerializer(secret, salt="job-alerts").dumps(int(user_id))


def read_unsubscribe_token(secret, token):
    """User id from a token, or None if it is forged/garbled."""
    from itsdangerous import BadSignature, URLSafeSerializer
    try:
        v = URLSafeSerializer(secret, salt="job-alerts").loads(token)
        return int(v)
    except (BadSignature, ValueError, TypeError):
        return None


def matches(job, user):
    """A job fits a student when it is in their region, remote, or the student has not set a region."""
    region = (user.region or "").strip().lower()
    if not region:
        return True
    where = (job.location or "").strip().lower()
    return not where or region in where or where in region or "masofaviy" in where or "remote" in where


def pick_jobs(jobs, user):
    return [j for j in jobs if matches(j, user)][:MAX_JOBS]


def render(user, jobs, frontend_url, unsubscribe_url):
    esc = html.escape
    first = esc((user.name or "Talaba").split(" ")[0])
    rows_html = "".join(
        f'<li style="margin:0 0 12px"><a href="{esc(frontend_url)}/jobs/{j.id}" style="color:#1d4ed8;font-weight:600;text-decoration:none">'
        f'{esc(j.title)}</a><br><span style="color:#475569">{esc(j.company)}'
        f'{" · " + esc(j.location) if j.location else ""}{" · " + esc(j.salary) if j.salary else ""}</span></li>'
        for j in jobs
    )
    body = (
        f'<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a">'
        f'<h2 style="margin:0 0 4px">Salom, {first}!</h2>'
        f'<p style="color:#475569;margin:0 0 16px">Oxirgi kunda {len(jobs)} ta yangi ish e\'loni qo\'shildi:</p>'
        f'<ul style="padding-left:18px">{rows_html}</ul>'
        f'<p><a href="{esc(frontend_url)}/jobs" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">Barcha ishlarni ko\'rish</a></p>'
        f'<p style="font-size:12px;color:#64748b;margin-top:24px">Bu xatni TALABA\'da ish xabarnomalarini yoqqaningiz uchun oldingiz. '
        f'<a href="{esc(unsubscribe_url)}" style="color:#64748b">Xabarnomani o\'chirish</a></p></div>'
    )
    text = "\n".join(f"- {j.title} — {j.company}" for j in jobs) + f"\n\nBarchasi: {frontend_url}/jobs\nO'chirish: {unsubscribe_url}"
    return f"Yangi ishlar: {jobs[0].title} va yana {len(jobs) - 1} ta" if len(jobs) > 1 else f"Yangi ish: {jobs[0].title}", body, text


def send_job_digests(flask_app, utc_now=None, sender=None):
    """Returns how many e-mails were sent. `sender(to, subject, html, text) -> bool` is injectable for tests."""
    from app import db
    from models import Job, User
    if sender is None:
        from routes.ambassador import _send_email as sender

    now = utc_now or datetime.utcnow()
    sent = 0
    with flask_app.app_context():
        frontend = os.environ.get("FRONTEND_URL", "http://localhost:3000").split(",")[0].strip().rstrip("/")
        api_public = os.environ.get("PUBLIC_API_URL", "").strip().rstrip("/")
        secret = flask_app.config["SECRET_KEY"]
        jobs = (Job.query.filter(Job.is_active.is_(True), Job.created_at >= now - timedelta(hours=WINDOW_HOURS))
                .order_by(Job.created_at.desc()).all())
        if not jobs:
            return 0
        users = User.query.filter(User.job_alerts_enabled.is_(True)).all()
        for u in users:
            if u.job_digest_at and u.job_digest_at > now - timedelta(hours=RESEND_AFTER_HOURS):
                continue
            mine = pick_jobs(jobs, u)
            if not mine or not u.email:
                continue
            previous, u.job_digest_at = u.job_digest_at, now
            db.session.commit()                      # claim
            unsub = (f"{api_public}/api/alerts/unsubscribe?token={unsubscribe_token(secret, u.id)}"
                     if api_public else f"{frontend}/dashboard/settings")
            subject, body, text = render(u, mine, frontend, unsub)
            ok = False
            try:
                ok = bool(sender(u.email, subject, body, text))
            except Exception as e:
                print(f"[digest] send failed for user {u.id}: {e}")
            if ok:
                sent += 1
            else:
                u.job_digest_at = previous           # release the claim: try again tomorrow
                db.session.commit()
    return sent
