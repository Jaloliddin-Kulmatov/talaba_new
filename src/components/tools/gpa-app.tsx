"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, Info, Plus, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHydrated, useLocalStore } from "@/lib/store";
import { toolById } from "@/lib/toolkit/tools";
import { uid } from "@/lib/toolkit/time";
import {
  EMPTY_GPA, GPA_KEY, MAX_POINTS, UZ_THRESHOLDS, US_GRADES, coursePoints, fmtGpa, gpaTone, neededAverage, statsFor,
  type Course, type GpaMode, type Semester, type Uz5Input,
} from "@/lib/toolkit/gpa";
import { EmptyState, Field, NumInput, Panel, Segmented, Skeleton, ToolHeader, fieldCls } from "./ui";

const TONE: Record<ReturnType<typeof gpaTone>, { text: string; ring: string; label: string }> = {
  none:  { text: "text-muted-foreground",                  ring: "stroke-muted-foreground/30", label: "Ma'lumot kiriting" },
  great: { text: "text-emerald-600 dark:text-emerald-400", ring: "stroke-emerald-500",         label: "A'lo natija" },
  good:  { text: "text-blue-600 dark:text-blue-400",       ring: "stroke-blue-500",            label: "Yaxshi natija" },
  ok:    { text: "text-amber-600 dark:text-amber-400",     ring: "stroke-amber-500",           label: "Qoniqarli" },
  low:   { text: "text-red-600 dark:text-red-400",         ring: "stroke-red-500",             label: "Yaxshilash kerak" },
};

const blankCourse = (): Course => ({ id: uid(), name: "", credits: null, score: null });
const newSemester = (n: number): Semester => ({
  id: uid(),
  name: `${n}-semestr`,
  courses: [blankCourse(), blankCourse(), blankCourse(), blankCourse()],
});

export default function GpaApp() {
  const tool = toolById("gpa");
  const hydrated = useHydrated();
  const [data, setData] = useLocalStore(GPA_KEY, EMPTY_GPA);

  const { mode, uz5Input } = data;
  const max = MAX_POINTS[mode];
  const semesters = data[mode];

  const setSemesters = (fn: (s: Semester[]) => Semester[]) =>
    setData((prev) => ({ ...prev, [prev.mode]: fn(prev[prev.mode]) }));
  const patchSemester = (id: string, fn: (s: Semester) => Semester) =>
    setSemesters((list) => list.map((s) => (s.id === id ? fn(s) : s)));
  const patchCourse = (sid: string, cid: string, patch: Partial<Course>) =>
    patchSemester(sid, (s) => ({ ...s, courses: s.courses.map((c) => (c.id === cid ? { ...c, ...patch } : c)) }));

  const overall = useMemo(() => statsFor(mode, uz5Input, semesters), [mode, uz5Input, semesters]);
  const tone = gpaTone(mode, overall.gpa);

  return (
    <>
      <ToolHeader tool={tool} />

      {!hydrated ? (
        <div className="space-y-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented<GpaMode>
              label="Baholash tizimi"
              value={mode}
              onChange={(m) => setData((p) => ({ ...p, mode: m }))}
              options={[
                { value: "uz5", label: "5 ballik tizim" },
                { value: "us4", label: "4.0 shkala" },
              ]}
            />
            {mode === "uz5" && (
              <Segmented<Uz5Input>
                size="sm"
                label="Kiritish turi"
                value={uz5Input}
                onChange={(v) => setData((p) => ({ ...p, uz5Input: v }))}
                options={[
                  { value: "points", label: "Ball (0–100)" },
                  { value: "grade", label: "Baho (2–5)" },
                ]}
              />
            )}
          </div>

          {/* ── Result ── */}
          <Panel className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="relative flex flex-wrap items-center gap-6">
              <Ring value={overall.gpa} max={max} tone={tone} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Umumiy GPA</p>
                <p className={cn("font-display text-4xl font-extrabold tabular-nums", TONE[tone].text)}>
                  {fmtGpa(overall.gpa)}
                  <span className="ml-1.5 text-base font-semibold text-muted-foreground">/ {max.toFixed(1)}</span>
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{TONE[tone].label}</p>
                <dl className="mt-3 grid grid-cols-3 gap-3 text-center sm:max-w-sm">
                  <Stat label="Fanlar" value={String(overall.count)} />
                  <Stat label="Kredit" value={trim(overall.credits)} />
                  <Stat label="O'tgan kredit" value={trim(overall.earned)} />
                </dl>
              </div>
            </div>
          </Panel>

          {/* ── Semesters ── */}
          {semesters.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="Birinchi semestrni qo'shing"
              text="Fan nomi, kredit va bahoni kiriting — GPA avtomatik hisoblanadi. Ma'lumotlar shu qurilmada saqlanadi."
              action={
                <Button onClick={() => setSemesters((l) => [...l, newSemester(l.length + 1)])}>
                  <Plus size={16} className="mr-1.5" /> Semestr qo&apos;shish
                </Button>
              }
            />
          ) : (
            <>
              {semesters.map((sem, idx) => (
                <SemesterCard
                  key={sem.id}
                  sem={sem}
                  index={idx}
                  mode={mode}
                  input={uz5Input}
                  onRename={(name) => patchSemester(sem.id, (s) => ({ ...s, name }))}
                  onRemove={() => setSemesters((l) => l.filter((s) => s.id !== sem.id))}
                  onAddCourse={() => patchSemester(sem.id, (s) => ({ ...s, courses: [...s.courses, blankCourse()] }))}
                  onPatch={(cid, patch) => patchCourse(sem.id, cid, patch)}
                  onRemoveCourse={(cid) =>
                    patchSemester(sem.id, (s) => ({ ...s, courses: s.courses.filter((c) => c.id !== cid) }))
                  }
                />
              ))}
              <Button variant="outline" className="w-full" onClick={() => setSemesters((l) => [...l, newSemester(l.length + 1)])}>
                <Plus size={16} className="mr-1.5" /> Semestr qo&apos;shish
              </Button>
            </>
          )}

          {/* ── Goal planner ── */}
          <GoalPlanner
            mode={mode}
            done={overall}
            target={data.target}
            onTarget={(t) => setData((p) => ({ ...p, target: t }))}
          />

          {/* ── Scale info ── */}
          <ScaleInfo mode={mode} />
        </div>
      )}
    </>
  );
}

