"""Admin-only moderation for community content (reviews, marketplace, lost & found)."""
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from sqlalchemy import func

from app import db
from models import (
    ContentReport, CourseReview, LostFoundItem, MarketItem, User,
)
from routes._common import is_admin, require_user

moderation_bp = Blueprint("moderation", __name__)

# kind -> (model, "hidden" state setter, "visible" state setter, hidden predicate)
KINDS = {
    "review":    (CourseReview, lambda i: setattr(i, "is_active", False), lambda i: setattr(i, "is_active", True),  lambda i: not i.is_active),
    "market":    (MarketItem,   lambda i: setattr(i, "status", "hidden"), lambda i: setattr(i, "status", "active"), lambda i: i.status == "hidden"),
    "lostfound": (LostFoundItem, lambda i: setattr(i, "status", "hidden"), lambda i: setattr(i, "status", "open"),  lambda i: i.status == "hidden"),
}


def _admin():
    user, err = require_user()
    if err:
        return None, err
    if not is_admin(user):
        return None, (jsonify({"error": "Faqat administrator uchun."}), 403)
    return user, None


def _summary(kind, item):
    if kind == "review":
        return f"{item.subject} · {item.teacher or 'o‘qituvchisiz'} · {item.university}", (item.text or "")[:240]
    if kind == "market":
        return item.title, (item.description or "")[:240]
    return item.title, f"{item.place} — {(item.description or '')[:200]}"


@moderation_bp.route("/stats", methods=["GET"])
def stats():
    _, err = _admin()
    if err:
        return err
    week = datetime.utcnow() - timedelta(days=7)
    flagged = sum(
        m.query.filter(m.report_count > 0).count() for m in (CourseReview, MarketItem, LostFoundItem)
    )
    return jsonify({
        "users": User.query.count(),
        "users_7d": User.query.filter(User.created_at >= week).count(),
        "reviews": CourseReview.query.filter_by(is_active=True).count(),
        "market_active": MarketItem.query.filter_by(status="active").count(),
        "lostfound_open": LostFoundItem.query.filter_by(status="open").count(),
        "new_7d": (
            CourseReview.query.filter(CourseReview.created_at >= week).count()
            + MarketItem.query.filter(MarketItem.created_at >= week).count()
            + LostFoundItem.query.filter(LostFoundItem.created_at >= week).count()
        ),
        "flagged": flagged,
        "hidden": (
            CourseReview.query.filter_by(is_active=False).count()
            + MarketItem.query.filter_by(status="hidden").count()
            + LostFoundItem.query.filter_by(status="hidden").count()
        ),
    }), 200


@moderation_bp.route("/queue", methods=["GET"])
def queue():
    """Everything that has been reported or auto-hidden, most-reported first."""
    _, err = _admin()
    if err:
        return err
    out = []
    for kind, (model, _hide, _show, is_hidden) in KINDS.items():
        for item in model.query.filter(model.report_count > 0).order_by(model.report_count.desc()).limit(100).all():
            reports = ContentReport.query.filter_by(kind=kind, item_id=item.id).order_by(ContentReport.created_at.desc()).all()
            author = User.query.get(item.user_id)
            title, preview = _summary(kind, item)
            out.append({
                "kind": kind, "id": item.id, "title": title, "preview": preview,
                "hidden": bool(is_hidden(item)), "report_count": item.report_count,
                "reasons": [r.reason for r in reports if r.reason][:8],
                "author": {"id": author.id, "name": author.name, "email": author.email} if author else None,
                "created_at": item.created_at.isoformat() + "Z" if item.created_at else None,
            })
    out.sort(key=lambda x: (not x["hidden"], -x["report_count"]))   # auto-hidden ones first: they need a decision
    return jsonify({"items": out}), 200


def _load(kind, item_id):
    if kind not in KINDS:
        return None, None, (jsonify({"error": "Noto'g'ri tur."}), 400)
    model = KINDS[kind][0]
    item = model.query.get(item_id)
    if not item:
        return None, None, (jsonify({"error": "Topilmadi."}), 404)
    return kind, item, None


@moderation_bp.route("/<kind>/<int:item_id>/restore", methods=["POST"])
def restore(kind, item_id):
    """Dismiss the reports and make the item visible again."""
    _, err = _admin()
    if err:
        return err
    kind, item, err = _load(kind, item_id)
    if err:
        return err
    KINDS[kind][2](item)
    item.report_count = 0
    ContentReport.query.filter_by(kind=kind, item_id=item.id).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({"message": "Tiklandi, shikoyatlar yopildi."}), 200


@moderation_bp.route("/<kind>/<int:item_id>/hide", methods=["POST"])
def hide(kind, item_id):
    _, err = _admin()
    if err:
        return err
    kind, item, err = _load(kind, item_id)
    if err:
        return err
    KINDS[kind][1](item)
    db.session.commit()
    return jsonify({"message": "Yashirildi."}), 200


@moderation_bp.route("/<kind>/<int:item_id>", methods=["DELETE"])
def remove(kind, item_id):
    _, err = _admin()
    if err:
        return err
    kind, item, err = _load(kind, item_id)
    if err:
        return err
    ContentReport.query.filter_by(kind=kind, item_id=item.id).delete(synchronize_session=False)
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "O'chirildi."}), 200
