"""
hh.uz (HeadHunter Uzbekistan) job scraper for students: internships, part-time and entry-level work.

What it does on every run
  1. SEARCH   five searches (employer-flagged internships, "intern" in the title, part-time, student/junior
              titles, remote entry-level) — see PLANS in hh_sources.py.
  2. SCORE    every posting gets a student-fit score (internship flag, "no experience", flexible schedule,
              seniority / years-of-experience penalties). Postings a student cannot take are dropped
              before any expensive work happens.
  3. DEADLINE the real deadline: the listing's own expiry date, or an explicit date found in the text
              ("до 25 ноября", "deadline Oct 30", "25 noyabrgacha"), whichever is earlier.
  4. CLEAN    duplicates (same employer + same role reposted) are skipped; Russian text is translated to
              Uzbek (Latin) only when it actually contains Cyrillic.
  5. VERIFY   `verify_active_jobs` (nightly) re-opens each live posting: closed / archived / removed rows are
              hidden with a reason, deadlines are refreshed; `purge_closed` deletes rows closed for 90+ days.

Where the data comes from (see hh_sources.py): the official API with an OAuth token (HH_UZ_TOKEN), or — only
when you opt in with HH_UZ_ALLOW_HTML=1 — the public hh.uz pages. Anonymous API access is refused by hh (403).

Environment variables (all optional)
  HH_UZ_TOKEN        OAuth application token for api.hh.ru
  HH_UZ_ALLOW_HTML   "1" to read the public hh.uz pages when there is no token
  HH_UZ_PAGES        result pages per search (default 2, 50 per page)
  MAX_PER_RUN        cap on inserts per run (default 25)
  HH_UZ_MAX_DETAILS  cap on detail-page requests per run (default 60)
  HH_UZ_MIN_FIT      minimum student-fit score to keep a posting (default 4)
  HH_UZ_TRANSLATE_MODEL / GROQ_API_KEY   translation (falls back to free Google Translate)
  DISABLE_SCHEDULER  "1" skips background scheduling (manual runs still work)
"""

from __future__ import annotations

import json
import os
import re
import time
import traceback
from datetime import datetime, timedelta
from typing import Callable, Optional

import requests

from deadlines import earliest, extract_deadline, is_expired, parse_iso
from . import hh_sources as S

# Used by the translation fallback below.
HEADERS = {"User-Agent": "talaba-app/1.0 (talaba.uz job board; contact: admin@talaba.uz)"}

DUPLICATE_WINDOW_DAYS = 21
PURGE_AFTER_DAYS = 90


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _clean_text(value) -> str:
    return "" if value is None else str(value).strip()


def _max_per_run() -> int:
    return _env_int("MAX_PER_RUN", 25)


def _max_details() -> int:
    return _env_int("HH_UZ_MAX_DETAILS", 60)


def _min_fit() -> int:
    return _env_int("HH_UZ_MIN_FIT", 4)


# Turning a posting into a Job row ---------------------------------------------

_REQ_HEAD = re.compile(r"^\s*(требовани\w*|мы ожидаем|ожидаем от вас|что нужно|requirements?|qualifications?|we expect|you have|talablar)\s*:?\s*$", re.I)
_OTHER_HEAD = re.compile(r"^\s*(обязанност\w*|задачи|условия|мы предлагаем|что мы предлагаем|responsibilit\w+|we offer|benefits|what you.ll do|vazifalar|shartlar|biz taklif)\s*:?\s*$", re.I)


def requirements_from(description: str) -> str:
    """The "requirements" section of a listing's text (bullet lines), or "" when it has no such section."""
    lines, out, on = (description or "").splitlines(), [], False
    for ln in lines:
        if _REQ_HEAD.match(ln):
            on = True
            continue
        if on and _OTHER_HEAD.match(ln):
            break
        if on and ln.strip():
            out.append(ln.strip())
        if on and len(out) >= 12:
            break
    return "\n".join(out)


