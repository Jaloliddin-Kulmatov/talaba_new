"""Tests for Web Push reminders: due-reminder logic, subscription API, sender behaviour, real crypto.

Run from the backend/ folder:   python tests/test_push.py
"""
import base64, json, os, subprocess, sys, tempfile
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_tmp = tempfile.mkdtemp()
os.environ.update(DISABLE_SCHEDULER="1", GROQ_API_KEY="", DATABASE_URL="sqlite:///" + os.path.join(_tmp, "test.db"))
for k in ("VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"):
    os.environ.pop(k, None)

import app as A
from flask_jwt_extended import create_access_token
from models import PushSubscription, SentReminder, User, UserSync
import push_service as PS
import reminders as R
import routes.push as RP

app, db = A.app, A.db
passed = 0


def ok(name, cond, extra=""):
    global passed
    if not cond:
        print("  ✗ FAIL:", name, extra)
        sys.exit(1)
    passed += 1
    print("  ✓", name)


# ── pure logic ────────────────────────────────────────────────────────────
WED_0950 = datetime(2026, 10, 7, 9, 50)          # Wednesday 7 Oct 2026, local time
ANCHOR = {"monday": "2026-10-05", "odd": True}   # that week is "toq"
C = lambda **o: {"id": "c1", "subject": "Algebra", "day": 2, "start": "10:00", "end": "11:20", "weeks": "all", "room": "204-xona", "teacher": "Karimov", **o}
tt = lambda *classes, anchor=ANCHOR: {R.TIMETABLE_KEY: {"v": {"classes": list(classes), "anchor": anchor}, "t": 1}}
pl = lambda **kw: {R.PLANNER_KEY: {"v": {"tasks": kw.get("tasks", []), "exams": kw.get("exams", [])}, "t": 1}}

print("reminder logic")
r = R.due_reminders(tt(C()), WED_0950, {})
ok("a class starting in 10 minutes triggers one reminder", len(r) == 1 and "10 daqiqadan keyin" in r[0]["title"] and "204-xona" in r[0]["body"] and r[0]["key"] == "class:c1:2026-10-07")
ok("dedupe key is per class per day", R.due_reminders(tt(C()), datetime(2026, 10, 14, 9, 50), {})[0]["key"] == "class:c1:2026-10-14")
ok("outside the lead window → nothing", R.due_reminders(tt(C(start="10:30")), WED_0950, {}) == [])
ok("lead time is configurable: a class 25 min away is skipped at 15 and sent at 30", R.due_reminders(tt(C(start="10:15")), WED_0950, {"classMin": 15}) == [] and len(R.due_reminders(tt(C(start="10:15")), WED_0950, {"classMin": 30})) == 1)
ok("exactly at the lead boundary counts; at start time it doesn't", len(R.due_reminders(tt(C(start="10:05")), WED_0950, {"classMin": 15})) == 1 and R.due_reminders(tt(C(start="09:50")), WED_0950, {}) == [])
ok("a class that already started → nothing", R.due_reminders(tt(C(start="09:00")), WED_0950, {}) == [])
ok("other weekday → nothing", R.due_reminders(tt(C(day=3)), WED_0950, {}) == [])
ok("even-week class is skipped on an odd week; odd-week class is sent", R.due_reminders(tt(C(weeks="even")), WED_0950, {}) == [] and len(R.due_reminders(tt(C(weeks="odd")), WED_0950, {})) == 1)
ok("parity flips every week after the anchor (and before it)", R.parity_of(datetime(2026, 10, 14).date(), ANCHOR) == "even" and R.parity_of(datetime(2026, 10, 21).date(), ANCHOR) == "odd" and R.parity_of(datetime(2026, 10, 1).date(), ANCHOR) == "even")
ok("without an anchor it falls back to ISO-week parity", R.parity_of(datetime(2026, 10, 7).date(), None) == ("odd" if datetime(2026, 10, 7).isocalendar()[1] % 2 else "even"))
ok("Sunday belongs to the Monday-started week", R.parity_of(datetime(2026, 10, 11).date(), ANCHOR) == "odd")

