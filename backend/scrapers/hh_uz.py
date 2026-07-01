"""
hh.uz (HeadHunter Uzbekistan) internship/part-time job scraper.

Pulls the latest Uzbekistan listings off hh.ru's public API scoped to area=97
(Uzbekistan), normalises each posting into our Job model, deduplicates against
existing apply_link values, and inserts up to MAX_PER_RUN new rows per run.

KNOWN RISK: a manual test of `GET api.hh.ru/vacancies?area=97` from a cloud
sandbox returned HTTP 403 {"errors":[{"type":"forbidden"}]} even with a
compliant HH-User-Agent header, while `GET api.hh.ru/areas/97` (metadata,
confirms area=97 IS Uzbekistan) succeeded — this points to an anti-bot block
on the vacancies endpoint specifically for some source IPs (a known hh.ru
pattern for datacenter/cloud IP ranges), not a broken query or missing auth.
This module is built to run correctly once connectivity is confirmed (e.g.
from the actual deploy host), but MUST NOT be assumed to work until verified
live. Until then, `backend/talaba_jobs.py` (seeded at boot in app.py) keeps
the Jobs page populated regardless of scraper connectivity.

Run modes:
  - Scheduled: APScheduler fires `run_scraper(app)` twice a day (06:00 / 18:00 UTC)
  - Manual: POST /api/admin/jobs/scrape-now triggers it in a background thread

Environment variables (all optional):
  HH_UZ_QUERY       — search keyword (default: "стажировка" — "internship" in Russian,
                       hh.uz listings are predominantly Russian-language)
  HH_UZ_LIMIT       — max listings to pull from the list endpoint (default: 40)
  MAX_PER_RUN       — cap on inserts per run (default: 15)
  DISABLE_SCHEDULER — set to "1" to skip background scheduling (still allows manual run)
"""

from __future__ import annotations

import json
import os
import time
import traceback
from typing import Optional

import requests

LIST_URL   = "https://api.hh.ru/vacancies"
DETAIL_URL = "https://api.hh.ru/vacancies/{id}"

# hh.ru's API asks integrators to identify their app in the User-Agent
# (contact info included) rather than spoofing a browser string.
HEADERS = {
    "User-Agent": "talaba-app/1.0 (talaba.uz job board; contact: admin@talaba.uz)",
    "Accept": "application/json",
    "Accept-Language": "ru-RU,ru;q=0.9,uz;q=0.8,en;q=0.5",
}

AREA_UZBEKISTAN = 97

# Tunables ---------------------------------------------------------------------

def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _query() -> str:
    return os.environ.get("HH_UZ_QUERY", "стажировка")


def _limit() -> int:
    return _env_int("HH_UZ_LIMIT", 40)


def _max_per_run() -> int:
    return _env_int("MAX_PER_RUN", 15)


# HTTP helpers ----------------------------------------------------------------

def _fetch_list() -> list[dict]:
    """Fetch the list page; return the raw items array (may be empty on error)."""
    params = {
        "area": AREA_UZBEKISTAN,
        "text": _query(),
        "per_page": _limit(),
        "order_by": "publication_time",
    }
    try:
        res = requests.get(LIST_URL, params=params, headers=HEADERS, timeout=15)
        res.raise_for_status()
        payload = res.json()
    except Exception as e:
        print(f"[hh_uz] list fetch failed: {e}")
        return []

    if isinstance(payload, dict):
        items = payload.get("items")
        if isinstance(items, list):
            return items
        return []
    if isinstance(payload, list):
        return payload
    return []


def _fetch_detail(vacancy_id) -> Optional[dict]:
    try:
        url = DETAIL_URL.format(id=vacancy_id)
        res = requests.get(url, headers=HEADERS, timeout=15)
        res.raise_for_status()
        return res.json()
    except Exception as e:
        print(f"[hh_uz] detail fetch failed for id={vacancy_id}: {e}")
        return None


# Parsing ---------------------------------------------------------------------

def _clean_text(value) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _strip_html(value: str) -> str:
    """hh.ru descriptions come as basic HTML (<p>, <ul>/<li>, <highlighttext>).
    Strip tags for our plain-text description/requirements fields."""
    import re
    text = re.sub(r"<[^>]+>", "", value or "")
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&quot;", '"')
    return text.strip()


# Schedule-compatibility mapping — hh.ru's schedule/employment enums mapped
# onto our student-relevant "kunduzgi | sirtqi | kechki | barchasi" axis.
# hh.ru schedule.id values: fullDay, shift, flexible, remote, flyInFlyOut
# hh.ru employment.id values: full, part, project, volunteer, probation
_FLEXIBLE_SCHEDULE_IDS = {"flexible", "remote", "shift"}
_PART_TIME_EMPLOYMENT_IDS = {"part", "project", "volunteer"}


