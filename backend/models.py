from app import db
from datetime import datetime, date as date_type
from deadlines import days_left as _days_left, normalize_deadline as _norm_deadline


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    university = db.Column(db.String(100))
    funding_type = db.Column(db.String(20))
    region = db.Column(db.String(100))
    role = db.Column(db.String(20), default="student")
    is_verified = db.Column(db.Boolean, default=False)
    # When True, this user gets daily-digest emails about new internships
    # matching their university / region. Toggled from the Internships page
    # "Enable Alerts" button.
    job_alerts_enabled = db.Column(db.Boolean, default=False)
    job_digest_at = db.Column(db.DateTime)   # when the last daily job email went out (claimed before sending)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "university": self.university,
            "funding_type": self.funding_type,
            "region": self.region,
            "role": self.role,
            "is_verified": self.is_verified,
            "job_alerts_enabled": bool(self.job_alerts_enabled),
            "created_at": self.created_at.isoformat() + "Z",
        }


class AISession(db.Model):
    __tablename__ = "ai_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    messages = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref="ai_sessions")


class Club(db.Model):
    __tablename__ = "clubs"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    university = db.Column(db.String(100), default="NUU")
    # private — only shown to approved members
    telegram_link = db.Column(db.String(300))
    contact = db.Column(db.String(200))
    meeting_time = db.Column(db.String(150))
    location = db.Column(db.String(150))
    club_type = db.Column(db.String(20), default="club")  # "club" | "community"
    region = db.Column(db.String(100))
    website = db.Column(db.String(500))   # official university / community website
    cover_image = db.Column(db.String(500))  # optional cover photo URL (user-set or blank = picsum default)
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship("User", foreign_keys=[created_by], backref="owned_clubs")

    def to_dict(self, user_id=None, _memberships=None):
        # _memberships: pre-fetched list of ClubMembership for this club (avoids N+1 on list endpoints)
        if _memberships is not None:
            approved_count = sum(1 for m in _memberships if m.status == "approved")
            creator_in_memberships = any(
                m.user_id == self.created_by and m.status == "approved" for m in _memberships
            )
            my_status = None
            pending_count = 0
            if user_id:
                my_m = next((m for m in _memberships if m.user_id == user_id), None)
                if my_m:
                    my_status = my_m.status
                if self.created_by == user_id:
                    pending_count = sum(1 for m in _memberships if m.status == "pending")
        else:
            approved_count = ClubMembership.query.filter_by(club_id=self.id, status="approved").count()
            creator_in_memberships = ClubMembership.query.filter_by(
                club_id=self.id, user_id=self.created_by, status="approved"
            ).first() is not None
            pending_count = 0
            my_status = None
            if user_id:
                m = ClubMembership.query.filter_by(club_id=self.id, user_id=user_id).first()
                if m:
                    my_status = m.status
                if self.created_by == user_id:
                    pending_count = ClubMembership.query.filter_by(club_id=self.id, status="pending").count()

        is_approved_member = my_status == "approved" or self.created_by == user_id
        is_creator = self.created_by == user_id

        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "university": self.university,
            "meeting_time": self.meeting_time,
            "location": self.location,
            "is_active": self.is_active,
            # +1 for creator, unless creator also has a membership row (don't double-count)
            "member_count": approved_count + (0 if creator_in_memberships else 1),
            "pending_count": pending_count,
            "my_status": my_status,           # None / "pending" / "approved"
            "is_creator": is_creator,
            # Private info — only for approved members & creator
            "telegram_link": self.telegram_link if is_approved_member else None,
            "contact": self.contact if is_approved_member else None,
            "created_at": self.created_at.isoformat() + "Z",
            "creator_name": self.creator.name if self.creator else None,
            "club_type": self.club_type or "club",
            "region": self.region,
            "website": self.website or "",
            "cover_image": self.cover_image or "",
        }


class ClubMembership(db.Model):
    __tablename__ = "club_memberships"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    club_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=False, index=True)
    status = db.Column(db.String(20), default="pending", index=True)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("user_id", "club_id"),
        db.Index("ix_club_memberships_club_status", "club_id", "status"),
    )

    user = db.relationship("User", backref="club_memberships")
    club = db.relationship("Club", backref="memberships")


