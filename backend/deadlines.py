"""Deadline handling for job listings — pure functions, no database, no network.

Deadlines are stored as text. The scraper writes ISO dates ("2026-11-20"); admins may type free text
("Iyun 30", "Doimiy"). `normalize_deadline` turns anything that is clearly a date into ISO and leaves the
rest alone; `extract_deadline` finds an explicit deadline inside a listing's text (Russian, Uzbek, English).
"""
from __future__ import annotations

import re
from datetime import date, datetime, timedelta

# month by the first letters of the word (Russian, Uzbek Latin, English) — works for "октября", "oktabrgacha", "October"
_MONTH_KEYS = {
    "янв": 1, "фев": 2, "мар": 3, "апр": 4, "мая": 5, "май": 5, "июн": 6, "июл": 7, "авг": 8, "сен": 9, "окт": 10, "ноя": 11, "дек": 12,
    "yan": 1, "jan": 1, "fev": 2, "feb": 2, "mar": 3, "apr": 4, "may": 5, "iyun": 6, "jun": 6, "iyul": 7, "jul": 7,
    "avg": 8, "aug": 8, "sen": 9, "sep": 9, "okt": 10, "oct": 10, "noy": 11, "nov": 11, "dek": 12, "dec": 12,
}

_WORD = r"[A-Za-zА-Яа-яЁёʻʼ’']{3,}"
_TEXT_DATE = re.compile(rf"(?<!\d)(\d{{1,2}})(?:\s*-?\s*(?:го|ga|da|th|st|nd|rd|-)\b)?[\s\-./]*({_WORD})\.?(?:[\s,]*(20\d{{2}}))?", re.I)
_EN_DATE = re.compile(rf"({_WORD})\.?\s+(\d{{1,2}})(?!\d)(?:st|nd|rd|th)?(?:\s*,?\s*(20\d{{2}}))?", re.I)
_NUM_DATE = re.compile(r"(?<!\d)(\d{1,2})[./](\d{1,2})[./](20\d{2}|\d{2})(?!\d)")
_ISO_DATE = re.compile(r"(?<!\d)(20\d{2})-(\d{2})-(\d{2})(?!\d)")

# words that mark a date as "the deadline" (before the date) …
_CUE_BEFORE = re.compile(
    r"(до\b|дедлайн|срок|не позднее|заявк\w* (?:принимаются )?до|прием|приём|"
    r"deadline|apply by|apply before|applications? (?:close|due|until|by)|closes?|closing|until|last day|"
    r"muddat|oxirgi|topshirish|qabul)", re.I)
# … or after it (Uzbek "25 oktabrgacha")
_CUE_AFTER = re.compile(r"^[\s\-]*(gacha|qadar|включительно|inclusive)", re.I)


def _month(word: str) -> int | None:
    w = word.lower().replace("ʻ", "'").replace("ʼ", "'")
    return _MONTH_KEYS.get(w[:4]) or _MONTH_KEYS.get(w[:3])


def _mk(y: int, m: int, d: int) -> date | None:
    try:
        return date(y, m, d)
    except ValueError:
        return None


def _two_digit_year(y: int) -> int:
    return y + 2000 if y < 100 else y


def normalize_deadline(raw: str | None) -> str:
    """ISO "YYYY-MM-DD" when `raw` is clearly one date, otherwise `raw` trimmed (free text is the admin's business)."""
    s = (raw or "").strip()
    if not s:
        return ""
    m = _ISO_DATE.match(s)
    if m and len(s) <= 32:
        d = _mk(int(m[1]), int(m[2]), int(m[3]))
        if d:
            return d.isoformat()
    if len(s) <= 24:
        m = _NUM_DATE.fullmatch(s)
        if m:
            d = _mk(_two_digit_year(int(m[3])), int(m[2]), int(m[1]))
            if d:
                return d.isoformat()
        m = _TEXT_DATE.fullmatch(s)
        if m and m[3] and _month(m[2]):
            d = _mk(int(m[3]), _month(m[2]), int(m[1]))
            if d:
                return d.isoformat()
    return s


def parse_iso(raw: str | None) -> date | None:
    """The date in `raw` if it is (or starts with) an ISO date, else None."""
    s = (raw or "").strip()
    m = _ISO_DATE.match(s)
    return _mk(int(m[1]), int(m[2]), int(m[3])) if m else None


def days_left(raw: str | None, today: date | None = None) -> int | None:
    """Whole days until the deadline day (0 = today is the last day, negative = passed). None for free text / no deadline."""
    d = parse_iso(normalize_deadline(raw))
    if not d:
        return None
    return (d - (today or datetime.utcnow().date())).days


def is_expired(raw: str | None, today: date | None = None) -> bool:
    n = days_left(raw, today)
    return n is not None and n < 0


def _resolve_year(day: int, month: int, today: date) -> date | None:
    """A deadline written without a year: this year, unless that is already clearly past — then next year."""
    d = _mk(today.year, month, day)
    if d is None:
        return None
    if d < today - timedelta(days=3):
        d = _mk(today.year + 1, month, day)
    return d


def extract_deadline(text: str | None, today: date | None = None) -> str:
    """The explicit application deadline mentioned in a listing, as ISO — or "" when there is none.

    A date only counts when a cue word ("до", "deadline", "apply by", "…gacha") sits next to it, so
    "работаем с 1 сентября" or "до 5 лет опыта" are never mistaken for a deadline.
    """
    t = (text or "")[:6000]
    today = today or datetime.utcnow().date()
    found: list[tuple[date, bool]] = []     # (date, year was written explicitly)

    def consider(start: int, end: int, d: date | None, explicit: bool):
        if not d or d.year < today.year - 1 or d > today + timedelta(days=400):
            return
        before = t[max(0, start - 45):start]
        after = t[end:end + 14]
        if _CUE_BEFORE.search(before) or _CUE_AFTER.match(after):
            found.append((d, explicit))

    for m in _TEXT_DATE.finditer(t):
        mo = _month(m[2])
        if not mo:
            continue
        if m[3]:
            consider(m.start(), m.end(), _mk(int(m[3]), mo, int(m[1])), True)
        else:
            consider(m.start(), m.end(), _resolve_year(int(m[1]), mo, today), False)
    for m in _EN_DATE.finditer(t):
        mo = _month(m[1])
        if not mo:
            continue
        if m[3]:
            consider(m.start(), m.end(), _mk(int(m[3]), mo, int(m[2])), True)
        else:
            consider(m.start(), m.end(), _resolve_year(int(m[2]), mo, today), False)
    for m in _NUM_DATE.finditer(t):
        consider(m.start(), m.end(), _mk(_two_digit_year(int(m[3])), int(m[2]), int(m[1])), True)
    for m in _ISO_DATE.finditer(t):
        consider(m.start(), m.end(), _mk(int(m[1]), int(m[2]), int(m[3])), True)

    upcoming = sorted(d for d, _ in found if d >= today)
    if upcoming:
        return upcoming[0].isoformat()
    past = sorted(d for d, explicit in found if explicit)     # an explicit past date means the listing is already closed
    return past[-1].isoformat() if past else ""


def earliest(*isos: str | None) -> str:
    """The earliest of several ISO deadlines (ignores blanks and free text); "" when none is a date."""
    ds = [d for d in (parse_iso(normalize_deadline(x)) for x in isos) if d]
    return min(ds).isoformat() if ds else ""
