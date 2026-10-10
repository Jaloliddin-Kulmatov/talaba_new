import { daysBetween, isoDate, parseISODate, startOfDay } from "./time";

export const FOCUS_KEY = "talaba:focus:v1";
export const FOCUS_TIMER_KEY = "talaba:focus-timer:v1";

export type FocusMode = "focus" | "short" | "long";

export const MODE_LABEL: Record<FocusMode, string> = {
  focus: "Diqqat",
  short: "Qisqa tanaffus",
  long: "Uzoq tanaffus",
};

export interface Preset {
  id: string;
  label: string;
  focus: number;
  short: number;
  long: number;
}

export const PRESETS: Preset[] = [
  { id: "classic", label: "25 / 5", focus: 25, short: 5, long: 15 },
  { id: "deep", label: "50 / 10", focus: 50, short: 10, long: 30 },
  { id: "light", label: "15 / 3", focus: 15, short: 3, long: 10 },
];

export interface FocusSession {
  id: string;
  /** ISO timestamp when the session ended */
  at: string;
  minutes: number;
  subject?: string;
}

export interface FocusLog {
  sessions: FocusSession[];
}
export const EMPTY_FOCUS: FocusLog = { sessions: [] };

/** Live timer state — persisted so a refresh doesn't lose a running session. */
export interface TimerState {
  presetId: string;
  mode: FocusMode;
  subject: string;
  /** ms epoch when the running timer finishes; null when paused/idle */
  endAt: number | null;
  /** ms left when paused/idle */
  remainingMs: number;
  /** focus sessions completed in the current set (resets after a long break) */
  cycle: number;
}

export const presetById = (id: string) => PRESETS.find((p) => p.id === id) ?? PRESETS[0];
export const modeMs = (p: Preset, mode: FocusMode) => p[mode] * 60_000;

export const INITIAL_TIMER: TimerState = {
  presetId: PRESETS[0].id,
  mode: "focus",
  subject: "",
  endAt: null,
  remainingMs: PRESETS[0].focus * 60_000,
  cycle: 0,
};

export function minutesOn(log: FocusLog, day: Date): number {
  const key = isoDate(day);
  return log.sessions.reduce((sum, s) => (isoDate(new Date(s.at)) === key ? sum + s.minutes : sum), 0);
}

/** Last `n` days, oldest first, ending today. */
export function lastDays(log: FocusLog, now: Date, n = 7): { date: Date; minutes: number }[] {
  const today = startOfDay(now);
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (n - 1 - i));
    return { date, minutes: minutesOn(log, date) };
  });
}

/** Consecutive days with at least one session. Today not yet studied doesn't break yesterday's streak. */
export function streak(log: FocusLog, now: Date): number {
  const days = new Set(log.sessions.map((s) => isoDate(new Date(s.at))));
  let count = 0;
  let cursor = startOfDay(now);
  if (!days.has(isoDate(cursor))) cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  while (days.has(isoDate(cursor))) {
    count++;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }
  return count;
}

export function fmtClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function fmtMinutes(min: number): string {
  if (min < 60) return `${min} daq`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h} soat ${r} daq` : `${h} soat`;
}

export { daysBetween, parseISODate };