ok("exam tomorrow: reminded in the evening, not at 17:00", len(R.due_reminders(pl(exams=[{"id": "e1", "subject": "Fizika", "date": "2026-10-08", "time": "09:00"}]), datetime(2026, 10, 7, 18, 5), {})) == 1 and R.due_reminders(pl(exams=[{"id": "e1", "subject": "Fizika", "date": "2026-10-08"}]), datetime(2026, 10, 7, 17, 0), {}) == [])
ok("exam today: reminded in the morning unless it already started", len(R.due_reminders(pl(exams=[{"id": "e1", "subject": "Fizika", "date": "2026-10-07", "time": "11:00"}]), WED_0950, {})) == 1 and R.due_reminders(pl(exams=[{"id": "e1", "subject": "Fizika", "date": "2026-10-07", "time": "09:00"}]), WED_0950, {}) == [])
ok("exam reminders can be switched off", R.due_reminders(pl(exams=[{"id": "e1", "subject": "F", "date": "2026-10-07"}]), WED_0950, {"exams": False}) == [])
tasks = [{"id": "a", "title": "Hisobot", "due": "2026-10-07", "done": False}, {"id": "b", "title": "Esse", "due": "2026-10-07", "done": True}, {"id": "c", "title": "Eski", "due": "2026-10-01", "done": False}, {"id": "d", "title": "Keyin", "due": "2026-10-09", "done": False}]
d = R.due_reminders(pl(tasks=tasks), datetime(2026, 10, 7, 8, 30), {})
ok("task digest: only today's open tasks, mentions overdue count", len(d) == 1 and "1 ta vazifa" in d[0]["title"] and "Hisobot" in d[0]["body"] and "Esse" not in d[0]["body"] and "1 ta muddati o'tgan" in d[0]["body"])
ok("task digest waits until 08:00 and respects the switch", R.due_reminders(pl(tasks=tasks), datetime(2026, 10, 7, 7, 59), {}) == [] and R.due_reminders(pl(tasks=tasks), datetime(2026, 10, 7, 9, 0), {"tasks": False}) == [])
for bad in (None, {}, {R.TIMETABLE_KEY: "x"}, {R.TIMETABLE_KEY: {"v": {"classes": "nope"}}}, {R.TIMETABLE_KEY: {"v": {"classes": [1, None, {"day": 2, "start": "zz"}, {"day": 2, "start": "25:99"}]}}}, {R.PLANNER_KEY: {"v": {"exams": [{"date": "garbage"}, 5], "tasks": [{"due": 1}, "x"]}}}):
    try:
        R.due_reminders(bad, WED_0950, {})
    except Exception as e:  # noqa: BLE001
        ok(f"malformed data never raises ({str(bad)[:40]})", False, repr(e))
ok("malformed data never raises", True)
ok("a million-item list is capped, not looped", len(R.due_reminders(tt(*[C(id=str(i)) for i in range(5000)]), WED_0950, {})) <= R.MAX_ITEMS)
ok("prefs are validated field by field", R.normalize_prefs({"classMin": 7, "exams": "yes", "tasks": False}) == {"classMin": 15, "exams": True, "tasks": False} and R.normalize_prefs(None) == R.DEFAULT_PREFS and R.normalize_prefs({"classMin": True})["classMin"] == 15)

print("endpoint allowlist (SSRF)")
good = ["https://fcm.googleapis.com/fcm/send/abc", "https://updates.push.services.mozilla.com/wpush/v2/x", "https://web.push.apple.com/Qx", "https://wns2-par02p.notify.windows.com/w/?token=x"]
bad = ["http://fcm.googleapis.com/x", "https://169.254.169.254/latest/meta-data", "https://localhost/x", "https://127.0.0.1/x", "https://evil.com/fcm.googleapis.com", "https://fcm.googleapis.com.evil.com/x", "https://evilfcm.googleapis.com.attacker.io/x", "https://fcm.googleapis.com@evil.com/x", "https://user:pw@fcm.googleapis.com/x", "https://fcm.googleapis.com:8443/x", "ftp://fcm.googleapis.com/x", "", "not a url", "https://[::1]/x"]
ok("real push services are accepted", all(PS.endpoint_ok(u) for u in good))
for u in bad:
    ok(f"rejected: {u or '(empty)'}", not PS.endpoint_ok(u))

