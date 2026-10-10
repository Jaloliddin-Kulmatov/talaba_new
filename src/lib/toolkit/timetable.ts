import {
  DAYS_FULL, dayIndex, fmtMin, isoDate, mondayOf, pad2, parseISODate, startOfDay, toMin,
} from "./time";

export const TIMETABLE_KEY = "talaba:timetable:v1";

export type ClassKind = "lecture" | "practice" | "lab" | "seminar";
export type WeekSel = "all" | "odd" | "even";
export type Parity = "odd" | "even";

export const KIND_LABEL: Record<ClassKind, string> = {
  lecture: "Ma'ruza",
  practice: "Amaliy",
  lab: "Laboratoriya",
  seminar: "Seminar",
};

export const WEEK_LABEL: Record<WeekSel, string> = {
  all: "Har hafta",
  odd: "Toq hafta",
  even: "Juft hafta",
};

export interface ClassEntry {
  id: string;
  subject: string;
  teacher?: string;
  room?: string;
  /** 0 = Monday … 6 = Sunday */
  day: number;
  start: string; // "HH:MM"
  end: string;
  color: ColorKey;
  kind: ClassKind;
  weeks: WeekSel;
}

export interface TimetableData {
  classes: ClassEntry[];
  /** Pins which week is "toq": `monday` is any Monday (YYYY-MM-DD), `odd` its parity. */
  anchor?: { monday: string; odd: boolean };
}

export const EMPTY_TIMETABLE: TimetableData = { classes: [] };

// Full class strings so Tailwind's scanner can see them.
export type ColorKey = "blue" | "emerald" | "violet" | "amber" | "rose" | "cyan" | "orange" | "slate";

export const COLORS: Record<ColorKey, { block: string; dot: string; label: string }> = {
  blue:    { block: "bg-blue-500/15 border-blue-500",       dot: "bg-blue-500",    label: "Ko'k" },
  emerald: { block: "bg-emerald-500/15 border-emerald-500", dot: "bg-emerald-500", label: "Yashil" },
  violet:  { block: "bg-violet-500/15 border-violet-500",   dot: "bg-violet-500",  label: "Binafsha" },
  amber:   { block: "bg-amber-500/15 border-amber-500",     dot: "bg-amber-500",   label: "Sariq" },
  rose:    { block: "bg-rose-500/15 border-rose-500",       dot: "bg-rose-500",    label: "Pushti" },
  cyan:    { block: "bg-cyan-500/15 border-cyan-500",       dot: "bg-cyan-500",    label: "Havorang" },
  orange:  { block: "bg-orange-500/15 border-orange-500",   dot: "bg-orange-500",  label: "To'q sariq" },
  slate:   { block: "bg-slate-500/15 border-slate-500",     dot: "bg-slate-500",   label: "Kulrang" },
};
export const COLOR_KEYS = Object.keys(COLORS) as ColorKey[];

/** Typical "juftlik" (double-period) times. Universities differ — these are only a shortcut. */
export const PAIRS = [
  { n: 1, start: "08:30", end: "09:50" },
  { n: 2, start: "10:00", end: "11:20" },
  { n: 3, start: "11:30", end: "12:50" },
  { n: 4, start: "13:30", end: "14:50" },
  { n: 5, start: "15:00", end: "16:20" },
  { n: 6, start: "16:30", end: "17:50" },
];

// ── Week parity (toq / juft hafta) ──────────────────────────────────────

function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function parityOf(date: Date, anchor?: TimetableData["anchor"]): Parity {
  if (!anchor) return isoWeek(date) % 2 === 1 ? "odd" : "even";
  const weeks = Math.round(
    (mondayOf(date).getTime() - parseISODate(anchor.monday).getTime()) / (7 * 86_400_000),
  );
  const flipped = Math.abs(weeks) % 2 === 1;
  return anchor.odd !== flipped ? "odd" : "even";
}

/** Make `parity` the parity of the week containing `date`. */
export function anchorFor(date: Date, parity: Parity): NonNullable<TimetableData["anchor"]> {
  return { monday: isoDate(mondayOf(date)), odd: parity === "odd" };
}

export const matchesParity = (c: ClassEntry, parity: Parity) => c.weeks === "all" || c.weeks === parity;

// ── Queries ─────────────────────────────────────────────────────────────

export function classesOn(data: TimetableData, day: number, parity: Parity): ClassEntry[] {
  return data.classes
    .filter((c) => c.day === day && matchesParity(c, parity))
    .sort((a, b) => toMin(a.start) - toMin(b.start) || toMin(a.end) - toMin(b.end));
}

export function todaysClasses(data: TimetableData, now: Date): ClassEntry[] {
  return classesOn(data, dayIndex(now), parityOf(now, data.anchor));
}

export type NowStatus =
  | { state: "empty" }
  | { state: "during"; cls: ClassEntry; minsLeft: number }
  | { state: "next"; cls: ClassEntry; minsUntil: number }
  | { state: "done" };

export function nowStatus(today: ClassEntry[], now: Date): NowStatus {
  if (today.length === 0) return { state: "empty" };
  const m = now.getHours() * 60 + now.getMinutes();
  const during = today.find((c) => toMin(c.start) <= m && m < toMin(c.end));
  if (during) return { state: "during", cls: during, minsLeft: toMin(during.end) - m };
  const next = today.find((c) => toMin(c.start) > m);
  if (next) return { state: "next", cls: next, minsUntil: toMin(next.start) - m };
  return { state: "done" };
}

