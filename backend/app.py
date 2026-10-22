from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
from datetime import timedelta
import os

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()


def normalize_db_url(url: str) -> str:
    """Hosts hand out postgres:// or postgresql://; we always want the psycopg2 driver explicitly.

    SQLAlchemy 2.1 changed the default driver for postgresql:// to psycopg (v3), which is not installed here —
    the service then crashes at boot with "No module named 'psycopg'". Naming the driver avoids that.
    """
    url = (url or "").strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "jwt-secret-change-me")
    db_url = normalize_db_url(os.environ.get("DATABASE_URL", "sqlite:///talaba.db"))
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    engine_options = {"pool_pre_ping": True}
    if db_url.startswith("postgresql"):
        engine_options.update(pool_size=5, max_overflow=10, pool_recycle=300, pool_timeout=20)
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = engine_options
    # Tokens expire after 30 days for every auth path (email/password AND Google),
    # so a leaked token can't grant access forever. Override per-token with
    # expires_delta if a specific flow needs a different lifetime.
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30)

    # FRONTEND_URL may list several origins, comma-separated (e.g. production + a Vercel preview alias).
    allowed_origins = [o.strip().rstrip("/") for o in os.environ.get("FRONTEND_URL", "http://localhost:3000").split(",") if o.strip()]

    @app.after_request
    def add_cors_headers(response):
        origin = (request.headers.get("Origin") or "").rstrip("/")
        # Echo the caller's origin only if it is on the list; otherwise fall back to the first one.
        response.headers["Access-Control-Allow-Origin"] = origin if origin in allowed_origins else allowed_origins[0]
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    @app.before_request
    def handle_options():
        if request.method == "OPTIONS":
            from flask import make_response
            resp = make_response()
            resp.status_code = 200
            return resp

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    from routes.auth import auth_bp
    from routes.ai import ai_bp
    from routes.admin import admin_bp
    from routes.clubs import clubs_bp
    from routes.ambassador import ambassador_bp
    from routes.posts import posts_bp
    from routes.search import search_bp
    from routes.feedback import feedback_bp
    from routes.chat import chat_bp
    from routes.track import track_bp
    from routes.reviews import reviews_bp
    from routes.market import market_bp
    from routes.lostfound import lostfound_bp
    from routes.sync import sync_bp
    from routes.moderation import moderation_bp
    from routes.push import push_bp
    from routes.messages import messages_bp
    from routes.news import news_bp
    from routes.cvfile import cv_bp
    from routes.alerts import alerts_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(clubs_bp, url_prefix="/api/clubs")
    app.register_blueprint(ambassador_bp, url_prefix="/api/ambassador")
    app.register_blueprint(posts_bp, url_prefix="/api/posts")
    app.register_blueprint(search_bp, url_prefix="/api/search")
    app.register_blueprint(feedback_bp, url_prefix="/api/feedback")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(track_bp, url_prefix="/api/track")
    app.register_blueprint(reviews_bp, url_prefix="/api/reviews")
    app.register_blueprint(market_bp, url_prefix="/api/market")
    app.register_blueprint(lostfound_bp, url_prefix="/api/lostfound")
    app.register_blueprint(sync_bp, url_prefix="/api/sync")
    app.register_blueprint(moderation_bp, url_prefix="/api/moderation")
    app.register_blueprint(push_bp, url_prefix="/api/push")
    app.register_blueprint(messages_bp, url_prefix="/api/messages")
    app.register_blueprint(news_bp, url_prefix="/api/news")
    app.register_blueprint(cv_bp, url_prefix="/api/cv")
    app.register_blueprint(alerts_bp, url_prefix="/api/alerts")

    @app.route("/")
    def index():
        return jsonify({"status": "ok", "service": "TALABA API", "version": "1.0", "frontend": "http://localhost:3000"})

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"}), 200

    with app.app_context():
        db.create_all()
        _run_lightweight_migrations()
        _seed_regional_communities()
        _seed_university_clubs()
        _seed_chat_threads()
        _seed_talaba_jobs()

    # NOTE: the background scheduler is started once at module load via
    # _start_scheduler(app) at the bottom of this file (the canonical
    # definition that schedules both the hh.uz scraper and the daily
    # expired-job cleanup). It is intentionally NOT started here to avoid
    # spinning up a second, duplicate scheduler on every boot.

    return app


