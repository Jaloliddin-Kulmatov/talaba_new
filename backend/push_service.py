"""Sending Web Push reminders. The scheduler calls send_due_reminders() every minute."""
import json
import os
from datetime import datetime, timedelta
from urllib.parse import urlparse

from sqlalchemy.exc import IntegrityError

from reminders import due_reminders, local_now

# The server POSTs to whatever endpoint a client registers, so only the real browser push
# services are allowed — otherwise a malicious "subscription" could aim requests at internal hosts.
ALLOWED_HOST_SUFFIXES = (
    "fcm.googleapis.com",          # Chrome, Edge, Android
    "push.services.mozilla.com",   # Firefox
    "web.push.apple.com",          # Safari / iOS home-screen apps
    "push.apple.com",
    "notify.windows.com",          # Windows / legacy Edge
)
FAIL_LIMIT = 5


def endpoint_ok(url):
    try:
        p = urlparse(url)
        host = (p.hostname or "").lower()
        port = p.port
    except ValueError:
        return False
    if p.scheme != "https" or port not in (None, 443) or p.username or p.password:
        return False
    return any(host == s or host.endswith("." + s) for s in ALLOWED_HOST_SUFFIXES)


def vapid_configured():
    return bool(os.environ.get("VAPID_PUBLIC_KEY") and os.environ.get("VAPID_PRIVATE_KEY"))


def _vapid():
    from py_vapid import Vapid
    # from_raw() takes the key still base64url-encoded and decodes it itself —
    # decoding it here first silently derives a different key and every push is rejected.
    return Vapid.from_raw(os.environ["VAPID_PRIVATE_KEY"].strip().encode())


class PushGone(Exception):
    """The browser says this subscription no longer exists (HTTP 404/410)."""


def send_push(sub, payload):
    """Encrypt and deliver one notification. Raises PushGone for dead subscriptions."""
    from pywebpush import WebPushException, webpush
    try:
        webpush(
            subscription_info={"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}},
            data=json.dumps(payload, ensure_ascii=False),
            vapid_private_key=_vapid(),
            vapid_claims={"sub": os.environ.get("VAPID_SUBJECT", "mailto:admin@talaba.uz")},
            ttl=600,   # a class reminder is useless after ten minutes
            timeout=10,
        )
    except WebPushException as e:
        status = getattr(getattr(e, "response", None), "status_code", None)
        if status in (404, 410):
            raise PushGone() from e
        raise


def _forget(db, sub):
    from models import SentReminder
    SentReminder.query.filter_by(subscription_id=sub.id).delete(synchronize_session=False)
    db.session.delete(sub)


def send_due_reminders(flask_app, utc_now=None, sender=send_push):
    """Send every reminder that is due and not yet sent. Returns how many were sent.

    A reminder is *claimed* (row inserted, committed) before it is sent, so two workers running
    this at the same moment can never both send it; a failed send releases the claim for a retry.
    """
    from app import db
    from models import PushSubscription, SentReminder, UserSync

    sent = 0
    with flask_app.app_context():
        now_l = local_now(utc_now)
        subs = PushSubscription.query.all()
        data_by_user = {}
        for sub in subs:
            if sub.user_id not in data_by_user:
                row = UserSync.query.filter_by(user_id=sub.user_id).first()
                data_by_user[sub.user_id] = (row.data if row else None) or {}
            for item in due_reminders(data_by_user[sub.user_id], now_l, sub.prefs):
                claim = SentReminder(subscription_id=sub.id, key=item["key"][:160])
                db.session.add(claim)
                try:
                    db.session.commit()
                except IntegrityError:
                    db.session.rollback()       # already sent (or another worker has it)
                    continue
                try:
                    sender(sub, {"title": item["title"], "body": item["body"], "url": item["url"], "tag": item["key"]})
                except PushGone:
                    _forget(db, sub)
                    db.session.commit()
                    break
                except Exception as e:           # transient failure: release the claim, count it
                    db.session.delete(claim)
                    sub.failures = (sub.failures or 0) + 1
                    if sub.failures >= FAIL_LIMIT:
                        _forget(db, sub)
                        db.session.commit()
                        break
                    db.session.commit()
                    print(f"[push] send failed for subscription {sub.id}: {e}")
                    continue
                if sub.failures:
                    sub.failures = 0
                db.session.commit()
                sent += 1
        # the dedupe log only needs to outlive the longest reminder window
        SentReminder.query.filter(SentReminder.sent_at < datetime.utcnow() - timedelta(days=3)).delete(synchronize_session=False)
        db.session.commit()
    return sent
