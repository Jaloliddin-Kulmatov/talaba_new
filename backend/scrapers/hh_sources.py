"""Where hh.uz listings come from, and how well each one fits a student.

Two interchangeable sources, both producing the same normalised "posting" dict:

  * ApiSource  — the official api.hh.ru. hh now answers 403 to anonymous callers, so it needs an OAuth
                 application token in HH_UZ_TOKEN (register an app at dev.hh.ru).
  * HtmlSource — the public hh.uz pages, whose embedded page state carries the same data. Off by default
                 (the site's terms govern automated reading): set HH_UZ_ALLOW_HTML=1 to opt in. It reads a
                 few dozen pages per run, one request at a time, with pauses.

Everything that is plain logic (normalising, fit scoring, duplicate keys) lives here as pure functions so it can
be tested without any network.
"""
from __future__ import annotations

import html as _html
import json
import os
import re
import time
from typing import Callable, Optional

import requests

API_BASE = "https://api.hh.ru"
HTML_BASE = "https://hh.uz"
AREA_UZBEKISTAN = 97

_BROWSER_UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) "
               "Version/17.0 Safari/605.1.15")
_APP_UA = "talaba-app/1.0 (talaba.uz student job board; admin@talaba.uz)"


class Blocked(Exception):
    """The site refuses us (403 / captcha). Retrying immediately only makes it worse."""


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


# ── what to look for ─────────────────────────────────────────────────────────

# kind = the job type shown to students ("Amaliyot", "Part-time", …)
PLANS = [
    {"name": "stajirovka-belgisi", "kind": "internship", "html": {"label": "internship"}, "api": {"label": "internship"}},
    {"name": "stajyor-sarlavha",   "kind": "internship", "html": {"text": "стажер OR стажёр OR стажировка OR intern OR internship OR trainee", "search_field": "name"},
                                    "api": {"text": "стажер OR стажёр OR стажировка OR intern OR internship OR trainee", "search_field": "name"}},
    {"name": "part-time",          "kind": "part-time", "html": {"employment_form": "PART", "experience": "noExperience"}, "api": {"employment": "part", "experience": "noExperience"}},
    {"name": "talaba-junior",      "kind": "part-time", "html": {"text": "студент OR подработка OR junior OR ассистент OR помощник", "search_field": "name", "experience": "noExperience"},
                                    "api": {"text": "студент OR подработка OR junior OR ассистент OR помощник", "search_field": "name", "experience": "noExperience"}},
    {"name": "masofaviy",          "kind": "remote", "html": {"work_format": "REMOTE", "experience": "noExperience"}, "api": {"schedule": "remote", "experience": "noExperience"}},
]

_SENIOR = re.compile(r"\b(senior|sr\.?|lead|head of|chief|principal|director|manager of|руководител|начальник|директор|главный|старший|ведущий|тимлид)\b", re.I)
_ENTRY = re.compile(r"(стаж[её]р|стажировк|intern|trainee|junior|джуниор|младший|студент|student|ассистент|assistant|помощник|практикант|стажер)", re.I)
_STUDENT_WORDS = re.compile(r"(студент|выпускник|без опыта|обучени|стажиров|student|graduate|intern|talaba|bitiruvchi)", re.I)
_RIGID = re.compile(r"(полный рабочий день|график 5/2|график 6/1|5/2|6/1|без совмещения|не рассматриваем студентов|only full[- ]time)", re.I)
_MIN_YEARS = re.compile(r"(?:опыт\w*|experience)[^.\n]{0,40}?(?:от|from|minimum|минимум|не менее)?\s*(\d)\+?\s*(?:лет|года|год|years?)", re.I)

# experience ids from hh, from least to most demanding
_EXPERIENCE_RANK = {"noExperience": 0, "between1And3": 1, "between3And6": 2, "moreThan6": 3}


def clean_text(value) -> str:
    return "" if value is None else str(value).strip()


