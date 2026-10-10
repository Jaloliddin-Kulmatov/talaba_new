"""Small helpers shared by the community-service routes (reviews, market, lost & found, sync)."""
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from sqlalchemy.exc import IntegrityError

from app import db
from models import User, ContentReport

HIDE_AT_REPORTS = 3  # distinct reporters needed to auto-hide an item until an admin looks at it


def current_user_id():
    """Signed-in user id, or None (never raises — reads are public)."""
    try:
        verify_jwt_in_request(optional=True)
        ident = get_jwt_identity()
        return int(ident) if ident else None
    except Exception:
        return None


def require_user():
    """(user, None) when signed in, else (None, error_response)."""
    uid = current_user_id()
    user = User.query.get(uid) if uid else None
    if not user:
        return None, (jsonify({"error": "Davom etish uchun tizimga kiring."}), 401)
    return user, None


def is_admin(user):
    return bool(user and user.role == "admin")


def clean(value, max_len, min_len=0):
    """Trimmed string or None. Raises ValueError with a user-facing message if it is out of bounds."""
    if value is None:
        s = ""
    elif isinstance(value, str):
        s = " ".join(value.split()) if max_len <= 160 else value.strip()
    else:
        raise ValueError("Noto'g'ri qiymat.")
    if len(s) > max_len:
        raise ValueError(f"Matn juda uzun (ko'pi bilan {max_len} belgi).")
    if len(s) < min_len:
        raise ValueError(f"Kamida {min_len} belgi kiriting.")
    return s or None


def norm_key(s):
    """Case/whitespace-insensitive identity for matching the same course typed differently."""
    return " ".join((s or "").lower().split())[:120]


def int_in(value, lo, hi, field):
    """int in [lo, hi] or None when value is None/''. Rejects bool and non-numeric input."""
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        raise ValueError(f"{field} noto'g'ri.")
    try:
        n = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field} son bo'lishi kerak.")
    if n < lo or n > hi:
        raise ValueError(f"{field} {lo} dan {hi} gacha bo'lishi kerak.")
    return n


def paging(default=24, cap=60):
    try:
        limit = max(1, min(int(request.args.get("limit", default)), cap))
        offset = max(0, int(request.args.get("offset", 0)))
    except ValueError:
        limit, offset = default, 0
    return limit, offset


def like(q):
    """Safe LIKE pattern (escapes % and _ so users can't wildcard-scan)."""
    esc = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{esc}%"


def report(kind, item, user, reason, on_hide):
    """Record one report per (user, item). Hides the item once HIDE_AT_REPORTS distinct users flagged it."""
    if getattr(item, "user_id", None) == user.id:
        return jsonify({"error": "O'z e'loningizni shikoyat qila olmaysiz."}), 400
    try:
        reason = clean(reason, 200)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    db.session.add(ContentReport(user_id=user.id, kind=kind, item_id=item.id, reason=reason))
    try:
        db.session.flush()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Shikoyatingiz allaqachon qabul qilingan."}), 200
    n = ContentReport.query.filter_by(kind=kind, item_id=item.id).count()
    item.report_count = n
    hidden = n >= HIDE_AT_REPORTS
    if hidden:
        on_hide(item)
    db.session.commit()
    return jsonify({"message": "Shikoyat yuborildi. Rahmat!", "hidden": hidden}), 200
