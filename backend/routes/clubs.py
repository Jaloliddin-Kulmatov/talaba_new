from collections import defaultdict

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from sqlalchemy.orm import joinedload

from app import db
from models import Club, ClubMembership, User, ClubMessage

clubs_bp = Blueprint("clubs", __name__)

# ── University alias table ────────────────────────────────────
# Maps every canonical short-name to a list of known variants so that
# "NUU", "nuu", "Milliy universitet", "O'zbekiston Milliy universiteti"
# all match. Not exhaustive — the frontend's constants.ts holds the
# canonical university list; this is just enough for flexible matching.
_UNI_ALIASES: dict[str, list[str]] = {
    "nuu":    ["nuu", "milliy universitet", "o'zbekiston milliy universiteti", "mirzo ulug'bek"],
    "tatu":   ["tatu", "axborot texnologiyalari universiteti", "toshkent axborot texnologiyalari"],
    "tdiu":   ["tdiu", "iqtisodiyot universiteti", "toshkent davlat iqtisodiyot"],
    "tta":    ["tta", "tibbiyot akademiyasi", "toshkent tibbiyot akademiyasi"],
    "tdtu":   ["tdtu", "texnika universiteti", "toshkent davlat texnika"],
    "tdpu":   ["tdpu", "pedagogika universiteti", "nizomiy nomidagi"],
    "wiut":   ["wiut", "vestminster", "westminster"],
    "tmi":    ["tmi", "moliya instituti", "toshkent moliya"],
    "sammu":  ["sammu", "samarqand davlat tibbiyot"],
    "andqu":  ["andqu", "andijon davlat universiteti"],
}

def _uni_matches(user_uni: str, club_uni: str) -> bool:
    """Return True if the two university strings refer to the same institution.
    Handles abbreviations, full names, and case differences."""
    u = user_uni.lower().strip()
    c = club_uni.lower().strip()
    if not u or not c:
        return False
    if u == c:
        return True
    # substring containment (e.g. "jbnu" ⊂ "jbnu international students")
    if u in c or c in u:
        return True
    # alias table lookup
    for _canonical, variants in _UNI_ALIASES.items():
        u_hit = any(v in u for v in variants)
        c_hit = any(v in c for v in variants)
        if u_hit and c_hit:
            return True
    return False


def _current_user_id():
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        return int(identity) if identity else None
    except Exception:
        return None


# ── Fast counts (no auth needed) ─────────────────────────────

@clubs_bp.route("/counts", methods=["GET"])
def club_counts():
    from sqlalchemy import func
    rows = (
        db.session.query(Club.club_type, func.count(Club.id))
        .filter_by(is_active=True)
        .group_by(Club.club_type)
        .all()
    )
    result = {"clubs": 0, "communities": 0}
    for ctype, cnt in rows:
        result["communities" if ctype == "community" else "clubs"] += cnt
    return jsonify(result), 200


# ── List clubs ────────────────────────────────────────────────
# Rules:
#   club_type == "community"  → visible to every authenticated user
#   club_type == "club"       → visible only to users whose university
#                               matches the club's university field (flexible)
#   unauthenticated request   → communities only

@clubs_bp.route("", methods=["GET"])
def list_clubs():
    user_id = _current_user_id()

    user_uni = None
    if user_id:
        u = User.query.get(user_id)
        if u:
            user_uni = (u.university or "").strip()

    # Eager-load the creator relationship so to_dict()'s `self.creator.name`
    # doesn't fire one lazy SELECT per club (was an N+1 — ~90 round-trips to
    # Neon, ~30s on the free tier; collapses to a single JOIN here).
    all_clubs = (
        Club.query.options(joinedload(Club.creator))
        .filter_by(is_active=True)
        .order_by(Club.created_at.desc())
        .all()
    )

    visible = []
    for c in all_clubs:
        ctype = (c.club_type or "club").lower()
        if ctype == "community":
            visible.append(c)
        elif user_uni and _uni_matches(user_uni, c.university or ""):
            visible.append(c)

    if not visible:
        return jsonify({"clubs": []}), 200

    # Fetch all memberships for visible clubs in a single query (avoids N+1)
    visible_ids = [c.id for c in visible]
    all_memberships = ClubMembership.query.filter(
        ClubMembership.club_id.in_(visible_ids)
    ).all()
    memberships_by_club: dict = defaultdict(list)
    for m in all_memberships:
        memberships_by_club[m.club_id].append(m)

    return jsonify({
        "clubs": [
            c.to_dict(user_id=user_id, _memberships=memberships_by_club[c.id])
            for c in visible
        ]
    }), 200


