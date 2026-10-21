"""Integration tests: direct messages, blocking, club events, news, CV file, phone push tokens,
Q&A (solved / report), job-alert e-mails and account deletion.

Run from the backend/ folder:   python tests/test_social.py
Uses a throw-away SQLite database in a temp directory and real JWTs — never touches your data.
"""
import os, sys, io, json, tempfile
from datetime import datetime, timedelta
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_tmp = tempfile.mkdtemp()
os.environ.update(DISABLE_SCHEDULER="1", GROQ_API_KEY="", DATABASE_URL="sqlite:///" + os.path.join(_tmp, "test.db"),
                  FRONTEND_URL="https://talaba.uz", PUBLIC_API_URL="https://api.talaba.uz")
import app as A
from flask_jwt_extended import create_access_token
from models import *
import notify, routes.messages
sent_notes = []
notify.notify_user = routes.messages.notify_user = lambda *a, **k: sent_notes.append((a, k))   # no threads, no network in tests
app, db = A.app, A.db
passed = 0
def ok(name, cond, extra=""):
    global passed
    if not cond: print("  ✗ FAIL:", name, extra); sys.exit(1)
    passed += 1; print("  ✓", name)

with app.app_context():
    def mk(n, role="student", uni="NUU", region="Toshkent", alerts=False):
        u = User(name=f"Talaba {n}", email=f"t{n}@x.uz", password_hash="x", university=uni, region=region, role=role, job_alerts_enabled=alerts)
        db.session.add(u); db.session.commit(); return u.id
    ids = {n: mk(n) for n in range(1, 5)}; admin = mk(99, "admin")
    tok = {n: create_access_token(identity=str(i)) for n, i in ids.items()}; tok["admin"] = create_access_token(identity=str(admin))
c = app.test_client()
H = lambda who: {"Authorization": f"Bearer {tok[who]}"} if who else {}
def call(m, url, who=None, body=None, **kw): return getattr(c, m)(url, headers=H(who), json=body, **kw)
def js(r): return r.get_json()
U = ids
def Q(f):
    with app.app_context(): return f()

print("direct messages")
ok("anonymous cannot list conversations", call("get", "/api/messages/conversations").status_code == 401)
ok("search needs 2+ letters", js(call("get", "/api/messages/users?q=T", 1))["users"] == [])
r = js(call("get", "/api/messages/users?q=talaba", 1))["users"]
ok("search finds others, never myself, never e-mail", len(r) == 4 and U[1] not in [x["id"] for x in r] and "email" not in json.dumps(r))
ok("search q='%' does not wildcard everything", js(call("get", "/api/messages/users?q=%25%25", 1))["users"] == [])
r = call("post", f"/api/messages/with/{U[2]}", 1, {"body": "Salom!"}); ok("send → 201", r.status_code == 201 and js(r)["message"]["mine"])
ok("recipient is notified", len(sent_notes) == 1 and sent_notes[0][0][0] == U[2])
ok("cannot message myself", call("post", f"/api/messages/with/{U[1]}", 1, {"body": "x"}).status_code == 404)
ok("empty / blank body rejected", call("post", f"/api/messages/with/{U[2]}", 1, {"body": "   "}).status_code == 400)
ok("body over 1000 chars rejected", call("post", f"/api/messages/with/{U[2]}", 1, {"body": "a" * 1001}).status_code == 400)
ok("unknown user → 404", call("post", "/api/messages/with/9999", 1, {"body": "x"}).status_code == 404)
ok("unread count = 1 for recipient", js(call("get", "/api/messages/unread-count", 2))["count"] == 1)
cv = js(call("get", "/api/messages/conversations", 2))["conversations"]
ok("conversation list shows the sender + unread 1", len(cv) == 1 and cv[0]["user"]["id"] == U[1] and cv[0]["unread"] == 1)
t = js(call("get", f"/api/messages/with/{U[1]}", 2)); ok("recipient opens thread → messages", len(t["messages"]) == 1 and not t["messages"][0]["mine"])
ok("opening marks as read", js(call("get", "/api/messages/unread-count", 2))["count"] == 0)
ok("sender sees 'read' status", js(call("get", f"/api/messages/with/{U[2]}", 1))["messages"][0]["read"] is True)
ok("a third person sees nothing of it", js(call("get", f"/api/messages/with/{U[2]}", 3))["messages"] == [])
call("post", f"/api/messages/with/{U[1]}", 2, {"body": "Vaalaykum"})
ok("conversations: last message is the newest one", js(call("get", "/api/messages/conversations", 1))["conversations"][0]["last"]["body"] == "Vaalaykum")
ok("polling with ?after returns only newer", len(js(call("get", f"/api/messages/with/{U[2]}?after=1", 1))["messages"]) == 1)
for i in range(19): call("post", f"/api/messages/with/{U[3]}", 1, {"body": f"m{i}"})
ok("sending too fast → 429", call("post", f"/api/messages/with/{U[3]}", 1, {"body": "x"}).status_code == 429)