class AmbassadorApplication(db.Model):
    __tablename__ = "ambassador_applications"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    university = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(150))
    year = db.Column(db.String(10))
    region = db.Column(db.String(100))
    funding_type = db.Column(db.String(20))
    motivation = db.Column(db.Text)
    social = db.Column(db.String(300))   # Telegram username / Instagram / etc.
    status = db.Column(db.String(20), default="pending")  # pending | approved | rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "university": self.university,
            "department": self.department,
            "year": self.year,
            "region": self.region,
            "funding_type": self.funding_type,
            "motivation": self.motivation,
            "social": self.social,
            "status": self.status,
            "created_at": self.created_at.isoformat() + "Z",
        }


class Post(db.Model):
    """Community feed posts — can be posted as self, university, or club."""
    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    # What the post appears "from" — "user" | "university" | "club"
    posted_as_type = db.Column(db.String(20), default="user")
    posted_as_label = db.Column(db.String(150))   # e.g. "JBNU" or "Hiking Club"
    club_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship("User", foreign_keys=[user_id], backref="posts")
    club = db.relationship("Club", foreign_keys=[club_id], backref="posts")

    def to_dict(self, comment_count=None):
        # Callers serializing many posts at once should pass a pre-computed
        # comment_count (batched in one grouped query) to avoid an N+1 of
        # COUNT(*) queries. When omitted we fall back to a single lookup.
        if comment_count is None:
            comment_count = PostComment.query.filter_by(post_id=self.id).count()
        return {
            "id": self.id,
            "user_id": self.user_id,
            "author_name": self.author.name if self.author else "Unknown",
            "content": self.content,
            "posted_as_type": self.posted_as_type,
            "posted_as_label": self.posted_as_label,
            "club_id": self.club_id,
            "created_at": self.created_at.isoformat() + "Z",
            "comment_count": comment_count,
        }


class PostComment(db.Model):
    """Comments on community feed posts. Supports one-level threaded replies via parent_id."""
    __tablename__ = "post_comments"

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey("post_comments.id"), nullable=True, index=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "post_id": self.post_id,
            "user_id": self.user_id,
            "parent_id": self.parent_id,
            "author_name": self.author.name if self.author else "Unknown",
            "content": self.content,
            "created_at": self.created_at.isoformat() + "Z",
        }


class ClubMessage(db.Model):
    """Chat messages inside a club or community."""
    __tablename__ = "club_messages"

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    # Reply threading (nullable — not all messages are replies)
    reply_to_id      = db.Column(db.Integer, db.ForeignKey("club_messages.id"), nullable=True)
    reply_to_name    = db.Column(db.String(150), nullable=True)   # denormalized author name
    reply_to_content = db.Column(db.String(200), nullable=True)   # preview of original msg
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship("User", foreign_keys=[user_id])
    club = db.relationship("Club", foreign_keys=[club_id])

    def to_dict(self):
        return {
            "id": self.id,
            "club_id": self.club_id,
            "user_id": self.user_id,
            "author_name": self.author.name if self.author else "Unknown",
            "content": self.content,
            "reply_to_id": self.reply_to_id,
            "reply_to_name": self.reply_to_name,
            "reply_to_content": self.reply_to_content,
            "created_at": self.created_at.isoformat() + "Z",
        }


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150))
    job_type = db.Column(db.String(50))
    salary = db.Column(db.String(100))
    description = db.Column(db.Text)
    requirements = db.Column(db.Text)
    schedule_compatible = db.Column(db.String(200))
    deadline = db.Column(db.String(50))
    tags = db.Column(db.String(300))
    apply_link = db.Column(db.String(500))   # real application URL
    # AI-detected schedule flexibility for students. Set by the scraper
    # after translating Russian job posts via Groq.
    # Values: "yes" | "no" | "unclear" | "" (legacy/admin-entered)
    student_friendly = db.Column(db.String(20), default="")
    student_friendly_note = db.Column(db.String(300), default="")
    # Number of times a user clicked the "Apply" link. Tracked client-side
    # via a fire-and-forget POST and shown on cards as "N applied" so the
    # most-clicked listings get visible social proof.
    apply_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Scraper bookkeeping. source: "hh" for scraped rows, "" for admin-entered / seeded ones.
    # deadline_source: where `deadline` came from — "listing" (the site's own expiry), "text" (found in the
    # description) or "admin". closed_* explain why a scraped row was hidden; last_checked_at is the last
    # time the nightly check looked at the original posting.
    source = db.Column(db.String(20), default="")
    deadline_source = db.Column(db.String(12), default="")
    closed_reason = db.Column(db.String(40), default="")
    closed_at = db.Column(db.DateTime)
    last_checked_at = db.Column(db.DateTime)

    def to_dict(self):
        left = _days_left(self.deadline)
        return {
            "id": self.id,
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "type": self.job_type,
            "salary": self.salary,
            "description": self.description,
            "requirements": [r.strip() for r in (self.requirements or "").split("\n") if r.strip()],
            "schedule_compatible": [v.strip() for v in (self.schedule_compatible or "").split(",") if v.strip()],
            "deadline": _norm_deadline(self.deadline),
            "days_left": left,                                  # None = rolling / free-text deadline
            "closing_soon": left is not None and 0 <= left <= 5,
            "expired": left is not None and left < 0,
            "tags": [t.strip() for t in (self.tags or "").split(",") if t.strip()],
            "apply_link": self.apply_link or "",
            "student_friendly": self.student_friendly or "",
            "student_friendly_note": self.student_friendly_note or "",
            "apply_count": self.apply_count or 0,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() + "Z",
            "isNew": (datetime.utcnow() - self.created_at).days < 3,
        }


