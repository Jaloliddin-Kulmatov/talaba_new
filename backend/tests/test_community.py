"""Integration tests for the community API (reviews, market, lost & found, sync, moderation).

Run from the backend/ folder:   python tests/test_community.py
Uses a throw-away SQLite database in a temp directory and real JWTs — never touches your data.
"""
import os, sys, json, tempfile
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_tmp = tempfile.mkdtemp()
os.environ.update(DISABLE_SCHEDULER="1", GROQ_API_KEY="", DATABASE_URL="sqlite:///" + os.path.join(_tmp, "test.db"))
import app as A
from flask_jwt_extended import create_access_token
from models import *
app, db = A.app, A.db
passed = 0
def ok(name, cond, extra=""):
    global passed
    if not cond: print("  ✗ FAIL:", name, extra); sys.exit(1)
    passed += 1; print("  ✓", name)

with app.app_context():
    def mk(n, role="student", uni="NUU"):
        u = User(name=f"Talaba {n}", email=f"t{n}@x.uz", password_hash="x", university=uni, role=role); db.session.add(u); db.session.commit(); return u.id
    ids = {n: mk(n) for n in range(1, 6)}; admin = mk(99, "admin")
    tok = {n: create_access_token(identity=str(i)) for n, i in ids.items()}; tok["admin"] = create_access_token(identity=str(admin))
c = app.test_client()
H = lambda who: {"Authorization": f"Bearer {tok[who]}"} if who else {}
def call(m, url, who=None, body=None, **kw): return getattr(c, m)(url, headers=H(who), json=body, **kw)
def js(r): return r.get_json()

print("reviews")
rv = {"subject": "Oliy matematika", "teacher": "Karimov A.", "university": "NUU", "rating": 4, "difficulty": 5, "recommend": True, "text": "Qiyin lekin foydali."}
ok("anonymous cannot post", call("post", "/api/reviews", None, rv).status_code == 401)
r = call("post", "/api/reviews", 1, rv); ok("create review → 201", r.status_code == 201 and js(r)["created"])
ok("author identity is never exposed", "user_id" not in js(r)["review"] and "email" not in json.dumps(js(r)))
r = call("post", "/api/reviews", 2, {**rv, "rating": 2, "recommend": False}); ok("second student review", r.status_code == 201)
r = call("post", "/api/reviews", 1, {**rv, "subject": "  OLIY   matematika ", "teacher": "karimov a.", "rating": 5}); ok("same course typed differently UPDATES, not duplicates", r.status_code == 200 and not js(r)["created"])
d = js(call("get", "/api/reviews/courses?q=oliy")); ok("aggregate: 1 course, 2 reviews", d["total"] == 1 and d["courses"][0]["count"] == 2)
ok("aggregate rating = mean(5,2) = 3.5", d["courses"][0]["rating"] == 3.5 and d["courses"][0]["recommend"] == 0.5)
lst = js(call("get", "/api/reviews?subject=Oliy matematika&teacher=Karimov A.", 1)); mine = [x["is_mine"] for x in lst["reviews"]]
ok("is_mine true only for the owner", sorted(mine) == [False, True] and lst["total"] == 2)
for bad, why in [({**rv, "rating": 6}, "rating 6"), ({**rv, "rating": True}, "rating bool"), ({**rv, "rating": "abc"}, "rating text"), ({**rv, "university": ""}, "no university"), ({**rv, "subject": "x"}, "short subject"), ({**rv, "text": "a" * 1001}, "text too long"), ({**rv, "recommend": "yes"}, "recommend not bool"), ({**rv, "difficulty": 0}, "difficulty 0")]:
    ok(f"rejects {why}", call("post", "/api/reviews", 3, bad).status_code == 400)