const trim = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/70 px-2 py-2">
      <dd className="text-lg font-bold tabular-nums text-foreground">{value}</dd>
      <dt className="text-[10px] font-medium text-muted-foreground">{label}</dt>
    </div>
  );
}

function Ring({ value, max, tone }: { value: number | null; max: number; tone: keyof typeof TONE }) {
  const R = 44;
  const C = 2 * Math.PI * R;
  const pct = value === null ? 0 : Math.max(0, Math.min(1, value / max));
  return (
    <svg width="116" height="116" viewBox="0 0 100 100" className="shrink-0 -rotate-90" aria-hidden>
      <circle cx="50" cy="50" r={R} fill="none" strokeWidth="9" className="stroke-muted" />
      <circle
        cx="50" cy="50" r={R} fill="none" strokeWidth="9" strokeLinecap="round"
        className={cn("transition-all duration-700", TONE[tone].ring)}
        strokeDasharray={C}
        strokeDashoffset={C * (1 - pct)}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function SemesterCard({
  sem, index, mode, input, onRename, onRemove, onAddCourse, onPatch, onRemoveCourse,
}: {
  sem: Semester;
  index: number;
  mode: GpaMode;
  input: Uz5Input;
  onRename: (n: string) => void;
  onRemove: () => void;
  onAddCourse: () => void;
  onPatch: (cid: string, patch: Partial<Course>) => void;
  onRemoveCourse: (cid: string) => void;
}) {
  const st = statsFor(mode, input, [sem]);
  const [confirmDel, setConfirmDel] = useState(false);
  const scoreLabel = mode === "us4" ? "Baho" : input === "points" ? "Ball (0–100)" : "Baho (2–5)";

  return (
    <Panel>
      <div className="mb-3 flex items-center gap-2">
        <input
          value={sem.name}
          onChange={(e) => onRename(e.target.value)}
          aria-label={`Semestr nomi ${index + 1}`}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 text-base font-semibold text-foreground outline-none focus:bg-muted/60"
          maxLength={40}
        />
        <span className="shrink-0 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold tabular-nums text-violet-700 dark:text-violet-300">
          GPA {fmtGpa(st.gpa)}
        </span>
        <button
          onClick={() => (confirmDel ? onRemove() : (setConfirmDel(true), setTimeout(() => setConfirmDel(false), 3000)))}
          aria-label="Semestrni o'chirish"
          className={cn(
            "shrink-0 rounded-lg p-2 transition-colors",
            confirmDel ? "bg-red-500 text-white" : "text-muted-foreground hover:bg-red-500/10 hover:text-red-600",
          )}
          title={confirmDel ? "Yana bosing — o'chiriladi" : "Semestrni o'chirish"}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="hidden grid-cols-[1fr_88px_132px_36px] gap-2 px-1 pb-1 text-[11px] font-medium text-muted-foreground sm:grid">
        <span>Fan</span>
        <span>Kredit</span>
        <span>{scoreLabel}</span>
        <span />
      </div>

      <ul className="space-y-2">
        {sem.courses.map((c, i) => {
          const filled = c.score !== null || c.credits !== null;
          const pts = coursePoints(mode, input, c);
          const scoreInvalid = c.score !== null && coursePoints(mode, input, { ...c, credits: 1 }) === null;
          const creditsInvalid = c.credits !== null && !(c.credits > 0 && c.credits <= 30);
          return (
            <li key={c.id} className="grid grid-cols-[1fr_72px_36px] items-center gap-2 sm:grid-cols-[1fr_88px_132px_36px]">
              <input
                value={c.name}
                onChange={(e) => onPatch(c.id, { name: e.target.value })}
                placeholder={`${i + 1}-fan`}
                aria-label={`Fan ${i + 1} nomi`}
                className={cn(fieldCls, "col-span-3 sm:col-span-1")}
                maxLength={60}
              />
              <NumInput
                value={c.credits}
                onChange={(v) => onPatch(c.id, { credits: v })}
                placeholder="Kredit"
                aria-label={`Fan ${i + 1} krediti`}
                invalid={creditsInvalid}
              />
              {mode === "us4" ? (
                <select
                  value={c.score === null ? "" : String(c.score)}
                  onChange={(e) => onPatch(c.id, { score: e.target.value === "" ? null : Number(e.target.value) })}
                  aria-label={`Fan ${i + 1} bahosi`}
                  className={cn(fieldCls, "col-span-1 sm:col-span-1")}
                >
                  <option value="">Baho</option>
                  {US_GRADES.map((g) => (
                    <option key={g.label} value={g.value}>{g.label} ({g.value.toFixed(1)})</option>
                  ))}
                </select>
              ) : (
                <div className="relative col-span-1">
                  <NumInput
                    value={c.score}
                    onChange={(v) => onPatch(c.id, { score: v })}
                    placeholder={input === "points" ? "0–100" : "2–5"}
                    aria-label={`Fan ${i + 1} ${input === "points" ? "bali" : "bahosi"}`}
                    invalid={scoreInvalid}
                    className={input === "points" && pts !== null ? "pr-9" : undefined}
                  />
                  {input === "points" && pts !== null && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-muted px-1.5 text-xs font-bold text-foreground">
                      {pts}
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => onRemoveCourse(c.id)}
                aria-label={`${i + 1}-fanni o'chirish`}
                className={cn(
                  "flex h-10 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600",
                  !filled && sem.courses.length <= 1 && "invisible",
                )}
              >
                <Trash2 size={15} />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onAddCourse}>
          <Plus size={14} className="mr-1" /> Fan qo&apos;shish
        </Button>
        <p className="text-xs text-muted-foreground tabular-nums">
          {trim(st.credits)} kredit · {st.count} ta fan hisoblandi
        </p>
      </div>
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────────────────

function GoalPlanner({
  mode, done, target, onTarget,
}: {
  mode: GpaMode;
  done: ReturnType<typeof statsFor>;
  target: number | null;
  onTarget: (t: number | null) => void;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const max = MAX_POINTS[mode];
  const targetInvalid = target !== null && !(target > 0 && target <= max);

  let result: React.ReactNode = (
    <p className="text-sm text-muted-foreground">
      Maqsadli GPA va qolgan kreditlar sonini kiriting — shunga erishish uchun qanday o&apos;rtacha baho kerakligini aytamiz.
    </p>
  );

  if (target !== null && !targetInvalid && remaining !== null && remaining > 0) {
    if (done.credits === 0) {
      result = <p className="text-sm text-muted-foreground">Avval o&apos;tgan fanlaringizni yuqoriga kiriting.</p>;
    } else {
      const r = neededAverage(mode, target, done, remaining);
      if (r.kind === "reached") {
        result = (
          <Verdict tone="good" title="Maqsad xavfsiz">
            Hozirgi natijangiz bilan {fmtGpa(target)} GPA ni qolgan {trim(remaining)} kreditda ham ushlab qolasiz.
          </Verdict>
        );
      } else if (r.feasible) {
        result = (
          <Verdict tone={r.average / max >= 0.95 ? "warn" : "good"} title={`O'rtacha ${r.average.toFixed(2)} baho kerak`}>
            Qolgan {trim(remaining)} kredit bo&apos;yicha o&apos;rtacha kamida <b>{r.average.toFixed(2)}</b> / {max.toFixed(1)} olsangiz,
            umumiy GPA <b>{fmtGpa(target)}</b> ga chiqadi.
          </Verdict>
        );
      } else {
        const best = (done.weighted + remaining * max) / (done.credits + remaining);
        result = (
          <Verdict tone="bad" title="Bu maqsadga erishib bo'lmaydi">
            Qolgan barcha fanlardan eng yuqori baho olsangiz ham, umumiy GPA eng ko&apos;pi bilan <b>{best.toFixed(2)}</b> bo&apos;ladi.
            Real maqsad tanlang.
          </Verdict>
        );
      }
    }
  }

  return (
    <Panel>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
          <Target size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">Maqsadli GPA</h2>
          <p className="text-xs text-muted-foreground">Qanday baho olishim kerak?</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={`Maqsad (maks. ${max.toFixed(1)})`}>
          <NumInput value={target} onChange={onTarget} placeholder={mode === "uz5" ? "masalan, 4.5" : "masalan, 3.5"} invalid={targetInvalid} />
        </Field>
        <Field label="Qolgan kreditlar">
          <NumInput value={remaining} onChange={setRemaining} placeholder="masalan, 60" />
        </Field>
      </div>
      <div className="mt-4">{result}</div>
    </Panel>
  );
}

function Verdict({ tone, title, children }: { tone: "good" | "warn" | "bad"; title: string; children: React.ReactNode }) {
  const styles = {
    good: "border-emerald-500/30 bg-emerald-500/10",
    warn: "border-amber-500/30 bg-amber-500/10",
    bad: "border-red-500/30 bg-red-500/10",
  }[tone];
  return (
    <div className={cn("rounded-xl border p-3.5", styles)} role="status">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function ScaleInfo({ mode }: { mode: GpaMode }) {
  const [open, setOpen] = useState(false);
  return (
    <Panel className="p-0 sm:p-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Info size={16} className="text-muted-foreground" /> Baholash shkalasi qanday ishlaydi?
        </span>
        <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-4 py-4 text-sm text-muted-foreground sm:px-5">
          {mode === "uz5" ? (
            <>
              <p>
                GPA = (har bir fan krediti × bahosi) yig&apos;indisi ÷ jami kreditlar. 100 ballik natija quyidagi standart
                oraliqlar bo&apos;yicha 5 ballikka o&apos;tkaziladi:
              </p>
              <table className="w-full max-w-sm text-left text-sm">
                <tbody>
                  {UZ_THRESHOLDS.map((t, i) => (
                    <tr key={t.grade} className="border-b border-border/60 last:border-0">
                      <td className="py-1.5 font-bold text-foreground">{t.grade}</td>
                      <td className="py-1.5">{t.label}</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {i === 0 ? "86–100" : `${t.min}–${UZ_THRESHOLDS[i - 1].min - 1}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p>
              GPA = (kredit × baho ballari) yig&apos;indisi ÷ jami kreditlar. A = 4.0, B = 3.0, C = 2.0, D = 1.0, F = 0.
              Xalqaro filial va hamkor universitetlarda ko&apos;proq ishlatiladi.
            </p>
          )}
          <p className="text-xs">
            Bu hisoblagich taxminiy. Universitetingiz boshqa oraliq yoki qoidalar qo&apos;llashi mumkin — rasmiy natija uchun
            dekanatga murojaat qiling.
          </p>
        </div>
      )}
    </Panel>
  );
}