class Feedback(db.Model):
    __tablename__ = "feedback"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)  # null = anonymous
    name       = db.Column(db.String(120))   # filled for anon submissions
    email      = db.Column(db.String(200))   # filled for anon submissions
    rating     = db.Column(db.Integer)       # 1-5 stars (nullable)
    message    = db.Column(db.Text, nullable=False)
    page_url   = db.Column(db.String(500))   # captured client-side for context
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        # Prefer the authenticated user's profile info when available
        author_name = self.user.name if self.user else (self.name or "Anonymous")
        author_email = self.user.email if self.user else (self.email or "")
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": author_name,
            "email": author_email,
            "rating": self.rating,
            "message": self.message,
            "page_url": self.page_url or "",
            "created_at": self.created_at.isoformat() + "Z",
        }


class ChatPost(db.Model):
    """Reddit-style Q&A thread. Anyone signed in can post a question; anyone
    signed in can answer. Image is stored as a data URL (base64) so we don't
    depend on external image hosting."""
    __tablename__ = "chat_posts"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title      = db.Column(db.String(200), nullable=False)
    content    = db.Column(db.Text, nullable=False)
    image_url  = db.Column(db.Text)   # data:image/...;base64,... or external URL
    # Audience scope. Empty = global ("All Korea"). A normalized university
    # token (e.g. "jbnu") = visible ONLY inside that university's chat, never
    # in the global feed.
    scope      = db.Column(db.String(80), default="", index=True)
    is_active  = db.Column(db.Boolean, default=True)
    # The asker can mark one answer as the best one ("Hal qilindi"). No FK on purpose: answers are
    # soft-deleted and this keeps account deletion simple.
    accepted_answer_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self, include_answers=False):
        out = {
            "id": self.id,
            "user_id": self.user_id,
            "author_name": self.author.name if self.author else "Unknown",
            "author_university": (self.author.university if self.author else "") or "",
            "author_region": (self.author.region if self.author else "") or "",
            "title": self.title,
            "content": self.content,
            "scope": (self.scope or ""),
            "image_url": self.image_url or "",
            "accepted_answer_id": self.accepted_answer_id,
            "solved": bool(self.accepted_answer_id),
            "answer_count": ChatAnswer.query.filter_by(post_id=self.id, is_active=True).count(),
            "created_at": self.created_at.isoformat() + "Z",
        }
        if include_answers:
            answers = (
                ChatAnswer.query.filter_by(post_id=self.id, is_active=True)
                .order_by(ChatAnswer.created_at.asc()).all()
            )
            out["answers"] = [a.to_dict() for a in answers]
        return out


class ChatAnswer(db.Model):
    __tablename__ = "chat_answers"

    id         = db.Column(db.Integer, primary_key=True)
    post_id    = db.Column(db.Integer, db.ForeignKey("chat_posts.id"), nullable=False, index=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    content    = db.Column(db.Text, nullable=False)
    is_active  = db.Column(db.Boolean, default=True)
    report_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "post_id": self.post_id,
            "user_id": self.user_id,
            "author_name": self.author.name if self.author else "Unknown",
            "author_university": (self.author.university if self.author else "") or "",
            "author_region": (self.author.region if self.author else "") or "",
            "content": self.content,
            "created_at": self.created_at.isoformat() + "Z",
        }