def _run_lightweight_migrations():
    """Add columns that were introduced after the table was first created.
    Runs at startup — safe to call repeatedly (each migration checks first)."""
    from sqlalchemy import inspect, text
    insp = inspect(db.engine)

    # parent_id on post_comments (threaded replies)
    try:
        if "post_comments" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("post_comments")]
            if "parent_id" not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE post_comments "
                        "ADD COLUMN parent_id INTEGER REFERENCES post_comments(id)"
                    ))
                print("[migration] Added post_comments.parent_id")
    except Exception as e:
        print(f"[migration] post_comments.parent_id failed (probably already done): {e}")

    # social on ambassador_applications (added after initial table creation)
    try:
        if "ambassador_applications" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("ambassador_applications")]
            if "social" not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE ambassador_applications "
                        "ADD COLUMN social VARCHAR(300)"
                    ))
                print("[migration] Added ambassador_applications.social")
    except Exception as e:
        print(f"[migration] ambassador_applications.social failed (probably already done): {e}")

    # apply_link on jobs (added after initial table creation)
    try:
        if "jobs" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("jobs")]
            if "apply_link" not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE jobs "
                        "ADD COLUMN apply_link VARCHAR(500)"
                    ))
                print("[migration] Added jobs.apply_link")
    except Exception as e:
        print(f"[migration] jobs.apply_link failed (probably already done): {e}")

    # website on clubs (official university / community website)
    try:
        if "clubs" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("clubs")]
            if "website" not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE clubs "
                        "ADD COLUMN website VARCHAR(500)"
                    ))
                print("[migration] Added clubs.website")
    except Exception as e:
        print(f"[migration] clubs.website failed (probably already done): {e}")

    # student_friendly + student_friendly_note on jobs (AI-detected schedule
    # flexibility from Russian job posts during scraping). apply_count tracks
    # how many users clicked the Apply button — shown as "N ta ariza" on cards.
    for col_name, col_def in [
        ("student_friendly",      "VARCHAR(20) DEFAULT ''"),
        ("student_friendly_note", "VARCHAR(300) DEFAULT ''"),
        ("apply_count",           "INTEGER DEFAULT 0"),
    ]:
        try:
            if "jobs" in insp.get_table_names():
                cols = [c["name"] for c in insp.get_columns("jobs")]
                if col_name not in cols:
                    with db.engine.begin() as conn:
                        conn.execute(text(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_def}"))
                    print(f"[migration] Added jobs.{col_name}")
        except Exception as e:
            print(f"[migration] jobs.{col_name} failed (probably already done): {e}")

    # job_alerts_enabled on users — opt-in for new-internship digests.
    try:
        if "users" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("users")]
            if "job_alerts_enabled" not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE users ADD COLUMN job_alerts_enabled BOOLEAN DEFAULT FALSE"
                    ))
                print("[migration] Added users.job_alerts_enabled")
    except Exception as e:
        print(f"[migration] users.job_alerts_enabled failed (probably already done): {e}")

    # columns added after the first release of the Q&A chat, the job-alert e-mails and the smarter scraper
    for table, col_name, col_def in [
        ("jobs", "source", "VARCHAR(20) DEFAULT ''"),
        ("jobs", "deadline_source", "VARCHAR(12) DEFAULT ''"),
        ("jobs", "closed_reason", "VARCHAR(40) DEFAULT ''"),
        ("jobs", "closed_at", "TIMESTAMP"),
        ("jobs", "last_checked_at", "TIMESTAMP"),
        ("chat_posts", "accepted_answer_id", "INTEGER"),
        ("chat_answers", "report_count", "INTEGER DEFAULT 0 NOT NULL"),
        ("users", "job_digest_at", "TIMESTAMP"),
    ]:
        try:
            if table in insp.get_table_names():
                cols = [c["name"] for c in insp.get_columns(table)]
                if col_name not in cols:
                    with db.engine.begin() as conn:
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}"))
                    print(f"[migration] Added {table}.{col_name}")
        except Exception as e:
            print(f"[migration] {table}.{col_name} failed (probably already done): {e}")

    # scope on chat_posts — audience targeting. Empty = global ("Butun O'zbekiston"),
    # a university token (e.g. "nuu") = that university's chat only.
    try:
        if "chat_posts" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("chat_posts")]
            if "scope" not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "ALTER TABLE chat_posts ADD COLUMN scope VARCHAR(80) DEFAULT ''"
                    ))
                print("[migration] Added chat_posts.scope")
    except Exception as e:
        print(f"[migration] chat_posts.scope failed (probably already done): {e}")

    # cover_image on clubs (optional user-set cover photo URL)
    try:
        if "clubs" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("clubs")]
            if "cover_image" not in cols:
                with db.engine.begin() as conn:
                    conn.execute(text("ALTER TABLE clubs ADD COLUMN cover_image VARCHAR(500)"))
                print("[migration] Added clubs.cover_image")
    except Exception as e:
        print(f"[migration] clubs.cover_image failed (probably already done): {e}")

    # page_visits table — daily visit counter (created by db.create_all if absent)
    # Just ensure it exists; SQLAlchemy creates it via the PageVisit model above.
    try:
        from models import PageVisit  # noqa: F401 — import ensures table is registered
    except Exception:
        pass

    # ── Search indexes for fast LIKE/ILIKE queries ───────────────────────────
    # PostgreSQL only — silently skipped on SQLite
    try:
        dialect = db.engine.dialect.name
        if dialect == "postgresql":
            with db.engine.begin() as conn:
                conn.execute(text(
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clubs_name_trgm "
                    "ON clubs USING gin (lower(name) gin_trgm_ops)"
                ))
                conn.execute(text(
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_title_trgm "
                    "ON jobs USING gin (lower(title) gin_trgm_ops)"
                ))
                conn.execute(text(
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_company_trgm "
                    "ON jobs USING gin (lower(company) gin_trgm_ops)"
                ))
            print("[migration] Search trigram indexes created/verified")
    except Exception as e:
        # pg_trgm extension may not be enabled — fall back to regular B-tree indexes
        try:
            dialect = db.engine.dialect.name
            if dialect == "postgresql":
                with db.engine.begin() as conn:
                    conn.execute(text(
                        "CREATE INDEX IF NOT EXISTS idx_clubs_name ON clubs (lower(name))"
                    ))
                    conn.execute(text(
                        "CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs (lower(title))"
                    ))
                print("[migration] Basic search indexes created/verified")
        except Exception:
            pass  # SQLite or already exists — no-op

    # Composite index on club_memberships(club_id, status) for fast member count queries
    try:
        idx_sql = (
            "CREATE INDEX IF NOT EXISTS ix_club_memberships_club_status "
            "ON club_memberships (club_id, status)"
        )
        with db.engine.begin() as conn:
            conn.execute(text(idx_sql))
        print("[migration] club_memberships(club_id, status) index verified")
    except Exception as e:
        print(f"[migration] club_memberships composite index skipped: {e}")

    # reply threading columns on club_messages
    for col_name, col_def in [
        ("reply_to_id",      "INTEGER REFERENCES club_messages(id)"),
        ("reply_to_name",    "VARCHAR(150)"),
        ("reply_to_content", "VARCHAR(200)"),
    ]:
        try:
            if "club_messages" in insp.get_table_names():
                cols = [c["name"] for c in insp.get_columns("club_messages")]
                if col_name not in cols:
                    with db.engine.begin() as conn:
                        conn.execute(text(
                            f"ALTER TABLE club_messages ADD COLUMN {col_name} {col_def}"
                        ))
                    print(f"[migration] Added club_messages.{col_name}")
        except Exception as e:
            print(f"[migration] club_messages.{col_name} failed (probably already done): {e}")


