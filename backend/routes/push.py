import base64
import os

from flask import Blueprint, request, jsonify

from app import db
from models import DeviceToken, PushSubscription, SentReminder
from push_service import PushGone, endpoint_ok, send_push, vapid_configured
from reminders import normalize_prefs
from routes._common import require_user

push_bp = Blueprint("push", __name__)

MAX_SUBS_PER_USER = 5


def _b64len(s):
    try:
        return len(base64.urlsafe_b64decode(s + "=" * (-len(s) % 4)))
    except Exception:
        return -1


@push_bp.route("/key", methods=["GET"])
def public_key():
    if not vapid_configured():
        return jsonify({"error": "Eslatmalar hozircha sozlanmagan."}), 503
    return jsonify({"key": os.environ["VAPID_PUBLIC_KEY"].strip()}), 200


@push_bp.route("/subscribe", methods=["POST"])
def subscribe():
    user, err = require_user()
    if err:
        return err
    if not vapid_configured():
        return jsonify({"error": "Eslatmalar hozircha sozlanmagan."}), 503
    body = request.get_json(silent=True) or {}
    sub = body.get("subscription") if isinstance(body.get("subscription"), dict) else {}
    endpoint = sub.get("endpoint")
    keys = sub.get("keys") if isinstance(sub.get("keys"), dict) else {}
    p256dh, auth = keys.get("p256dh"), keys.get("auth")
    if not isinstance(endpoint, str) or len(endpoint) > 600 or not endpoint_ok(endpoint):
        return jsonify({"error": "Bu qurilma/brauzer qo'llab-quvvatlanmaydi."}), 400
    if not (isinstance(p256dh, str) and isinstance(auth, str) and _b64len(p256dh) == 65 and _b64len(auth) == 16):
        return jsonify({"error": "Obuna kalitlari noto'g'ri."}), 400

    prefs = normalize_prefs(body.get("prefs"))
    row = PushSubscription.query.filter_by(endpoint=endpoint).first()
    if row:   # same browser, possibly a different account now — it belongs to whoever is signed in
        row.user_id, row.p256dh, row.auth, row.prefs, row.failures = user.id, p256dh, auth, prefs, 0
    else:
        mine = PushSubscription.query.filter_by(user_id=user.id).order_by(PushSubscription.created_at.asc()).all()
        for old in mine[: max(0, len(mine) - MAX_SUBS_PER_USER + 1)]:
            SentReminder.query.filter_by(subscription_id=old.id).delete(synchronize_session=False)
            db.session.delete(old)
        row = PushSubscription(user_id=user.id, endpoint=endpoint, p256dh=p256dh, auth=auth, prefs=prefs,
                               user_agent=(request.headers.get("User-Agent") or "")[:200])
        db.session.add(row)
    db.session.commit()
    return jsonify({"subscribed": True, "prefs": row.prefs}), 201


def _mine(user, endpoint):
    if not isinstance(endpoint, str):
        return None
    return PushSubscription.query.filter_by(endpoint=endpoint, user_id=user.id).first()


@push_bp.route("/status", methods=["GET"])
def status():
    user, err = require_user()
    if err:
        return err
    row = _mine(user, request.args.get("endpoint"))
    return jsonify({"subscribed": bool(row), "prefs": row.prefs if row else None, "configured": vapid_configured()}), 200


@push_bp.route("/prefs", methods=["PATCH"])
def update_prefs():
    user, err = require_user()
    if err:
        return err
    body = request.get_json(silent=True) or {}
    row = _mine(user, body.get("endpoint"))
    if not row:
        return jsonify({"error": "Obuna topilmadi."}), 404
    row.prefs = normalize_prefs({**(row.prefs or {}), **(body.get("prefs") if isinstance(body.get("prefs"), dict) else {})})
    db.session.commit()
    return jsonify({"prefs": row.prefs}), 200


@push_bp.route("/subscribe", methods=["DELETE"])
def unsubscribe():
    user, err = require_user()
    if err:
        return err
    row = _mine(user, (request.get_json(silent=True) or {}).get("endpoint"))
    if row:
        SentReminder.query.filter_by(subscription_id=row.id).delete(synchronize_session=False)
        db.session.delete(row)
        db.session.commit()
    return jsonify({"subscribed": False}), 200


@push_bp.route("/test", methods=["POST"])
def test_push():
    user, err = require_user()
    if err:
        return err
    row = _mine(user, (request.get_json(silent=True) or {}).get("endpoint"))
    if not row:
        return jsonify({"error": "Obuna topilmadi."}), 404
    try:
        send_push(row, {"title": "TALABA eslatmalari yoqildi ✅", "body": "Dars, imtihon va vazifalar haqida shu yerda eslatib turamiz.", "url": "/tools", "tag": "test"})
    except PushGone:
        SentReminder.query.filter_by(subscription_id=row.id).delete(synchronize_session=False)
        db.session.delete(row)
        db.session.commit()
        return jsonify({"error": "Obuna eskirgan — eslatmalarni qayta yoqing."}), 410
    except Exception as e:
        print(f"[push] test failed: {e}")
        return jsonify({"error": "Yuborib bo'lmadi. Keyinroq urinib ko'ring."}), 502
    return jsonify({"message": "Sinov eslatmasi yuborildi."}), 200


@push_bp.route("/device", methods=["POST"])
def register_device():
    """The phone app registers its Expo push token (iOS / Android)."""
    user, err = require_user()
    if err:
        return err
    body = request.get_json(silent=True) or {}
    token = body.get("token")
    if not (isinstance(token, str) and token.startswith(("ExponentPushToken[", "ExpoPushToken[")) and len(token) <= 200):
        return jsonify({"error": "Qurilma kaliti noto'g'ri."}), 400
    platform = body.get("platform") if body.get("platform") in ("ios", "android") else None
    row = DeviceToken.query.filter_by(token=token).first()
    if row:
        row.user_id, row.platform = user.id, platform   # the phone now belongs to whoever is signed in
    else:
        mine = DeviceToken.query.filter_by(user_id=user.id).order_by(DeviceToken.created_at.asc()).all()
        for old in mine[: max(0, len(mine) - MAX_SUBS_PER_USER + 1)]:
            db.session.delete(old)
        db.session.add(DeviceToken(user_id=user.id, token=token, platform=platform))
    db.session.commit()
    return jsonify({"message": "Qurilma ulandi."}), 200


@push_bp.route("/device", methods=["DELETE"])
def unregister_device():
    user, err = require_user()
    if err:
        return err
    token = (request.get_json(silent=True) or {}).get("token") or request.args.get("token")
    if isinstance(token, str):
        DeviceToken.query.filter_by(user_id=user.id, token=token).delete(synchronize_session=False)
        db.session.commit()
    return jsonify({"message": "Qurilma o'chirildi."}), 200