class PageVisit(db.Model):
    """One row per calendar day — stores how many sessions visited that day."""
    __tablename__ = "page_visits"

    id    = db.Column(db.Integer, primary_key=True)
    date  = db.Column(db.Date, nullable=False, unique=True, index=True)
    count = db.Column(db.Integer, default=0, nullable=False)

    def to_dict(self):
        return {"date": self.date.isoformat(), "count": self.count}


# ── Community services: course reviews, marketplace, lost & found, sync ──────

def _iso(dt):
    return dt.isoformat() + "Z" if dt else None


class CourseReview(db.Model):
    """One student's anonymous review of one course (subject + teacher + university).

    The author is stored for accountability/moderation but is NEVER exposed in
    to_dict(); the API only tells a viewer whether a review is theirs.
    """
    __tablename__ = "course_reviews"
    __table_args__ = (
        db.UniqueConstraint("user_id", "subject_key", "teacher_key", "university",
                            name="uq_review_user_course"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    subject = db.Column(db.String(120), nullable=False)
    subject_key = db.Column(db.String(120), nullable=False, index=True)   # lower-cased, whitespace-collapsed
    teacher = db.Column(db.String(120))
    teacher_key = db.Column(db.String(120), nullable=False, default="", index=True)
    university = db.Column(db.String(120), nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False)          # 1–5 overall
    difficulty = db.Column(db.Integer)                      # 1–5, optional
    recommend = db.Column(db.Boolean)                       # optional
    text = db.Column(db.Text)
    report_count = db.Column(db.Integer, default=0, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, viewer_id=None):
        return {
            "id": self.id,
            "subject": self.subject,
            "teacher": self.teacher or "",
            "university": self.university,
            "rating": self.rating,
            "difficulty": self.difficulty,
            "recommend": self.recommend,
            "text": self.text or "",
            "created_at": _iso(self.created_at),
            "is_mine": bool(viewer_id and viewer_id == self.user_id),
        }


class MarketItem(db.Model):
    __tablename__ = "market_items"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(30), nullable=False, index=True)
    condition = db.Column(db.String(20))                    # yangi | yaxshi | ishlatilgan
    price = db.Column(db.Integer)                           # so'm; NULL = kelishiladi, 0 = tekin
    university = db.Column(db.String(120), index=True)
    region = db.Column(db.String(100), index=True)
    contact = db.Column(db.String(120), nullable=False)     # shown to signed-in users only
    status = db.Column(db.String(12), default="active", nullable=False, index=True)  # active | sold | hidden
    report_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    seller = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self, viewer_id=None):
        mine = bool(viewer_id and viewer_id == self.user_id)
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description or "",
            "category": self.category,
            "condition": self.condition or "",
            "price": self.price,
            "university": self.university or "",
            "region": self.region or "",
            "status": self.status,
            "seller_name": (self.seller.name.split(" ")[0] if self.seller and self.seller.name else "Talaba"),
            # contact details are only revealed to signed-in users
            "contact": self.contact if viewer_id else None,
            "created_at": _iso(self.created_at),
            "is_mine": mine,
        }


class LostFoundItem(db.Model):
    __tablename__ = "lost_found_items"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    kind = db.Column(db.String(8), nullable=False, index=True)           # lost | found
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    place = db.Column(db.String(160), nullable=False)
    happened_on = db.Column(db.Date, nullable=False)
    university = db.Column(db.String(120), index=True)
    contact = db.Column(db.String(120), nullable=False)
    status = db.Column(db.String(12), default="open", nullable=False, index=True)  # open | resolved | hidden
    report_count = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self, viewer_id=None):
        return {
            "id": self.id,
            "kind": self.kind,
            "title": self.title,
            "description": self.description or "",
            "place": self.place,
            "happened_on": self.happened_on.isoformat(),
            "university": self.university or "",
            "status": self.status,
            "contact": self.contact if viewer_id else None,
            "created_at": _iso(self.created_at),
            "is_mine": bool(viewer_id and viewer_id == self.user_id),
        }


