"""Direct messages between students: search people, conversations, send, read receipts, block, report."""
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from sqlalchemy import and_, case, func, or_

from app import db
from models import ContentReport, DirectMessage, User, UserBlock
from notify import notify_user
from routes._common import clean, like, require_user

messages_bp = Blueprint("messages", __name__)

MAX_BODY = 1000
MAX_PER_MINUTE = 20      # sending faster than this is spam, not conversation
THREAD_PAGE = 100
SYSTEM_EMAIL = "system@talaba.uz"   # the seeded owner of official clubs: nobody to talk to


def _blocked_between(a, b):
    return UserBlock.query.filter(or_(
        and_(UserBlock.blocker_id == a, UserBlock.blocked_id == b),
        and_(UserBlock.blocker_id == b, UserBlock.blocked_id == a),
    )).first() is not None


def _person(u):
    return {"id": u.id, "name": u.name, "university": u.university or ""}


@messages_bp.route("/users", methods=["GET"])
def search_users():
    """Find a student by name (2+ letters). Never reveals e-mail addresses."""
    user, err = require_user()
    if err:
        return err
    q = (request.args.get("q") or "").strip()[:60]
    if len(q) < 2:
        return jsonify({"users": []}), 200
    hidden = {b.blocked_id for b in UserBlock.query.filter_by(blocker_id=user.id)} | \
             {b.blocker_id for b in UserBlock.query.filter_by(blocked_id=user.id)}
    rows = (User.query.filter(User.id != user.id, User.email != SYSTEM_EMAIL, User.name.ilike(like(q), escape="\\"))
            .order_by(User.name.asc()).limit(20).all())
    return jsonify({"users": [_person(u) for u in rows if u.id not in hidden]}), 200


@messages_bp.route("/conversations", methods=["GET"])
def conversations():
    user, err = require_user()
    if err:
        return err
    me = user.id
    # last message id per counterpart
    other = case((DirectMessage.sender_id == me, DirectMessage.recipient_id), else_=DirectMessage.sender_id)
    last_ids = [r[0] for r in (db.session.query(func.max(DirectMessage.id))
                               .filter(or_(DirectMessage.sender_id == me, DirectMessage.recipient_id == me))
                               .group_by(other).all())]
    out = []
    blocked = {b.blocked_id for b in UserBlock.query.filter_by(blocker_id=me)}
    for m in DirectMessage.query.filter(DirectMessage.id.in_(last_ids)).order_by(DirectMessage.id.desc()).all() if last_ids else []:
        pid = m.recipient_id if m.sender_id == me else m.sender_id
        if pid in blocked:
            continue
        p = User.query.get(pid)
        if not p:
            continue
        unread = DirectMessage.query.filter_by(sender_id=pid, recipient_id=me, read_at=None).count()
        out.append({"user": _person(p), "last": m.to_dict(me), "unread": unread})
    return jsonify({"conversations": out}), 200


@messages_bp.route("/unread-count", methods=["GET"])
def unread_count():
    user, err = require_user()
    if err:
        return err
    blocked = [b.blocked_id for b in UserBlock.query.filter_by(blocker_id=user.id)]
    q = DirectMessage.query.filter_by(recipient_id=user.id, read_at=None)
    if blocked:
        q = q.filter(~DirectMessage.sender_id.in_(blocked))
    return jsonify({"count": q.count()}), 200


@messages_bp.route("/with/<int:other_id>", methods=["GET"])
def thread(other_id):
    """Messages with one person, oldest first. Opening a thread marks their messages as read."""
    user, err = require_user()
    if err:
        return err
    other = User.query.get(other_id)
    if not other or other.id == user.id or other.email == SYSTEM_EMAIL:
        return jsonify({"error": "Foydalanuvchi topilmadi."}), 404
    after = request.args.get("after", 0, type=int)
    q = DirectMessage.query.filter(
        or_(and_(DirectMessage.sender_id == user.id, DirectMessage.recipient_id == other_id),
            and_(DirectMessage.sender_id == other_id, DirectMessage.recipient_id == user.id)),
        DirectMessage.id > after,
    )
    rows = q.order_by(DirectMessage.id.desc()).limit(THREAD_PAGE).all()[::-1]
    now = datetime.utcnow()
    changed = False
    for m in rows:
        if m.recipient_id == user.id and m.read_at is None:
            m.read_at = now
            changed = True
    if changed:
        db.session.commit()
    return jsonify({
        "user": _person(other),
        "messages": [m.to_dict(user.id) for m in rows],
        "blocked": UserBlock.query.filter_by(blocker_id=user.id, blocked_id=other_id).first() is not None,
        "blocked_me": UserBlock.query.filter_by(blocker_id=other_id, blocked_id=user.id).first() is not None,
    }), 200


