"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, Flame, Plus, Sprout, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useHydrated, useLocalStore } from "@/lib/store";
import { useNow } from "@/lib/toolkit/hooks";
import { toolById } from "@/lib/toolkit/tools";
import { formatShortDate, isoDate, parseISODate, uid } from "@/lib/toolkit/time";
import {
  CATEGORY_LABEL, EMPTY_SKILLS, LEVEL_LABEL, SKILLS_KEY, SUGGESTED, activityStreak, fmtHours, goalProgress,
  lastLogDate, totalMinutes, weekMinutes, type Skill, type SkillCategory,
} from "@/lib/toolkit/skills";
import { ConfirmButton, EmptyState, Field, FormError, NumInput, Panel, Skeleton, ToolHeader, fieldCls } from "./ui";

const CAT_COLOR: Record<SkillCategory, string> = {
  til: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  dastur: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  dizayn: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  tahlil: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  muloqot: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  boshqa: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

export default function SkillsApp() {
  const tool = toolById("skills");
  const hydrated = useHydrated();
  const now = useNow(60_000);
  const [data, setData] = useLocalStore(SKILLS_KEY, EMPTY_SKILLS);
  const [adding, setAdding] = useState(false);
  const [logging, setLogging] = useState<Skill | null>(null);
  const [editing, setEditing] = useState<Skill | null>(null);

  const ready = hydrated && now !== null;
  const patch = (id: string, fn: (s: Skill) => Skill) =>
    setData((p) => ({ skills: p.skills.map((s) => (s.id === id ? fn(s) : s)) }));
  const quickLog = (id: string, minutes: number) =>
    patch(id, (s) => ({ ...s, logs: [...s.logs, { id: uid(), date: isoDate(new Date()), minutes }].slice(-400) }));

  const sorted = useMemo(
    () => [...data.skills].sort((a, b) => (lastLogDate(b) ?? b.createdAt).localeCompare(lastLogDate(a) ?? a.createdAt)),
    [data.skills],
  );
  const stats = ready
    ? {
        week: data.skills.reduce((n, s) => n + weekMinutes(s, now), 0),
        streak: activityStreak(data.skills, now),
      }
    : null;

  return (
    <>
      <ToolHeader
        tool={tool}
        actions={
          <>
            {data.skills.length > 0 && (
              <Button variant="outline" asChild>
                <Link href="/jobs?match=1"><Briefcase size={15} className="mr-2" /> Mos ishlar</Link>
              </Button>
            )}
            <Button onClick={() => setAdding(true)}><Plus size={16} className="mr-1.5" /> Ko&apos;nikma qo&apos;shish</Button>
          </>
        }
      />

      {!ready ? (
        <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-48" /></div>
      ) : data.skills.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={Sprout}
            title="Birinchi ko'nikmangizni qo'shing"
            text="Nimani o'rganayotganingizni yozing, darajangiz va maqsadingizni belgilang, mashq vaqtini kuzating. Ko'nikmalaringiz CV va ish tavsiyalariga avtomatik ulanadi."
          />
          <QuickAdd existing={[]} onAdd={(name, category) => setData((p) => ({ skills: [...p.skills, newSkill(name, category)] }))} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Ko'nikmalar" value={String(data.skills.length)} />
            <Stat label="Shu hafta" value={fmtHours(stats?.week ?? 0)} />
            <Stat label="Ketma-ket" value={`${stats?.streak ?? 0} kun`} icon={stats && stats.streak > 0 ? <Flame size={14} className="text-orange-500" /> : undefined} />
          </div>

          <ul className="grid gap-3 md:grid-cols-2">
            {sorted.map((s) => (
              <li key={s.id}>
                <Panel className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-foreground">{s.name}</h2>
                      <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold", CAT_COLOR[s.category])}>{CATEGORY_LABEL[s.category]}</span>
                    </div>
                    <button onClick={() => setEditing(s)} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">Tahrirlash</button>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{LEVEL_LABEL[s.level]}</span>
                      <span className="text-muted-foreground">Maqsad: {LEVEL_LABEL[s.goal]}</span>
                    </div>
                    <div className="flex gap-1" role="img" aria-label={`Daraja ${s.level} / 5, maqsad ${s.goal}`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={cn("h-2 flex-1 rounded-full", n <= s.level ? "bg-lime-500" : n <= s.goal ? "bg-lime-500/25" : "bg-muted")} />
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">Maqsadga: {Math.round(goalProgress(s) * 100)}%</p>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Shu hafta <b className="text-foreground">{fmtHours(weekMinutes(s, now))}</b> · jami <b className="text-foreground">{fmtHours(totalMinutes(s))}</b>
                    {lastLogDate(s) ? ` · oxirgi mashq ${formatShortDate(parseISODate(lastLogDate(s) as string))}` : ""}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {[15, 30, 60].map((m) => (
                      <Button key={m} size="sm" variant="outline" onClick={() => quickLog(s.id, m)}>+{m === 60 ? "1 soat" : `${m} daq`}</Button>
                    ))}
                    <Button size="sm" variant="ghost" onClick={() => setLogging(s)}>Boshqa vaqt…</Button>
                  </div>
                </Panel>
              </li>
            ))}
          </ul>

          <QuickAdd existing={data.skills.map((s) => s.name.toLowerCase())} onAdd={(name, category) => setData((p) => ({ skills: [...p.skills, newSkill(name, category)] }))} />
        </div>
      )}

      {adding && <AddDialog onClose={() => setAdding(false)} onAdd={(s) => { setData((p) => ({ skills: [...p.skills, s] })); setAdding(false); }} />}
      {logging && <LogDialog skill={logging} onClose={() => setLogging(null)} onSave={(minutes, date, note) => { patch(logging.id, (s) => ({ ...s, logs: [...s.logs, { id: uid(), date, minutes, note: note || undefined }].slice(-400) })); setLogging(null); }} />}
      {editing && (
        <EditDialog
          skill={editing}
          onClose={() => setEditing(null)}
          onSave={(s) => { patch(s.id, () => s); setEditing(null); }}
          onDelete={() => { setData((p) => ({ skills: p.skills.filter((x) => x.id !== editing.id) })); setEditing(null); }}
        />
      )}
    </>
  );
}

function newSkill(name: string, category: SkillCategory): Skill {
  return { id: uid(), name: name.trim(), category, level: 1, goal: 3, logs: [], createdAt: new Date().toISOString() };
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-3 text-center shadow-sm">
      <p className="flex items-center justify-center gap-1 text-lg font-bold tabular-nums text-foreground">{icon}{value}</p>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAdd({ existing, onAdd }: { existing: string[]; onAdd: (name: string, c: SkillCategory) => void }) {
  const options = SUGGESTED.filter((s) => !existing.includes(s.name.toLowerCase()));
  if (!options.length) return null;
  return (
    <Panel>
      <p className="mb-2 text-sm font-medium text-foreground">Tezkor qo&apos;shish</p>
      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <button key={s.name} onClick={() => onAdd(s.name, s.category)} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-lime-500/50 hover:bg-lime-500/10">
            + {s.name}
          </button>
        ))}
      </div>
    </Panel>
  );
}

function AddDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Skill) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SkillCategory>("dastur");
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Ko'nikma qo'shish">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (name.trim().length < 2) return setError("Ko'nikma nomini kiriting."); onAdd(newSkill(name, category)); }}>
          <Field label="Nomi *"><input value={name} onChange={(e) => setName(e.target.value)} className={fieldCls} maxLength={40} placeholder="masalan, Python" autoFocus /></Field>
          <Field label="Yo'nalish">
            <select value={category} onChange={(e) => setCategory(e.target.value as SkillCategory)} className={fieldCls}>
              {(Object.keys(CATEGORY_LABEL) as SkillCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </Field>
          <FormError text={error} />
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button><Button type="submit">Qo&apos;shish</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LogDialog({ skill, onClose, onSave }: { skill: Skill; onClose: () => void; onSave: (minutes: number, date: string, note: string) => void }) {
  const [minutes, setMinutes] = useState<number | null>(45);
  const [date, setDate] = useState(isoDate(new Date()));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={`${skill.name}: mashq qo'shish`}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!minutes || minutes < 1 || minutes > 720) return setError("Vaqt 1 dan 720 daqiqagacha bo'lsin."); onSave(Math.round(minutes), date, note.trim()); }}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Daqiqa"><NumInput value={minutes} onChange={setMinutes} placeholder="45" /></Field>
            <Field label="Sana"><input type="date" value={date} max={isoDate(new Date())} onChange={(e) => setDate(e.target.value)} className={fieldCls} /></Field>
          </div>
          <Field label="Nima qildingiz? (ixtiyoriy)"><input value={note} onChange={(e) => setNote(e.target.value)} className={fieldCls} maxLength={120} placeholder="masalan, 2-bo'lim mashqlari" /></Field>
          <FormError text={error} />
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button><Button type="submit">Saqlash</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({ skill, onClose, onSave, onDelete }: { skill: Skill; onClose: () => void; onSave: (s: Skill) => void; onDelete: () => void }) {
  const [name, setName] = useState(skill.name);
  const [category, setCategory] = useState(skill.category);
  const [level, setLevel] = useState(skill.level);
  const [goal, setGoal] = useState(skill.goal);
  const [error, setError] = useState<string | null>(null);
  const recent = [...skill.logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const Scale = ({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) => (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange(n)} className={cn("rounded-lg border px-1 py-2 text-[11px] font-medium leading-tight transition-colors", value === n ? "border-lime-600 bg-lime-600 text-white" : "border-border text-muted-foreground hover:bg-accent")}>
          {LEVEL_LABEL[n]}
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Ko'nikmani tahrirlash">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (name.trim().length < 2) return setError("Nomini kiriting."); onSave({ ...skill, name: name.trim(), category, level, goal: Math.max(goal, level) }); }}>
          <Field label="Nomi"><input value={name} onChange={(e) => setName(e.target.value)} className={fieldCls} maxLength={40} /></Field>
          <Field label="Yo'nalish">
            <select value={category} onChange={(e) => setCategory(e.target.value as SkillCategory)} className={fieldCls}>
              {(Object.keys(CATEGORY_LABEL) as SkillCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </Field>
          <div><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Hozirgi daraja</span><Scale value={level} onChange={(n) => { setLevel(n); if (goal < n) setGoal(n); }} label="Hozirgi daraja" /></div>
          <div><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Maqsad</span><Scale value={goal} onChange={(n) => setGoal(Math.max(n, level))} label="Maqsad darajasi" /></div>
          {recent.length > 0 && (
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">So&apos;nggi mashqlar</span>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {recent.map((l) => <li key={l.id} className="flex justify-between gap-3"><span className="truncate">{formatShortDate(parseISODate(l.date))}{l.note ? ` · ${l.note}` : ""}</span><span className="shrink-0 tabular-nums">{fmtHours(l.minutes)}</span></li>)}
              </ul>
            </div>
          )}
          <FormError text={error} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <ConfirmButton onConfirm={onDelete}><Trash2 size={15} /> O&apos;chirish</ConfirmButton>
            <div className="flex gap-2"><Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none">Bekor qilish</Button><Button type="submit" className="flex-1 sm:flex-none">Saqlash</Button></div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
