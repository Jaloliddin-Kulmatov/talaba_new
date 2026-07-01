"""
Page-visit tracking endpoint.
Called once per browser session from the frontend VisitTracker component.
No auth required — increments a daily counter in page_visits.
"""

from flask import Blueprint, jsonify
from datetime import date

track_bp = Blueprint("track", __name__)


@track_bp.route("/stats", methods=["GET"])
def member_stats():
    """Public member counts for the landing page.

    Returns total registered members and how many are NUU (O'zbekiston Milliy
    universiteti) students. No auth — safe, aggregate numbers only. Degrades
    to zeros on any error.
    """
    from models import User
    try:
        total = User.query.count()
        # university is stored as the lowercase id ("nuu"); match common variants.
        nuu = User.query.filter(
            db_lower(User.university).in_([
                "nuu", "milliy universitet", "o'zbekiston milliy universiteti",
                "ozbekiston milliy universiteti",
            ])
        ).count()
    except Exception:
        total, nuu = 0, 0
    return jsonify({"total_members": total, "nuu_members": nuu}), 200


def db_lower(col):
    """Case-insensitive helper that works across SQLite/Postgres."""
    from sqlalchemy import func
    return func.lower(func.coalesce(col, ""))


@track_bp.route("/visit", methods=["POST"])
def record_visit():
    """Bump today's visit count by 1.  Silently succeeds even on DB error
    so a tracking failure never breaks the page load for the user."""
    from app import db
    from models import PageVisit
    try:
        today = date.today()
        row = PageVisit.query.filter_by(date=today).first()
        if row:
            row.count += 1
        else:
            row = PageVisit(date=today, count=1)
            db.session.add(row)
        db.session.commit()
    except Exception:
        try:
            db.session.rollback()
        except Exception:
            pass
    return jsonify({"ok": True}), 200