def _has_cyrillic(*parts: str) -> bool:
    return any("Ѐ" <= ch <= "ӿ" for part in parts for ch in (part or ""))


def to_row(posting: dict, kind: str, deadline: str, deadline_source: str) -> dict:
    desc = posting.get("description", "")
    return {
        "title": posting["title"][:200], "company": (posting.get("company") or "hh.uz")[:150],
        "location": posting.get("location", "")[:150], "job_type": kind, "salary": posting.get("salary", "")[:100],
        "description": desc[:6000], "requirements": requirements_from(desc)[:3000],
        "schedule_compatible": S.schedule_labels(posting), "deadline": deadline, "deadline_source": deadline_source,
        "tags": ", ".join(posting.get("key_skills", []))[:300], "apply_link": posting["url"][:500],
    }


def decide_deadline(posting: dict, today) -> tuple[str, str]:
    """(iso deadline or "", source). The earlier of the listing's own expiry and a date written in its text."""
    listing = (posting.get("valid_to") or "")[:10]
    text = extract_deadline(posting.get("description", ""), today)
    best = earliest(listing, text)
    if not best:
        return "", ""
    return best, ("text" if text and text == best and text != listing else "listing")


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


_GT_PAUSE_UNTIL = 0.0      # after an HTTP 429 we stop calling Google for a while instead of hammering it


def _google_translate(text: str) -> str:
    """Translate Russian → Uzbek via Google's public endpoint. Returns the
    original text on any failure so we never lose data."""
    global _GT_PAUSE_UNTIL
    text = (text or "").strip()
    if not text:
        return ""
    if time.time() < _GT_PAUSE_UNTIL:
        return text
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
        if "429" in str(e):
            _GT_PAUSE_UNTIL = time.time() + 900
            print("[hh_uz] google translate is rate-limiting us — pausing it for 15 minutes "
                  "(untranslated rows are picked up later by translate_pending)")
        else:
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

    def _tr(field: str, limit: int | None = None) -> str:
        v = parsed.get(field, "") or ""
        if not _looks_cyrillic(v):               # English / Uzbek text is left exactly as written
            return v
        t = _google_translate(v) or v
        time.sleep(0.4)                          # be gentle with the free endpoint
        return t[:limit] if limit else t

    out["title"]        = _tr("title", 200)
    out["company"]      = _tr("company", 150)
    out["location"]     = _tr("location", 150)
    out["description"]  = _tr("description")
    out["requirements"] = _tr("requirements")
    out["student_friendly"]      = friendly
    out["student_friendly_note"] = note[:300]
    return out


# Main scraper ----------------------------------------------------------------

def _row_values(job, row: dict):
    for k in ("title", "company", "location", "job_type", "salary", "description", "requirements", "schedule_compatible",
              "deadline", "deadline_source", "tags", "student_friendly", "student_friendly_note"):
        if k in row:
            setattr(job, k, row[k])


