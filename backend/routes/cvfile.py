"""The student's uploaded CV. One file per account; only the owner can read, replace or delete it."""
from flask import Blueprint, Response, request, jsonify

from app import db
from models import CvFile
from routes._common import require_user

cv_bp = Blueprint("cvfile", __name__)

MAX_BYTES = 2 * 1024 * 1024
KINDS = {
    ".pdf": ("application/pdf", b"%PDF-"),
    ".docx": ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", b"PK\x03\x04"),
}


@cv_bp.route("", methods=["GET"])
def meta():
    user, err = require_user()
    if err:
        return err
    row = CvFile.query.filter_by(user_id=user.id).first()
    return jsonify({"cv": row.meta() if row else None}), 200


@cv_bp.route("/download", methods=["GET"])
def download():
    user, err = require_user()
    if err:
        return err
    row = CvFile.query.filter_by(user_id=user.id).first()
    if not row:
        return jsonify({"error": "CV yuklanmagan."}), 404
    return Response(row.data, mimetype=row.mime, headers={
        "Content-Disposition": f'attachment; filename="{row.filename}"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
    })


@cv_bp.route("", methods=["PUT", "POST"])
def upload():
    user, err = require_user()
    if err:
        return err
    if (request.content_length or 0) > MAX_BYTES + 64 * 1024:
        return jsonify({"error": "Fayl juda katta (ko'pi bilan 2 MB)."}), 413
    f = request.files.get("file")
    if not f or not f.filename:
        return jsonify({"error": "Fayl tanlanmadi."}), 400
    name = " ".join(f.filename.replace("\\", "/").split("/")[-1].split())[:120]
    ext = "." + name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in KINDS:
        return jsonify({"error": "Faqat PDF yoki Word (.docx) fayl yuklash mumkin."}), 400
    data = f.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        return jsonify({"error": "Fayl juda katta (ko'pi bilan 2 MB)."}), 413
    mime, magic = KINDS[ext]
    if not data.startswith(magic):   # the extension alone proves nothing
        return jsonify({"error": "Fayl mazmuni kengaytmasiga mos kelmaydi."}), 400
    safe_name = "".join(ch for ch in name if ch not in '"\r\n;')
    row = CvFile.query.filter_by(user_id=user.id).first()
    if row:
        row.filename, row.mime, row.size, row.data = safe_name, mime, len(data), data
    else:
        row = CvFile(user_id=user.id, filename=safe_name, mime=mime, size=len(data), data=data)
        db.session.add(row)
    db.session.commit()
    return jsonify({"cv": row.meta()}), 200


@cv_bp.route("", methods=["DELETE"])
def remove():
    user, err = require_user()
    if err:
        return err
    CvFile.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({"message": "CV o'chirildi."}), 200
