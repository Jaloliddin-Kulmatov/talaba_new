from flask import Blueprint, request, jsonify

from app import db
from models import MarketItem
from routes._common import (
    clean, current_user_id, int_in, is_admin, like, paging, report, require_user,
)

market_bp = Blueprint("market", __name__)

CATEGORIES = {"kitob", "konspekt", "elektronika", "turargoh", "kiyim", "xizmat", "boshqa"}
CONDITIONS = {"yangi", "yaxshi", "ishlatilgan"}
MAX_ACTIVE_PER_USER = 15
MAX_PRICE = 1_000_000_000  # so'm


def _fields(data, partial=False):
    """Validated dict of the writable fields. With partial=True only keys present in `data` are returned."""
    out = {}

    def has(k):
        return (not partial) or (k in data)

    if has("title"):
        out["title"] = clean(data.get("title"), 120, 3)
        if not out["title"]:
            raise ValueError("Sarlavha kamida 3 belgidan iborat bo'lsin.")
    if has("description"):
        out["description"] = clean(data.get("description"), 1000)
    if has("category"):
        cat = (data.get("category") or "").strip().lower()
        if cat not in CATEGORIES:
            raise ValueError("Kategoriya noto'g'ri.")
        out["category"] = cat
    if has("condition"):
        cond = (data.get("condition") or "").strip().lower() or None
        if cond is not None and cond not in CONDITIONS:
            raise ValueError("Holat noto'g'ri.")
        out["condition"] = cond
    if has("price"):
        out["price"] = int_in(data.get("price"), 0, MAX_PRICE, "Narx")
    if has("university"):
        out["university"] = clean(data.get("university"), 120)
    if has("region"):
        out["region"] = clean(data.get("region"), 100)
    if has("contact"):
        out["contact"] = clean(data.get("contact"), 120, 3)
        if not out["contact"]:
            raise ValueError("Bog'lanish uchun Telegram yoki telefon kiriting.")
    return out


@market_bp.route("", methods=["GET"])
def list_items():
    viewer = current_user_id()
    q = (request.args.get("q") or "").strip()[:80]
    category = (request.args.get("category") or "").strip().lower()
    university = (request.args.get("university") or "").strip()[:120]
    region = (request.args.get("region") or "").strip()[:100]
    sort = request.args.get("sort", "new")
    mine = request.args.get("mine") == "1" and viewer
    limit, offset = paging(24, 60)

    M = MarketItem
    query = M.query
    if mine:
        query = query.filter(M.user_id == viewer, M.status != "hidden")   # my own: active + sold
    else:
        query = query.filter(M.status == "active")
    if q:
        pat = like(q)
        query = query.filter(db.or_(M.title.ilike(pat, escape="\\"), M.description.ilike(pat, escape="\\")))
    if category in CATEGORIES:
        query = query.filter(M.category == category)
    if university:
        query = query.filter(M.university == university)
    if region:
        query = query.filter(M.region == region)
    if request.args.get("max_price") not in (None, ""):
        try:
            query = query.filter(M.price.isnot(None), M.price <= int(request.args["max_price"]))
        except ValueError:
            return jsonify({"error": "max_price son bo'lishi kerak."}), 400

    total = query.count()
    order = [M.price.asc().nullslast(), M.created_at.desc()] if sort == "cheap" else [M.created_at.desc()]
    items = query.order_by(*order).limit(limit).offset(offset).all()
    return jsonify({"total": total, "items": [i.to_dict(viewer) for i in items]}), 200


@market_bp.route("/<int:item_id>", methods=["GET"])
def get_item(item_id):
    viewer = current_user_id()
    item = MarketItem.query.get_or_404(item_id)
    if item.status == "hidden" and item.user_id != viewer:
        return jsonify({"error": "E'lon topilmadi."}), 404
    return jsonify({"item": item.to_dict(viewer)}), 200


@market_bp.route("", methods=["POST"])
def create_item():
    user, err = require_user()
    if err:
        return err
    active = MarketItem.query.filter_by(user_id=user.id, status="active").count()
    if active >= MAX_ACTIVE_PER_USER:
        return jsonify({"error": f"Bir vaqtda ko'pi bilan {MAX_ACTIVE_PER_USER} ta faol e'lon qo'yish mumkin. Sotilganlarini belgilang yoki o'chiring."}), 429
    try:
        f = _fields(request.get_json(silent=True) or {})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    # _fields() always returns these keys (None when omitted), so fall back to the profile explicitly
    f["university"] = f.get("university") or user.university
    f["region"] = f.get("region") or user.region
    item = MarketItem(user_id=user.id, **f)
    db.session.add(item)
    db.session.commit()
    return jsonify({"item": item.to_dict(user.id)}), 201


@market_bp.route("/<int:item_id>", methods=["PATCH"])
def update_item(item_id):
    user, err = require_user()
    if err:
        return err
    item = MarketItem.query.get_or_404(item_id)
    if item.user_id != user.id and not is_admin(user):
        return jsonify({"error": "Ruxsat yo'q."}), 403
    data = request.get_json(silent=True) or {}
    try:
        f = _fields(data, partial=True)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    if "status" in data:
        if data["status"] not in ("active", "sold"):
            return jsonify({"error": "Holat noto'g'ri."}), 400
        # an item an admin/auto-moderation hid can't be re-published by its owner
        if item.status == "hidden" and not is_admin(user):
            return jsonify({"error": "Bu e'lon moderatsiya tomonidan yashirilgan."}), 403
        f["status"] = data["status"]
    for k, v in f.items():
        setattr(item, k, v)
    db.session.commit()
    return jsonify({"item": item.to_dict(user.id)}), 200


@market_bp.route("/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    user, err = require_user()
    if err:
        return err
    item = MarketItem.query.get_or_404(item_id)
    if item.user_id != user.id and not is_admin(user):
        return jsonify({"error": "Ruxsat yo'q."}), 403
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "E'lon o'chirildi."}), 200


@market_bp.route("/<int:item_id>/report", methods=["POST"])
def report_item(item_id):
    user, err = require_user()
    if err:
        return err
    item = MarketItem.query.get_or_404(item_id)
    reason = (request.get_json(silent=True) or {}).get("reason")
    return report("market", item, user, reason, lambda it: setattr(it, "status", "hidden"))