print("blocking and reporting")
ok("block", call("post", f"/api/messages/block/{U[2]}", 1).status_code == 200)
ok("blocker cannot send", call("post", f"/api/messages/with/{U[2]}", 1, {"body": "x"}).status_code == 403)
ok("blocked person cannot send either", call("post", f"/api/messages/with/{U[1]}", 2, {"body": "x"}).status_code == 403)
ok("blocked people vanish from search", U[2] not in [x["id"] for x in js(call("get", "/api/messages/users?q=talaba", 1))["users"]])
ok("blocked conversation is hidden for the blocker", all(x["user"]["id"] != U[2] for x in js(call("get", "/api/messages/conversations", 1))["conversations"]))
ok("thread flags blocked / blocked_me", js(call("get", f"/api/messages/with/{U[2]}", 1))["blocked"] and js(call("get", f"/api/messages/with/{U[1]}", 2))["blocked_me"])
ok("blocks list", [x["id"] for x in js(call("get", "/api/messages/blocks", 1))["users"]] == [U[2]])
ok("unblock", call("delete", f"/api/messages/block/{U[2]}", 1).status_code == 200 and call("post", f"/api/messages/with/{U[1]}", 2, {"body": "yana salom"}).status_code == 201)
r = call("post", f"/api/messages/report/{U[3]}", 1, {"reason": "spam"}); ok("report a user", r.status_code == 200)
ok("reporting twice is idempotent", "allaqachon" in js(call("post", f"/api/messages/report/{U[3]}", 1, {"reason": "spam"}))["message"])
ok("cannot report myself", call("post", f"/api/messages/report/{U[1]}", 1, {"reason": "x"}).status_code == 404)
q = js(call("get", "/api/moderation/queue", "admin"))["items"]
ok("admin queue lists the reported person", any(i["kind"] == "user" and i["id"] == U[3] for i in q))
ok("admin can dismiss user reports", call("post", f"/api/moderation/user/{U[3]}/restore", "admin").status_code == 200
   and not any(i["kind"] == "user" for i in js(call("get", "/api/moderation/queue", "admin"))["items"]))

print("club events")
with app.app_context():
    club = Club(name="Python klubi", created_by=U[1], university="NUU"); db.session.add(club); db.session.commit(); cid = club.id
    db.session.add(ClubMembership(user_id=U[2], club_id=cid, status="approved")); db.session.commit()
start = (datetime.utcnow() + timedelta(days=3)).replace(microsecond=0).isoformat() + "Z"
ev = {"title": "Hackathon", "description": "Kod yozamiz", "location": "A-205", "starts_at": start}
ok("member cannot create", call("post", f"/api/clubs/{cid}/events", 2, ev).status_code == 403)
ok("anonymous cannot create", call("post", f"/api/clubs/{cid}/events", None, ev).status_code == 401)
r = call("post", f"/api/clubs/{cid}/events", 1, ev); ok("owner creates → 201", r.status_code == 201 and js(r)["event"]["is_mine"])
eid = js(r)["event"]["id"]
for bad, why in [({**ev, "title": "ab"}, "short title"), ({**ev, "starts_at": "kecha"}, "garbage date"), ({**ev, "starts_at": ""}, "missing date"),
                 ({**ev, "starts_at": (datetime.utcnow() - timedelta(days=5)).isoformat() + "Z"}, "past date"),
                 ({**ev, "starts_at": (datetime.utcnow() + timedelta(days=900)).isoformat() + "Z"}, "date > 2 years")]:
    ok(f"rejects {why}", call("post", f"/api/clubs/{cid}/events", 1, bad).status_code == 400)