# ── Create a club (any authenticated user) ───────────────────

@clubs_bp.route("", methods=["POST"])
@jwt_required()
def create_club():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Klub nomi kiritilishi shart."}), 400

    club_type_val = (data.get("club_type") or "club").strip()
    # Communities are nationwide — don't default their university to NUU.
    # Clubs without a university supplied still default to NUU.
    default_uni = "" if club_type_val == "community" else "NUU"

    club = Club(
        name=name,
        description=(data.get("description") or "").strip(),
        category=(data.get("category") or "social").strip(),
        university=(data.get("university") or default_uni).strip(),
        telegram_link=(data.get("telegram_link") or "").strip(),
        contact=(data.get("contact") or "").strip(),
        meeting_time=(data.get("meeting_time") or "").strip(),
        location=(data.get("location") or "").strip(),
        club_type=club_type_val,
        region=(data.get("region") or "").strip(),
        created_by=user_id,
    )
    db.session.add(club)
    db.session.commit()
    return jsonify({"club": club.to_dict(user_id=user_id)}), 201


# ── Request to join (auto-approved for now) ───────────────────

@clubs_bp.route("/<int:club_id>/request", methods=["POST"])
@jwt_required()
def request_join(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    if not club.is_active:
        return jsonify({"error": "Klub topilmadi."}), 404
    if club.created_by == user_id:
        return jsonify({"error": "Siz bu klubning yaratuvchisisiz."}), 400

    existing = ClubMembership.query.filter_by(user_id=user_id, club_id=club_id).first()
    if existing:
        # If they were stuck in "pending" from before this change, promote
        # them to approved so nobody is permanently waiting.
        if existing.status != "approved":
            existing.status = "approved"
            db.session.commit()
            return jsonify({
                "message": "Xush kelibsiz! Endi siz a'zosiz.",
                "club": club.to_dict(user_id=user_id),
            }), 200
        return jsonify({"error": "Siz allaqachon a'zosiz.", "status": existing.status}), 409

    # Auto-approve every join request for now — no creator review step.
    # (Flip back to status="pending" if/when we want gated joining.)
    membership = ClubMembership(user_id=user_id, club_id=club_id, status="approved")
    db.session.add(membership)
    db.session.commit()
    return jsonify({
        "message": "Welcome! You're now a member.",
        "club": club.to_dict(user_id=user_id),
    }), 200


# ── Leave a club ──────────────────────────────────────────────

@clubs_bp.route("/<int:club_id>/leave", methods=["POST"])
@jwt_required()
def leave_club(club_id):
    user_id = int(get_jwt_identity())
    membership = ClubMembership.query.filter_by(user_id=user_id, club_id=club_id).first()
    if not membership:
        return jsonify({"error": "Siz a'zo emassiz."}), 404
    db.session.delete(membership)
    db.session.commit()
    club = Club.query.get_or_404(club_id)
    return jsonify({"message": "Klubdan chiqdingiz.", "club": club.to_dict(user_id=user_id)}), 200


# ── Get pending requests (creator only) ──────────────────────

@clubs_bp.route("/<int:club_id>/requests", methods=["GET"])
@jwt_required()
def get_requests(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    if club.created_by != user_id:
        return jsonify({"error": "Faqat klub yaratuvchisi so'rovlarni ko'ra oladi."}), 403

    pending = ClubMembership.query.filter_by(club_id=club_id, status="pending").all()
    result = []
    for m in pending:
        u = User.query.get(m.user_id)
        if u:
            result.append({
                "membership_id": m.id,
                "user_id": u.id,
                "name": u.name,
                "email": u.email,
                "university": u.university,
                "region": u.region,
                "funding_type": u.funding_type,
                "requested_at": m.joined_at.isoformat() + "Z",
            })
    return jsonify({"requests": result}), 200


# ── Approve / reject ──────────────────────────────────────────

@clubs_bp.route("/<int:club_id>/approve/<int:target_user_id>", methods=["POST"])
@jwt_required()
def approve_member(club_id, target_user_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    if club.created_by != user_id:
        return jsonify({"error": "Faqat klub yaratuvchisi a'zolarni tasdiqlashi mumkin."}), 403

    membership = ClubMembership.query.filter_by(club_id=club_id, user_id=target_user_id).first()
    if not membership:
        return jsonify({"error": "So'rov topilmadi."}), 404

    membership.status = "approved"
    db.session.commit()
    return jsonify({"message": "A'zo tasdiqlandi."}), 200


@clubs_bp.route("/<int:club_id>/reject/<int:target_user_id>", methods=["POST"])
@jwt_required()
def reject_member(club_id, target_user_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    if club.created_by != user_id:
        return jsonify({"error": "Faqat klub yaratuvchisi a'zolarni rad etishi mumkin."}), 403

    membership = ClubMembership.query.filter_by(club_id=club_id, user_id=target_user_id).first()
    if not membership:
        return jsonify({"error": "So'rov topilmadi."}), 404

    db.session.delete(membership)
    db.session.commit()
    return jsonify({"message": "So'rov rad etildi."}), 200


# ── Get approved members (creator or any approved member) ─────

@clubs_bp.route("/<int:club_id>/members", methods=["GET"])
@jwt_required()
def get_members(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)

    is_creator  = club.created_by == user_id
    is_approved = ClubMembership.query.filter_by(
        club_id=club_id, user_id=user_id, status="approved"
    ).first() is not None

    if not is_creator and not is_approved:
        return jsonify({"error": "Faqat klub a'zolari a'zolar ro'yxatini ko'ra oladi."}), 403

    approved = ClubMembership.query.filter_by(club_id=club_id, status="approved").all()
    result = []
    for m in approved:
        u = User.query.get(m.user_id)
        if u:
            # If this approved member is also the creator, tag them so the
            # frontend can render the crown badge.
            is_owner = u.id == club.created_by
            result.append({
                "membership_id": m.id,
                "user_id": u.id,
                "name": u.name + (" (Yaratuvchi)" if is_owner else ""),
                "university": u.university,
                "region": u.region,
                "funding_type": u.funding_type,
                "joined_at": m.joined_at.isoformat() + "Z",
            })

    # Always include the creator at the top of the list (if not already in it)
    creator_ids = {r["user_id"] for r in result}
    if club.created_by not in creator_ids:
        creator_user = User.query.get(club.created_by)
        if creator_user:
            result.insert(0, {
                "membership_id": None,
                "user_id": creator_user.id,
                "name": creator_user.name + " (Yaratuvchi)",
                "university": creator_user.university,
                "region": creator_user.region,
                "funding_type": creator_user.funding_type,
                "joined_at": club.created_at.isoformat() + "Z",
            })
    else:
        # Creator is already in the list — move them to the top
        result.sort(key=lambda r: 0 if r["user_id"] == club.created_by else 1)

    return jsonify({"members": result, "is_creator": is_creator}), 200


# ── My clubs (created + joined) ───────────────────────────────

@clubs_bp.route("/mine", methods=["GET"])
@jwt_required()
def my_clubs():
    user_id = int(get_jwt_identity())
    created = Club.query.filter_by(created_by=user_id, is_active=True).all()
    memberships = ClubMembership.query.filter_by(user_id=user_id).all()
    joined_clubs = [m.club for m in memberships if m.club and m.club.is_active]

    return jsonify({
        "created": [c.to_dict(user_id=user_id) for c in created],
        "joined": [c.to_dict(user_id=user_id) for c in joined_clubs],
    }), 200


# ── Get a single club (public) ───────────────────────────────

@clubs_bp.route("/<int:club_id>", methods=["GET"])
def get_club(club_id):
    user_id = _current_user_id()
    club = Club.query.get_or_404(club_id)
    if not club.is_active:
        return jsonify({"error": "Klub topilmadi."}), 404
    return jsonify({"club": club.to_dict(user_id=user_id)}), 200


# ── Edit a club (creator only) ────────────────────────────────

@clubs_bp.route("/<int:club_id>", methods=["PATCH"])
@jwt_required()
def edit_club(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)

    if club.created_by != user_id:
        return jsonify({"error": "Faqat klub yaratuvchisi bu klubni tahrirlashi mumkin."}), 403

    data = request.get_json(silent=True) or {}
    editable = ["name", "description", "category", "meeting_time",
                "location", "contact", "telegram_link", "website", "region", "cover_image"]
    for field in editable:
        if field in data:
            setattr(club, field, (data[field] or "").strip())

    db.session.commit()
    return jsonify({"club": club.to_dict(user_id=user_id)}), 200


# ── Delete a club (creator only, soft-delete) ─────────────────

@clubs_bp.route("/<int:club_id>", methods=["DELETE"])
@jwt_required()
def delete_club(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    if club.created_by != user_id:
        return jsonify({"error": "Faqat klub yaratuvchisi bu klubni o'chirishi mumkin."}), 403
    club.is_active = False
    db.session.commit()
    return jsonify({"message": "Klub o'chirildi."}), 200


# ── Kick a member (creator only) ─────────────────────────────

@clubs_bp.route("/<int:club_id>/kick/<int:target_user_id>", methods=["DELETE"])
@jwt_required()
def kick_member(club_id, target_user_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    if club.created_by != user_id:
        return jsonify({"error": "Faqat klub yaratuvchisi a'zolarni chiqarib yuborishi mumkin."}), 403
    if target_user_id == user_id:
        return jsonify({"error": "O'zingizni chiqarib yubora olmaysiz."}), 400
    membership = ClubMembership.query.filter_by(
        club_id=club_id, user_id=target_user_id
    ).first()
    if not membership:
        return jsonify({"error": "Foydalanuvchi a'zo emas."}), 404
    db.session.delete(membership)
    db.session.commit()
    return jsonify({"message": "A'zo chiqarib yuborildi."}), 200


# ── Club chat: get messages ───────────────────────────────────

@clubs_bp.route("/<int:club_id>/chat", methods=["GET"])
@jwt_required()
def get_chat(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    is_member = club.created_by == user_id or ClubMembership.query.filter_by(
        club_id=club_id, user_id=user_id, status="approved"
    ).first() is not None
    if not is_member:
        return jsonify({"error": "Faqat a'zolar uchun."}), 403
    after_id = request.args.get("after", 0, type=int)
    msgs = (ClubMessage.query
            .filter(ClubMessage.club_id == club_id, ClubMessage.id > after_id)
            .order_by(ClubMessage.created_at.asc()).limit(100).all())
    return jsonify({"messages": [m.to_dict() for m in msgs]}), 200


# ── Club chat: send message ───────────────────────────────────

@clubs_bp.route("/<int:club_id>/chat", methods=["POST"])
@jwt_required()
def send_chat(club_id):
    user_id = int(get_jwt_identity())
    club = Club.query.get_or_404(club_id)
    is_member = club.created_by == user_id or ClubMembership.query.filter_by(
        club_id=club_id, user_id=user_id, status="approved"
    ).first() is not None
    if not is_member:
        return jsonify({"error": "Faqat a'zolar uchun."}), 403
    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "Xabar bo'sh bo'lishi mumkin emas."}), 400
    if len(content) > 1000:
        return jsonify({"error": "Xabar juda uzun."}), 400

    # Optional reply threading
    reply_to_id = data.get("reply_to_id")
    reply_to_name = None
    reply_to_content = None
    if reply_to_id:
        parent = ClubMessage.query.get(int(reply_to_id))
        if parent and parent.club_id == club_id:
            reply_to_name = parent.author.name if parent.author else "Unknown"
            reply_to_content = parent.content[:150]

    msg = ClubMessage(
        club_id=club_id, user_id=user_id, content=content,
        reply_to_id=reply_to_id if reply_to_id else None,
        reply_to_name=reply_to_name,
        reply_to_content=reply_to_content,
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({"message": msg.to_dict()}), 201
