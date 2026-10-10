export const ATTENDANCE_KEY = "talaba:attendance:v1";

export interface AttendanceSubject {
  id: string;
  name: string;
  /** total academic hours in the semester */
  totalHours: number;
  /** hours missed so far */
  missedHours: number;
  /** allowed share of missed hours, in percent */
  limitPct: number;
}

export interface AttendanceData {
  subjects: AttendanceSubject[];
}
export const EMPTY_ATTENDANCE: AttendanceData = { subjects: [] };

/** Default share only — every university sets its own rule, so it is editable per subject. */
export const DEFAULT_LIMIT_PCT = 25;

/** One "juftlik" = 2 academic hours. */
export const PAIR_HOURS = 2;

export type Risk = "ok" | "warn" | "danger";

export interface AttendanceStatus {
  /** hours that may be missed in total */
  allowed: number;
  /** hours still available to miss (never negative) */
  left: number;
  /** how many hours over the limit */
  over: number;
  /** 0–1 share of the allowance already used */
  used: number;
  risk: Risk;
}

export function statusOf(s: AttendanceSubject): AttendanceStatus {
  const allowed = Math.floor((s.totalHours * s.limitPct) / 100);
  const used = allowed > 0 ? s.missedHours / allowed : s.missedHours > 0 ? 1 : 0;
  const risk: Risk = used >= 1 ? "danger" : used >= 0.6 ? "warn" : "ok";
  return {
    allowed,
    left: Math.max(0, allowed - s.missedHours),
    over: Math.max(0, s.missedHours - allowed),
    used: Math.min(1, used),
    risk,
  };
}