def run_scraper(app, source=None, sleep: Callable = time.sleep, today=None) -> dict:
    """Search, score, de-duplicate, translate and store new student-relevant postings. Returns a summary dict."""
    from app import db
    from models import Job

    today = today or datetime.utcnow().date()
    summary = {
        "mode": "", "fetched": 0, "candidates": 0, "details": 0, "inserted": 0, "reactivated": 0,
        "skipped_existing": 0, "skipped_low_fit": 0, "skipped_closed": 0, "skipped_expired": 0,
        "skipped_duplicate": 0, "skipped_not_student_friendly": 0, "errors": 0, "blocked": False,
    }

    with app.app_context():
        src = source or S.pick_source()
        summary["mode"] = getattr(src, "name", "")
        try:
            candidates, fetched = S.collect_candidates(src, sleep=sleep)
        except S.Blocked:
            summary["blocked"] = True
            print("[hh_uz] hh refused the search (403/captcha). Set HH_UZ_TOKEN (OAuth app token from dev.hh.ru) "
                  "or HH_UZ_ALLOW_HTML=1 to read the public pages.")
            return summary
        except Exception as e:
            print(f"[hh_uz] search failed: {e}")
            traceback.print_exc()
            summary["errors"] += 1
            return summary
        summary["fetched"], summary["candidates"] = fetched, len(candidates)

        rows_by_id = {}
        recent_keys = {}
        for j in Job.query.filter(Job.apply_link.isnot(None)).all():
            vid = S.hh_id(j.apply_link)
            if vid:
                rows_by_id[vid] = j
            if j.is_active and j.created_at:
                recent_keys[S.dup_key(j.company, j.title)] = j.created_at

        # cheap pass on the list data alone: drop what a student cannot take, rank the rest
        ranked = []
        for p in candidates:
            known = rows_by_id.get(p["id"])
            if known is not None and known.is_active:
                summary["skipped_existing"] += 1
                continue
            if p.get("archived") or p.get("closed"):
                summary["skipped_closed"] += 1
                continue
            score, _kind, _why = S.fit(p)
            if score < _min_fit() - 2:               # the list has no description yet, so allow a little slack
                summary["skipped_low_fit"] += 1
                continue
            ranked.append((score, p))
        ranked.sort(key=lambda sp: sp[1].get("published_at", ""), reverse=True)     # newest first …
        ranked.sort(key=lambda sp: -sp[0])                                           # … then best fit first (stable)

        added = []
        for _score, p in ranked:
            if summary["inserted"] + summary["reactivated"] >= _max_per_run() or summary["details"] >= _max_details():
                break
            try:
                detail = src.detail(p["id"])
            except S.Blocked:
                summary["blocked"] = True
                print("[hh_uz] blocked while reading details — stopping this run")
                break
            except Exception as e:
                summary["errors"] += 1
                print(f"[hh_uz] detail failed for {p['id']}: {e}")
                continue
            summary["details"] += 1
            sleep(0.5)
            if not detail:
                summary["errors"] += 1
                continue
            full = {**p, **{k: v for k, v in detail.items() if v not in ("", [], None)}}
            full["has_detail"] = True

            if full.get("archived") or full.get("closed"):
                summary["skipped_closed"] += 1
                continue
            score, kind, why = S.fit(full)
            if score < _min_fit():
                summary["skipped_low_fit"] += 1
                continue
            deadline, dl_source = decide_deadline(full, today)
            if deadline and parse_iso(deadline) < today:
                summary["skipped_expired"] += 1
                continue
            key = S.dup_key(full.get("company", ""), full.get("title", ""))
            seen_at = recent_keys.get(key)
            known = rows_by_id.get(full["id"])
            if known is None and seen_at and (datetime.utcnow() - seen_at) < timedelta(days=DUPLICATE_WINDOW_DAYS):
                summary["skipped_duplicate"] += 1
                continue

            row = to_row(full, kind, deadline, dl_source)
            base_friendly = "ha" if (full.get("internship") or full.get("flexible") or full.get("employment") in ("part", "project", "volunteer")) else "unclear"
            row["student_friendly"], row["student_friendly_note"] = base_friendly, ("; ".join(why)[:300] if why else "")
            if _has_cyrillic(row["title"], row["description"], row["requirements"], row["company"], row["location"]):
                row = _translate_with_groq(row)         # Uzbek (Latin) + AI student-friendliness
            if (row.get("student_friendly") or "").lower() == "yoq":
                summary["skipped_not_student_friendly"] += 1
                continue

            try:
                if known is not None:
                    _row_values(known, row)
                    known.is_active, known.source = True, "hh"
                    known.closed_reason, known.closed_at, known.last_checked_at = "", None, datetime.utcnow()
                    summary["reactivated"] += 1
                else:
                    db.session.add(Job(**row, source="hh", is_active=True, last_checked_at=datetime.utcnow()))
                    summary["inserted"] += 1
                db.session.commit()
                recent_keys[key] = datetime.utcnow()
                added.append(row["apply_link"])
            except Exception as e:
                db.session.rollback()
                summary["errors"] += 1
                print(f"[hh_uz] write failed for {row['apply_link']}: {e}")

        print("[hh_uz] done — " + " ".join(f"{k}={v}" for k, v in summary.items()))
        if added:
            print("[hh_uz] new/updated postings:\n  " + "\n  ".join(added))
    return summary


