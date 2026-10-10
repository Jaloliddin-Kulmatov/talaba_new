from flask import Blueprint, request, jsonify
from sqlalchemy import func

from app import db
from models import CourseReview
from routes._common import (
    clean, current_user_id, int_in, is_admin, like, norm_key, paging, report, require_user,
)

reviews_bp = Blueprint("reviews", __name__)


def _validate(data):
    subject = clean(data.get("subject"), 120, 2)
    if not subject:
        raise ValueError("Fan nomini kiriting.")
    university = clean(data.get("university"), 120, 2)
    if not university:
        raise ValueError("Universitetni kiriting.")
    teacher = clean(data.get("teacher"), 120)
    rating = int_in(data.get("rating"), 1, 5, "Baho")
    if rating is None:
        raise ValueError("Umumiy bahoni (1–5) tanlang.")
    difficulty = int_in(data.get("difficulty"), 1, 5, "Qiyinlik")
    recommend = data.get("recommend")
    if recommend is not None and not isinstance(recommend, bool):
        raise ValueError("Tavsiya maydoni noto'g'ri.")
    text = clean(data.get("text"), 1000)
    return subject, teacher, university, rating, difficulty, recommend, text


# ── Aggregated course list (search / browse) ─────────────────────────────────
@reviews_bp.route("/courses", methods=["GET"])
def list_courses():
    q = (request.args.get("q") or "").strip()[:80]
    university = (request.args.get("university") or "").strip()[:120]
    sort = request.args.get("sort", "top")
    limit, offset = paging(24, 60)

    R = CourseReview
    base = db.session.query(
        func.min(R.subject).label("subject"),
        func.min(R.teacher).label("teacher"),
        R.university.label("university"),
        func.count(R.id).label("n"),
        func.avg(R.rating).label("rating"),
        func.avg(R.difficulty).label("difficulty"),
        func.avg(db.case((R.recommend.is_(True), 1.0), (R.recommend.is_(False), 0.0), else_=None)).label("recommend"),
        func.max(R.created_at).label("latest"),
    ).filter(R.is_active.is_(True))
    if q:
        pat = like(q.lower())
        base = base.filter(db.or_(R.subject_key.like(pat, escape="\\"), R.teacher_key.like(pat, escape="\\")))
    if university:
        base = base.filter(R.university == university)
    grouped = base.group_by(R.subject_key, R.teacher_key, R.university)

    order = {
        "new": [func.max(R.created_at).desc()],
        "count": [func.count(R.id).desc(), func.avg(R.rating).desc()],
    }.get(sort, [func.avg(R.rating).desc(), func.count(R.id).desc()])
    total = grouped.count()
    rows = grouped.order_by(*order).limit(limit).offset(offset).all()
    return jsonify({
        "total": total,
        "courses": [{
            "subject": r.subject, "teacher": r.teacher or "", "university": r.university,
            "count": r.n, "rating": round(float(r.rating), 2),
            "difficulty": round(float(r.difficulty), 2) if r.difficulty is not None else None,
            "recommend": round(float(r.recommend), 2) if r.recommend is not None else None,
        } for r in rows],
    }), 200


# ── Reviews for one course ───────────────────────────────────────────────────
@reviews_bp.route("", methods=["GET"])
def list_reviews():
    subject = norm_key(request.args.get("subject"))
    if not subject:
        return jsonify({"error": "subject kerak."}), 400
    teacher = norm_key(request.args.get("teacher"))
    university = (request.args.get("university") or "").strip()[:120]
    viewer = current_user_id()
    limit, offset = paging(30, 100)
    q = CourseReview.query.filter_by(subject_key=subject, teacher_key=teacher, is_active=True)
    if university:
        q = q.filter_by(university=university)
    total = q.count()
    items = q.order_by(CourseReview.created_at.desc()).limit(limit).offset(offset).all()
    return jsonify({"total": total, "reviews": [r.to_dict(viewer) for r in items]}), 200


# ── Create or update my review of a course (one per student per course) ──────
@reviews_bp.route("", methods=["POST"])
def upsert_review():
    user, err = require_user()
    if err:
        return err
    try:
        subject, teacher, university, rating, difficulty, recommend, text = _validate(request.get_json(silent=True) or {})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    skey, tkey = norm_key(subject), norm_key(teacher)
    review = CourseReview.query.filter_by(user_id=user.id, subject_key=skey, teacher_key=tkey, university=university).first()
    created = review is None
    if created:
        review = CourseReview(user_id=user.id, subject=subject, subject_key=skey, teacher=teacher, teacher_key=tkey, university=university)
        db.session.add(review)
    review.rating, review.difficulty, review.recommend, review.text = rating, difficulty, recommend, text
    db.session.commit()
    return jsonify({"review": review.to_dict(user.id), "created": created}), 201 if created else 200


@reviews_bp.route("/<int:rid>", methods=["DELETE"])
def delete_review(rid):
    user, err = require_user()
    if err:
        return err
    review = CourseReview.query.get_or_404(rid)
    if review.user_id != user.id and not is_admin(user):
        return jsonify({"error": "Ruxsat yo'q."}), 403
    db.session.delete(review)
    db.session.commit()
    return jsonify({"message": "Sharh o'chirildi."}), 200


@reviews_bp.route("/<int:rid>/report", methods=["POST"])
def report_review(rid):
    user, err = require_user()
    if err:
        return err
    review = CourseReview.query.get_or_404(rid)
    reason = (request.get_json(silent=True) or {}).get("reason")
    return report("review", review, user, reason, lambda it: setattr(it, "is_active", False))