@messages_bp.route("/with/<int:other_id>", methods=["POST"])
def send(other_id):
    user, err = require_user()
    if err:
        return err
    other = User.query.get(other_id)
    if not other or other.id == user.id or other.email == SYSTEM_EMAIL:
        return jsonify({"error": "Foydalanuvchi topilmadi."}), 404
    if _blocked_between(user.id, other_id):
        return jsonify({"error": "Bu foydalanuvchiga xabar yubora olmaysiz."}), 403
    try:
        body = clean((request.get_json(silent=True) or {}).get("body"), MAX_BODY, 1)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    if not body:
        return jsonify({"error": "Xabar bo'sh bo'lishi mumkin emas."}), 400
    recent = DirectMessage.query.filter(
        DirectMessage.sender_id == user.id, DirectMessage.created_at >= datetime.utcnow() - timedelta(minutes=1)
    ).count()
    if recent >= MAX_PER_MINUTE:
        return jsonify({"error": "Juda tez yozyapsiz. Biroz kutib turing."}), 429
    m = DirectMessage(sender_id=user.id, recipient_id=other_id, body=body)
    db.session.add(m)
    db.session.commit()
    notify_user(other_id, user.name.split(" ")[0], body, url=f"/dashboard/messages?with={user.id}",
                tag=f"dm-{user.id}", kind="messages")
    return jsonify({"message": m.to_dict(user.id)}), 201


@messages_bp.route("/blocks", methods=["GET"])
def blocks():
    user, err = require_user()
    if err:
        return err
    rows = UserBlock.query.filter_by(blocker_id=user.id).all()
    users = [User.query.get(b.blocked_id) for b in rows]
    return jsonify({"users": [_person(u) for u in users if u]}), 200


@messages_bp.route("/block/<int:other_id>", methods=["POST"])
def block(other_id):
    user, err = require_user()
    if err:
        return err
    if other_id == user.id or not User.query.get(other_id):
        return jsonify({"error": "Foydalanuvchi topilmadi."}), 404
    if not UserBlock.query.filter_by(blocker_id=user.id, blocked_id=other_id).first():
        db.session.add(UserBlock(blocker_id=user.id, blocked_id=other_id))
        db.session.commit()
    return jsonify({"message": "Bloklandi."}), 200


@messages_bp.route("/block/<int:other_id>", methods=["DELETE"])
def unblock(other_id):
    user, err = require_user()
    if err:
        return err
    UserBlock.query.filter_by(blocker_id=user.id, blocked_id=other_id).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({"message": "Blok olib tashlandi."}), 200


@messages_bp.route("/report/<int:other_id>", methods=["POST"])
def report_user(other_id):
    """Flag a person to the administrators (one report per reporter). Never auto-hides anybody."""
    user, err = require_user()
    if err:
        return err
    if other_id == user.id or not User.query.get(other_id):
        return jsonify({"error": "Foydalanuvchi topilmadi."}), 404
    try:
        reason = clean((request.get_json(silent=True) or {}).get("reason"), 200)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    if ContentReport.query.filter_by(user_id=user.id, kind="user", item_id=other_id).first():
        return jsonify({"message": "Shikoyatingiz allaqachon qabul qilingan."}), 200
    db.session.add(ContentReport(user_id=user.id, kind="user", item_id=other_id, reason=reason))
    db.session.commit()
    return jsonify({"message": "Shikoyat yuborildi. Rahmat!"}), 200
