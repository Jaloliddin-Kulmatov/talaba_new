"""Offline tests for the job scraper: deadlines, student-fit scoring, hh.uz page/API parsing, the search → score →
store pipeline, the nightly verification and the clean-up. No network: every hh call is replaced by a fake.

Run from the backend/ folder:   python tests/test_jobs.py
"""
import os, sys, json, tempfile, html as htmllib
from datetime import date, datetime, timedelta
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_tmp = tempfile.mkdtemp()
os.environ.update(DISABLE_SCHEDULER="1", GROQ_API_KEY="", DATABASE_URL="sqlite:///" + os.path.join(_tmp, "test.db"))
import app as A
from flask_jwt_extended import create_access_token
from models import *
import deadlines as D
from scrapers import hh_sources as S, hh_uz as H
app, db = A.app, A.db
passed = 0
def ok(name, cond, extra=""):
    global passed
    if not cond: print("  ✗ FAIL:", name, extra); sys.exit(1)
    passed += 1; print("  ✓", name)
T = date(2026, 10, 21)

print("deadlines")
for text, want in [
    ("Приём заявок до 25 ноября 2026 года", "2026-11-25"), ("Срок подачи: до 5 ноября", "2026-11-05"),
    ("Deadline: October 30, 2026", "2026-10-30"), ("Apply by 15 Nov 2026", "2026-11-15"),
    ("Hujjat topshirish 30 noyabrgacha", "2026-11-30"), ("Oxirgi muddat: 12.12.2026", "2026-12-12"),
    ("Registration closes Nov 5", "2026-11-05"), ("deadline 2026-12-01", "2026-12-01"),
    ("Заявки принимаются до 10 октября", "2027-10-10"), ("до 3 января 2026", "2026-01-03"),
    ("Стажировка с 1 сентября, опыт до 2 лет", ""), ("Работа до 5 лет опыта", ""), ("Зарплата до 25 000 000 сум", ""),
    ("Мы основаны 12 мая 2019 года", ""), ("", "")]:
    ok(f"extract: {text[:44]!r} → {want or 'nothing'}", D.extract_deadline(text, T) == want, D.extract_deadline(text, T))
ok("two dates: the earliest upcoming one wins", D.extract_deadline("Deadline: 30 Nov 2026. Early birds apply by 5 Nov 2026", T) == "2026-11-05")
ok("normalize: dd.mm.yyyy / ISO datetime / text date", D.normalize_deadline("20.11.2026") == "2026-11-20" == D.normalize_deadline("2026-11-20T10:00:00+03:00") == D.normalize_deadline("20 noyabr 2026"))
ok("normalize leaves free text alone", D.normalize_deadline("Doimiy") == "Doimiy" and D.normalize_deadline("Iyun 30") == "Iyun 30" and D.normalize_deadline(None) == "")
ok("days_left: last day = 0, yesterday = -1, free text = None", D.days_left("2026-10-21", T) == 0 and D.days_left("2026-10-20", T) == -1 and D.days_left("Doimiy", T) is None)
ok("is_expired only after the deadline day", not D.is_expired("2026-10-21", T) and D.is_expired("2026-10-20", T) and not D.is_expired("", T))
ok("earliest ignores blanks and free text", D.earliest("", "Doimiy", "2026-12-01", "2026-11-05") == "2026-11-05" and D.earliest("x", "") == "")
ok("impossible dates are ignored (31 February)", D.extract_deadline("deadline 31 February 2026", T) == "")

print("parsing")
ok("strip_html keeps list/paragraph structure", S.strip_html("<p>Hi&nbsp;there</p><ul><li>One</li><li>Two &amp; three</li></ul>") == "Hi there\n• One\n• Two & three")
ok("hh_id from links", S.hh_id("https://hh.uz/vacancy/138561331?query=x") == "138561331" and S.hh_id("https://example.com/1") is None)
ok("dup_key ignores case and punctuation", S.dup_key("Uzum Tezkor, LLC", "Python Intern!") == S.dup_key("uzum tezkor llc", "python  intern"))
HTML_ITEM = {"vacancyId": 111, "name": "Python Intern (Backend)", "company": {"visibleName": "IT Park", "name": "IT Park"}, "area": {"name": "Ташкент"},
             "compensation": {"from": 3000000, "to": 5000000, "currencyCode": "UZS"}, "publicationTime": {"$": "2026-10-20T10:00:00.000+03:00"},
             "workExperience": "noExperience", "internship": True, "employmentForm": "PART", "workFormats": [{"workFormatsElement": ["HYBRID"]}], "@workSchedule": "flexible"}