def _schedule_compatible(schedule_id: str, employment_id: str) -> str:
    if schedule_id in _FLEXIBLE_SCHEDULE_IDS or employment_id in _PART_TIME_EMPLOYMENT_IDS:
        return "kunduzgi, sirtqi, kechki"  # flexible enough for any study schedule
    if schedule_id == "fullDay" and employment_id == "full":
        return "sirtqi"  # rigid full-day — realistically only sirtqi (correspondence) students can take it
    return "barchasi"


def _parse_job(detail: dict) -> Optional[dict]:
    """Map an hh.ru vacancy detail payload onto our Job columns. Returns None
    if the posting doesn't look usable (e.g. no title or no id)."""
    if not isinstance(detail, dict):
        return None

    vacancy_id = detail.get("id")
    if not vacancy_id:
        return None

    title = _clean_text(detail.get("name"))
    if not title:
        return None

    employer = detail.get("employer") or {}
    company = _clean_text(employer.get("name") if isinstance(employer, dict) else employer)

    area = detail.get("area") or {}
    location = _clean_text(area.get("name") if isinstance(area, dict) else area)

    description = _strip_html(_clean_text(detail.get("description")))

    snippet = detail.get("snippet") or {}
    requirements = _strip_html(_clean_text(
        snippet.get("requirement") if isinstance(snippet, dict) else ""
    ))
    if not requirements:
        # Detail endpoint sometimes only has the full description with
        # requirements folded in — leave requirements empty rather than
        # duplicating the whole description.
        requirements = ""

    key_skills = detail.get("key_skills") or []
    tag_keywords: list[str] = []
    if isinstance(key_skills, list):
        for skill in key_skills:
            name = _clean_text(skill.get("name") if isinstance(skill, dict) else skill)
            if name and name not in tag_keywords:
                tag_keywords.append(name)
    tags = ", ".join(tag_keywords)

    schedule_obj = detail.get("schedule") or {}
    employment_obj = detail.get("employment") or {}
    schedule_id = schedule_obj.get("id") if isinstance(schedule_obj, dict) else ""
    employment_id = employment_obj.get("id") if isinstance(employment_obj, dict) else ""
    schedule_compatible = _schedule_compatible(schedule_id or "", employment_id or "")

    salary = ""
    salary_obj = detail.get("salary") or {}
    if isinstance(salary_obj, dict) and (salary_obj.get("from") or salary_obj.get("to")):
        currency = salary_obj.get("currency") or "UZS"
        s_from, s_to = salary_obj.get("from"), salary_obj.get("to")
        if s_from and s_to:
            salary = f"{s_from:,}–{s_to:,} {currency}"
        elif s_from:
            salary = f"{s_from:,}+ {currency}"
        elif s_to:
            salary = f"up to {s_to:,} {currency}"

    apply_link = _clean_text(detail.get("alternate_url")) or f"https://hh.uz/vacancy/{vacancy_id}"

    return {
        "title": title[:200],
        "company": company[:150] or "hh.uz",
        "location": location[:150],
        "job_type": "internship" if "стажир" in _query().lower() else "part-time",
        "salary": salary[:100],
        "description": description,
        "requirements": requirements,
        "schedule_compatible": schedule_compatible,
        "deadline": "",  # hh.ru vacancies are rolling by default; no fixed deadline field
        "tags": tags[:300],
        "apply_link": apply_link[:500],
    }


# Translation + student-friendliness detection ---------------------------------

_TRANSLATION_PROMPT = """You translate Russian-language job postings from hh.uz (HeadHunter Uzbekistan) to clean, natural Uzbek for an audience of Uzbek university students, and determine whether the schedule accommodates a full-time student.

CRITICAL: Output Uzbek in LATIN SCRIPT ONLY (the modern standard Uzbek alphabet: o'g'ish, sh, ch, etc — e.g. "talaba", "ish", "tajriba"). Do NOT output Cyrillic script under any circumstance, even though the source text is Russian/Cyrillic — this is a hard requirement, not a style preference.

Rules:
- Translate EVERY field, including company names and location where they are generic Russian words (keep proper nouns / brand names as-is — e.g. "Uzum", "Beeline", "Artel" stay unchanged; "Ташкент" → "Toshkent").
- Keep formatting: line breaks between sections, bullet points if present.
- For the student_friendly field, decide one of:
    "ha"      → schedule is flexible/part-time/remote/shift-based, explicitly welcomes students, or hours clearly fit around university classes.
    "yoq"     → requires rigid full 5/2 or 6/1 daytime schedule with no flexibility mentioned, or explicitly excludes students.
    "unclear" → schedule flexibility not stated either way. Default for typical listings.
- student_friendly_note: ONE short Uzbek sentence explaining the decision (max 120 chars).

Return STRICT JSON only — no markdown, no commentary. Schema:
{
  "title": "<Uzbek title>",
  "company": "<company, translated if generic>",
  "location": "<Uzbek location>",
  "description": "<Uzbek description>",
  "requirements": "<Uzbek requirements>",
  "student_friendly": "ha" | "yoq" | "unclear",
  "student_friendly_note": "<short reason in Uzbek>"
}
"""