def _get_or_create_system_user():
    from models import User
    system_user = User.query.filter_by(email="system@talaba.uz").first()
    if not system_user:
        system_user = User(
            name="TALABA jamoasi",
            email="system@talaba.uz",
            password_hash=bcrypt.generate_password_hash("TALABA_SYSTEM_NO_LOGIN_9x!").decode(),
            university="Oʻzbekiston Milliy universiteti",
            role="admin",
            is_verified=True,
        )
        db.session.add(system_user)
        db.session.commit()
    return system_user


def _seed_regional_communities():
    """Seed viloyat-based regional student communities on first deploy.
    Checks by name — safe to call on every startup."""
    import sys, os
    from models import Club

    try:
        seed_dir = os.path.dirname(__file__)
        if seed_dir not in sys.path:
            sys.path.insert(0, seed_dir)
        from seed_clubs import SEED_CLUBS  # type: ignore

        system_user = _get_or_create_system_user()

        added = updated = 0
        for data in SEED_CLUBS:
            existing = Club.query.filter_by(name=data["name"]).first()
            if existing:
                if data.get("website") and not existing.website:
                    existing.website = data["website"]
                    updated += 1
            else:
                club = Club(
                    name          = data["name"],
                    description   = data["description"],
                    category      = data["category"],
                    university    = data.get("university", ""),
                    meeting_time  = data["meeting_time"],
                    location      = data["location"],
                    club_type     = data.get("club_type", "community"),
                    region        = data.get("region", ""),
                    contact       = data.get("contact", ""),
                    telegram_link = data.get("telegram_link", ""),
                    website       = data.get("website", ""),
                    created_by    = system_user.id,
                    is_active     = True,
                )
                db.session.add(club)
                added += 1

        if added or updated:
            db.session.commit()
            print(f"[seed] Regional communities: added {added}, updated {updated} with website.")
        else:
            print("[seed] Regional communities already seeded — nothing to do.")

    except Exception as e:
        db.session.rollback()
        print(f"[seed] Regional communities seed skipped: {e}")