p = S.posting_from_html(HTML_ITEM, detail=False)
ok("html item → posting", p["id"] == "111" and p["company"] == "IT Park" and p["internship"] and p["employment"] == "part" and p["hybrid"] and p["flexible"] and p["salary"] == "3 000 000–5 000 000 so'm", p)
DETAIL = {"vacancyId": 111, "name": "Python Intern (Backend)", "company": {"name": "IT Park"}, "area": {"name": "Ташкент"}, "workExperience": "noExperience",
          "internship": True, "employmentForm": "PART", "workFormats": ["REMOTE"], "workScheduleByDays": ["FLEXIBLE"], "compensation": {"noCompensation": True},
          "description": "<p>Требования:</p><ul><li>Python</li><li>SQL</li></ul><p>Условия:</p><ul><li>Гибкий график</li></ul><p>Приём заявок до 25 ноября 2026</p>",
          "keySkills": ["Python", "SQL"], "validToTimeIso": "2026-11-20T13:00:00.000+03:00", "publicationTimeIso": "2026-10-21T13:00:00.000+03:00",
          "status": {"archived": False}, "closedForApplicants": False}
d = S.posting_from_html(DETAIL, detail=True)
ok("html detail → description, skills, expiry, remote", "• Python" in d["description"] and d["key_skills"] == ["Python", "SQL"] and d["valid_to"].startswith("2026-11-20") and d["remote"] and not d["archived"])
ok("requirements section is extracted, other sections are not", H.requirements_from(d["description"]) == "• Python\n• SQL")
ok("deadline: the earlier of listing expiry (20 Nov) and text (25 Nov) → listing", H.decide_deadline(d, T) == ("2026-11-20", "listing"))
ok("deadline: a text date earlier than the expiry wins and is labelled 'text'", H.decide_deadline({**d, "description": "Deadline: 5 Nov 2026"}, T) == ("2026-11-05", "text"))
ok("deadline: nothing known → rolling", H.decide_deadline({"description": "", "valid_to": ""}, T) == ("", ""))
API = {"id": "222", "name": "Стажёр-аналитик", "employer": {"name": "Uzum"}, "area": {"name": "Ташкент"}, "experience": {"id": "noExperience"}, "employment": {"id": "probation"},
       "schedule": {"id": "flexible"}, "salary": {"from": 2000000, "currency": "UZS"}, "published_at": "2026-10-20T10:00:00+0300", "expires_at": "2026-11-19T10:00:00+0300",
       "alternate_url": "https://hh.uz/vacancy/222", "description": "<p>Описание</p>", "key_skills": [{"name": "Excel"}], "archived": False}
a = S.posting_from_api(API, detail=True)
ok("api detail → posting (probation = internship)", a["internship"] and a["flexible"] and a["key_skills"] == ["Excel"] and a["salary"] == "2 000 000+ so'm" and a["valid_to"].startswith("2026-11-19"), a)
ok("page state is read from the embedded template (plain and html-escaped JSON)",
   S._page_state('<template id="HH-Lux-InitialState">' + json.dumps({"a": 1}) + "</template>") == {"a": 1}
   and S._page_state('<template id="HH-Lux-InitialState">' + htmllib.escape(json.dumps({"a": "x"})) + "</template>") == {"a": "x"}
   and S._page_state("<html>captcha</html>") is None)