ok("offset timezone is converted to UTC", js(call("post", f"/api/clubs/{cid}/events", 1, {**ev, "title": "Tashkent evening", "starts_at": (datetime.utcnow() + timedelta(days=4)).replace(microsecond=0).isoformat() + "+05:00"}))["event"]["starts_at"].endswith("Z"))
ok("club events are public", len(js(call("get", f"/api/clubs/{cid}/events"))["events"]) == 2)
ok("member sees it in 'my upcoming'", [e["title"] for e in js(call("get", "/api/clubs/events/upcoming", 2))["events"]][0] == "Hackathon")
ok("outsider sees nothing in 'my upcoming'", js(call("get", "/api/clubs/events/upcoming", 3))["events"] == [])
ok("non-owner cannot delete", call("delete", f"/api/clubs/{cid}/events/{eid}", 2).status_code == 403)
ok("owner deletes", call("delete", f"/api/clubs/{cid}/events/{eid}", 1).status_code == 200 and len(js(call("get", f"/api/clubs/{cid}/events"))["events"]) == 1)

print("news")
ok("news is public", call("get", "/api/news").status_code == 200)
ok("student cannot post", call("post", "/api/news", 1, {"title": "Yangilik"}).status_code == 403)
ok("rejects javascript: links", call("post", "/api/news", "admin", {"title": "Yangilik", "url": "javascript:alert(1)"}).status_code == 400)
r = call("post", "/api/news", "admin", {"title": "Qabul 2026", "summary": "Hujjatlar 1-iyundan", "url": "https://uz.example/qabul", "source": "NUU"}); ok("admin posts", r.status_code == 201)
nid = js(r)["item"]["id"]
with app.app_context():
    db.session.add(NewsItem(title="Eski xabar", published_at=datetime.utcnow() - timedelta(days=200))); db.session.commit()
ok("old news (>120 days) is hidden", [n["title"] for n in js(call("get", "/api/news"))["items"]] == ["Qabul 2026"])
ok("student cannot delete", call("delete", f"/api/news/{nid}", 1).status_code == 403)
ok("admin deletes", call("delete", f"/api/news/{nid}", "admin").status_code == 200 and js(call("get", "/api/news"))["total"] == 0)

print("CV file")
pdf = b"%PDF-1.4\n" + b"x" * 500
def up(who, name, data): return c.put("/api/cv", headers=H(who), data={"file": (io.BytesIO(data), name)}, content_type="multipart/form-data")
ok("anonymous cannot upload", up(None, "cv.pdf", pdf).status_code == 401)
ok("no CV yet", js(call("get", "/api/cv", 1))["cv"] is None)
r = up(1, "Mening CV.pdf", pdf); ok("PDF accepted", r.status_code == 200 and js(r)["cv"]["size"] == len(pdf))
ok("text file refused", up(1, "cv.txt", b"hello").status_code == 400)
ok("fake PDF (wrong magic bytes) refused", up(1, "cv.pdf", b"not a pdf").status_code == 400)
ok(".exe renamed to .pdf refused", up(1, "cv.pdf", b"MZ\x90\x00").status_code == 400)
ok("over 2 MB refused", up(1, "big.pdf", b"%PDF-" + b"0" * (2 * 1024 * 1024 + 10)).status_code == 413)
ok("docx accepted (replaces the PDF)", up(1, "cv.docx", b"PK\x03\x04" + b"0" * 100).status_code == 200 and js(call("get", "/api/cv", 1))["cv"]["filename"] == "cv.docx")
d = call("get", "/api/cv/download", 1); ok("owner downloads it, no caching", d.status_code == 200 and d.data.startswith(b"PK") and "no-store" in d.headers["Cache-Control"])
ok("someone else has no CV (cannot read mine)", call("get", "/api/cv/download", 2).status_code == 404 and js(call("get", "/api/cv", 2))["cv"] is None)
ok("delete", call("delete", "/api/cv", 1).status_code == 200 and js(call("get", "/api/cv", 1))["cv"] is None)

