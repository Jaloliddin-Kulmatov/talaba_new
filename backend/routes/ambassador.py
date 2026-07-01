import os
import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app import db
from models import AmbassadorApplication, User

ambassador_bp = Blueprint("ambassador", __name__)


# ── Email helpers ──────────────────────────────────────────────────────────────

def _send_via_resend(to_email: str, subject: str, html: str, text: str = "") -> bool:
    """Send one email via Resend API (resend.com — free 3 000 emails/month).
    Requires env var:  RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxx
    From address:      RESEND_FROM    (default: onboarding@resend.dev for testing)
    """
    api_key = os.environ.get("RESEND_API_KEY", "").strip()
    if not api_key:
        return False

    from_addr = os.environ.get("RESEND_FROM", "TALABA <onboarding@resend.dev>")

    try:
        import httpx
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"from": from_addr, "to": [to_email], "subject": subject, "html": html, "text": text},
            timeout=15,
        )
        if resp.status_code in (200, 201):
            print(f"[email/resend] Sent to {to_email} ✓")
            return True
        print(f"[email/resend] Failed {resp.status_code}: {resp.text[:200]}")
        return False
    except Exception as e:
        print(f"[email/resend] Exception: {e}")
        return False


def _send_via_smtp(to_email: str, subject: str, html: str, text: str = "") -> bool:
    """Send via Gmail SMTP (STARTTLS port 587).
    Requires env vars:
      SENDER_EMAIL    = your Gmail address
      SENDER_PASSWORD = 16-char Gmail App Password (not your real password!)
    """
    sender_email    = os.environ.get("SENDER_EMAIL", "").strip()
    sender_password = os.environ.get("SENDER_PASSWORD", "").strip()

    if not sender_email or not sender_password:
        return False

    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"TALABA <{sender_email}>"
        msg["To"]      = to_email
        if text:
            msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, msg.as_string())

        print(f"[email/smtp] Sent to {to_email} ✓")
        return True
    except smtplib.SMTPAuthenticationError:
        print("[email/smtp] Auth failed — use a Gmail App Password, not your account password.")
        return False
    except Exception as e:
        print(f"[email/smtp] Failed: {e}")
        return False


def _send_email(to_email: str, subject: str, html: str, text: str = "") -> bool:
    """Try Resend first, then SMTP fallback."""
    if _send_via_resend(to_email, subject, html, text):
        return True
    return _send_via_smtp(to_email, subject, html, text)


def _email_configured() -> bool:
    """Return True if at least one email provider is configured."""
    has_resend = bool(os.environ.get("RESEND_API_KEY", "").strip())
    has_smtp   = bool(os.environ.get("SENDER_EMAIL", "").strip() and
                      os.environ.get("SENDER_PASSWORD", "").strip())
    return has_resend or has_smtp