print("student fit")
def fit(**kw): return S.fit({**S._blank(), **kw})
s1 = fit(title="Python Intern", internship=True, experience="noExperience", flexible=True)
ok("flagged internship, no experience, flexible → high score, kind 'internship'", s1[0] >= 9 and s1[1] == "internship", s1)
ok("senior role with years of experience → rejected", fit(title="Senior Backend Engineer", experience="between3And6")[0] < 0)
ok("'Head of …' is penalised even with no experience listed", fit(title="Head of Engineering Design", experience="noExperience")[0] < 4)
ok("junior part-time, no experience → keeps ('part-time')", fit(title="Junior SMM", experience="noExperience", employment="part")[:2] == (fit(title="Junior SMM", experience="noExperience", employment="part")[0], "part-time") and fit(title="Junior SMM", experience="noExperience", employment="part")[0] >= 4)
ok("remote entry-level → kind 'remote'", fit(title="Content writer", experience="noExperience", remote=True, flexible=True)[1] == "remote")
ok("rigid 5/2 full-time without internship flag scores lower than the flexible one", fit(title="Operator", experience="noExperience", description="График 5/2, полный рабочий день")[0] < fit(title="Operator", experience='noExperience', flexible=True)[0])
ok("'опыт от 3 лет' in the text is penalised", fit(title="Analyst", experience="noExperience", description="Требуется опыт работы от 3 лет")[0] < fit(title="Analyst", experience="noExperience")[0])
ok("archived / closed postings never qualify", fit(title="Intern", internship=True, archived=True)[0] < 0 and fit(title="Intern", internship=True, closed=True)[0] < 0)
ok("schedule labels: flexible → all study forms; plain full-time → sirtqi", S.schedule_labels({"flexible": True}) == "kunduzgi, sirtqi, kechki" and S.schedule_labels({"employment": "full"}) == "sirtqi")

print("fetching (fake HTTP)")
class R:
    def __init__(self, code=200, text="", js=None, headers=None): self.status_code, self.text, self._js, self.headers = code, text, js, headers or {}
    def json(self): return self._js
def page(state): return '<html><template id="HH-Lux-InitialState">' + json.dumps(state) + "</template></html>"
calls = []
def fake_get(url, **kw):
    calls.append((url, kw.get("params")))
    if url.endswith("/search/vacancy"): return R(text=page({"vacancySearchResult": {"vacancies": [HTML_ITEM]}}))
    if url.endswith("/vacancy/111"): return R(text=page({"vacancyView": {"vacancyFull": {"vacancy": DETAIL}}}))
    if url.endswith("/vacancy/222"): return R(text=page({"vacancyView": {"vacancyFull": {"vacancy": {**DETAIL, "vacancyId": 222, "status": {"archived": True}}}}}))
    if url.endswith("/vacancy/333"): return R(text=page({"vacancyView": {}}))
    if url.endswith("/vacancy/444"): return R(text="<html>captcha</html>")
    if url.endswith("/vacancy/555"): return R(code=404)
    return R(code=404)
S._get = lambda url, **kw: fake_get(url, **kw)
H_src = S.HtmlSource()
ok("html search → postings, sends the plan's filters", H_src.search(S.PLANS[0], 0, 50)[0]["id"] == "111" and calls[-1][1]["label"] == "internship" and calls[-1][1]["area"] == 97)
ok("status: open posting", H_src.status("111")[0] == "open")
ok("status: archived posting → closed", H_src.status("222")[0] == "closed")
ok("status: page without a vacancy → gone", H_src.status("333")[0] == "gone")
ok("status: captcha page → unknown (never 'gone')", H_src.status("444")[0] == "unknown")
ok("status: 404 → gone", H_src.status("555")[0] == "gone")
ok("detail of an archived posting is still returned (caller decides)", H_src.detail("222")["archived"])
cands, fetched = S.collect_candidates(H_src, pages=1, sleep=lambda *_: None)
ok("collect_candidates merges the same posting found by several searches", len(cands) == 1 and len(cands[0]["plans"]) == len(S.PLANS) and fetched == len(S.PLANS))
os.environ.pop("HH_UZ_TOKEN", None); os.environ.pop("HH_UZ_ALLOW_HTML", None)
ok("source choice: anonymous → API; token → API; opt-in → HTML", S.pick_source().name == "api")
os.environ["HH_UZ_ALLOW_HTML"] = "1"; ok("opt-in flag switches to the public pages", S.pick_source().name == "html"); os.environ.pop("HH_UZ_ALLOW_HTML")
os.environ["HH_UZ_TOKEN"] = "x"; ok("a token wins over the opt-in", S.pick_source().name == "api"); os.environ.pop("HH_UZ_TOKEN")

print("pipeline")
_real_translate = H._translate_with_groq
H._translate_with_groq = lambda row: {**row, "title": "[uz] " + row["title"], "student_friendly": "ha", "student_friendly_note": "ok"}   # no network in tests
def posting(i, title, company="Firma", **kw):
    base = {**S._blank(), "id": str(i), "url": f"https://hh.uz/vacancy/{i}", "title": title, "company": company, "location": "Toshkent", "experience": "noExperience",
            "internship": True, "flexible": True, "description": "Описание вакансии", "has_detail": True,
            "valid_to": (datetime.utcnow() + timedelta(days=25)).isoformat(), "published_at": "2026-10-20T10:00:00"}
    return {**base, **kw}
