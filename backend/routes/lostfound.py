from datetime import date, timedelta

from flask import Blueprint, request, jsonify

from app import db
from models import LostFoundItem
from routes._common import clean, current_user_id, is_admin, like, paging, report, require_user

lostfound_bp = Blueprint("lostfound", __name__)

MAX_OPEN_PER_USER = 10


def _parse_day(value):
    try:
        d = date.fromisoformat(str(value))
    except (TypeError, ValueError):
        raise ValueError("Sana YYYY-OO-KK ko'rinishida bo'lsin.")
    today = date.today()
    if d > today + timedelta(days=1):          # +1 day tolerance for timezone differences
        raise ValueError("Sana kelajakda bo'lishi mumkin emas.")
    if d < today - timedelta(days=365):
        raise ValueError("Bir yildan eski e'lon qo'shib bo'lmaydi.")
    return d


@lostfound_bp.route("", methods=["GET"])
def list_items():
    viewer = current_user_id()
    kind = request.args.get("kind", "")
    q = (request.args.get("q") or "").strip()[:80]
    university = (request.args.get("university") or "").strip()[:120]
    mine = request.args.get("mine") == "1" and viewer
    limit, offset = paging(24, 60)

    L = LostFoundItem
    query = L.query.filter(L.user_id == viewer, L.status != "hidden") if mine else L.query.filter(L.status == "open")
    if kind in ("lost", "found"):
        query = query.filter(L.kind == kind)
    if q:
        pat = like(q)
        query = query.filter(db.or_(L.title.ilike(pat, escape="\\"), L.place.ilike(pat, escape="\\"), L.description.ilike(pat, escape="\\")))
    if university:
        query = query.filter(L.university == university)
    total = query.count()
    items = query.order_by(L.created_at.desc()).limit(limit).offset(offset).all()
    return jsonify({"total": total, "items": [i.to_dict(viewer) for i in items]}), 200


@lostfound_bp.route("", methods=["POST"])
def create_item():
    user, err = require_user()
    if err:
        return err
    if LostFoundItem.query.filter_by(user_id=user.id, status="open").count() >= MAX_OPEN_PER_USER:
        return jsonify({"error": f"Bir vaqtda ko'pi bilan {MAX_OPEN_PER_USER} ta ochiq e'lon bo'lishi mumkin. Topilganlarini yoping."}), 429
    data = request.get_json(silent=True) or {}
    try:
        kind = data.get("kind")
        if kind not in ("lost", "found"):
            raise ValueError("Turini tanlang: yo'qotdim yoki topdim.")
        title = clean(data.get("title"), 120, 3)
        if not title:
            raise ValueError("Buyum nomini kiriting.")
        place = clean(data.get("place"), 160, 2)
        if not place:
            raise ValueError("Joyni kiriting.")
        contact = clean(data.get("contact"), 120, 3)
        if not contact:
            raise ValueError("Bog'lanish uchun Telegram yoki telefon kiriting.")
        item = LostFoundItem(
            user_id=user.id, kind=kind, title=title, place=place, contact=contact,
            description=clean(data.get("description"), 800),
            happened_on=_parse_day(data.get("happened_on")),
            university=clean(data.get("university"), 120) or user.university,
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    db.session.add(item)
    db.session.commit()
    return jsonify({"item": item.to_dict(user.id)}), 201


@lostfound_bp.route("/<int:item_id>", methods=["PATCH"])
def update_item(item_id):
    user, err = require_user()
    if err:
        return err
    item = LostFoundItem.query.get_or_404(item_id)
    if item.user_id != user.id and not is_admin(user):
        return jsonify({"error": "Ruxsat yo'q."}), 403
    status = (request.get_json(silent=True) or {}).get("status")
    if status not in ("open", "resolved"):
        return jsonify({"error": "Holat noto'g'ri."}), 400
    if item.status == "hidden" and not is_admin(user):
        return jsonify({"error": "Bu e'lon moderatsiya tomonidan yashirilgan."}), 403
    item.status = status
    db.session.commit()
    return jsonify({"item": item.to_dict(user.id)}), 200


@lostfound_bp.route("/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    user, err = require_user()
    if err:
        return err
    item = LostFoundItem.query.get_or_404(item_id)
    if item.user_id != user.id and not is_admin(user):
        return jsonify({"error": "Ruxsat yo'q."}), 403
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "E'lon o'chirildi."}), 200


@lostfound_bp.route("/<int:item_id>/report", methods=["POST"])
def report_item(item_id):
    user, err = require_user()
    if err:
        return err
    item = LostFoundItem.query.get_or_404(item_id)
    reason = (request.get_json(silent=True) or {}).get("reason")
    return report("lostfound", item, user, reason, lambda it: setattr(it, "status", "hidden"))