print("phone push tokens")
ok("rejects junk token", call("post", "/api/push/device", 1, {"token": "abc"}).status_code == 400)
tkn = "ExponentPushToken[abcdefghijklmnop]"
ok("registers", call("post", "/api/push/device", 1, {"token": tkn, "platform": "ios"}).status_code == 200)
ok("same phone, new account → moves to that account", call("post", "/api/push/device", 2, {"token": tkn, "platform": "ios"}).status_code == 200
   and Q(lambda: DeviceToken.query.filter_by(token=tkn).count() == 1 and DeviceToken.query.filter_by(token=tkn).first().user_id == U[2]))
ok("unregisters", call("delete", "/api/push/device", 2, {"token": tkn}).status_code == 200 and Q(lambda: DeviceToken.query.count() == 0))

print("Q&A: solved + report")
with app.app_context():
    post = ChatPost(user_id=U[1], title="Yotoqxonaga qanday kiraman?", content="Maslahat bering"); db.session.add(post); db.session.commit(); pid = post.id
r = call("post", f"/api/chat/posts/{pid}/answers", 2, {"content": "Dekanatga boring"}); aid = js(r)["answer"]["id"]
ok("asker gets a notification for a new answer", any(n[0][0] == U[1] for n in sent_notes[1:]) and sent_notes[-1][1].get("kind") == "answers")
n_before = len(sent_notes); call("post", f"/api/chat/posts/{pid}/answers", 1, {"content": "Rahmat"})
ok("answering your own question does not notify yourself", len(sent_notes) == n_before)
ok("only the asker can accept", call("post", f"/api/chat/posts/{pid}/accept/{aid}", 2).status_code == 403)
r = call("post", f"/api/chat/posts/{pid}/accept/{aid}", 1); ok("asker accepts → solved", js(r)["solved"] and js(call("get", f"/api/chat/posts/{pid}"))["post"]["solved"])
ok("accepting the same answer again un-marks it", not js(call("post", f"/api/chat/posts/{pid}/accept/{aid}", 1))["solved"])
ok("unknown answer → 404", call("post", f"/api/chat/posts/{pid}/accept/9999", 1).status_code == 404)
ok("cannot report own answer", call("post", f"/api/chat/answers/{aid}/report", 2, {"reason": "x"}).status_code == 400)
for u in (1, 3): call("post", f"/api/chat/answers/{aid}/report", u, {"reason": "spam"})
r = call("post", f"/api/chat/answers/{aid}/report", 4, {"reason": "spam"}); ok("3 distinct reports hide the answer", js(r)["hidden"])
ok("hidden answer no longer shown", all(a["id"] != aid for a in js(call("get", f"/api/chat/posts/{pid}"))["post"]["answers"]))
ok("admin queue shows it, admin restores it", any(i["kind"] == "answer" for i in js(call("get", "/api/moderation/queue", "admin"))["items"])
   and call("post", f"/api/moderation/answer/{aid}/restore", "admin").status_code == 200)

print("job-alert e-mails")
import job_digest as JD
with app.app_context():
    a1 = mk(11, alerts=True, region="Toshkent"); a2 = mk(12, alerts=True, region="Samarqand"); a3 = mk(13, alerts=False); a4 = mk(14, alerts=True, region="")
    db.session.add_all([
        Job(title="Python stajyor", company="IT Park", location="Toshkent", salary="3 mln"),
        Job(title="Ofitsiant", company="Cafe", location="Samarqand"),
        Job(title="Eski ish", company="X", location="Toshkent", created_at=datetime.utcnow() - timedelta(days=5)),
    ]); db.session.commit()