# ── API ───────────────────────────────────────────────────────────────────
with app.app_context():
    uid = {}
    for n in (1, 2):
        u = User(name=f"Talaba {n}", email=f"p{n}@x.uz", password_hash="x"); db.session.add(u); db.session.commit(); uid[n] = u.id
    tok = {n: create_access_token(identity=str(i)) for n, i in uid.items()}
c = app.test_client()
call = lambda m, url, who=None, body=None: getattr(c, m)(url, headers={"Authorization": f"Bearer {tok[who]}"} if who else {}, json=body)
js = lambda r: r.get_json()
b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b"=").decode()

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec


def make_sub(host="fcm.googleapis.com", path="/fcm/send/abc"):
    priv = ec.generate_private_key(ec.SECP256R1())
    pub = priv.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    auth = os.urandom(16)
    return priv, auth, {"endpoint": f"https://{host}{path}", "keys": {"p256dh": b64(pub), "auth": b64(auth)}}


print("subscription API")
ok("public key is 503 until VAPID is configured", c.get("/api/push/key").status_code == 503)
ok("subscribing is also refused (503) until configured", call("post", "/api/push/subscribe", 1, {"subscription": make_sub()[2]}).status_code == 503)
keys = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "make_vapid_keys.py")], capture_output=True, text=True).stdout
env = dict(line.split("=", 1) for line in keys.splitlines() if line.startswith("VAPID_"))
os.environ["VAPID_PUBLIC_KEY"], os.environ["VAPID_PRIVATE_KEY"] = env["VAPID_PUBLIC_KEY"], env["VAPID_PRIVATE_KEY"].split()[0]
ok("make_vapid_keys.py prints a usable key pair", len(base64.urlsafe_b64decode(env["VAPID_PUBLIC_KEY"] + "==")) == 65)
ok("public key endpoint returns it once configured", js(c.get("/api/push/key"))["key"] == os.environ["VAPID_PUBLIC_KEY"])
_, _, s1 = make_sub()
ok("anonymous cannot subscribe", call("post", "/api/push/subscribe", None, {"subscription": s1}).status_code == 401)
for label, sub in [("SSRF endpoint", {**s1, "endpoint": "https://169.254.169.254/x"}), ("http endpoint", {**s1, "endpoint": "http://fcm.googleapis.com/x"}), ("short p256dh", {**s1, "keys": {**s1["keys"], "p256dh": "abc"}}), ("short auth", {**s1, "keys": {**s1["keys"], "auth": "abc"}}), ("no keys", {"endpoint": s1["endpoint"]}), ("not base64", {**s1, "keys": {"p256dh": "!!!", "auth": "???"}}), ("endpoint too long", {**s1, "endpoint": "https://fcm.googleapis.com/" + "a" * 700})]:
    ok(f"rejects {label}", call("post", "/api/push/subscribe", 1, {"subscription": sub}).status_code == 400)
