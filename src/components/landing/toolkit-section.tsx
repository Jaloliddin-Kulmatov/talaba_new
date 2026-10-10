import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toolById, type ToolMeta } from "@/lib/toolkit/tools";

/** Static, illustrative mini-previews (sample data) for each tool. */
function TimetablePreview() {
  const days = ["Du", "Se", "Ch", "Pa", "Ju", "Sh"];
  const blocks: Record<number, { top: number; h: number; c: string }[]> = {
    0: [{ top: 6, h: 30, c: "bg-blue-500" }, { top: 46, h: 30, c: "bg-emerald-500" }],
    1: [{ top: 26, h: 30, c: "bg-violet-500" }],
    2: [{ top: 6, h: 30, c: "bg-blue-500" }, { top: 66, h: 26, c: "bg-amber-500" }],
    3: [{ top: 46, h: 30, c: "bg-emerald-500" }, { top: 6, h: 26, c: "bg-rose-500" }],
    4: [{ top: 26, h: 40, c: "bg-violet-500" }],
    5: [{ top: 6, h: 30, c: "bg-cyan-500" }],
  };
  return (
    <div className="grid grid-cols-6 gap-1.5" aria-hidden>
      {days.map((d, i) => (
        <div key={d} className="text-center">
          <p className="mb-1 text-[10px] font-semibold text-muted-foreground">{d}</p>
          <div className="relative h-24 rounded-lg bg-muted/60">
            {blocks[i].map((b, j) => (
              <span key={j} className={cn("absolute inset-x-1 rounded-md opacity-90", b.c)} style={{ top: b.top, height: b.h }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GpaPreview() {
  const R = 30, C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-4" aria-hidden>
      <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90 shrink-0">
        <circle cx="38" cy="38" r={R} fill="none" strokeWidth="8" className="stroke-muted" />
        <circle cx="38" cy="38" r={R} fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-violet-500" strokeDasharray={C} strokeDashoffset={C * 0.08} />
      </svg>
      <div>
        <p className="font-display text-3xl font-extrabold tabular-nums text-foreground">4.62</p>
        <p className="text-xs text-muted-foreground">Maqsad 4.8 uchun o&apos;rtacha 4.9 kerak</p>
      </div>
    </div>
  );
}

function PlannerPreview() {
  const rows = [
    { t: "Fizika lab hisoboti", d: "Bugun", done: false },
    { t: "Inglizcha esse", d: "Ertaga", done: false },
    { t: "Matematika testi", d: "Bajarildi", done: true },
  ];
  return (
    <ul className="space-y-2" aria-hidden>
      {rows.map((r) => (
        <li key={r.t} className="flex items-center gap-2.5 text-xs">
          <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2", r.done ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/40")}>
            {r.done && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
          </span>
          <span className={cn("truncate font-medium", r.done ? "text-muted-foreground line-through" : "text-foreground")}>{r.t}</span>
          <span className="ml-auto shrink-0 text-muted-foreground">{r.d}</span>
        </li>
      ))}
    </ul>
  );
}

function FocusPreview() {
  const R = 30, C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-4" aria-hidden>
      <div className="relative h-[76px] w-[76px] shrink-0">
        <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
          <circle cx="38" cy="38" r={R} fill="none" strokeWidth="7" className="stroke-muted" />
          <circle cx="38" cy="38" r={R} fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-emerald-500" strokeDasharray={C} strokeDashoffset={C * 0.35} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-bold tabular-nums text-foreground">16:12</span>
      </div>
      <div>
        <p className="font-display text-xl font-extrabold text-foreground">3 kun</p>
        <p className="text-xs text-muted-foreground">ketma-ket o&apos;qiyapsiz</p>
      </div>
    </div>
  );
}

function AttendancePreview() {
  const rows = [
    { n: "Iqtisodiyot", p: 25, c: "bg-emerald-500" },
    { n: "Fizika", p: 70, c: "bg-amber-500" },
    { n: "Tarix", p: 100, c: "bg-red-500" },
  ];
  return (
    <ul className="space-y-2.5" aria-hidden>
      {rows.map((r) => (
        <li key={r.n}>
          <div className="mb-1 flex justify-between text-[11px] font-medium text-foreground">
            <span>{r.n}</span>
            <span className="text-muted-foreground">{r.p}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", r.c)} style={{ width: `${r.p}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const PREVIEW: Record<ToolMeta["id"], React.ReactNode> = {
  timetable: <TimetablePreview />,
  gpa: <GpaPreview />,
  planner: <PlannerPreview />,
  focus: <FocusPreview />,
  attendance: <AttendancePreview />,
};

const LAYOUT: Record<ToolMeta["id"], string> = {
  timetable: "lg:col-span-2",
  gpa: "",
  planner: "",
  focus: "",
  attendance: "",
};

export default function ToolkitSection() {
  const order: ToolMeta["id"][] = ["timetable", "gpa", "planner", "focus", "attendance"];
  return (
    <section className="relative px-4 py-20 sm:px-6" id="tools">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Badge className="mb-4 px-4 py-1 text-xs">Bepul · ro&apos;yxatdan o&apos;tmasdan</Badge>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Har kuni kerak bo&apos;ladigan <span className="gradient-text">asboblar</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Jadvalga qarash, GPA hisoblash, vazifani unutmaslik — telefoningizda ham, kompyuteringizda ham, internetsiz ham.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {order.map((id) => {
            const t = toolById(id);
            const Icon = t.icon;
            return (
              <Link
                key={id}
                href={t.href}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  LAYOUT[id],
                )}
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", t.gradient)}>
                    <Icon size={20} />
                  </span>
                  <h3 className="font-display text-lg font-bold text-foreground">{t.title}</h3>
                  <ArrowRight size={16} className="ml-auto text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
                </div>
                <div className="mb-5 flex-1 rounded-2xl border border-border/70 bg-background/60 p-4">{PREVIEW[id]}</div>
                <p className="text-sm leading-relaxed text-muted-foreground">{t.blurb}</p>
              </Link>
            );
          })}

          <Link
            href="/tools"
            className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 p-6 text-center transition-colors hover:border-blue-500/50"
          >
            <p className="font-display text-lg font-bold text-foreground">Hammasini ko&apos;rish</p>
            <p className="mt-1 text-sm text-muted-foreground">Ma&apos;lumotlaringiz faqat shu qurilmada saqlanadi.</p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Asboblarni ochish <ArrowRight size={14} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