mails = []
def fake(to, subject, html, text): mails.append((to, subject, html, text)); return True
n = JD.send_job_digests(app, sender=fake)
by = {m[0]: m for m in mails}
ok("3 opted-in students get a mail, the opted-out one does not", n == 3 and "t13@x.uz" not in by)
ok("Toshkent student gets only the Toshkent job", "Python stajyor" in by["t11@x.uz"][2] and "Ofitsiant" not in by["t11@x.uz"][2])
ok("Samarqand student gets only the Samarqand job", "Ofitsiant" in by["t12@x.uz"][2] and "Python" not in by["t12@x.uz"][2])
ok("student without a region gets both new jobs", "Python stajyor" in by["t14@x.uz"][2] and "Ofitsiant" in by["t14@x.uz"][2])
ok("jobs older than the window are not mailed", all("Eski ish" not in m[2] for m in mails))
ok("mail contains a signed one-click unsubscribe link", "api.talaba.uz/api/alerts/unsubscribe?token=" in by["t11@x.uz"][2])
ok("running again the same day sends nothing (claimed)", JD.send_job_digests(app, sender=fake) == 0)
with app.app_context():
    u = User.query.get(a1); u.job_digest_at = None; db.session.commit()
ok("a failed send releases the claim", JD.send_job_digests(app, sender=lambda *a: False) == 0 and Q(lambda: User.query.get(a1).job_digest_at is None))
tkn_un = JD.unsubscribe_token(app.config["SECRET_KEY"], a1)
ok("unsubscribe link works without sign-in", c.get(f"/api/alerts/unsubscribe?token={tkn_un}").status_code == 200 and not Q(lambda: User.query.get(a1).job_alerts_enabled))
ok("forged unsubscribe token is refused", c.get("/api/alerts/unsubscribe?token=abc").status_code == 400 and Q(lambda: User.query.get(a2).job_alerts_enabled))
ok("a token for another purpose/secret is refused", c.get("/api/alerts/unsubscribe?token=" + JD.unsubscribe_token("other-secret", a2)).status_code == 400 and Q(lambda: User.query.get(a2).job_alerts_enabled))

print("account deletion")
call("post", f"/api/messages/with/{U[4]}", 3, {"body": "salom"}); call("post", f"/api/messages/block/{U[4]}", 3)
up(3, "cv.pdf", pdf); call("post", f"/api/messages/report/{U[3]}", 4, {"reason": "x"})
with app.app_context():
    db.session.add(DeviceToken(user_id=U[3], token="ExponentPushToken[zzzzzzzzzzzz]")); db.session.commit()
r = call("delete", "/api/auth/me", 3, {"confirm": "DELETE"}); ok("delete account → 200", r.status_code == 200, r.get_data(as_text=True))
with app.app_context():
    ok("their messages, blocks, CV, tokens and reports are gone",
       DirectMessage.query.filter((DirectMessage.sender_id == U[3]) | (DirectMessage.recipient_id == U[3])).count() == 0
       and UserBlock.query.filter((UserBlock.blocker_id == U[3]) | (UserBlock.blocked_id == U[3])).count() == 0
       and CvFile.query.filter_by(user_id=U[3]).count() == 0 and DeviceToken.query.filter_by(user_id=U[3]).count() == 0
       and ContentReport.query.filter_by(kind="user", item_id=U[3]).count() == 0)
    ok("their Q&A answers are gone", ChatAnswer.query.filter_by(user_id=U[3]).count() == 0)
r = call("delete", "/api/auth/me", 1, {"confirm": "DELETE"}); ok("owner of a club with events can delete the account", r.status_code == 200, r.get_data(as_text=True))
with app.app_context():
    ok("their club events and their question (with its answers) are gone", ClubEvent.query.count() == 0 and ChatPost.query.filter_by(id=pid).count() == 0 and ChatAnswer.query.filter_by(post_id=pid).count() == 0)

print(f"\nALL {passed} CHECKS PASSED")