ok("rejects a non-object subscription", call("post", "/api/push/subscribe", 1, {"subscription": "x"}).status_code == 400)
r = call("post", "/api/push/subscribe", 1, {"subscription": s1, "prefs": {"classMin": 30, "exams": False}}); ok("valid subscription → 201 with normalised prefs", r.status_code == 201 and js(r)["prefs"] == {"classMin": 30, "exams": False, "tasks": True})
ok("status reports it for the owner only", js(call("get", f"/api/push/status?endpoint={s1['endpoint']}", 1))["subscribed"] and not js(call("get", f"/api/push/status?endpoint={s1['endpoint']}", 2))["subscribed"])
ok("prefs patch merges and validates (bad classMin → default)", js(call("patch", "/api/push/prefs", 1, {"endpoint": s1["endpoint"], "prefs": {"tasks": False, "classMin": 99}}))["prefs"] == {"classMin": 15, "exams": False, "tasks": False})
ok("another user cannot change my prefs", call("patch", "/api/push/prefs", 2, {"endpoint": s1["endpoint"], "prefs": {"tasks": True}}).status_code == 404)
ok("same browser signing in as someone else moves the subscription", call("post", "/api/push/subscribe", 2, {"subscription": s1}).status_code == 201 and js(call("get", f"/api/push/status?endpoint={s1['endpoint']}", 1))["subscribed"] is False)
for i in range(7): call("post", "/api/push/subscribe", 1, {"subscription": make_sub(path=f"/fcm/send/dev{i}")[2]})
with app.app_context(): ok("at most 5 devices per user (oldest dropped)", PushSubscription.query.filter_by(user_id=uid[1]).count() == RP.MAX_SUBS_PER_USER)
ok("unsubscribe removes it and is idempotent", call("delete", "/api/push/subscribe", 2, {"endpoint": s1["endpoint"]}).status_code == 200 and call("delete", "/api/push/subscribe", 2, {"endpoint": s1["endpoint"]}).status_code == 200 and not js(call("get", f"/api/push/status?endpoint={s1['endpoint']}", 2))["subscribed"])

print("test-notification endpoint")
_, _, s2 = make_sub(path="/fcm/send/testme"); call("post", "/api/push/subscribe", 2, {"subscription": s2})
sent_payloads = []
RP.send_push = lambda sub, payload: sent_payloads.append(payload)
ok("sends a test push to my own subscription", call("post", "/api/push/test", 2, {"endpoint": s2["endpoint"]}).status_code == 200 and sent_payloads[0]["title"].startswith("TALABA"))
ok("cannot trigger a push to someone else's subscription", call("post", "/api/push/test", 1, {"endpoint": s2["endpoint"]}).status_code == 404 and len(sent_payloads) == 1)
def gone(sub, payload): raise PS.PushGone()
RP.send_push = gone
ok("expired subscription → 410 and it is deleted", call("post", "/api/push/test", 2, {"endpoint": s2["endpoint"]}).status_code == 410 and not js(call("get", f"/api/push/status?endpoint={s2['endpoint']}", 2))["subscribed"])
call("post", "/api/push/subscribe", 2, {"subscription": s2})
def boom(sub, payload): raise RuntimeError("push service down")
RP.send_push = boom
ok("other send errors → 502 without leaking details", (lambda r: r.status_code == 502 and "down" not in json.dumps(js(r)))(call("post", "/api/push/test", 2, {"endpoint": s2["endpoint"]})))

print("scheduler sender")
with app.app_context():
    PushSubscription.query.delete(); SentReminder.query.delete(); UserSync.query.delete(); db.session.commit()
    sub = PushSubscription(user_id=uid[1], endpoint="https://fcm.googleapis.com/fcm/send/sched", p256dh="x", auth="y", prefs={}); db.session.add(sub)
    db.session.add(UserSync(user_id=uid[1], data=tt(C(), C(id="c2", subject="Fizika", start="10:05"))))
    db.session.commit(); sid = sub.id
outbox = []
UTC = WED_0950 - timedelta(hours=5)
n = PS.send_due_reminders(app, UTC, sender=lambda s, p: outbox.append(p))
ok("sends each due reminder once", n == 2 and {p["tag"] for p in outbox} == {"class:c1:2026-10-07", "class:c2:2026-10-07"})
ok("running again a minute later sends nothing (dedupe)", PS.send_due_reminders(app, UTC + timedelta(minutes=1), sender=lambda s, p: outbox.append(p)) == 0 and len(outbox) == 2)
with app.app_context(): SentReminder.query.delete(); db.session.commit()
flaky = {"n": 0}
def flaky_sender(s, p):
    flaky["n"] += 1
    if flaky["n"] <= 2: raise RuntimeError("temporary network error")
    outbox.append(p)