# Google Translate (unofficial public endpoint) — free, no key required ---------
# Used as a fallback when GROQ_API_KEY is not configured.

_GTRANS_URL = "https://translate.googleapis.com/translate_a/single"
_GTRANS_MAX_CHARS = 4500


def _google_translate(text: str) -> str:
    """Translate Russian → Uzbek via Google's public endpoint. Returns the
    original text on any failure so we never lose data."""
    text = (text or "").strip()
    if not text:
        return ""
    if len(text) > _GTRANS_MAX_CHARS:
        chunks: list[str] = []
        buf = ""
        for para in text.split("\n\n"):
            if len(buf) + len(para) + 2 > _GTRANS_MAX_CHARS:
                if buf:
                    chunks.append(buf)
                buf = para
            else:
                buf = (buf + "\n\n" + para) if buf else para
        if buf:
            chunks.append(buf)
        return "\n\n".join(_google_translate(c) for c in chunks)

    try:
        res = requests.get(
            _GTRANS_URL,
            params={"client": "gtx", "sl": "ru", "tl": "uz", "dt": "t", "q": text},
            headers={"User-Agent": HEADERS["User-Agent"]},
            timeout=15,
        )
        res.raise_for_status()
        data = res.json()
        if not isinstance(data, list) or not data or not isinstance(data[0], list):
            return text
        out_parts = [seg[0] for seg in data[0] if isinstance(seg, list) and seg]
        return "".join(out_parts) or text
    except Exception as e:
        print(f"[hh_uz] google translate failed: {e}")
        return text


# Russian keyword heuristic for student-friendliness (only used when Groq
# isn't available). Matches against the ORIGINAL Russian text.
_RIGID_NEGATIVE = (
    "полный рабочий день", "5/2", "6/1", "без совмещения",
    "не рассматриваем студентов", "только с опытом",
)
_FLEXIBLE_POSITIVE = (
    "гибкий график", "неполный день", "подработка", "для студентов",
    "удаленно", "удалённо", "part-time",
)


def _detect_student_friendly(text: str) -> tuple[str, str]:
    if not text:
        return ("unclear", "")
    low = text.lower()
    has_neg = any(kw in low for kw in _RIGID_NEGATIVE)
    has_pos = any(kw in low for kw in _FLEXIBLE_POSITIVE)
    if has_pos and not has_neg:
        return ("ha", "Moslashuvchan yoki qisman ish grafigi ko'rsatilgan.")
    if has_neg and not has_pos:
        return ("yoq", "To'liq kunlik, moslashuvsiz grafik talab qilinadi.")
    return ("unclear", "Grafik moslashuvchanligi aniq ko'rsatilmagan.")