def strip_html(value: str) -> str:
    """hh descriptions are basic HTML. Keep paragraph / list structure as line breaks, drop everything else."""
    t = re.sub(r"(?i)<\s*br\s*/?>", "\n", value or "")
    t = re.sub(r"(?i)</\s*(p|div|li|ul|ol|h[1-6])\s*>", "\n", t)
    t = re.sub(r"(?i)<\s*li[^>]*>", "• ", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = _html.unescape(t).replace("\xa0", " ")
    t = re.sub(r"[ \t]+", " ", t)
    return re.sub(r"\n{3,}", "\n\n", t).strip()


def hh_id(link: str | None) -> str | None:
    m = re.search(r"hh\.(?:uz|ru)/vacancy/(\d+)", link or "")
    return m.group(1) if m else None


def dup_key(company: str, title: str) -> str:
    """Same employer + same role title (ignoring case/punctuation) = the same opening posted twice."""
    norm = lambda s: re.sub(r"[^0-9a-zа-яё]+", "", (s or "").lower())
    return f"{norm(company)}|{norm(title)}"[:200]


# ── normalising ──────────────────────────────────────────────────────────────

def _salary_text(frm, to, currency) -> str:
    cur = {"UZS": "so'm", "RUR": "RUB", "RUB": "RUB"}.get(currency or "UZS", currency or "so'm")
    f = lambda n: f"{int(n):,}".replace(",", " ")
    if frm and to:
        return f"{f(frm)}–{f(to)} {cur}"
    if frm:
        return f"{f(frm)}+ {cur}"
    if to:
        return f"{f(to)} {cur} gacha"
    return ""


def _blank() -> dict:
    return {"id": "", "url": "", "title": "", "company": "", "location": "", "description": "", "key_skills": [],
            "experience": "", "internship": False, "employment": "", "remote": False, "hybrid": False, "flexible": False,
            "salary": "", "published_at": "", "valid_to": "", "archived": False, "closed": False, "has_detail": False}


def posting_from_api(d: dict, detail: bool) -> Optional[dict]:
    if not isinstance(d, dict) or not d.get("id") or not clean_text(d.get("name")):
        return None
    p = _blank()
    sched = (d.get("schedule") or {}).get("id", "") if isinstance(d.get("schedule"), dict) else ""
    emp = (d.get("employment") or {}).get("id", "") if isinstance(d.get("employment"), dict) else ""
    sal = d.get("salary") if isinstance(d.get("salary"), dict) else {}
    p.update({
        "id": str(d["id"]), "url": clean_text(d.get("alternate_url")) or f"{HTML_BASE}/vacancy/{d['id']}",
        "title": clean_text(d["name"]),
        "company": clean_text((d.get("employer") or {}).get("name") if isinstance(d.get("employer"), dict) else ""),
        "location": clean_text((d.get("area") or {}).get("name") if isinstance(d.get("area"), dict) else ""),
        "experience": clean_text((d.get("experience") or {}).get("id") if isinstance(d.get("experience"), dict) else ""),
        "internship": emp == "probation" or bool(d.get("internship")),
        "employment": emp, "remote": sched == "remote", "flexible": sched in ("flexible", "shift", "remote"),
        "salary": _salary_text(sal.get("from"), sal.get("to"), sal.get("currency")),
        "published_at": clean_text(d.get("published_at")), "valid_to": clean_text(d.get("expires_at")),
        "archived": bool(d.get("archived")), "has_detail": detail,
    })
    snippet = d.get("snippet") if isinstance(d.get("snippet"), dict) else {}
    desc = strip_html(clean_text(d.get("description"))) if detail else strip_html(
        "\n".join(x for x in (clean_text(snippet.get("requirement")), clean_text(snippet.get("responsibility"))) if x))
    p["description"] = desc
    if detail:
        for sk in d.get("key_skills") or []:
            name = clean_text(sk.get("name") if isinstance(sk, dict) else sk)
            if name and name not in p["key_skills"]:
                p["key_skills"].append(name)
    return p


_FORM_TO_EMPLOYMENT = {"FULL": "full", "PART": "part", "PROJECT": "project", "VOLUNTEER": "volunteer", "FLY_IN_FLY_OUT": "full"}


def posting_from_html(v: dict, detail: bool) -> Optional[dict]:
    """`v` is a search-page item (detail=False) or the vacancy object from a vacancy page (detail=True)."""
    if not isinstance(v, dict):
        return None
    vid = v.get("vacancyId")
    name = clean_text(v.get("name"))
    if not vid or not name:
        return None
    comp = v.get("compensation") if isinstance(v.get("compensation"), dict) else {}
    formats: list[str] = []
    for f in v.get("workFormats") or []:
        formats += f.get("workFormatsElement", []) if isinstance(f, dict) else [f]
    area = v.get("area") if isinstance(v.get("area"), dict) else {}
    company = v.get("company") if isinstance(v.get("company"), dict) else {}
    status = v.get("status") if isinstance(v.get("status"), dict) else {}
    pub = v.get("publicationTimeIso") or ((v.get("publicationTime") or {}).get("$") if isinstance(v.get("publicationTime"), dict) else "")
    sched_days = v.get("workScheduleByDays") or []
    p = _blank()
    p.update({
        "id": str(vid), "url": f"{HTML_BASE}/vacancy/{vid}", "title": name,
        "company": clean_text(company.get("visibleName") or company.get("name")),
        "location": clean_text(area.get("name")),
        "experience": clean_text(v.get("workExperience")),
        "internship": bool(v.get("internship")),
        "employment": _FORM_TO_EMPLOYMENT.get(clean_text(v.get("employmentForm")).upper(), ""),
        "remote": "REMOTE" in formats, "hybrid": "HYBRID" in formats,
        "flexible": ("REMOTE" in formats) or any(str(x).upper() == "FLEXIBLE" for x in sched_days) or clean_text(v.get("@workSchedule")) in ("flexible", "shift", "remote"),
        "salary": _salary_text(comp.get("from"), comp.get("to"), comp.get("currencyCode")),
        "published_at": clean_text(pub), "valid_to": clean_text(v.get("validToTimeIso")),
        "archived": bool(status.get("archived")), "closed": bool(v.get("closedForApplicants")), "has_detail": detail,
    })
    if detail:
        p["description"] = strip_html(clean_text(v.get("description")))
        p["key_skills"] = [clean_text(s) for s in (v.get("keySkills") or []) if clean_text(s)]
    return p


# ── how well does a posting fit a student? ───────────────────────────────────

def fit(p: dict) -> tuple[int, str, list[str]]:
    """(score, job_type, reasons). Roughly: ≥ 4 is worth showing; ≤ 0 is something a student cannot take."""
    score, why = 0, []
    title, text = p.get("title", ""), p.get("description", "")
    exp_rank = _EXPERIENCE_RANK.get(p.get("experience", ""), 1)

    if p.get("internship"):
        score += 4; why.append("stajirovka belgisi")
    if _ENTRY.search(title):
        score += 3; why.append("sarlavhada stajyor/junior")
    if exp_rank == 0:
        score += 2; why.append("tajribasiz")
    elif exp_rank == 1:
        score += 0
    else:
        score -= 6; why.append("katta tajriba talab qilinadi")
    if p.get("employment") in ("part", "project", "volunteer") or p.get("flexible"):
        score += 2; why.append("moslashuvchan grafik")
    if p.get("remote"):
        score += 1
    if _STUDENT_WORDS.search(text):
        score += 1
    if _SENIOR.search(title):
        score -= 8; why.append("katta lavozim")
    m = _MIN_YEARS.search(text)
    if m and int(m.group(1)) >= 3:
        score -= 4; why.append(f"{m.group(1)} yil tajriba so'ralgan")
    if _RIGID.search(text) and not p.get("internship"):
        score -= 2
    if p.get("closed") or p.get("archived"):
        score -= 20

    # hh's "internship" flag means "open to students / no experience", not always a formal internship, so the
    # label "internship" needs the words too (in the title, or in the text of a flagged posting).
    if re.search(r"(стаж|intern|trainee|stajyor|stajirovka)", title, re.I) or (
            p.get("internship") and re.search(r"(стажиров|intern|trainee|stajirovka)", text, re.I)):
        kind = "internship"
    elif p.get("remote"):
        kind = "remote"
    elif p.get("employment") in ("part", "project", "volunteer") or p.get("flexible"):
        kind = "part-time"
    elif p.get("internship"):
        kind = "internship"
    else:
        kind = "full-time"
    return score, kind, why


def schedule_labels(p: dict) -> str:
    """Which study formats can realistically work this job."""
    if p.get("flexible") or p.get("employment") in ("part", "project", "volunteer") or p.get("internship"):
        return "kunduzgi, sirtqi, kechki"
    if p.get("employment") == "full":
        return "sirtqi"
    return "barchasi"


# ── fetching ─────────────────────────────────────────────────────────────────

def _get(url: str, *, params=None, headers=None, retries: int = 3, sleep: Callable = time.sleep) -> requests.Response:
    """GET with polite retries: 429/5xx back off (honouring Retry-After); 403 raises Blocked straight away."""
    last: Exception | None = None
    for attempt in range(retries):
        try:
            res = requests.get(url, params=params, headers=headers, timeout=25)
        except requests.RequestException as e:
            last = e
            sleep(1.5 * (attempt + 1))
            continue
        if res.status_code == 403:
            raise Blocked(url)
        if res.status_code == 429 or res.status_code >= 500:
            try:
                wait = float(res.headers.get("Retry-After", 0))
            except ValueError:
                wait = 0
            sleep(min(30, wait or 2 * (attempt + 1) ** 2))
            last = RuntimeError(f"HTTP {res.status_code}")
            continue
        return res
    raise last or RuntimeError("request failed")


def _page_state(markup: str) -> Optional[dict]:
    m = re.search(r'id="HH-Lux-InitialState">(.*?)</template>', markup, re.S)
    if not m:
        return None
    raw = m.group(1).strip()
    try:
        return json.loads(raw)
    except ValueError:
        try:
            return json.loads(_html.unescape(raw))
        except ValueError:
            return None


class ApiSource:
    name = "api"

    def __init__(self, token: str | None = None):
        self.token = token or os.environ.get("HH_UZ_TOKEN", "").strip()
        self.headers = {"User-Agent": _APP_UA, "HH-User-Agent": _APP_UA, "Accept": "application/json",
                        **({"Authorization": f"Bearer {self.token}"} if self.token else {})}

    def search(self, plan: dict, page: int, per_page: int) -> list[dict]:
        params = {"area": AREA_UZBEKISTAN, "per_page": per_page, "page": page, "order_by": "publication_time", "period": 30, **plan["api"]}
        data = _get(f"{API_BASE}/vacancies", params=params, headers=self.headers).json()
        return [x for x in (posting_from_api(i, detail=False) for i in (data.get("items") or [])) if x]

    def detail(self, vid: str) -> Optional[dict]:
        res = _get(f"{API_BASE}/vacancies/{vid}", headers=self.headers)
        return posting_from_api(res.json(), detail=True) if res.status_code == 200 else None

    def status(self, vid: str) -> tuple[str, Optional[dict]]:
        """("open" | "closed" | "gone" | "unknown", posting-or-None)"""
        res = _get(f"{API_BASE}/vacancies/{vid}", headers=self.headers)
        if res.status_code in (404, 410):
            return "gone", None
        if res.status_code != 200:
            return "unknown", None
        p = posting_from_api(res.json(), detail=True)
        if not p:
            return "unknown", None
        return ("closed" if p["archived"] else "open"), p


class HtmlSource:
    name = "html"

    def __init__(self):
        self.headers = {"User-Agent": _BROWSER_UA, "Accept-Language": "ru-RU,ru;q=0.9,uz;q=0.8,en;q=0.5"}

    def search(self, plan: dict, page: int, per_page: int) -> list[dict]:
        params = {"area": AREA_UZBEKISTAN, "items_on_page": per_page, "page": page, "order_by": "publication_time", "search_period": 30, **plan["html"]}
        res = _get(f"{HTML_BASE}/search/vacancy", params=params, headers=self.headers)
        state = _page_state(res.text)
        if state is None:
            raise Blocked("search page had no data (captcha?)")
        items = (state.get("vacancySearchResult") or {}).get("vacancies") or []
        return [x for x in (posting_from_html(i, detail=False) for i in items) if x]

    def _vacancy(self, vid: str) -> tuple[str, Optional[dict]]:
        res = _get(f"{HTML_BASE}/vacancy/{vid}", headers=self.headers)
        if res.status_code in (404, 410):
            return "gone", None
        state = _page_state(res.text)
        if state is None:
            return "unknown", None                      # captcha / error page: never treat as "gone"
        v = ((state.get("vacancyView") or {}).get("vacancyFull") or {}).get("vacancy")
        if not v:
            return "gone", None                         # normal page, no vacancy inside: hh's "vacancy not found"
        p = posting_from_html(v, detail=True)
        if not p:
            return "unknown", None
        return ("closed" if (p["archived"] or p["closed"]) else "open"), p

    def detail(self, vid: str) -> Optional[dict]:
        state, p = self._vacancy(vid)
        return p if state in ("open", "closed") else None

    def status(self, vid: str) -> tuple[str, Optional[dict]]:
        return self._vacancy(vid)


def pick_source() -> Optional[object]:
    """API when a token is configured (or anonymous access happens to work); HTML only when explicitly allowed."""
    if os.environ.get("HH_UZ_TOKEN", "").strip():
        return ApiSource()
    if os.environ.get("HH_UZ_ALLOW_HTML", "").strip().lower() in ("1", "true", "yes"):
        return HtmlSource()
    return ApiSource()          # anonymous: may be refused with 403, which run_scraper reports clearly


def collect_candidates(src, plans=None, pages: int | None = None, per_page: int = 50, sleep: Callable = time.sleep) -> tuple[list[dict], int]:
    """Search every plan, merge duplicates (an id found by several plans keeps the best kind). Returns (postings, fetched)."""
    pages = pages if pages is not None else _env_int("HH_UZ_PAGES", 2)
    seen: dict[str, dict] = {}
    fetched = 0
    for plan in plans or PLANS:
        for page in range(max(1, pages)):
            items = src.search(plan, page, per_page)
            fetched += len(items)
            for p in items:
                p.setdefault("plans", [])
                if p["id"] in seen:
                    seen[p["id"]]["plans"].append(plan["name"])
                else:
                    p["plans"] = [plan["name"]]
                    seen[p["id"]] = p
            if len(items) < per_page:
                break
            sleep(0.8)
        sleep(0.8)
    return list(seen.values()), fetched