outbox.clear()
ok("a transient failure sends nothing and releases the claim", PS.send_due_reminders(app, UTC, sender=flaky_sender) == 0)
with app.app_context(): ok("…failures are counted", PushSubscription.query.get(sid).failures >= 1 and SentReminder.query.count() == 0)
ok("the next run retries and succeeds, resetting the failure count", PS.send_due_reminders(app, UTC + timedelta(minutes=1), sender=flaky_sender) == 2)
with app.app_context(): ok("failure counter reset after success", PushSubscription.query.get(sid).failures == 0)
with app.app_context(): SentReminder.query.delete(); db.session.commit()
with app.app_context(): db.session.add(SentReminder(subscription_id=sid, key="class:c1:2026-10-07")); db.session.commit()
outbox.clear(); PS.send_due_reminders(app, UTC, sender=lambda s, p: outbox.append(p))
ok("a reminder already claimed (e.g. by another worker) is skipped", [p["tag"] for p in outbox] == ["class:c2:2026-10-07"])
with app.app_context(): SentReminder.query.delete(); db.session.commit()
ok("a dead subscription (410) is removed during a run", PS.send_due_reminders(app, UTC, sender=gone) == 0)
with app.app_context(): ok("…subscription and its dedupe rows are gone", PushSubscription.query.get(sid) is None and SentReminder.query.count() == 0)
with app.app_context():
    sub = PushSubscription(user_id=uid[1], endpoint="https://fcm.googleapis.com/fcm/send/failer", p256dh="x", auth="y", prefs={}); db.session.add(sub); db.session.commit(); sid = sub.id
for i in range(PS.FAIL_LIMIT): PS.send_due_reminders(app, UTC + timedelta(seconds=i), sender=boom)
with app.app_context(): ok(f"a subscription that keeps failing is dropped after {PS.FAIL_LIMIT} attempts", PushSubscription.query.get(sid) is None)
with app.app_context():
    sub = PushSubscription(user_id=uid[1], endpoint="https://fcm.googleapis.com/fcm/send/old", p256dh="x", auth="y", prefs={}); db.session.add(sub); db.session.commit()
    db.session.add(SentReminder(subscription_id=sub.id, key="old", sent_at=datetime.utcnow() - timedelta(days=5))); db.session.add(SentReminder(subscription_id=sub.id, key="new")); db.session.commit()
PS.send_due_reminders(app, UTC, sender=lambda s, p: None)
with app.app_context(): ok("dedupe rows older than 3 days are pruned", [r.key for r in SentReminder.query.filter(SentReminder.key.in_(["old", "new"])).all()] == ["new"])

print("real crypto")
import http_ece
from py_vapid import Vapid
from pywebpush import WebPusher
priv, auth, sub_info = make_sub()
body = WebPusher(sub_info).encode(json.dumps({"title": "Oliy matematika — 10 daqiqadan keyin"}, ensure_ascii=False).encode(), "aes128gcm")["body"]
ok("payload is encrypted (plaintext not visible in the body)", b"matematika" not in body)
ok("the subscriber's private key decrypts it, Uzbek text intact", json.loads(http_ece.decrypt(body, private_key=priv, auth_secret=auth, version="aes128gcm"))["title"] == "Oliy matematika — 10 daqiqadan keyin")
v = PS._vapid()
pub = v.public_key.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
ok("the private key loaded from env matches the published public key", b64(pub) == os.environ["VAPID_PUBLIC_KEY"])
hdr = v.sign({"sub": "mailto:admin@talaba.uz", "aud": "https://fcm.googleapis.com", "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp())})
ok("VAPID signing produces an Authorization header", "Authorization" in hdr and hdr["Authorization"].startswith(("vapid", "WebPush")))

print("account deletion")
with app.app_context():
    PushSubscription.query.delete(); SentReminder.query.delete(); db.session.commit()
call("post", "/api/push/subscribe", 2, {"subscription": make_sub(path="/fcm/send/del")[2]})
with app.app_context(): before = PushSubscription.query.filter_by(user_id=uid[2]).count()
r = call("delete", "/api/auth/me?confirm=DELETE", 2, {"confirm": "DELETE"})
with app.app_context(): after = PushSubscription.query.filter_by(user_id=uid[2]).count()
ok("deleting an account removes its push subscriptions", before == 1 and r.status_code == 200 and after == 0, f"{before} {r.status_code} {after}")
print(f"\nALL {passed} CHECKS PASSED")
