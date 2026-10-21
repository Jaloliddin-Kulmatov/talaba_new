"""University and education news. Public to read; administrators post and remove items."""
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify

from app import db
from models import NewsItem
from routes._common import clean, is_admin, paging, require_user

news_bp = Blueprint("news", __name__)

SHOW_DAYS = 120   # older items stop appearing (they stay in the database for the admin)


def _admin():
    user, err = require_user()
    if err:
        return None, err
    if not is_admin(user):
        return None, (jsonify({"error": "Faqat administrator uchun."}), 403)
    return user, None


def _url(v):
    v = clean(v, 500)
    if v and not (v.startswith("https://") or v.startswith("http://")):
        raise ValueError("Havola http(s) bilan boshlanishi kerak.")
    return v


@news_bp.route("", methods=["GET"])
def list_news():
    limit, offset = paging(default=20, cap=50)
    since = datetime.utcnow() - timedelta(days=SHOW_DAYS)
    q = NewsItem.query.filter(NewsItem.is_active.is_(True), NewsItem.published_at >= since)
    total = q.count()
    rows = q.order_by(NewsItem.published_at.desc()).offset(offset).limit(limit).all()
    return jsonify({"items": [n.to_dict() for n in rows], "total": total}), 200


@news_bp.route("", methods=["POST"])
def create():
    user, err = _admin()
    if err:
        return err
    d = request.get_json(silent=True) or {}
    try:
        title = clean(d.get("title"), 200, 3)
        item = NewsItem(title=title, summary=clean(d.get("summary"), 1500), url=_url(d.get("url")),
                        source=clean(d.get("source"), 120), created_by=user.id)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    db.session.add(item)
    db.session.commit()
    return jsonify({"item": item.to_dict()}), 201


@news_bp.route("/<int:item_id>", methods=["DELETE"])
def remove(item_id):
    _, err = _admin()
    if err:
        return err
    item = NewsItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "O'chirildi."}), 200