/** Average weekly hours in class: weekly classes count fully, odd/even-week ones half. */
export function weeklyClassHours(data: TimetableData): number {
  let mins = 0;
  for (const c of data.classes) {
    const d = toMin(c.end) - toMin(c.start);
    if (d > 0) mins += c.weeks === "all" ? d : d / 2;
  }
  return Math.round((mins / 60) * 10) / 10;
}

export interface Placed {
  entry: ClassEntry;
  lane: number;
  lanes: number;
}

/** Side-by-side layout for classes that overlap in time (common with lab sub-groups). */
export function layoutDay(entries: ClassEntry[]): Placed[] {
  const sorted = [...entries].sort((a, b) => toMin(a.start) - toMin(b.start) || toMin(a.end) - toMin(b.end));
  const out: Placed[] = [];
  let cluster: { entry: ClassEntry; lane: number }[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const lanes = Math.max(1, laneEnds.length);
    cluster.forEach((c) => out.push({ ...c, lanes }));
    cluster = [];
    laneEnds = [];
    clusterEnd = -1;
  };

  for (const e of sorted) {
    const s = toMin(e.start);
    const en = toMin(e.end);
    if (cluster.length && s >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= s);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(en);
    } else {
      laneEnds[lane] = en;
    }
    cluster.push({ entry: e, lane });
    clusterEnd = Math.max(clusterEnd, en);
  }
  flush();
  return out;
}

// ── Validation ──────────────────────────────────────────────────────────

export function validateClass(c: Pick<ClassEntry, "subject" | "start" | "end">): string | null {
  if (!c.subject.trim()) return "Fan nomini kiriting.";
  const s = toMin(c.start);
  const e = toMin(c.end);
  if (Number.isNaN(s) || Number.isNaN(e)) return "Boshlanish va tugash vaqtini kiriting.";
  if (e <= s) return "Tugash vaqti boshlanishdan keyin bo'lishi kerak.";
  return null;
}

// ── Export: text (for Telegram) ─────────────────────────────────────────

export function scheduleText(data: TimetableData, parity: Parity): string {
  const lines: string[] = [`📚 Dars jadvali — ${parity === "odd" ? "toq" : "juft"} hafta`, ""];
  let any = false;
  for (let d = 0; d < 7; d++) {
    const list = classesOn(data, d, parity);
    if (!list.length) continue;
    any = true;
    lines.push(`📅 ${DAYS_FULL[d]}`);
    for (const c of list) {
      const extra = [c.room && `${c.room}`, c.teacher].filter(Boolean).join(" · ");
      lines.push(`${c.start}–${c.end}  ${c.subject}${extra ? ` (${extra})` : ""}`);
    }
    lines.push("");
  }
  if (!any) lines.push("Hozircha darslar qo'shilmagan.");
  lines.push("— TALABA · talaba.uz/tools/timetable");
  return lines.join("\n");
}

// ── Export: calendar (.ics) ─────────────────────────────────────────────

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** RFC 5545 line folding (75 octets; we fold on 60 chars to stay safe with multi-byte text). */
function fold(line: string): string {
  if (line.length <= 60) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 60) {
    parts.push(rest.slice(0, 60));
    rest = " " + rest.slice(60);
  }
  parts.push(rest);
  return parts.join("\r\n");
}

const icsLocal = (d: Date, hhmm: string) => {
  const m = toMin(hhmm);
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(Math.floor(m / 60))}${pad2(m % 60)}00`;
};

/**
 * Weekly recurring events for `weeks` weeks starting from the next matching day.
 * Times are "floating" (no timezone) so they stay at the student's local clock time.
 */
export function buildICS(data: TimetableData, now: Date = new Date(), weeks = 18): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TALABA//Dars jadvali//UZ",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:TALABA — Dars jadvali",
  ];

  for (const c of data.classes) {
    // first date (today or later) on the class's weekday in a week with the right parity
    const first = startOfDay(now);
    let found = false;
    for (let i = 0; i < 15; i++) {
      const d = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
      if (dayIndex(d) !== c.day) continue;
      if (c.weeks !== "all" && parityOf(d, data.anchor) !== c.weeks) continue;
      first.setTime(d.getTime());
      found = true;
      break;
    }
    if (!found) continue;

    const every = c.weeks === "all" ? 1 : 2;
    const count = c.weeks === "all" ? weeks : Math.ceil(weeks / 2);
    const summary = c.subject + (c.kind !== "lecture" ? ` (${KIND_LABEL[c.kind]})` : "");
    const desc = [KIND_LABEL[c.kind], c.teacher].filter(Boolean).join(" · ");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${c.id}@talaba.uz`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsLocal(first, c.start)}`,
      `DTEND:${icsLocal(first, c.end)}`,
      `RRULE:FREQ=WEEKLY;INTERVAL=${every};COUNT=${count}`,
      `SUMMARY:${icsEscape(summary)}`,
    );
    if (c.room) lines.push(`LOCATION:${icsEscape(c.room)}`);
    if (desc) lines.push(`DESCRIPTION:${icsEscape(desc)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export { fmtMin };
