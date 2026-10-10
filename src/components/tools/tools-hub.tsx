"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, Lightbulb, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exportBackup, importBackup } from "@/lib/store";
import { TOOLS, type ToolMeta } from "@/lib/toolkit/tools";
import { COMMUNITY_SERVICES } from "@/lib/community";
import { useToolkitSummary, type ToolkitSummary } from "@/lib/toolkit/summary";
import { formatDuration } from "@/lib/toolkit/time";
import { fmtMinutes } from "@/lib/toolkit/focus";
import { fmtHours } from "@/lib/toolkit/skills";
import { FormError, Notice, Panel, Skeleton, useNotice } from "./ui";
import SyncCard from "./sync-card";
import ReminderCard from "./reminder-card";

/** One live line per tool, drawn from what the student has saved. */
function liveLine(id: ToolMeta["id"], s: ToolkitSummary): { text: string; tone?: "warn" | "ok" } {
  switch (id) {
    case "timetable":
      if (s.totalClasses === 0) return { text: "Jadvalni to'ldiring" };
      if (s.status.state === "during") return { text: `Hozir: ${s.status.cls.subject}`, tone: "ok" };
      if (s.status.state === "next") return { text: `Keyingi: ${s.status.cls.subject}, ${formatDuration(s.status.minsUntil)}dan keyin` };
      if (s.status.state === "done") return { text: "Bugungi darslar tugadi" };
      return { text: "Bugun dars yo'q" };
    case "gpa":
      return s.gpa === null ? { text: "GPA ni hisoblang" } : { text: `Umumiy GPA: ${s.gpa.toFixed(2)} / ${s.gpaMax.toFixed(1)}` };
    case "planner":
      if (s.tasksOverdue > 0) return { text: `${s.tasksOverdue} ta vazifa muddati o'tgan`, tone: "warn" };
      if (s.nextExam && s.nextExam.days <= 7) return { text: `${s.nextExam.exam.subject}: ${s.nextExam.label}`, tone: s.nextExam.urgent ? "warn" : undefined };
      if (s.tasksOpen > 0) return { text: `${s.tasksOpen} ta ochiq vazifa` };
      return { text: "Vazifa va imtihon qo'shing" };
    case "focus":
      return s.focusToday > 0
        ? { text: `Bugun ${fmtMinutes(s.focusToday)}${s.focusStreak > 1 ? ` · ${s.focusStreak} kun ketma-ket` : ""}`, tone: "ok" }
        : { text: "Bugun hali o'qimadingiz" };
    case "skills":
      return s.skillsCount === 0 ? { text: "Ko'nikma qo'shing" } : { text: `${s.skillsCount} ta ko'nikma · shu hafta ${fmtHours(s.skillsWeekMinutes)}`, tone: s.skillsWeekMinutes > 0 ? "ok" : undefined };
    case "cv":
      return s.cvPct === 0 ? { text: "CV yarating" } : { text: `CV ${s.cvPct}% tayyor`, tone: s.cvPct >= 80 ? "ok" : undefined };
    case "attendance":
      if (s.attendanceSubjects === 0) return { text: "Fanlarni qo'shing" };
      return s.attendanceAtRisk > 0
        ? { text: `${s.attendanceAtRisk} ta fan xavf ostida`, tone: "warn" }
        : { text: "Hammasi xavfsiz", tone: "ok" };
  }
}

export default function ToolsHub() {
  const summary = useToolkitSummary();

  return (
    <>
      <header className="mb-8">
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
          <ShieldCheck size={13} /> Ro&apos;yxatdan o&apos;tmasdan ishlaydi
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Talaba asboblari</h1>
        <p className="mt-2 max-w-2xl text-base text-muted-foreground">
          Dars jadvali, GPA, vazifalar, fokus va davomat — o&apos;qish uchun har kuni kerak bo&apos;ladigan hamma narsa bir joyda.
          Ro&apos;yxatdan o&apos;tmasangiz ma&apos;lumotlar faqat shu qurilmada saqlanadi; kirsangiz — hamma qurilmalaringizda sinxron bo&apos;ladi.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const line = summary ? liveLine(t.id, summary) : null;
          return (
            <Link
              key={t.id}
              href={t.href}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-105", t.gradient)}>
                <Icon size={22} />
              </div>
              <h2 className="font-display text-lg font-bold text-foreground">{t.title}</h2>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{t.blurb}</p>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                {line ? (
                  <span
                    className={cn(
                      "truncate text-xs font-medium",
                      line.tone === "warn" ? "text-amber-700 dark:text-amber-400" : line.tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
                    )}
                  >
                    {line.text}
                  </span>
                ) : (
                  <Skeleton className="h-4 w-32" />
                )}
                <ArrowRight size={16} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
              </div>
            </Link>
          );
        })}

        <Link
          href="/feedback"
          className="flex flex-col justify-between rounded-2xl border border-dashed border-border bg-card/50 p-5 transition-colors hover:border-blue-500/40 hover:bg-card"
        >
          <div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Lightbulb size={22} />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">Yana nima kerak?</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Sizga qaysi imkoniyat yetishmayapti? Taklifingiz keyingi yangilanish rejasiga kiradi.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            Fikringizni yuboring <ArrowRight size={14} />
          </span>
        </Link>
      </div>

      <section className="mt-12" aria-labelledby="community-heading">
        <h2 id="community-heading" className="font-display text-2xl font-extrabold tracking-tight text-foreground">Hamjamiyat xizmatlari</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Boshqa talabalar bilan birga — o&apos;qish, savdo va kampus hayoti uchun. Ko&apos;rish hammaga ochiq, yozish uchun hisob kerak.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNITY_SERVICES.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.id}
                href={c.href}
                className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-105", c.gradient)}>
                  <Icon size={22} />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{c.title}</h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{c.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">Ochish <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <SyncCard />
      <ReminderCard />
      <BackupCard />
    </>
  );
}

function BackupCard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, flash] = useNotice();
  const [error, setError] = useState<string | null>(null);

  const download = () => {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `talaba-zaxira-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash("Zaxira fayli yuklandi");
  };

  const restore = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (file.size > 5_000_000) return setError("Fayl juda katta.");
    try {
      const n = importBackup(await file.text());
      flash(n > 0 ? "Ma'lumotlar tiklandi" : "Faylda tiklanadigan ma'lumot yo'q");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tiklab bo'lmadi.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Panel className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="text-base font-semibold text-foreground">Zaxira nusxa</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ma&apos;lumotlar brauzeringizda saqlanadi. Telefonni almashtirsangiz yoki brauzer ma&apos;lumotlarini tozalasangiz, yo&apos;qolishi mumkin —
            shuning uchun vaqti-vaqti bilan zaxira oling va yangi qurilmada tiklang.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={download}><Download size={15} className="mr-2" /> Yuklab olish</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload size={15} className="mr-2" /> Tiklash</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => restore(e.target.files?.[0])}
          />
        </div>
      </div>
      {error && <div className="mt-3"><FormError text={error} /></div>}
      <Notice text={notice} />
    </Panel>
  );
}
