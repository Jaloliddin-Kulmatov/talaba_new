"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Flame, GraduationCap, ListChecks, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { toolById, TOOLS } from "@/lib/toolkit/tools";
import { useToolkitSummary, type ToolkitSummary } from "@/lib/toolkit/summary";
import { formatDuration, formatShortDate, parseISODate, toMin } from "@/lib/toolkit/time";
import { fmtMinutes } from "@/lib/toolkit/focus";

const cardCls =
  "group flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

function CardHead({ icon: Icon, title, tint }: { icon: typeof CalendarDays; title: string; tint: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", tint)}>
          <Icon size={15} />
        </span>
        {title}
      </span>
      <ArrowRight size={14} className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
    </div>
  );
}

export default function TodayOverview() {
  const s = useToolkitSummary();

  if (!s) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}
      </div>
    );
  }

  if (!s.hasAnyData) return <Onboarding />;

  return (
    <section aria-label="Bugungi ko'rinish" className="mb-6 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TimetableCard s={s} />
        <TasksCard s={s} />
        <ExamCard s={s} />
        <FocusCard s={s} />
      </div>
      {(s.gpa !== null || s.attendanceSubjects > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {s.gpa !== null && (
            <Link href="/tools/gpa" className={cn(cardCls, "flex-row items-center justify-between py-3")}>
              <span className="text-sm text-muted-foreground">Umumiy GPA</span>
              <span className="font-display text-lg font-bold tabular-nums text-foreground">
                {s.gpa.toFixed(2)} <span className="text-xs font-medium text-muted-foreground">/ {s.gpaMax.toFixed(1)}</span>
              </span>
            </Link>
          )}
          {s.attendanceSubjects > 0 && (
            <Link href="/tools/attendance" className={cn(cardCls, "flex-row items-center justify-between py-3")}>
              <span className="text-sm text-muted-foreground">Davomat</span>
              <span className={cn("text-sm font-semibold", s.attendanceAtRisk > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400")}>
                {s.attendanceAtRisk > 0 ? `${s.attendanceAtRisk} ta fan xavf ostida` : "Hammasi xavfsiz"}
              </span>
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

function TimetableCard({ s }: { s: ToolkitSummary }) {
  const t = toolById("timetable");
  const nowMin = s.now.getHours() * 60 + s.now.getMinutes();
  const remaining = s.classesToday.filter((c) => toMin(c.end) > nowMin).slice(0, 3);

  let headline = "Bugun dars yo'q";
  let tone = "text-foreground";
  if (s.totalClasses === 0) headline = "Jadval bo'sh";
  else if (s.status.state === "during") { headline = `Hozir: ${s.status.cls.subject}`; tone = "text-emerald-700 dark:text-emerald-400"; }
  else if (s.status.state === "next") headline = `Keyingi: ${formatDuration(s.status.minsUntil)}dan keyin`;
  else if (s.status.state === "done") headline = "Bugungi darslar tugadi";

  return (
    <Link href={t.href} className={cardCls}>
      <CardHead icon={CalendarDays} title="Bugungi darslar" tint={t.tint} />
      <p className={cn("text-sm font-semibold", tone)}>{headline}</p>
      {s.status.state === "during" && (
        <p className="text-xs text-muted-foreground">{formatDuration(s.status.minsLeft)} qoldi</p>
      )}
      {remaining.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {remaining.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-xs">
              <span className="w-[84px] shrink-0 tabular-nums text-muted-foreground">{c.start}–{c.end}</span>
              <span className="truncate font-medium text-foreground">{c.subject}</span>
              {c.room && <span className="ml-auto shrink-0 text-muted-foreground">{c.room}</span>}
            </li>
          ))}
        </ul>
      ) : s.totalClasses === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Darslaringizni kiriting — bu yerda hozirgi va keyingi dars ko&apos;rinadi.</p>
      ) : null}
    </Link>
  );
}

function TasksCard({ s }: { s: ToolkitSummary }) {
  const t = toolById("planner");
  return (
    <Link href={t.href} className={cardCls}>
      <CardHead icon={ListChecks} title="Vazifalar" tint={t.tint} />
      {s.tasksOpen === 0 ? (
        <p className="text-sm font-semibold text-foreground">Ochiq vazifa yo&apos;q</p>
      ) : (
        <p className="text-sm font-semibold text-foreground">
          {s.tasksOpen} ta ochiq
          {s.tasksOverdue > 0 && <span className="ml-2 text-red-600 dark:text-red-400">· {s.tasksOverdue} ta kechikkan</span>}
        </p>
      )}
      {s.topTasks.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {s.topTasks.map((task) => {
            const overdue = task.due && parseISODate(task.due) < new Date(s.now.getFullYear(), s.now.getMonth(), s.now.getDate());
            return (
              <li key={task.id} className="flex items-center gap-2 text-xs">
                <span className="truncate font-medium text-foreground">{task.title}</span>
                {task.priority === "high" && <Flame size={11} className="shrink-0 text-orange-500" />}
                {task.due && (
                  <span className={cn("ml-auto shrink-0", overdue ? "font-semibold text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                    {formatShortDate(parseISODate(task.due))}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Topshiriq va muddatlarni yozib qo&apos;ying.</p>
      )}
    </Link>
  );
}

function ExamCard({ s }: { s: ToolkitSummary }) {
  const t = toolById("planner");
  const ex = s.nextExam;
  return (
    <Link href={`${t.href}`} className={cardCls}>
      <CardHead icon={GraduationCap} title="Keyingi imtihon" tint="bg-amber-500/10 text-amber-700 dark:text-amber-300" />
      {ex ? (
        <div className="flex items-center gap-3">
          <div className={cn("flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl", ex.urgent ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-300")}>
            {ex.days <= 1 ? (
              <span className="text-xs font-bold">{ex.label}</span>
            ) : (
              <>
                <span className="font-display text-xl font-extrabold leading-none tabular-nums">{ex.days}</span>
                <span className="text-[9px] font-semibold uppercase">kun</span>
              </>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{ex.exam.subject}</p>
            <p className="text-xs text-muted-foreground">{formatShortDate(parseISODate(ex.exam.date))}{ex.exam.time ? `, ${ex.exam.time}` : ""}</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Imtihon sanasini qo&apos;shing — qancha kun qolganini ko&apos;rib turasiz.</p>
      )}
    </Link>
  );
}

function FocusCard({ s }: { s: ToolkitSummary }) {
  const t = toolById("focus");
  return (
    <Link href={t.href} className={cardCls}>
      <CardHead icon={Timer} title="Fokus" tint={t.tint} />
      <p className="font-display text-2xl font-extrabold tabular-nums text-foreground">{fmtMinutes(s.focusToday)}</p>
      <p className="text-xs text-muted-foreground">
        bugun o&apos;qildi
        {s.focusStreak > 1 && (
          <span className="ml-2 inline-flex items-center gap-0.5 font-semibold text-orange-700 dark:text-orange-400">
            <Flame size={11} /> {s.focusStreak} kun ketma-ket
          </span>
        )}
      </p>
      <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">
        Taymerni boshlash <ArrowRight size={12} />
      </span>
    </Link>
  );
}

function Onboarding() {
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-emerald-500/10 p-5 sm:p-6">
      <div className="relative">
        <h2 className="font-display text-lg font-bold text-foreground sm:text-xl">Kunlik rejangizni tuzing</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Dars jadvali, vazifalar va imtihonlar — bir marta kiriting, har kuni shu yerda ko&apos;rasiz. Hammasi bir daqiqada.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.id}
                href={t.href}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-blue-500/40 hover:bg-accent"
              >
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", t.tint)}>
                  <Icon size={14} />
                </span>
                {t.title}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
