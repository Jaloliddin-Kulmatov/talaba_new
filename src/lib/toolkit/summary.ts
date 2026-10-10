"use client";

import { useMemo } from "react";
import { useLocalStore } from "@/lib/store";
import { useNow } from "./hooks";
import { ATTENDANCE_KEY, EMPTY_ATTENDANCE, statusOf } from "./attendance";
import { EMPTY_FOCUS, FOCUS_KEY, minutesOn, streak } from "./focus";
import { EMPTY_GPA, GPA_KEY, statsFor } from "./gpa";
import { EMPTY_SKILLS, SKILLS_KEY, activityStreak, weekMinutes } from "./skills";
import { CV_KEY, EMPTY_CV, completeness, skillList } from "./cv";
import {
  EMPTY_PLANNER, PLANNER_KEY, TASK_GROUP_ORDER, examCountdown, groupTasks, upcomingExams,
  type Exam, type Task,
} from "./planner";
import {
  EMPTY_TIMETABLE, TIMETABLE_KEY, nowStatus, parityOf, todaysClasses,
  type ClassEntry, type NowStatus, type Parity,
} from "./timetable";

export interface ToolkitSummary {
  now: Date;
  parity: Parity;
  classesToday: ClassEntry[];
  status: NowStatus;
  totalClasses: number;
  tasksOpen: number;
  tasksOverdue: number;
  tasksToday: number;
  /** the three most pressing open tasks (overdue first, then by deadline) */
  topTasks: Task[];
  nextExam: { exam: Exam; days: number; label: string; urgent: boolean } | null;
  gpa: number | null;
  gpaMax: number;
  focusToday: number;
  focusStreak: number;
  attendanceSubjects: number;
  attendanceAtRisk: number;
  skillsCount: number;
  skillsWeekMinutes: number;
  cvPct: number;
  /** true once the student has entered anything in any tool */
  hasAnyData: boolean;
}

/** Live roll-up of every tool's data. `null` until mounted (so SSR output is stable). */
export function useToolkitSummary(): ToolkitSummary | null {
  const now = useNow(30_000);
  const [tt] = useLocalStore(TIMETABLE_KEY, EMPTY_TIMETABLE);
  const [pl] = useLocalStore(PLANNER_KEY, EMPTY_PLANNER);
  const [gpa] = useLocalStore(GPA_KEY, EMPTY_GPA);
  const [fo] = useLocalStore(FOCUS_KEY, EMPTY_FOCUS);
  const [at] = useLocalStore(ATTENDANCE_KEY, EMPTY_ATTENDANCE);
  const [sk] = useLocalStore(SKILLS_KEY, EMPTY_SKILLS);
  const [cv] = useLocalStore(CV_KEY, EMPTY_CV);

  return useMemo(() => {
    if (!now) return null;
    const classesToday = todaysClasses(tt, now);
    const groups = groupTasks(pl.tasks, now);
    const next = upcomingExams(pl.exams, now)[0];
    const g = statsFor(gpa.mode, gpa.uz5Input, gpa[gpa.mode]);
    const risky = at.subjects.filter((s) => statusOf(s).risk !== "ok").length;
    const tasksOpen = pl.tasks.filter((t) => !t.done).length;

    return {
      now,
      parity: parityOf(now, tt.anchor),
      classesToday,
      status: nowStatus(classesToday, now),
      totalClasses: tt.classes.length,
      tasksOpen,
      tasksOverdue: groups.overdue.length,
      tasksToday: groups.today.length,
      topTasks: TASK_GROUP_ORDER.flatMap((k) => groups[k]).slice(0, 3),
      nextExam: next ? { exam: next, ...examCountdown(next, now) } : null,
      gpa: g.gpa,
      gpaMax: gpa.mode === "uz5" ? 5 : 4,
      focusToday: minutesOn(fo, now),
      focusStreak: streak(fo, now),
      attendanceSubjects: at.subjects.length,
      attendanceAtRisk: risky,
      skillsCount: sk.skills.length,
      skillsWeekMinutes: sk.skills.reduce((n, s) => n + weekMinutes(s, now), 0),
      cvPct: cv.fullName.trim() ? completeness(cv, skillList(cv, sk.skills).length).pct : 0,
      hasAnyData:
        tt.classes.length > 0 || pl.tasks.length > 0 || pl.exams.length > 0 || g.count > 0 ||
        fo.sessions.length > 0 || at.subjects.length > 0 || sk.skills.length > 0,
    };
  }, [now, tt, pl, gpa, fo, at, sk, cv]);
}
