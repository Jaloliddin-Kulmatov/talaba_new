import { daysBetween, isoDate, startOfDay } from "./time";

export const SKILLS_KEY = "talaba:skills:v1";

export type SkillCategory = "til" | "dastur" | "dizayn" | "tahlil" | "muloqot" | "boshqa";

export const CATEGORY_LABEL: Record<SkillCategory, string> = {
  til: "Tillar",
  dastur: "Dasturlash",
  dizayn: "Dizayn",
  tahlil: "Tahlil va ofis",
  muloqot: "Muloqot va shaxsiy",
  boshqa: "Boshqa",
};

export const LEVEL_LABEL = ["", "Boshlang'ich", "Asosiy", "O'rta", "Yaxshi", "Ekspert"];

export interface SkillLog {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  minutes: number;
  note?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  /** 1–5 */
  level: number;
  /** 1–5, the level the student is working toward */
  goal: number;
  logs: SkillLog[];
  createdAt: string; // ISO
}

export interface SkillsData {
  skills: Skill[];
}
export const EMPTY_SKILLS: SkillsData = { skills: [] };

/** One-tap suggestions for the most requested student skills. */
export const SUGGESTED: { name: string; category: SkillCategory }[] = [
  { name: "IELTS", category: "til" },
  { name: "Ingliz tili", category: "til" },
  { name: "Rus tili", category: "til" },
  { name: "Python", category: "dastur" },
  { name: "JavaScript", category: "dastur" },
  { name: "SQL", category: "dastur" },
  { name: "Excel", category: "tahlil" },
  { name: "Ma'lumotlar tahlili", category: "tahlil" },
  { name: "Figma", category: "dizayn" },
  { name: "Canva", category: "dizayn" },
  { name: "Nutq madaniyati", category: "muloqot" },
  { name: "Jamoada ishlash", category: "muloqot" },
  { name: "Vaqtni boshqarish", category: "muloqot" },
  { name: "SMM", category: "boshqa" },
];

export function totalMinutes(s: Skill): number {
  return s.logs.reduce((n, l) => n + l.minutes, 0);
}

/** Minutes logged in the last 7 days (today included). */
export function weekMinutes(s: Skill, now: Date): number {
  const today = startOfDay(now);
  return s.logs.reduce((n, l) => {
    const d = daysBetween(new Date(l.date + "T00:00:00"), today);
    return d >= 0 && d < 7 ? n + l.minutes : n;
  }, 0);
}

export function lastLogDate(s: Skill): string | null {
  return s.logs.reduce<string | null>((m, l) => (m === null || l.date > m ? l.date : m), null);
}

export const fmtHours = (min: number) => (min < 60 ? `${min} daq` : `${(min / 60).toFixed(min % 60 === 0 ? 0 : 1)} soat`);

/** Progress toward the goal level, 0–1 (a skill already at its goal is 1). */
export function goalProgress(s: Skill): number {
  if (s.goal <= s.level) return 1;
  return Math.max(0, Math.min(1, (s.level - 1) / (s.goal - 1)));
}

export const todayISO = (now: Date) => isoDate(now);

/** Consecutive days (ending today or yesterday) with any logged practice, across all skills. */
export function activityStreak(skills: Skill[], now: Date): number {
  const days = new Set(skills.flatMap((s) => s.logs.map((l) => l.date)));
  let cursor = startOfDay(now);
  if (!days.has(isoDate(cursor))) cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  let n = 0;
  while (days.has(isoDate(cursor))) {
    n++;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }
  return n;
}