def _send_application_emails_async(applicant_name: str, applicant_email: str,
                                   university: str, data: dict):
    """Fire-and-forget in a daemon thread."""
    def _run():
        admin_email = os.environ.get("ADMIN_EMAIL", os.environ.get("SENDER_EMAIL", "")).strip()

        # ── 1. Confirmation to applicant ─────────────────────────────
        confirm_html = f"""
<html><body style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1a1a2e">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;border-radius:12px 12px 0 0;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px">TALABA</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:13px">O'zbek talabalari uchun platforma</p>
  </div>
  <div style="background:#f8f9ff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
    <h2 style="color:#1a1a2e;margin-top:0">Ariza qabul qilindi! 🎉</h2>
    <p>Assalomu alaykum, <strong>{applicant_name}</strong>,</p>
    <p><strong>{university}</strong> uchun <strong>TALABA elchisi</strong> bo'lish arizangiz qabul qilindi!</p>
    <p>Arizangizni <strong>2–5 ish kuni</strong> ichida ko'rib chiqamiz.</p>
    <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0">
      <p style="margin:0;font-size:13px;color:#6b7280">Ariza xulosasi:</p>
      <p style="margin:8px 0 0;font-size:14px"><strong>Ism:</strong> {applicant_name}</p>
      <p style="margin:4px 0;font-size:14px"><strong>Universitet:</strong> {university}</p>
      <p style="margin:4px 0;font-size:14px"><strong>Yo'nalish:</strong> {data.get('department') or '—'}</p>
      <p style="margin:4px 0;font-size:14px"><strong>Ta'lim shakli:</strong> {data.get('funding_type') or '—'}</p>
    </div>
    <p style="color:#6b7280;font-size:13px">
      Kutish davomida <a href="https://talaba.uz" style="color:#6366f1">TALABA</a> dagi klublar va amaliyot o'rinlarini ko'rib chiqing.
    </p>
    <p style="color:#6b7280;font-size:12px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px">
      TALABA — O'zbek talabalari uchun platforma · Bu avtomatik xabar.
    </p>
  </div>
</body></html>"""

        _send_email(applicant_email, "✅ TALABA Elchisi arizangiz qabul qilindi", confirm_html)

        # ── 2. Notification to admin ──────────────────────────────────
        if admin_email and admin_email != applicant_email:
            admin_html = f"""
<html><body style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
  <h2>Yangi elchi arizasi</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:6px;color:#6b7280">Ism</td><td style="padding:6px"><strong>{applicant_name}</strong></td></tr>
    <tr><td style="padding:6px;color:#6b7280">Email</td><td style="padding:6px">{applicant_email}</td></tr>
    <tr><td style="padding:6px;color:#6b7280">Universitet</td><td style="padding:6px">{university}</td></tr>
    <tr><td style="padding:6px;color:#6b7280">Yo'nalish</td><td style="padding:6px">{data.get('department','—')}</td></tr>
    <tr><td style="padding:6px;color:#6b7280">Kurs</td><td style="padding:6px">{data.get('year','—')}</td></tr>
    <tr><td style="padding:6px;color:#6b7280">Viloyat</td><td style="padding:6px">{data.get('region','—')}</td></tr>
    <tr><td style="padding:6px;color:#6b7280">Ta'lim shakli</td><td style="padding:6px">{data.get('funding_type','—')}</td></tr>
    <tr><td style="padding:6px;color:#6b7280">Ijtimoiy tarmoq</td><td style="padding:6px">{data.get('social','—')}</td></tr>
  </table>
  <h3>Motivatsiya</h3>
  <p style="white-space:pre-wrap">{data.get('motivation','—')}</p>
  <p><a href="https://talaba.uz/admin">Admin panelda ko'rish →</a></p>
</body></html>"""
            _send_email(admin_email,
                        f"[TALABA] Yangi elchi: {applicant_name} — {university}",
                        admin_html)

    threading.Thread(target=_run, daemon=True).start()


# ── Apply ──────────────────────────────────────────────────────────────────────