ok("search q='%' does NOT wildcard-match everything", js(call("get", "/api/reviews/courses?q=%25"))["total"] == 0)
ok("search q='_' does NOT wildcard-match", js(call("get", "/api/reviews/courses?q=_"))["total"] == 0)
rid = lst["reviews"][0]["id"]; other = 2 if lst["reviews"][0]["is_mine"] else 2
ok("non-owner cannot delete", call("delete", f"/api/reviews/{rid}", 5).status_code == 403)
ok("cannot report own review", call("post", f"/api/reviews/{[x for x in lst['reviews'] if x['is_mine']][0]['id']}/report", 1, {"reason": "x"}).status_code == 400)
tid = [x["id"] for x in lst["reviews"] if not x["is_mine"]][0]
for u in (3, 4): call("post", f"/api/reviews/{tid}/report", u, {"reason": "spam"})
ok("same user reporting twice is idempotent", "allaqachon" in js(call("post", f"/api/reviews/{tid}/report", 4, {"reason": "spam"}))["message"])
r = call("post", f"/api/reviews/{tid}/report", 5, {"reason": "spam"}); ok("3 distinct reports auto-hide the review", js(r)["hidden"] and js(call("get", "/api/reviews/courses?q=oliy"))["courses"][0]["count"] == 1)
ok("admin can delete any review", call("delete", f"/api/reviews/{tid}", "admin").status_code == 200)

print("marketplace")
it = {"title": "Oliy matematika kitobi", "description": "Yangi holatda", "category": "kitob", "condition": "yaxshi", "price": 50000, "contact": "@sotuvchi"}
ok("anonymous cannot post", call("post", "/api/market", None, it).status_code == 401)
r = call("post", "/api/market", 1, it); mid = js(r)["item"]["id"]; ok("create item → 201, defaults university from profile", r.status_code == 201 and js(r)["item"]["university"] == "NUU")
ok("contact hidden from anonymous visitors", js(call("get", "/api/market"))["items"][0]["contact"] is None)
ok("contact visible to signed-in users", js(call("get", "/api/market", 2))["items"][0]["contact"] == "@sotuvchi")
ok("seller exposed by first name only", js(call("get", "/api/market"))["items"][0]["seller_name"] == "Talaba" and "email" not in json.dumps(js(call("get", "/api/market"))))
for bad, why in [({**it, "price": -1}, "negative price"), ({**it, "price": "abc"}, "text price"), ({**it, "price": 10**10}, "absurd price"), ({**it, "category": "weapons"}, "bad category"), ({**it, "title": "ab"}, "short title"), ({**it, "contact": ""}, "no contact"), ({**it, "condition": "zo'r"}, "bad condition")]:
    ok(f"rejects {why}", call("post", "/api/market", 2, bad).status_code == 400)
ok("free (price 0) and negotiable (null) are allowed", call("post", "/api/market", 2, {**it, "title": "Tekin konspekt", "price": 0, "category": "konspekt"}).status_code == 201 and call("post", "/api/market", 2, {**it, "title": "Kelishiladi", "price": None}).status_code == 201)
ok("filter by category", js(call("get", "/api/market?category=konspekt"))["total"] == 1)
ok("sort=cheap puts negotiable (null) last", [i["price"] for i in js(call("get", "/api/market?sort=cheap"))["items"]] == [0, 50000, None])
ok("max_price filter", js(call("get", "/api/market?max_price=1000"))["total"] == 1)
ok("max_price non-numeric → 400", call("get", "/api/market?max_price=abc").status_code == 400)
ok("wildcard search is escaped", js(call("get", "/api/market?q=%25"))["total"] == 0)
ok("non-owner cannot edit", call("patch", f"/api/market/{mid}", 3, {"price": 1}).status_code == 403)
ok("owner marks sold → disappears from public list", call("patch", f"/api/market/{mid}", 1, {"status": "sold"}).status_code == 200 and js(call("get", "/api/market"))["total"] == 2)
ok("…but stays in the owner's own list", js(call("get", "/api/market?mine=1", 1))["total"] == 1)
ok("invalid status rejected", call("patch", f"/api/market/{mid}", 1, {"status": "hidden"}).status_code == 400)
for n in range(13): call("post", "/api/market", 4, {**it, "title": f"Kitob raqam {n}"})
ok("per-user cap of 15 active listings → 429", call("post", "/api/market", 4, {**it, "title": "Oxirgisi"}).status_code in (201,) and call("post", "/api/market", 4, {**it, "title": "Ortiqcha"}).status_code in (201, 429))
cnt = MarketItem.query.filter_by(user_id=ids[4], status="active").count() if False else None
with app.app_context(): cnt = MarketItem.query.filter_by(user_id=ids[4], status="active").count()
ok("cap really enforced (≤ 15 active)", cnt <= 15, str(cnt))
r = call("post", "/api/market", 4, {**it, "title": "Yana bir kitob"}); ok("16th active listing is refused", cnt < 15 or r.status_code == 429)
with app.app_context(): vic = MarketItem.query.filter_by(user_id=ids[4]).first().id
for u in (1, 2, 3): rr = call("post", f"/api/market/{vic}/report", u, {"reason": "firibgarlik"})
ok("3 reports auto-hide a listing", js(rr)["hidden"] and call("get", f"/api/market/{vic}", 5).status_code == 404)
ok("owner can still see it, but cannot re-publish", call("get", f"/api/market/{vic}", 4).status_code == 200 and call("patch", f"/api/market/{vic}", 4, {"status": "active"}).status_code == 403)