def _seed_university_clubs():
    """Seed real university-specific clubs on first deploy (and keep them updated).
    Checks by name — safe to call on every startup (only inserts missing clubs)."""
    import sys, os
    from models import Club

    try:
        seed_dir = os.path.dirname(__file__)
        if seed_dir not in sys.path:
            sys.path.insert(0, seed_dir)
        from seed_university_clubs import UNIVERSITY_CLUBS  # type: ignore

        system_user = _get_or_create_system_user()

        added = updated = 0
        for data in UNIVERSITY_CLUBS:
            existing = Club.query.filter_by(name=data["name"]).first()
            if existing:
                if data.get("website") and not existing.website:
                    existing.website = data["website"]
                    updated += 1
            else:
                club = Club(
                    name          = data["name"],
                    description   = data["description"],
                    category      = data["category"],
                    university    = data["university"],
                    meeting_time  = data["meeting_time"],
                    location      = data["location"],
                    club_type     = data.get("club_type", "club"),
                    region        = data.get("region", ""),
                    contact       = data.get("contact", ""),
                    telegram_link = data.get("telegram_link", ""),
                    website       = data.get("website", ""),
                    created_by    = system_user.id,
                    is_active     = True,
                )
                db.session.add(club)
                added += 1

        if added or updated:
            db.session.commit()
            print(f"[seed] University clubs: added {added}, updated {updated} with website.")
        else:
            print("[seed] University clubs already seeded — nothing to do.")

    except Exception as e:
        db.session.rollback()
        print(f"[seed] University clubs seed skipped: {e}")


def _seed_chat_threads():
    """Seed a handful of example Q&A threads (with answers) so the Chat page
    isn't empty on first visit. All authored by the TALABA system user."""
    import sys, os
    from models import ChatPost, ChatAnswer

    try:
        system_user = _get_or_create_system_user()

        seed_dir = os.path.dirname(__file__)
        if seed_dir not in sys.path:
            sys.path.insert(0, seed_dir)
        from seed_chat_threads import CHAT_THREAD_SEEDS as seeds  # type: ignore

        added = 0
        backfilled = 0
        for seed in seeds:
            seed_scope = seed.get("scope", "")
            existing = ChatPost.query.filter_by(title=seed["title"]).first()
            if existing:
                if (existing.scope or "") != seed_scope:
                    existing.scope = seed_scope
                    backfilled += 1
                continue
            post = ChatPost(
                user_id=system_user.id,
                title=seed["title"],
                content=seed["content"],
                image_url="",
                scope=seed_scope,
                is_active=True,
            )
            db.session.add(post)
            db.session.flush()  # so post.id is available
            for answer_text in seed["answers"]:
                db.session.add(ChatAnswer(
                    post_id=post.id,
                    user_id=system_user.id,
                    content=answer_text,
                    is_active=True,
                ))
            added += 1

        if added or backfilled:
            db.session.commit()
            print(f"[seed] Chat threads: added {added} thread(s), "
                  f"backfilled scope on {backfilled}.")
        else:
            print("[seed] Chat threads already seeded — nothing to do.")
    except Exception as e:
        db.session.rollback()
        print(f"[seed] Chat threads seed skipped: {e}")