@ambassador_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply():
    # Auth required: an ambassador represents a university and gets posting
    # powers, so applicants must be signed-in users. We also BIND the email to
    # the authenticated account — never trust a client-supplied address — which
    # stops anyone from submitting (or overwriting a pending) application under
    # someone else's email.
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    data = request.get_json(silent=True) or {}

    name       = (data.get("name") or user.name or "").strip()
    email      = (user.email or "").strip()
    university = (data.get("university") or "").strip()

    if not name or not email or not university:
        return jsonify({"error": "Name, email, and university are required."}), 400

    # Update existing pending application instead of blocking with a 409
    existing = AmbassadorApplication.query.filter_by(email=email, status="pending").first()
    if existing:
        existing.name       = name
        existing.university = university
        existing.department = (data.get("department") or "").strip()
        existing.year       = (data.get("year") or "").strip()
        existing.region       = (data.get("region") or "").strip()
        existing.funding_type = (data.get("funding_type") or "").strip()
        existing.motivation = (data.get("motivation") or "").strip()
        existing.social     = (data.get("social") or "").strip()
        db.session.commit()
        configured = _email_configured()
        if configured:
            _send_application_emails_async(name, email, university, data)
        return jsonify({"message": "Application updated!", "email_sent": configured}), 200

    app_record = AmbassadorApplication(
        name       = name,
        email      = email,
        university = university,
        department = (data.get("department") or "").strip(),
        year       = (data.get("year") or "").strip(),
        region       = (data.get("region") or "").strip(),
        funding_type = (data.get("funding_type") or "").strip(),
        motivation = (data.get("motivation") or "").strip(),
        social     = (data.get("social") or "").strip(),
    )
    db.session.add(app_record)
    db.session.commit()

    configured = _email_configured()
    if configured:
        _send_application_emails_async(name, email, university, data)

    return jsonify({
        "message": "Application submitted successfully!",
        "email_sent": configured,   # honest: True only when a provider is configured
    }), 201


# ── Admin: list all applications ───────────────────────────────────────────────

@ambassador_bp.route("/applications", methods=["GET"])
@jwt_required()
def list_applications():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    if user.role != "admin":
        return jsonify({"error": "Admin only."}), 403
    apps = AmbassadorApplication.query.order_by(AmbassadorApplication.created_at.desc()).all()
    return jsonify({"applications": [a.to_dict() for a in apps]}), 200


# ── Admin: approve / reject ────────────────────────────────────────────────────

@ambassador_bp.route("/applications/<int:app_id>", methods=["PATCH"])
@jwt_required()
def update_application(app_id):
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    if user.role != "admin":
        return jsonify({"error": "Admin only."}), 403

    app_record = AmbassadorApplication.query.get_or_404(app_id)
    data   = request.get_json(silent=True) or {}
    status = data.get("status")

    if status in ("approved", "rejected", "pending"):
        app_record.status = status
        db.session.commit()

        if _email_configured() and app_record.email:
            if status == "approved":
                subject = "🎉 Siz endi TALABA elchisisiz!"
                body_html = f"""<html><body style="font-family:Arial,sans-serif">
<h2>Tabriklaymiz, {app_record.name}! 🎉</h2>
<p><strong>{app_record.university}</strong> uchun TALABA elchisi bo'lish arizangiz
<strong style="color:#10b981">TASDIQLANDI</strong>.</p>
<p>Endi TALABA'da o'z universitetingiz nomidan yangiliklar joylashtirish imkoniyatiga egasiz.</p>
<p>Jamoaga xush kelibsiz! 🚀 — TALABA jamoasi</p>
</body></html>"""
            else:
                subject = "TALABA elchisi arizasi bo'yicha yangilanish"
                body_html = f"""<html><body style="font-family:Arial,sans-serif">
<h2>Assalomu alaykum, {app_record.name},</h2>
<p>TALABA elchisi bo'lishga qiziqish bildirganingiz uchun rahmat.</p>
<p>Afsuski, hozircha arizangizni tasdiqlay olmadik.
Kelajakda qayta ariza topshirishingiz mumkin.</p>
<p>— TALABA jamoasi</p>
</body></html>"""

            def _notify():
                _send_email(app_record.email, subject, body_html)
            threading.Thread(target=_notify, daemon=True).start()

    return jsonify({"application": app_record.to_dict()}), 200


# ── Admin: delete application ──────────────────────────────────────────────────

@ambassador_bp.route("/applications/<int:app_id>", methods=["DELETE"])
@jwt_required()
def delete_application(app_id):
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    if user.role != "admin":
        return jsonify({"error": "Admin only."}), 403
    app_record = AmbassadorApplication.query.get_or_404(app_id)
    db.session.delete(app_record)
    db.session.commit()
    return jsonify({"message": "Application deleted."}), 200
