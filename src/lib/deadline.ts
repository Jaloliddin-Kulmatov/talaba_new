/** How a job's deadline is shown. Pure and dependency-free, shared by the website and the phone app. */

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

export type DeadlineTone = "rolling" | "ok" | "soon" | "today" | "expired" | "text";

export interface DeadlineInfo {
  /** e.g. "3 kun qoldi", "Bugun oxirgi kun", "Muddat: 15-noy, 2026" */
  label: string;
  /** whole days until the deadline day; null for rolling / free-text deadlines */
  days: number | null;
  tone: DeadlineTone;
  /** "15-noy, 2026" for real dates */
  date: string | null;
}

/** Calendar-day difference between an ISO date and `today` (local calendar, no time-of-day effects). */
export function daysUntil(iso: string, today: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec((iso || "").trim());
  if (!m) return null;
  const target = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  if (Number.isNaN(target)) return null;
  return Math.round((target - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
}

export function formatDate(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec((iso || "").trim());
  if (!m) return null;
  return `${+m[3]}-${MONTHS[+m[2] - 1]}, ${m[1]}`;
}

export function deadlineInfo(raw: string | null | undefined, today: Date = new Date()): DeadlineInfo {
  const s = (raw || "").trim();
  if (!s) return { label: "Doimiy — istalgan vaqtda ariza bering", days: null, tone: "rolling", date: null };
  const days = daysUntil(s, today);
  const date = formatDate(s);
  if (days === null || !date) return { label: `Muddat: ${s}`, days: null, tone: "text", date: null };
  if (days < 0) return { label: "Muddat tugagan", days, tone: "expired", date };
  if (days === 0) return { label: "Bugun oxirgi kun", days, tone: "today", date };
  if (days <= 5) return { label: `${days} kun qoldi`, days, tone: "soon", date };
  return { label: `Muddat: ${date} (${days} kun)`, days, tone: "ok", date };
}

/** Sort key for "closest deadline first": soonest real deadline first, rolling / free text last. */
export function deadlineRank(raw: string | null | undefined, today: Date = new Date()): number {
  const d = daysUntil((raw || "").trim(), today);
  return d === null ? Number.MAX_SAFE_INTEGER : d < 0 ? Number.MAX_SAFE_INTEGER - 1 : d;
}