def _seed_talaba_jobs():
    """Insert (or refresh) ~15 real Tashkent/regional part-time & internship
    listings, curated by hand as a guaranteed-populated fallback alongside the
    live hh.uz scraper.

    Deduplicates by apply_link. Safe to call repeatedly.
    """
    from models import Job, User
    import sys, os
    try:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)
        from talaba_jobs import TALABA_JOBS

        owner = User.query.filter_by(role="admin").order_by(User.id).first()
        if not owner:
            owner = User.query.order_by(User.id).first()
        if not owner:
            print("[seed] TALABA jobs: no users yet, skipping.")
            return

        existing_by_link = {
            row.apply_link: row
            for row in Job.query.filter(Job.apply_link.isnot(None)).all()
        }

        inserted = updated = 0
        for d in TALABA_JOBS:
            link = (d.get("apply_link") or "").strip()
            title = (d.get("title") or "").strip()
            company = (d.get("company") or "").strip()
            if not link or not title or not company:
                continue

            existing = existing_by_link.get(link)
            if existing:
                continue  # curated seed rows are static — don't overwrite admin edits

            job = Job(
                title=title[:200],
                company=company[:150],
                location=(d.get("location") or "").strip()[:150],
                job_type=(d.get("type") or "internship").strip(),
                salary=(d.get("salary") or "").strip()[:100],
                description=(d.get("description") or "").strip(),
                requirements=(d.get("requirements") or "").strip(),
                schedule_compatible=(d.get("schedule_compatible") or "barchasi").strip(),
                deadline=(d.get("deadline") or "").strip()[:50],
                tags=(d.get("tags") or "").strip()[:300],
                apply_link=link,
                student_friendly=(d.get("student_friendly") or "").strip(),
                student_friendly_note=(d.get("student_friendly_note") or "").strip()[:300],
                is_active=True,
                created_by=owner.id,
            )
            db.session.add(job)
            existing_by_link[link] = job
            inserted += 1

        db.session.commit()
        if inserted or updated:
            print(f"[seed] TALABA jobs: inserted {inserted}, updated {updated}.")
        else:
            print("[seed] TALABA jobs already seeded — nothing to do.")
    except Exception as e:
        db.session.rollback()
        print(f"[seed] TALABA jobs seed skipped: {e}")


app = create_app()


# ── Expired-job cleanup ──────────────────────────────────────────────────────
def _cleanup_expired_jobs(flask_app):
    """Hide jobs whose deadline day has passed (the deadline day itself is still open).

    Understands every date written as a date — "2026-11-20", "20.11.2026", "20 noyabr 2026" — and leaves
    free text ("Doimiy", "Iyun 30") alone, because that is admin-managed.
    """
    from datetime import datetime
    from deadlines import is_expired
    from models import Job

    with flask_app.app_context():
        try:
            now = datetime.utcnow()
            deactivated = 0
            for job in Job.query.filter_by(is_active=True).all():
                if is_expired(job.deadline, now.date()):
                    job.is_active, job.closed_reason, job.closed_at = False, "muddati o'tgan", now
                    deactivated += 1
            if deactivated:
                db.session.commit()
                print(f"[cleanup] deactivated {deactivated} expired job(s)")
            else:
                print("[cleanup] no expired jobs found")
        except Exception as e:
            db.session.rollback()
            print(f"[cleanup] failed: {e}")


# Run once at boot so legacy expired jobs disappear immediately on next deploy.
_cleanup_expired_jobs(app)


