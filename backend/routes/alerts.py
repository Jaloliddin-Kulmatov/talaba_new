"""One-click unsubscribe link used in the daily job e-mails (no sign-in needed; the link is signed)."""
from flask import Blueprint, Response, current_app, request

from app import db
from job_digest import read_unsubscribe_token
from models import User

alerts_bp = Blueprint("alerts", __name__)

_PAGE = ('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
         '<title>TALABA</title><body style="font-family:Arial,sans-serif;max-width:420px;margin:15vh auto;padding:0 20px;'
         'text-align:center;color:#0f172a"><h2>{title}</h2><p style="color:#475569">{text}</p></body>')


@alerts_bp.route("/unsubscribe", methods=["GET"])
def unsubscribe():
    uid = read_unsubscribe_token(current_app.config["SECRET_KEY"], request.args.get("token", ""))
    user = User.query.get(uid) if uid else None
    if not user:
        return Response(_PAGE.format(title="Havola yaroqsiz", text="Bu havola noto'g'ri yoki eskirgan."), 400, mimetype="text/html")
    user.job_alerts_enabled = False
    db.session.commit()
    return Response(_PAGE.format(title="Xabarnoma o'chirildi",
                                 text="Endi yangi ishlar haqida xat yubormaymiz. Xohlasangiz, Ishlar sahifasidan qayta yoqishingiz mumkin."),
                    200, mimetype="text/html")
