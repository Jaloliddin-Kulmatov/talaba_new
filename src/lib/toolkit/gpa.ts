export const GPA_KEY = "talaba:gpa:v1";

/**
 * uz5 — O'zbekiston davlat OTMlarida keng tarqalgan 5 ballik tizim
 *       (baho 2–5 yoki 100 ballik reyting, u 5 ballikka o'tkaziladi).
 * us4 — xalqaro filial/hamkor universitetlarda ishlatiladigan 4.0 shkala.
 *
 * Each mode keeps its own data so switching modes never reinterprets numbers.
 */
export type GpaMode = "uz5" | "us4";
export type Uz5Input = "points" | "grade";

export interface Course {
  id: string;
  name: string;
  credits: number | null;
  /** uz5: 0–100 ball or 2–5 baho (see Uz5Input); us4: grade points 0–4 */
  score: number | null;
}

export interface Semester {
  id: string;
  name: string;
  courses: Course[];
}

export interface GpaData {
  mode: GpaMode;
  uz5Input: Uz5Input;
  uz5: Semester[];
  us4: Semester[];
  /** Optional goal for the "what do I need?" planner. */
  target: number | null;
}

export const EMPTY_GPA: GpaData = { mode: "uz5", uz5Input: "points", uz5: [], us4: [], target: null };

export const MAX_POINTS: Record<GpaMode, number> = { uz5: 5, us4: 4 };

/** Standard thresholds: 86–100 → 5, 71–85 → 4, 55–70 → 3, below → 2. Universities may differ. */
export const UZ_THRESHOLDS = [
  { grade: 5, min: 86, label: "A'lo" },
  { grade: 4, min: 71, label: "Yaxshi" },
  { grade: 3, min: 55, label: "Qoniqarli" },
  { grade: 2, min: 0, label: "Qoniqarsiz" },
];

export const pointsToGrade = (p: number) => (p >= 86 ? 5 : p >= 71 ? 4 : p >= 55 ? 3 : 2);

export const US_GRADES = [
  { label: "A", value: 4.0 },
  { label: "A−", value: 3.7 },
  { label: "B+", value: 3.3 },
  { label: "B", value: 3.0 },
  { label: "B−", value: 2.7 },
  { label: "C+", value: 2.3 },
  { label: "C", value: 2.0 },
  { label: "C−", value: 1.7 },
  { label: "D+", value: 1.3 },
  { label: "D", value: 1.0 },
  { label: "F", value: 0 },
];

export const US_LABEL = (v: number | null) => US_GRADES.find((g) => g.value === v)?.label ?? "";

/** Grade points (on the mode's scale) for one course, or null if it isn't fully filled in. */
export function coursePoints(mode: GpaMode, input: Uz5Input, c: Course): number | null {
  if (c.score === null || c.credits === null || !(c.credits > 0)) return null;
  if (mode === "us4") return c.score >= 0 && c.score <= 4 ? c.score : null;
  if (input === "points") return c.score >= 0 && c.score <= 100 ? pointsToGrade(c.score) : null;
  return c.score >= 2 && c.score <= 5 ? c.score : null;
}

/** A course is "passed" at 3+ on the 5-point scale, or anything above F on 4.0. */
const passed = (mode: GpaMode, pts: number) => (mode === "uz5" ? pts >= 3 : pts > 0);

export interface Stats {
  /** credits that count toward GPA (fully filled-in courses) */
  credits: number;
  /** sum of credits × grade points */
  weighted: number;
  /** credits of passed courses */
  earned: number;
  gpa: number | null;
  count: number;
}

export function statsFor(mode: GpaMode, input: Uz5Input, semesters: Semester[]): Stats {
  let credits = 0;
  let weighted = 0;
  let earned = 0;
  let count = 0;
  for (const s of semesters) {
    for (const c of s.courses) {
      const pts = coursePoints(mode, input, c);
      if (pts === null) continue;
      const cr = c.credits as number;
      credits += cr;
      weighted += cr * pts;
      if (passed(mode, pts)) earned += cr;
      count++;
    }
  }
  return { credits, weighted, earned, count, gpa: credits > 0 ? weighted / credits : null };
}

export const fmtGpa = (g: number | null, digits = 2) => (g === null ? "—" : g.toFixed(digits));

export type GoalResult =
  | { kind: "reached" }
  | { kind: "needs"; average: number; feasible: boolean };

/** Average grade needed over `remainingCredits` to finish at `target` overall. */
export function neededAverage(
  mode: GpaMode,
  target: number,
  done: Stats,
  remainingCredits: number,
): GoalResult {
  const max = MAX_POINTS[mode];
  if (remainingCredits <= 0) return { kind: "reached" };
  const need = (target * (done.credits + remainingCredits) - done.weighted) / remainingCredits;
  if (need <= 0) return { kind: "reached" };
  return { kind: "needs", average: need, feasible: need <= max + 1e-9 };
}

/** Colour band for a GPA value, relative to the mode's scale. */
export function gpaTone(mode: GpaMode, g: number | null): "none" | "great" | "good" | "ok" | "low" {
  if (g === null) return "none";
  const r = g / MAX_POINTS[mode];
  return r >= 0.9 ? "great" : r >= 0.75 ? "good" : r >= 0.6 ? "ok" : "low";
}