# Translate any remaining Russian-language job rows to Uzbek on every boot.
def _translate_pending_jobs(flask_app):
    try:
        from scrapers.hh_uz import translate_pending
        summary = translate_pending(flask_app, limit=60)
        if summary.get("translated", 0):
            print(
                f"[startup] Translated {summary['translated']} job(s) from Russian to Uzbek "
                f"(errors={summary.get('errors', 0)})"
            )
        else:
            print("[startup] No Russian job rows found to translate live.")
    except Exception as e:
        print(f"[startup] translate_pending skipped: {e}")


_translate_pending_jobs(app)


# ── Background scheduler ─────────────────────────────────────────────────────
def _start_scheduler(flask_app):
    """Start APScheduler exactly once: not when DISABLE_SCHEDULER=1, and not
    inside Flask's debug auto-reloader parent process (which would launch the
    scheduler twice).

    Jobs:
      • hh_uz_scraper: 06:00 and 18:00 UTC — pull fresh internships
      • cleanup_expired: 00:30 UTC daily — hide jobs past their deadline
    """
    if os.environ.get("DISABLE_SCHEDULER") == "1":
        print("[scheduler] DISABLE_SCHEDULER=1 → skipping startup")
        return

    # In debug mode, only the child reloader process should start the scheduler.
    if flask_app.debug and os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        return

    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from scrapers.hh_uz import run_scraper
    except Exception as e:
        print(f"[scheduler] failed to import dependencies — scheduler off: {e}")
        return

    scheduler = BackgroundScheduler(timezone="UTC")

    # Twice-daily hh.uz scrape
    scheduler.add_job(
        lambda: run_scraper(flask_app),
        trigger="cron",
        hour="6,18",
        minute=0,
        id="hh_uz_scraper",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Daily expired-job sweep — runs at 00:30 UTC so it lands between days
    # and doesn't overlap with the scraper.
    scheduler.add_job(
        lambda: _cleanup_expired_jobs(flask_app),
        trigger="cron",
        hour=0,
        minute=30,
        id="cleanup_expired",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # Class / exam / task reminders (Web Push) — only when VAPID keys are configured.
    try:
        from push_service import send_due_reminders, vapid_configured
        if vapid_configured():
            scheduler.add_job(
                lambda: send_due_reminders(flask_app),
                trigger="interval", minutes=1, id="push_reminders",
                replace_existing=True, max_instances=1, coalesce=True,
            )
            print("[scheduler] push reminders: every minute")
        else:
            print("[scheduler] push reminders off (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set)")
    except Exception as e:
        print(f"[scheduler] push reminders unavailable: {e}")

    # Nightly: re-check every live scraped posting against hh.uz (closed / removed → hidden, deadlines refreshed),
    # and once a week delete rows that have been closed for 90+ days.
    try:
        from scrapers.hh_uz import verify_active_jobs, purge_closed
        scheduler.add_job(
            lambda: (_cleanup_expired_jobs(flask_app), verify_active_jobs(flask_app), _cleanup_expired_jobs(flask_app)),
            trigger="cron", hour=0, minute=45, id="verify_jobs",
            replace_existing=True, max_instances=1, coalesce=True, misfire_grace_time=3600,
        )
        scheduler.add_job(
            lambda: purge_closed(flask_app),
            trigger="cron", day_of_week="sun", hour=1, minute=15, id="purge_closed_jobs",
            replace_existing=True, max_instances=1, coalesce=True, misfire_grace_time=3600,
        )
    except Exception as e:
        print(f"[scheduler] job verification unavailable: {e}")

    # Daily job e-mail for students who switched alerts on: 05:00 UTC = 10:00 Tashkent
    try:
        from job_digest import send_job_digests
        scheduler.add_job(
            lambda: send_job_digests(flask_app),
            trigger="cron", hour=5, minute=0, id="job_digest",
            replace_existing=True, max_instances=1, coalesce=True, misfire_grace_time=3600,
        )
    except Exception as e:
        print(f"[scheduler] job digest unavailable: {e}")

    scheduler.start()
    print(
        "[scheduler] started — hh.uz scraper: 06:00/18:00 UTC · "
        "Expired-job cleanup: 00:30 UTC daily"
    )


_start_scheduler(app)