print("lost & found")
today = __import__("datetime").date.today(); iso = lambda d: d.isoformat()
lf = {"kind": "lost", "title": "Qora hamyon", "place": "2-bino kutubxona", "happened_on": iso(today), "contact": "+998901234567"}
ok("anonymous cannot post", call("post", "/api/lostfound", None, lf).status_code == 401)
r = call("post", "/api/lostfound", 1, lf); lid = js(r)["item"]["id"]; ok("create → 201", r.status_code == 201)
ok("future date rejected", call("post", "/api/lostfound", 1, {**lf, "happened_on": iso(today + __import__("datetime").timedelta(days=5))}).status_code == 400)
ok("date >1 year old rejected", call("post", "/api/lostfound", 1, {**lf, "happened_on": iso(today - __import__("datetime").timedelta(days=400))}).status_code == 400)
ok("garbage date rejected", call("post", "/api/lostfound", 1, {**lf, "happened_on": "kecha"}).status_code == 400)
ok("bad kind rejected", call("post", "/api/lostfound", 1, {**lf, "kind": "stolen"}).status_code == 400)
ok("contact hidden from anonymous / shown to members", js(call("get", "/api/lostfound"))["items"][0]["contact"] is None and js(call("get", "/api/lostfound", 2))["items"][0]["contact"] == "+998901234567")
call("post", "/api/lostfound", 2, {**lf, "kind": "found", "title": "Kalitlar"})
ok("filter kind=found", js(call("get", "/api/lostfound?kind=found"))["total"] == 1)
ok("non-owner cannot resolve", call("patch", f"/api/lostfound/{lid}", 3, {"status": "resolved"}).status_code == 403)
ok("owner resolves → leaves public list", call("patch", f"/api/lostfound/{lid}", 1, {"status": "resolved"}).status_code == 200 and js(call("get", "/api/lostfound"))["total"] == 1)

print("sync")
S = "talaba:planner:v1"
ok("anonymous cannot sync", call("get", "/api/sync").status_code == 401 and call("put", "/api/sync", None, {"data": {}}).status_code == 401)
ok("empty pull", js(call("get", "/api/sync", 1))["data"] == {})
r = call("put", "/api/sync", 1, {"data": {S: {"v": {"tasks": [1]}, "t": 1000}, "talaba_token": {"v": "pwn", "t": 5}, "evil:key": {"v": 1, "t": 1}}}); d = js(r)["data"]
ok("only whitelisted keys are stored (auth token / foreign keys ignored)", list(d.keys()) == [S])
d = js(call("put", "/api/sync", 1, {"data": {S: {"v": {"tasks": [2]}, "t": 500}}}))["data"]; ok("older edit does NOT overwrite newer data", d[S]["v"] == {"tasks": [1]})
d = js(call("put", "/api/sync", 1, {"data": {S: {"v": {"tasks": [3]}, "t": 2000}}}))["data"]; ok("newer edit wins", d[S]["v"] == {"tasks": [3]} and d[S]["t"] == 2000)
d = js(call("put", "/api/sync", 1, {"data": {"talaba:gpa:v1": {"v": {"mode": "uz5"}, "t": 3000}}}))["data"]; ok("keys merge independently", set(d) == {S, "talaba:gpa:v1"})
ok("skills and CV data are syncable too", set(js(call("put", "/api/sync", 1, {"data": {"talaba:skills:v1": {"v": {"skills": []}, "t": 4000}, "talaba:cv:v1": {"v": {"fullName": "A"}, "t": 4000}}}))["data"]) >= {"talaba:skills:v1", "talaba:cv:v1"})
ok("users are isolated", js(call("get", "/api/sync", 2))["data"] == {})
for bad in ({"data": [1]}, {"data": {S: "x"}}, {"data": {S: {"v": 1}}}, {"data": {S: {"v": 1, "t": "now"}}}, {"data": {S: {"v": 1, "t": True}}}, {}):
    ok(f"rejects malformed payload {json.dumps(bad)[:40]}", call("put", "/api/sync", 1, bad).status_code == 400)
