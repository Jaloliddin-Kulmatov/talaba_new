// Shared date/time helpers for the student toolkit.
// Weeks start on Monday (index 0) — that's how Uzbek university timetables run.

export const DAYS_FULL = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
export const DAYS_SHORT = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
export const MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

const DAY_MS = 86_400_000;

export const pad2 = (n: number) => String(n).padStart(2, "0");

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** 0 = Monday … 6 = Sunday */
export const dayIndex = (d: Date) => (d.getDay() + 6) % 7;

/** "HH:MM" → minutes since midnight. Returns NaN for malformed input. */
export function toMin(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

export const fmtMin = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Local calendar date as YYYY-MM-DD (not UTC — a student at 00:30 still means "today"). */
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function mondayOf(d: Date): Date {
  const s = startOfDay(d);
  s.setDate(s.getDate() - dayIndex(s));
  return s;
}

/** Whole calendar days from a to b (negative if b is earlier). */
export const daysBetween = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);

/** "9-oktabr" */
export const formatShortDate = (d: Date) => `${d.getDate()}-${MONTHS[d.getMonth()]}`;

/** "payshanba, 9-oktabr" */
export const formatLongDate = (d: Date) => `${DAYS_FULL[dayIndex(d)].toLowerCase()}, ${formatShortDate(d)}`;

/** 80 → "1 soat 20 daqiqa", 35 → "35 daqiqa" */
export function formatDuration(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} daqiqa`;
  if (r === 0) return `${h} soat`;
  return `${h} soat ${r} daqiqa`;
}

/** "Bugun" / "Ertaga" / "3 kun qoldi" / "2 kun oldin" */
export function relativeDay(target: Date, now: Date): string {
  const n = daysBetween(now, target);
  if (n === 0) return "Bugun";
  if (n === 1) return "Ertaga";
  if (n === -1) return "Kecha";
  return n > 0 ? `${n} kundan keyin` : `${-n} kun oldin`;
}

/** Backend timestamps are UTC; older rows may lack the "Z". */
export function parseServerDate(iso: string): Date {
  return new Date(/Z$|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + "Z");
}

/** "hozirgina", "5 daqiqa oldin", "3 soat oldin", "2 kun oldin", then "9-oktabr". */
export function timeAgoUz(iso: string, now: Date = new Date()): string {
  const d = parseServerDate(iso);
  const mins = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (mins < 1) return "hozirgina";
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} kun oldin`;
  return formatShortDate(d);
}
