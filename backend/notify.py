"""Fan one notification out to everything a user has registered: browsers (Web Push) and phones (Expo push).

Never raises and never blocks the request that triggered it — delivery runs in a daemon thread.
"""
import threading

import requests

EXPO_URL = "https://exp.host/--/api/v2/push/send"


def _deliver(flask_app, user_id, title, body, url, tag, kind):
    from app import db
    from models import DeviceToken, PushSubscription
    from push_service import PushGone, send_push, vapid_configured

    with flask_app.app_context():
        try:
            payload = {"title": title[:80], "body": body[:160], "url": url, "tag": tag}
            if vapid_configured():
                for sub in PushSubscription.query.filter_by(user_id=user_id).all():
                    if (sub.prefs or {}).get(kind, True) is False:
                        continue
                    try:
                        send_push(sub, payload)
                    except PushGone:
                        db.session.delete(sub)
                        db.session.commit()
                    except Exception as e:
                        print(f"[notify] web push failed: {e}")
            tokens = [t.token for t in DeviceToken.query.filter_by(user_id=user_id).all()]
            if tokens:
                msgs = [{"to": t, "title": payload["title"], "body": payload["body"], "sound": "default",
                         "data": {"url": url}} for t in tokens]
                try:
                    r = requests.post(EXPO_URL, json=msgs, timeout=10)
                    for tok, res in zip(tokens, (r.json().get("data") or []) if r.ok else []):
                        if res.get("status") == "error" and (res.get("details") or {}).get("error") == "DeviceNotRegistered":
                            DeviceToken.query.filter_by(token=tok).delete()
                    db.session.commit()
                except Exception as e:
                    print(f"[notify] expo push failed: {e}")
        except Exception as e:
            print(f"[notify] failed: {e}")


def notify_user(user_id, title, body, url="/", tag=None, kind="messages"):
    """Fire-and-forget. `kind` lets a subscription opt out ("messages", "answers", ...)."""
    from flask import current_app
    app = current_app._get_current_object()
    threading.Thread(target=_deliver, args=(app, user_id, title, body, url, tag, kind), daemon=True).start()
