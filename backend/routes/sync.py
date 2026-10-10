import json
from datetime import datetime

from flask import Blueprint, request, jsonify

from app import db
from models import UserSync
from routes._common import require_user

sync_bp = Blueprint("sync", __name__)

# Only the toolkit's own data keys are accepted — nothing else can be stored through this endpoint.
SYNC_KEYS = {
    "talaba:timetable:v1",
    "talaba:gpa:v1",
    "talaba:planner:v1",
    "talaba:focus:v1",
    "talaba:attendance:v1",
}
MAX_KEY_BYTES = 200_000
MAX_TOTAL_BYTES = 600_000


def _size(v):
    return len(json.dumps(v, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))


def _row_for_update(user_id):
    """Row for this user (created on first use), locked so two devices syncing at once can't lose a write."""
    row = UserSync.query.filter_by(user_id=user_id).with_for_update().first()
    if not row:
        row = UserSync(user_id=user_id, data={})
        db.session.add(row)
        db.session.flush()
    return row


def _payload(row):
    return {"data": row.data or {}, "updated_at": row.updated_at.isoformat() + "Z" if row.updated_at else None}


@sync_bp.route("", methods=["GET"])
def pull():
    user, err = require_user()
    if err:
        return err
    row = UserSync.query.filter_by(user_id=user.id).first()
    return jsonify(_payload(row) if row else {"data": {}, "updated_at": None}), 200


@sync_bp.route("", methods=["PUT"])
def push():
    """Merge client data into the server copy, last-write-wins per key (by the client's edit timestamp `t`).
    Responds with the merged result so the client can adopt anything newer that another device saved."""
    user, err = require_user()
    if err:
        return err
    incoming = (request.get_json(silent=True) or {}).get("data")
    if not isinstance(incoming, dict):
        return jsonify({"error": "data obyekt bo'lishi kerak."}), 400

    clean = {}
    for key, entry in incoming.items():
        if key not in SYNC_KEYS:
            continue   # unknown keys are ignored, not an error — newer clients may sync more
        if not isinstance(entry, dict) or "v" not in entry or isinstance(entry.get("t"), bool) or not isinstance(entry.get("t"), (int, float)):
            return jsonify({"error": f"'{key}' noto'g'ri formatda."}), 400
        if _size(entry["v"]) > MAX_KEY_BYTES:
            return jsonify({"error": f"'{key}' juda katta."}), 413
        clean[key] = {"v": entry["v"], "t": int(entry["t"])}

    row = _row_for_update(user.id)
    merged = dict(row.data or {})
    for key, entry in clean.items():
        cur = merged.get(key)
        if cur is None or entry["t"] > int(cur.get("t", 0)):
            merged[key] = entry
    if sum(_size(e["v"]) for e in merged.values()) > MAX_TOTAL_BYTES:
        db.session.rollback()
        return jsonify({"error": "Ma'lumotlar hajmi chegaradan oshdi."}), 413
    row.data = merged                      # new dict object so SQLAlchemy sees the change
    row.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(_payload(row)), 200


@sync_bp.route("", methods=["DELETE"])
def wipe():
    user, err = require_user()
    if err:
        return err
    UserSync.query.filter_by(user_id=user.id).delete()
    db.session.commit()
    return jsonify({"message": "Bulutdagi nusxa o'chirildi."}), 200