def _translate_with_groq(parsed: dict) -> dict:
    """Translate Russian job fields to Uzbek (Latin) and classify student
    schedule-friendliness. Tries Groq first, falls back to free Google
    Translate + keyword heuristic when GROQ_API_KEY is missing or Groq errors.
    Never loses data — on total failure the original Russian is preserved."""
    out = dict(parsed)
    out.setdefault("student_friendly", "")
    out.setdefault("student_friendly_note", "")

    api_key = os.environ.get("GROQ_API_KEY", "").strip()

    # ── Path A — Groq (best) ──────────────────────────────────────────────
    if api_key:
        payload_in = {
            "title": parsed.get("title", "")[:200],
            "company": parsed.get("company", "")[:150],
            "location": parsed.get("location", "")[:150],
            "description": parsed.get("description", "")[:4000],
            "requirements": parsed.get("requirements", "")[:3000],
        }
        try:
            from groq import Groq
            client = Groq(api_key=api_key)
            resp = client.chat.completions.create(
                model=os.environ.get("HH_UZ_TRANSLATE_MODEL", "llama-3.3-70b-versatile"),
                messages=[
                    {"role": "system", "content": _TRANSLATION_PROMPT},
                    {"role": "user", "content": json.dumps(payload_in, ensure_ascii=False)},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=2000,
            )
            raw = resp.choices[0].message.content or "{}"
            data = json.loads(raw)

            title = _clean_text(data.get("title"))
            company = _clean_text(data.get("company"))
            location = _clean_text(data.get("location"))
            description = _clean_text(data.get("description"))
            requirements = _clean_text(data.get("requirements"))
            student_friendly = _clean_text(data.get("student_friendly")).lower()
            student_friendly_note = _clean_text(data.get("student_friendly_note"))
            if student_friendly not in {"ha", "yoq", "unclear"}:
                student_friendly = "unclear"

            if title:        out["title"]        = title[:200]
            if company:      out["company"]      = company[:150]
            if location:     out["location"]     = location[:150]
            if description:  out["description"]  = description
            if requirements: out["requirements"] = requirements
            out["student_friendly"]      = student_friendly
            out["student_friendly_note"] = student_friendly_note[:300]
            return out
        except Exception as e:
            print(f"[hh_uz] Groq translation failed, falling back to Google: {e}")
            # fall through to Path B

    # ── Path B — Google Translate fallback ────────────────────────────────
    original_req = parsed.get("requirements", "")
    original_desc = parsed.get("description", "")
    friendly, note = _detect_student_friendly(original_req + "\n" + original_desc)

    out["title"]        = _google_translate(parsed.get("title", ""))[:200] or parsed.get("title", "")
    out["company"]      = _google_translate(parsed.get("company", ""))[:150] or parsed.get("company", "")
    out["location"]     = _google_translate(parsed.get("location", ""))[:150] or parsed.get("location", "")
    out["description"]  = _google_translate(parsed.get("description", "")) or parsed.get("description", "")
    out["requirements"] = _google_translate(parsed.get("requirements", "")) or parsed.get("requirements", "")
    out["student_friendly"]      = friendly
    out["student_friendly_note"] = note[:300]
    return out


# Main scraper ----------------------------------------------------------------

def run_scraper(app) -> dict:
    """Fetch latest hh.uz listings and insert up to MAX_PER_RUN new rows.

    Returns a small summary dict (also printed) so the admin trigger can log
    what happened.
    """
    from app import db
    from models import Job

    summary = {
        "fetched": 0, "skipped_existing": 0, "skipped_invalid": 0,
        "skipped_not_student_friendly": 0,
        "inserted": 0, "reactivated": 0, "errors": 0,
    }

    with app.app_context():
        try:
            listings = _fetch_list()
        except Exception as e:
            print(f"[hh_uz] unexpected list error: {e}")
            traceback.print_exc()
            return summary

        summary["fetched"] = len(listings)
        if not listings:
            print("[hh_uz] no listings returned — bailing out (see module docstring re: known 403 risk)")
            return summary

        active_links = {
            row[0] for row in db.session.query(Job.apply_link)
                .filter(Job.is_active == True, Job.apply_link.isnot(None))  # noqa: E712
                .all()
        }

        max_inserts = _max_per_run()
        inserted_links: list[str] = []
        reactivated_links: list[str] = []

        for raw in listings:
            if summary["inserted"] + summary["reactivated"] >= max_inserts:
                break

            vacancy_id = raw.get("id") if isinstance(raw, dict) else None
            if not vacancy_id:
                summary["skipped_invalid"] += 1
                continue

            detail = _fetch_detail(vacancy_id)
            time.sleep(0.3)  # be polite — avoid hammering the API

            if not detail:
                summary["errors"] += 1
                continue

            parsed = _parse_job(detail)
            if not parsed:
                summary["skipped_invalid"] += 1
                continue

            if parsed["apply_link"] in active_links:
                summary["skipped_existing"] += 1
                continue

            # Translate Russian → Uzbek (Latin) + classify student-friendliness.
            parsed = _translate_with_groq(parsed)

            # Skip postings explicitly unfriendly to a student's schedule —
            # saves DB space and prevents misleading our student audience.
            if (parsed.get("student_friendly") or "").lower() == "yoq":
                summary["skipped_not_student_friendly"] += 1
                continue

            try:
                existing = Job.query.filter_by(apply_link=parsed["apply_link"]).first()
                if existing:
                    existing.title                  = parsed["title"]
                    existing.company                = parsed["company"]
                    existing.location               = parsed["location"]
                    existing.job_type               = parsed["job_type"]
                    existing.salary                 = parsed["salary"]
                    existing.description            = parsed["description"]
                    existing.requirements           = parsed["requirements"]
                    existing.schedule_compatible    = parsed["schedule_compatible"]
                    existing.deadline               = parsed["deadline"]
                    existing.tags                   = parsed["tags"]
                    existing.student_friendly       = parsed.get("student_friendly", "")
                    existing.student_friendly_note  = parsed.get("student_friendly_note", "")
                    existing.is_active              = True
                    db.session.commit()
                    active_links.add(parsed["apply_link"])
                    reactivated_links.append(parsed["apply_link"])
                    summary["reactivated"] += 1
                    continue

                job = Job(
                    title=parsed["title"],
                    company=parsed["company"],
                    location=parsed["location"],
                    job_type=parsed["job_type"],
                    salary=parsed["salary"],
                    description=parsed["description"],
                    requirements=parsed["requirements"],
                    schedule_compatible=parsed["schedule_compatible"],
                    deadline=parsed["deadline"],
                    tags=parsed["tags"],
                    apply_link=parsed["apply_link"],
                    student_friendly=parsed.get("student_friendly", ""),
                    student_friendly_note=parsed.get("student_friendly_note", ""),
                    is_active=True,
                )
                db.session.add(job)
                db.session.commit()
                active_links.add(parsed["apply_link"])
                inserted_links.append(parsed["apply_link"])
                summary["inserted"] += 1
            except Exception as e:
                db.session.rollback()
                summary["errors"] += 1
                print(f"[hh_uz] write failed for {parsed['apply_link']}: {e}")

        print(
            f"[hh_uz] done — fetched={summary['fetched']} "
            f"inserted={summary['inserted']} "
            f"reactivated={summary['reactivated']} "
            f"skipped_existing={summary['skipped_existing']} "
            f"skipped_invalid={summary['skipped_invalid']} "
            f"skipped_not_student_friendly={summary['skipped_not_student_friendly']} "
            f"errors={summary['errors']}"
        )
        if inserted_links:
            print(f"[hh_uz] new postings:\n  " + "\n  ".join(inserted_links))
        if reactivated_links:
            print(f"[hh_uz] reactivated postings:\n  " + "\n  ".join(reactivated_links))

    return summary


# Retroactive translation -----------------------------------------------------

def _looks_cyrillic(text: str) -> bool:
    """True if the string contains any Cyrillic characters."""
    if not text:
        return False
    return any("Ѐ" <= ch <= "ӿ" for ch in text)


def translate_pending(app, limit: int = 80) -> dict:
    """Find active job rows whose title still contains Cyrillic OR whose
    student_friendly column is empty (meaning they were scraped before AI
    classification existed) and translate them in place via Groq.

    Returns a small summary so the admin trigger can display it.
    """
    from app import db
    from models import Job

    summary = {"scanned": 0, "translated": 0, "skipped": 0, "errors": 0}

    with app.app_context():
        rows = (
            Job.query.filter(Job.is_active == True)  # noqa: E712
            .order_by(Job.created_at.desc())
            .limit(limit)
            .all()
        )
        for job in rows:
            summary["scanned"] += 1
            needs = (
                _looks_cyrillic(job.title or "")
                or _looks_cyrillic(job.description or "")
                or _looks_cyrillic(job.requirements or "")
                or not (job.student_friendly or "")
            )
            if not needs:
                summary["skipped"] += 1
                continue

            parsed = {
                "title":        job.title or "",
                "company":      job.company or "",
                "location":     job.location or "",
                "description":  job.description or "",
                "requirements": job.requirements or "",
            }
            translated = _translate_with_groq(parsed)
            if (
                translated.get("title") == parsed["title"]
                and translated.get("student_friendly") in ("", None)
            ):
                summary["errors"] += 1
                continue

            try:
                job.title                 = translated.get("title", job.title)[:200]
                job.company               = (translated.get("company") or job.company)[:150]
                job.location              = (translated.get("location") or job.location or "")[:150]
                job.description           = translated.get("description", job.description)
                job.requirements          = translated.get("requirements", job.requirements)
                job.student_friendly      = translated.get("student_friendly", "")
                job.student_friendly_note = translated.get("student_friendly_note", "")[:300]
                db.session.commit()
                summary["translated"] += 1
            except Exception as e:
                db.session.rollback()
                summary["errors"] += 1
                print(f"[hh_uz] translate write failed for job {job.id}: {e}")

        print(
            f"[hh_uz] translate_pending — scanned={summary['scanned']} "
            f"translated={summary['translated']} skipped={summary['skipped']} "
            f"errors={summary['errors']}"
        )
    return summary