class Fake:
    name = "fake"
    def __init__(self, items, details=None, blocked=False): self.items, self.det, self.blocked = items, details or {p["id"]: p for p in items}, blocked
    def search(self, plan, page, per_page):
        if self.blocked: raise S.Blocked("403")
        return [dict(p) for p in self.items] if (plan["name"] == S.PLANS[0]["name"] and page == 0) else []
    def detail(self, vid): return self.det.get(vid)
good = posting(1001, "Стажёр Python")
senior = posting(1002, "Senior Python Developer", internship=False, experience="between3And6", flexible=False)
expired = posting(1003, "Стажёр отдела продаж", valid_to="2026-01-01T10:00:00", description="Заявки до 3 января 2026")
dup = posting(1004, "Стажёр Python")                                  # same company + title as 1001
archived = posting(1005, "Стажёр маркетинга", archived=True)
texty = posting(1006, "Стажёр SMM", company="Other", description="Заявки принимаются до 5 ноября 2026", valid_to=(datetime.utcnow() + timedelta(days=28)).isoformat())
nosal = posting(1007, "Стажёр без срока", company="Third", valid_to="")
fake = Fake([good, senior, expired, dup, archived, texty, nosal, posting(9001, "Already live"), posting(1008, "Stajyor reposted", company="Z")])
with app.app_context():
    db.session.add(Job(title="Old", company="Old", apply_link="https://hh.uz/vacancy/9001", is_active=True, source="hh"))
    db.session.add(Job(title="Closed earlier", company="Z", apply_link="https://hh.uz/vacancy/1008", is_active=False, source="hh", closed_reason="yopilgan", closed_at=datetime.utcnow() - timedelta(days=3)))
    db.session.commit()
sm = H.run_scraper(app, source=fake, sleep=lambda *_: None, today=T)
with app.app_context():
    rows = {S.hh_id(j.apply_link): j for j in Job.query.all()}
ok("inserted the good one with its listing deadline and kind", rows["1001"].title.startswith("[uz]") and rows["1001"].source == "hh" and rows["1001"].job_type == "internship" and rows["1001"].deadline_source == "listing" and D.days_left(rows["1001"].deadline, T) is not None)
ok("a senior role is not stored (low fit)", "1002" not in rows and sm["skipped_low_fit"] >= 1)
ok("an already expired posting is not stored", "1003" not in rows and sm["skipped_expired"] == 1)
ok("a repost of the same role by the same employer is skipped as a duplicate", "1004" not in rows and sm["skipped_duplicate"] == 1)
ok("an archived posting is not stored", "1005" not in rows and sm["skipped_closed"] == 1)
ok("the deadline written in the text wins when it is earlier", rows["1006"].deadline == "2026-11-05" and rows["1006"].deadline_source == "text")
ok("no deadline anywhere → rolling (blank), not a made-up date", rows["1007"].deadline == "")
ok("a live posting that is already in the database is not touched", sm["skipped_existing"] == 1)
ok("a posting closed earlier but live again is reactivated, with its reason cleared", rows["1008"].is_active and rows["1008"].closed_reason == "" and sm["reactivated"] == 1)
ok("summary adds up", sm["inserted"] == 3 and sm["details"] >= 5 and sm["mode"] == "fake" and not sm["blocked"], sm)
ok("blocked source: nothing crashes, run is flagged", H.run_scraper(app, source=Fake([], blocked=True), sleep=lambda *_: None, today=T)["blocked"])
os.environ["MAX_PER_RUN"] = "1"
many = Fake([posting(2000 + i, f"Стажёр {i}", company=f"Co{i}") for i in range(5)])
ok("MAX_PER_RUN caps inserts", H.run_scraper(app, source=many, sleep=lambda *_: None, today=T)["inserted"] == 1); os.environ.pop("MAX_PER_RUN")
H._translate_with_groq = lambda row: {**row, "student_friendly": "yoq"}
ok("AI says 'not student friendly' → skipped", H.run_scraper(app, source=Fake([posting(3001, "Стажёр X", company="Strict")]), sleep=lambda *_: None, today=T)["skipped_not_student_friendly"] == 1)
tr = []; H._translate_with_groq = lambda row: (tr.append(row["title"]) or {**row, "student_friendly": "ha"})
H.run_scraper(app, source=Fake([posting(3002, "Python Intern", company="English Co", description="English description only", location="Tashkent")]), sleep=lambda *_: None, today=T)
ok("text without Cyrillic is never sent to the translator", tr == [])