# Nightly check of what is already published ------------------------------------

def verify_active_jobs(app, source=None, limit: int = 120, sleep: Callable = time.sleep, today=None) -> dict:
    """Re-open each live scraped posting. Closed / removed ones are hidden (with a reason); deadlines are refreshed.

    Safe by design: a 403, captcha or network error is "unknown" and changes nothing — only a definite
    "closed/archived" or "no such vacancy" answer hides a job, and five unknowns in a row stop the run.
    """
    from app import db
    from models import Job

    today = today or datetime.utcnow().date()
    summary = {"checked": 0, "closed": 0, "gone": 0, "expired": 0, "deadline_updated": 0, "unknown": 0, "blocked": False}
    with app.app_context():
        src = source or S.pick_source()
        rows = (Job.query.filter(Job.is_active.is_(True), Job.apply_link.isnot(None), Job.apply_link.like("%hh.%/vacancy/%"))
                .order_by(Job.last_checked_at.is_(None).desc(), Job.last_checked_at.asc()).limit(limit).all())
        streak = 0
        for job in rows:
            vid = S.hh_id(job.apply_link)
            if not vid:
                continue
            try:
                state, p = src.status(vid)
            except S.Blocked:
                summary["blocked"] = True
                break
            except Exception as e:
                state, p = "unknown", None
                print(f"[verify] {vid}: {e}")
            sleep(0.4)
            if state == "unknown":
                summary["unknown"] += 1
                streak += 1
                if streak >= 5:
                    break
                continue
            streak = 0
            summary["checked"] += 1
            now = datetime.utcnow()
            job.last_checked_at = now
            if state in ("closed", "gone"):
                job.is_active, job.closed_at = False, now
                job.closed_reason = "yopilgan" if state == "closed" else "e'lon topilmadi"
                summary["closed" if state == "closed" else "gone"] += 1
            elif p and (job.deadline_source or "") != "admin":
                new, src_name = decide_deadline(p, today)
                if new and new != (job.deadline or ""):
                    job.deadline, job.deadline_source = new, src_name
                    summary["deadline_updated"] += 1
                if is_expired(job.deadline, today):
                    job.is_active, job.closed_at, job.closed_reason = False, now, "muddati o'tgan"
                    summary["expired"] += 1
            db.session.commit()
        print("[verify] " + " ".join(f"{k}={v}" for k, v in summary.items()))
    return summary


def purge_closed(app, days: int = PURGE_AFTER_DAYS) -> int:
    """Delete scraped rows that have been closed for more than `days` days (admin-entered rows are never touched)."""
    from app import db
    from models import Job

    with app.app_context():
        cutoff = datetime.utcnow() - timedelta(days=days)
        old = Job.query.filter(Job.is_active.is_(False), Job.source == "hh", Job.closed_at.isnot(None), Job.closed_at < cutoff).all()
        for j in old:
            db.session.delete(j)
        if old:
            db.session.commit()
        print(f"[purge] deleted {len(old)} long-closed job(s)")
        return len(old)


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
            cyrillic = (
                _looks_cyrillic(job.title or "")
                or _looks_cyrillic(job.description or "")
                or _looks_cyrillic(job.requirements or "")
            )
            if not cyrillic:
                # nothing to translate (already Uzbek / English): never send it through the ru→uz translator
                if not (job.student_friendly or ""):
                    job.student_friendly = "unclear"
                    db.session.commit()
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