class ContentReport(db.Model):
    """A signed-in user flagging a review / listing. One report per user per item."""
    __tablename__ = "content_reports"
    __table_args__ = (
        db.UniqueConstraint("user_id", "kind", "item_id", name="uq_report_once"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    kind = db.Column(db.String(12), nullable=False)       # review | market | lostfound
    item_id = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class UserSync(db.Model):
    """Per-user blob of toolkit data (timetable, GPA, planner, …) for cross-device sync.

    `data` maps a whitelisted key -> {"v": <value>, "t": <client ms timestamp>}.
    Merge is last-write-wins per key.
    """
    __tablename__ = "user_sync"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    data = db.Column(db.JSON, default=dict)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ── Web push reminders ───────────────────────────────────────────────────────

class PushSubscription(db.Model):
    """A browser/device that agreed to receive class, exam and task reminders."""
    __tablename__ = "push_subscriptions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    endpoint = db.Column(db.String(600), nullable=False, unique=True)
    p256dh = db.Column(db.String(200), nullable=False)
    auth = db.Column(db.String(100), nullable=False)
    prefs = db.Column(db.JSON, default=dict)          # {"classMin": 15, "exams": true, "tasks": true}
    user_agent = db.Column(db.String(200))
    failures = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class SentReminder(db.Model):
    """Dedupe log: one row per (subscription, reminder key) so nothing is sent twice."""
    __tablename__ = "sent_reminders"
    __table_args__ = (db.UniqueConstraint("subscription_id", "key", name="uq_sent_once"),)

    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey("push_subscriptions.id"), nullable=False, index=True)
    key = db.Column(db.String(160), nullable=False)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)


# ── Direct messages, blocking ────────────────────────────────────────────────

class DirectMessage(db.Model):
    """One private message between two students. `read_at` is set when the recipient opens the thread."""
    __tablename__ = "direct_messages"
    __table_args__ = (
        db.Index("ix_dm_pair_time", "sender_id", "recipient_id", "created_at"),
    )

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    read_at = db.Column(db.DateTime)

    def to_dict(self, viewer_id=None):
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "recipient_id": self.recipient_id,
            "body": self.body,
            "created_at": _iso(self.created_at),
            "read": self.read_at is not None,
            "mine": bool(viewer_id and viewer_id == self.sender_id),
        }


class UserBlock(db.Model):
    """`blocker` does not want to hear from `blocked` (neither can write to the other)."""
    __tablename__ = "user_blocks"
    __table_args__ = (db.UniqueConstraint("blocker_id", "blocked_id", name="uq_block_once"),)

    id = db.Column(db.Integer, primary_key=True)
    blocker_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    blocked_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ── Club events, news, CV file, phone push tokens ────────────────────────────

class ClubEvent(db.Model):
    __tablename__ = "club_events"

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey("clubs.id"), nullable=False, index=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    starts_at = db.Column(db.DateTime, nullable=False, index=True)   # naive UTC
    location = db.Column(db.String(160))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    club = db.relationship("Club", foreign_keys=[club_id])

    def to_dict(self, viewer_id=None):
        return {
            "id": self.id,
            "club_id": self.club_id,
            "club_name": self.club.name if self.club else "",
            "title": self.title,
            "description": self.description or "",
            "starts_at": _iso(self.starts_at),
            "location": self.location or "",
            "is_mine": bool(viewer_id and viewer_id == self.created_by),
        }


class NewsItem(db.Model):
    """University / education news posted by an administrator. Old items stop showing after 120 days."""
    __tablename__ = "news_items"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    summary = db.Column(db.Text)
    url = db.Column(db.String(500))
    source = db.Column(db.String(120))
    published_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "summary": self.summary or "",
            "url": self.url or "",
            "source": self.source or "",
            "published_at": _iso(self.published_at),
        }


class CvFile(db.Model):
    """The student's uploaded CV (PDF or Word, ≤ 2 MB). Only its owner can ever read it."""
    __tablename__ = "cv_files"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    filename = db.Column(db.String(200), nullable=False)
    mime = db.Column(db.String(100), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    data = db.Column(db.LargeBinary, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def meta(self):
        return {"filename": self.filename, "mime": self.mime, "size": self.size, "updated_at": _iso(self.updated_at)}


class DeviceToken(db.Model):
    """An Expo push token of the phone app (iOS / Android)."""
    __tablename__ = "device_tokens"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    token = db.Column(db.String(200), nullable=False, unique=True)
    platform = db.Column(db.String(12))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