print("nightly verification")
class VFake:
    name = "vfake"
    def __init__(self, states): self.states = states
    def status(self, vid):
        s = self.states.get(vid, "open")
        if s == "blocked": raise S.Blocked("403")
        if s == "boom": raise RuntimeError("network")
        return s, (posting(int(vid), "Стажёр", valid_to=(datetime.utcnow() + timedelta(days=9)).isoformat()) if s == "open" else None)
with app.app_context():
    Job.query.delete(); db.session.commit()
    mk = lambda i, **kw: db.session.add(Job(title=f"J{i}", company=f"C{i}", apply_link=f"https://hh.uz/vacancy/{i}", is_active=True, source="hh", **kw))
    for i in (1, 2, 3, 4, 5): mk(i, deadline="2026-12-31", deadline_source="listing")
    mk(6, deadline="2026-12-31", deadline_source="admin")
    db.session.add(Job(title="Seed", company="Seed", is_active=True, source="", apply_link="https://example.com/x"))
    db.session.commit()
sv = H.verify_active_jobs(app, source=VFake({"2": "closed", "3": "gone", "4": "boom"}), sleep=lambda *_: None, today=T)
with app.app_context():
    j = {S.hh_id(x.apply_link): x for x in Job.query.filter(Job.apply_link.like("%hh.uz%")).all()}
    seed = Job.query.filter_by(company="Seed").first()
ok("closed posting is hidden with a reason", not j["2"].is_active and j["2"].closed_reason == "yopilgan" and j["2"].closed_at is not None)
ok("a posting that no longer exists is hidden", not j["3"].is_active and j["3"].closed_reason == "e'lon topilmadi")
ok("a network error changes nothing (unknown)", j["4"].is_active and sv["unknown"] == 1)
ok("an open posting gets its deadline refreshed and is stamped as checked", j["1"].is_active and j["1"].deadline != "2026-12-31" and j["1"].deadline_source == "listing" and j["1"].last_checked_at is not None and sv["deadline_updated"] >= 1)
ok("admin-owned deadlines are never overwritten", j["6"].deadline == "2026-12-31")
ok("seeded / admin rows (not from hh) are never checked", seed.is_active and seed.last_checked_at is None)
ok("summary", sv["closed"] == 1 and sv["gone"] == 1 and not sv["blocked"], sv)
ok("blocked → stops and reports, hides nothing", H.verify_active_jobs(app, source=VFake({str(i): "blocked" for i in range(1, 7)}), sleep=lambda *_: None, today=T)["blocked"])
with app.app_context():
    Job.query.filter(Job.source == "hh").update({"is_active": True, "closed_reason": "", "last_checked_at": None}); db.session.commit()
sv = H.verify_active_jobs(app, source=VFake({str(i): "boom" for i in range(1, 7)}), sleep=lambda *_: None, today=T)
ok("five unknown answers in a row stop the run (probably blocked)", sv["unknown"] == 5 and sv["checked"] == 0, sv)
with app.app_context():
    Job.query.filter(Job.source == "hh").update({"is_active": True, "last_checked_at": None}); db.session.commit()
class SoonFake(VFake):
    def status(self, vid): return "open", posting(int(vid), "x", valid_to="2026-10-01T10:00:00")
sv = H.verify_active_jobs(app, source=SoonFake({}), sleep=lambda *_: None, today=T)
with app.app_context():
    exp = Job.query.filter(Job.source == "hh", Job.is_active.is_(False), Job.closed_reason == "muddati o'tgan").count()
ok("a refreshed deadline that is already past hides the job ('muddati o'tgan'); admin-owned excluded", exp == 5 and sv["expired"] == 5, (exp, sv))