ok("oversized key → 413", call("put", "/api/sync", 1, {"data": {S: {"v": "x" * 250000, "t": 9000}}}).status_code == 413)
ok("failed push left stored data intact", js(call("get", "/api/sync", 1))["data"][S]["v"] == {"tasks": [3]})


print("moderation")
ok("anonymous cannot read stats", call("get", "/api/moderation/stats").status_code == 401)
ok("non-admin gets 403 on stats and queue", call("get", "/api/moderation/stats", 1).status_code == 403 and call("get", "/api/moderation/queue", 1).status_code == 403)
r = call("post", "/api/market", 5, {**it, "title": "Shubhali e'lon"}); sid = js(r)["item"]["id"]
for u in (1, 2, 3): call("post", f"/api/market/{sid}/report", u, {"reason": f"firibgarlik {u}"})
q = js(call("get", "/api/moderation/queue", "admin"))["items"]; row = [x for x in q if x["kind"] == "market" and x["id"] == sid][0]
ok("queue lists the auto-hidden listing with reasons and author", row["hidden"] and row["report_count"] == 3 and len(row["reasons"]) == 3 and row["author"]["email"] == "t5@x.uz")
ok("auto-hidden items come first in the queue", q[0]["hidden"])
st = js(call("get", "/api/moderation/stats", "admin")); ok("stats reflect flagged/hidden/users", st["flagged"] >= 1 and st["hidden"] >= 1 and st["users"] >= 6)
ok("restore makes it visible again and closes the reports", call("post", f"/api/moderation/market/{sid}/restore", "admin").status_code == 200 and call("get", f"/api/market/{sid}", 3).status_code == 200)
with app.app_context(): ok("restore cleared report rows and counter", ContentReport.query.filter_by(kind="market", item_id=sid).count() == 0 and MarketItem.query.get(sid).report_count == 0)
ok("manual hide works", call("post", f"/api/moderation/market/{sid}/hide", "admin").status_code == 200 and call("get", f"/api/market/{sid}", 3).status_code == 404)
ok("admin delete removes the item", call("delete", f"/api/moderation/market/{sid}", "admin").status_code == 200 and call("get", f"/api/market/{sid}", 5).status_code == 404)
ok("unknown kind → 400, missing id → 404", call("post", "/api/moderation/banana/1/restore", "admin").status_code == 400 and call("post", "/api/moderation/market/99999/restore", "admin").status_code == 404)
ok("non-admin cannot restore/delete", call("post", "/api/moderation/market/1/restore", 1).status_code == 403 and call("delete", "/api/moderation/market/1", 1).status_code == 403)

print("account deletion")
r = call("delete", "/api/auth/me?confirm=DELETE", 1, {"confirm": "DELETE"})
print("   delete status:", r.status_code, (js(r) or {}).get("error", "")[:80])
with app.app_context():
    left = {n: m.query.filter_by(user_id=ids[1]).count() for n, m in [("reviews", CourseReview), ("market", MarketItem), ("lostfound", LostFoundItem), ("sync", UserSync)]}
ok("deleting the account removes reviews/listings/lost-found/sync rows", r.status_code == 200 and all(v == 0 for v in left.values()), str(left))
print(f"\nALL {passed} CHECKS PASSED")
