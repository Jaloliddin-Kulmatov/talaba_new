"""Which reminders are due for a student right now — pure logic, no database or network.

Reads the same data the web app syncs (timetable + planner), so it must mirror the
client's rules: weeks start on Monday, toq/juft parity from the pinned anchor (or ISO
week parity), and local time is Asia/Tashkent (UTC+5, no daylight saving).
"""
from datetime import date, datetime, timedelta

TZ_OFFSET = timedelta(hours=5)

TIMETABLE_KEY = "talaba:timetable:v1"
PLANNER_KEY = "talaba:planner:v1"

DEFAULT_PREFS = {"classMin": 15, "exams": True, "tasks": True}
CLASS_MIN_CHOICES = (5, 10, 15, 20, 30, 45, 60)

MAX_ITEMS = 200  # never loop over unbounded user data


def local_now(utc_now=None):
    return (utc_now or datetime.utcnow()) + TZ_OFFSET


def normalize_prefs(raw):
    """Valid prefs from untrusted input (falls back to defaults field by field)."""
    raw = raw if isinstance(raw, dict) else {}
    cm = raw.get("classMin")
    return {
        "classMin": cm if isinstance(cm, int) and not isinstance(cm, bool) and cm in CLASS_MIN_CHOICES else DEFAULT_PREFS["classMin"],
        "exams": raw["exams"] if isinstance(raw.get("exams"), bool) else DEFAULT_PREFS["exams"],
        "tasks": raw["tasks"] if isinstance(raw.get("tasks"), bool) else DEFAULT_PREFS["tasks"],
    }


def _monday(d):
    return d - timedelta(days=d.weekday())


def parity_of(d, anchor):
    """'odd' | 'even' — same rule as parityOf() in src/lib/toolkit/timetable.ts."""
    if not isinstance(anchor, dict) or not anchor.get("monday"):
        return "odd" if d.isocalendar()[1] % 2 == 1 else "even"
    try:
        base = date.fromisoformat(str(anchor["monday"]))
    except ValueError:
        return "odd" if d.isocalendar()[1] % 2 == 1 else "even"
    weeks = round((_monday(d) - base).days / 7)
    flipped = abs(weeks) % 2 == 1
    return "odd" if bool(anchor.get("odd")) != flipped else "even"


def _minutes(hhmm):
    try:
        h, m = str(hhmm).split(":")
        h, m = int(h), int(m)
    except (ValueError, TypeError):
        return None
    return h * 60 + m if 0 <= h < 24 and 0 <= m < 60 else None


def _value(data, key):
    entry = (data or {}).get(key)
    return entry.get("v") if isinstance(entry, dict) else None


def due_reminders(data, now_local, prefs):
    """List of {key, title, body, url} that should be sent now (the caller dedupes by key)."""
    prefs = normalize_prefs(prefs)
    today = now_local.date()
    now_min = now_local.hour * 60 + now_local.minute
    out = []

    # ── classes starting soon ──
    tt = _value(data, TIMETABLE_KEY)
    if isinstance(tt, dict) and isinstance(tt.get("classes"), list):
        parity = parity_of(today, tt.get("anchor"))
        for c in tt["classes"][:MAX_ITEMS]:
            if not isinstance(c, dict) or c.get("day") != today.weekday():
                continue
            if c.get("weeks", "all") not in ("all", parity):
                continue
            start = _minutes(c.get("start"))
            if start is None:
                continue
            delta = start - now_min
            if 0 < delta <= prefs["classMin"]:
                where = " · ".join(str(x) for x in (c.get("room"), c.get("teacher")) if x)
                out.append({
                    "key": f"class:{c.get('id')}:{today.isoformat()}",
                    "title": f"{c.get('subject', 'Dars')} — {delta} daqiqadan keyin",
                    "body": f"{c.get('start')}{' · ' + where if where else ''}",
                    "url": "/tools/timetable",
                })

    planner = _value(data, PLANNER_KEY)
    if isinstance(planner, dict):
        # ── exams: the evening before, and the morning of ──
        if prefs["exams"] and isinstance(planner.get("exams"), list):
            for e in planner["exams"][:MAX_ITEMS]:
                if not isinstance(e, dict):
                    continue
                try:
                    d = date.fromisoformat(str(e.get("date")))
                except ValueError:
                    continue
                when = f" · {e.get('time')}" if e.get("time") else ""
                where = f" · {e.get('room')}" if e.get("room") else ""
                if d == today + timedelta(days=1) and 18 * 60 <= now_min <= 22 * 60:
                    out.append({"key": f"exam:{e.get('id')}:eve", "title": f"Ertaga imtihon: {e.get('subject', '')}",
                                "body": f"Tayyorlanishni unutmang{when}{where}", "url": "/tools/planner"})
                if d == today and 7 * 60 + 30 <= now_min:
                    t = _minutes(e.get("time"))
                    if t is None or t > now_min:
                        out.append({"key": f"exam:{e.get('id')}:day", "title": f"Bugun imtihon: {e.get('subject', '')}",
                                    "body": f"Omad!{when}{where}", "url": "/tools/planner"})

        # ── tasks: a single morning digest ──
        if prefs["tasks"] and isinstance(planner.get("tasks"), list) and 8 * 60 <= now_min <= 21 * 60:
            due_today, overdue = [], 0
            for t in planner["tasks"][:MAX_ITEMS]:
                if not isinstance(t, dict) or t.get("done"):
                    continue
                try:
                    d = date.fromisoformat(str(t.get("due")))
                except ValueError:
                    continue
                if d == today:
                    due_today.append(str(t.get("title", "")))
                elif d < today:
                    overdue += 1
            if due_today:
                extra = f" (+{overdue} ta muddati o'tgan)" if overdue else ""
                out.append({"key": f"tasks:{today.isoformat()}", "title": f"Bugun {len(due_today)} ta vazifa muddati",
                            "body": "; ".join(due_today[:3]) + extra, "url": "/tools/planner"})
    return out
