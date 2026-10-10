import { daysBetween, isoDate, parseISODate, toMin } from "./time";

export const PLANNER_KEY = "talaba:planner:v1";

export type Priority = "normal" | "high";

export interface Task {
  id: string;
  title: string;
  subject?: string;
  /** YYYY-MM-DD, local date. Undefined = no deadline. */
  due?: string;
  priority: Priority;
  done: boolean;
  doneAt?: string; // ISO timestamp
}

export type ExamType = "midterm" | "final" | "retake" | "dtm" | "language" | "other";

export const EXAM_LABEL: Record<ExamType, string> = {
  midterm: "Oraliq nazorat",
  final: "Yakuniy nazorat",
  retake: "Qayta topshirish",
  dtm: "DTM / kirish",
  language: "IELTS / TOEFL",
  other: "Boshqa",
};

export interface Exam {
  id: string;
  subject: string;
  type: ExamType;
  /** YYYY-MM-DD */
  date: string;
  time?: string; // HH:MM
  room?: string;
}

export interface PlannerData {
  tasks: Task[];
  exams: Exam[];
}

export const EMPTY_PLANNER: PlannerData = { tasks: [], exams: [] };

export type TaskGroupKey = "overdue" | "today" | "tomorrow" | "week" | "later" | "none";

export const TASK_GROUP_LABEL: Record<TaskGroupKey, string> = {
  overdue: "Muddati o'tgan",
  today: "Bugun",
  tomorrow: "Ertaga",
  week: "Shu hafta",
  later: "Keyinroq",
  none: "Muddatsiz",
};

export const TASK_GROUP_ORDER: TaskGroupKey[] = ["overdue", "today", "tomorrow", "week", "later", "none"];

export function taskGroup(t: Task, now: Date): TaskGroupKey {
  if (!t.due) return "none";
  const n = daysBetween(now, parseISODate(t.due));
  if (n < 0) return "overdue";
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n <= 7) return "week";
  return "later";
}

export function groupTasks(tasks: Task[], now: Date): Record<TaskGroupKey, Task[]> {
  const out: Record<TaskGroupKey, Task[]> = { overdue: [], today: [], tomorrow: [], week: [], later: [], none: [] };
  for (const t of tasks) {
    if (t.done) continue;
    out[taskGroup(t, now)].push(t);
  }
  const byDue = (a: Task, b: Task) =>
    (a.due ?? "9999").localeCompare(b.due ?? "9999") ||
    Number(b.priority === "high") - Number(a.priority === "high");
  (Object.keys(out) as TaskGroupKey[]).forEach((k) => out[k].sort(byDue));
  return out;
}

/** Date + optional time → ms timestamp (end of day if no time). */
export function examMoment(e: Exam): number {
  const d = parseISODate(e.date);
  if (e.time) {
    const m = toMin(e.time);
    if (!Number.isNaN(m)) d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  } else {
    d.setHours(23, 59, 0, 0);
  }
  return d.getTime();
}

export function upcomingExams(exams: Exam[], now: Date): Exam[] {
  return exams.filter((e) => examMoment(e) >= now.getTime()).sort((a, b) => examMoment(a) - examMoment(b));
}

export function pastExams(exams: Exam[], now: Date): Exam[] {
  return exams.filter((e) => examMoment(e) < now.getTime()).sort((a, b) => examMoment(b) - examMoment(a));
}

export function examCountdown(e: Exam, now: Date): { days: number; label: string; urgent: boolean } {
  const days = daysBetween(now, parseISODate(e.date));
  const label = days === 0 ? "Bugun!" : days === 1 ? "Ertaga" : `${days} kun`;
  return { days, label, urgent: days <= 3 };
}

export const todayISO = (now: Date) => isoDate(now);