print("clean-up and exposure")
with app.app_context():
    today = datetime.utcnow().date()
    Job.query.delete(); db.session.commit()
    db.session.add_all([
        Job(title="past", company="p", deadline=(today - timedelta(days=1)).isoformat(), is_active=True),
        Job(title="today", company="t", deadline=today.isoformat(), is_active=True),
        Job(title="dotted-past", company="dp", deadline=(today - timedelta(days=2)).strftime("%d.%m.%Y"), is_active=True),
        Job(title="free", company="f", deadline="Doimiy", is_active=True), Job(title="none", company="n", deadline="", is_active=True),
        Job(title="old-hh", company="o", source="hh", is_active=False, closed_at=datetime.utcnow() - timedelta(days=120)),
        Job(title="recent-hh", company="o2", source="hh", is_active=False, closed_at=datetime.utcnow() - timedelta(days=10)),
        Job(title="old-admin", company="o3", source="", is_active=False, closed_at=datetime.utcnow() - timedelta(days=400))])
    db.session.commit()
A._cleanup_expired_jobs(app)
with app.app_context():
    act = {j.title: j.is_active for j in Job.query.all()}
    reason = Job.query.filter_by(title="past").first().closed_reason
ok("clean-up hides yesterday's and dotted-format past deadlines, keeps today / free text / blank", not act["past"] and not act["dotted-past"] and act["today"] and act["free"] and act["none"] and reason == "muddati o'tgan", act)
ok("purge deletes scraped rows closed for 90+ days only", H.purge_closed(app) == 1)
with app.app_context():
    left = {j.title for j in Job.query.all()}
ok("…keeping recently closed and admin-entered rows", "old-hh" not in left and "recent-hh" in left and "old-admin" in left)
with app.app_context():
    d1 = Job(title="x", company="x", created_at=datetime.utcnow(), deadline=(datetime.utcnow().date() + timedelta(days=3)).isoformat()).to_dict()
    d2 = Job(title="x", company="x", created_at=datetime.utcnow(), deadline="Doimiy").to_dict()
    d3 = Job(title="x", company="x", created_at=datetime.utcnow(), deadline=(datetime.utcnow().date() - timedelta(days=1)).strftime("%d.%m.%Y")).to_dict()
    uid = User(name="Admin", email="adm@x.uz", password_hash="x", role="admin"); db.session.add(uid); db.session.commit(); tok = create_access_token(identity=str(uid.id))
ok("API exposes days_left / closing_soon / expired and normalises the date", d1["days_left"] == 3 and d1["closing_soon"] and d2["days_left"] is None and not d2["closing_soon"] and d3["expired"] and len(d3["deadline"]) == 10)
c = app.test_client()
ok("health endpoint needs an admin", c.get("/api/admin/jobs/health").status_code == 401)
h = c.get("/api/admin/jobs/health", headers={"Authorization": f"Bearer {tok}"}).get_json()
ok("health summarises the board", h["active"] >= 3 and "hidden_by_reason" in h and "muddati o'tgan" in h["hidden_by_reason"], h)
ok("admin can start a verification run", c.post("/api/admin/jobs/verify", headers={"Authorization": f"Bearer {tok}"}).status_code == 202)
r = c.post("/api/admin/jobs", headers={"Authorization": f"Bearer {tok}"}, json={"title": "Stajyor", "company": "X", "deadline": "25.12.2026"})
ok("admin-created job: deadline normalised and marked admin-owned", r.status_code == 201 and r.get_json()["job"]["deadline"] == "2026-12-25")
with app.app_context():
    ok("…stored with deadline_source 'admin'", Job.query.filter_by(title="Stajyor").first().deadline_source == "admin")

print("labels and translation fallback")
ok("hh's student flag alone does not make a courier job an 'internship'", fit(title="Курьер", internship=True, flexible=True, experience="noExperience")[1] == "part-time")
ok("…but a flagged posting that talks about a стажировка is one", fit(title="Менеджер", internship=True, experience="noExperience", description="Оплачиваемая стажировка 3 месяца")[1] == "internship")
ok("flagged, rigid, no hint → still shown as 'internship' (the flag is all we know)", fit(title="Оператор", internship=True, experience="noExperience")[1] == "internship")
seen = []
H._google_translate = lambda t: (seen.append(t) or "UZ:" + t)
import time as _t; _t_sleep, _t.sleep = _t.sleep, lambda *_: None
out = _real_translate({"title": "Стажёр", "company": "Uzum", "location": "Ташкент", "description": "English only text", "requirements": ""})
_t.sleep = _t_sleep
ok("fallback translates only the fields that contain Cyrillic", seen == ["Стажёр", "Ташкент"] and out["company"] == "Uzum" and out["description"] == "English only text" and out["title"] == "UZ:Стажёр", seen)

print(f"\nALL {passed} CHECKS PASSED")
