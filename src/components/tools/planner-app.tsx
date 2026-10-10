"use client";

import React, { useMemo, useState } from "react";
import { Check, ChevronDown, Flame, GraduationCap, ListChecks, MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useHydrated, useLocalStore } from "@/lib/store";
import { useNow } from "@/lib/toolkit/hooks";
import { toolById } from "@/lib/toolkit/tools";
import { formatShortDate, isoDate, parseISODate, uid } from "@/lib/toolkit/time";
import { EMPTY_TIMETABLE, TIMETABLE_KEY } from "@/lib/toolkit/timetable";
import {
  EMPTY_PLANNER, EXAM_LABEL, PLANNER_KEY, TASK_GROUP_LABEL, TASK_GROUP_ORDER,
  examCountdown, groupTasks, pastExams, upcomingExams,
  type Exam, type ExamType, type Priority, type Task, type TaskGroupKey,
} from "@/lib/toolkit/planner";
import {
  ConfirmButton, EmptyState, Field, FormError, Panel, Segmented, Skeleton, ToolHeader, fieldCls,
} from "./ui";

type Tab = "tasks" | "exams";
type DueChoice = "none" | "today" | "tomorrow" | "week" | "custom";

function dueFromChoice(choice: DueChoice, custom: string, now: Date): string | undefined {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (choice === "none") return undefined;
  if (choice === "custom") return custom || undefined;
  d.setDate(d.getDate() + (choice === "tomorrow" ? 1 : choice === "week" ? 7 : 0));
  return isoDate(d);
}

export default function PlannerApp() {
  const tool = toolById("planner");
  const hydrated = useHydrated();
  const now = useNow(60_000);
  const [data, setData] = useLocalStore(PLANNER_KEY, EMPTY_PLANNER);
  const [timetable] = useLocalStore(TIMETABLE_KEY, EMPTY_TIMETABLE);
  const [tab, setTab] = useState<Tab>("tasks");
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [examDialog, setExamDialog] = useState<Exam | "new" | null>(null);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    timetable.classes.forEach((c) => set.add(c.subject));
    data.exams.forEach((e) => set.add(e.subject));
    data.tasks.forEach((t) => t.subject && set.add(t.subject));
    return Array.from(set);
  }, [timetable, data]);

  const ready = hydrated && now !== null;
  const open = data.tasks.filter((t) => !t.done).length;
  const upcoming = ready ? upcomingExams(data.exams, now) : [];

  return (
    <>
      <ToolHeader
        tool={tool}
        actions={
          tab === "exams" ? (
            <Button onClick={() => setExamDialog("new")}>
              <Plus size={16} className="mr-1.5" /> Imtihon qo&apos;shish
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4">
        <Segmented<Tab>
          label="Bo'lim"
          value={tab}
          onChange={setTab}
          options={[
            { value: "tasks", label: <>Vazifalar{open > 0 && <Count n={open} />}</> },
            { value: "exams", label: <>Imtihonlar{upcoming.length > 0 && <Count n={upcoming.length} />}</> },
          ]}
        />
      </div>

      {!ready ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-48" />
        </div>
      ) : tab === "tasks" ? (
        <TasksTab
          now={now}
          tasks={data.tasks}
          subjects={subjects}
          onAdd={(t) => setData((p) => ({ ...p, tasks: [t, ...p.tasks] }))}
          onToggle={(id) =>
            setData((p) => ({
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === id ? { ...t, done: !t.done, doneAt: t.done ? undefined : new Date().toISOString() } : t,
              ),
            }))
          }
          onEdit={setEditTask}
          onClearDone={() => setData((p) => ({ ...p, tasks: p.tasks.filter((t) => !t.done) }))}
        />
      ) : (
        <ExamsTab
          now={now}
          exams={data.exams}
          onPick={setExamDialog}
          onAdd={() => setExamDialog("new")}
        />
      )}

      {editTask && (
        <TaskDialog
          key={editTask.id}
          task={editTask}
          subjects={subjects}
          onClose={() => setEditTask(null)}
          onSave={(t) => {
            setData((p) => ({ ...p, tasks: p.tasks.map((x) => (x.id === t.id ? t : x)) }));
            setEditTask(null);
          }}
          onDelete={(id) => {
            setData((p) => ({ ...p, tasks: p.tasks.filter((x) => x.id !== id) }));
            setEditTask(null);
          }}
        />
      )}

      {examDialog && (
        <ExamDialog
          key={examDialog === "new" ? "new" : examDialog.id}
          exam={examDialog === "new" ? null : examDialog}
          subjects={subjects}
          onClose={() => setExamDialog(null)}
          onSave={(e) => {
            setData((p) => ({
              ...p,
              exams: p.exams.some((x) => x.id === e.id) ? p.exams.map((x) => (x.id === e.id ? e : x)) : [...p.exams, e],
            }));
            setExamDialog(null);
          }}
          onDelete={(id) => {
            setData((p) => ({ ...p, exams: p.exams.filter((x) => x.id !== id) }));
            setExamDialog(null);
          }}
        />
      )}
    </>
  );
}

const Count = ({ n }: { n: number }) => (
  <span className="ml-1.5 rounded-full bg-blue-600/15 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">{n}</span>
);

// ─────────────────────────────────────────────────────────────────────────
// Tasks
// ─────────────────────────────────────────────────────────────────────────

function TasksTab({
  now, tasks, subjects, onAdd, onToggle, onEdit, onClearDone,
}: {
  now: Date;
  tasks: Task[];
  subjects: string[];
  onAdd: (t: Task) => void;
  onToggle: (id: string) => void;
  onEdit: (t: Task) => void;
  onClearDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [choice, setChoice] = useState<DueChoice>("today");
  const [custom, setCustom] = useState("");
  const [high, setHigh] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const groups = groupTasks(tasks, now);
  const done = tasks.filter((t) => t.done).sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));
  const openCount = tasks.length - done.length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    onAdd({
      id: uid(),
      title: t,
      subject: subject.trim() || undefined,
      due: dueFromChoice(choice, custom, now),
      priority: high ? "high" : "normal",
      done: false,
    });
    setTitle("");
    setHigh(false);
  };

  const chips: { v: DueChoice; label: string }[] = [
    { v: "today", label: "Bugun" },
    { v: "tomorrow", label: "Ertaga" },
    { v: "week", label: "1 hafta" },
    { v: "none", label: "Muddatsiz" },
    { v: "custom", label: "Sana…" },
  ];

  return (
    <div className="space-y-4">
      <Panel>
        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Yangi vazifa — masalan, Fizika laboratoriya hisoboti"
              aria-label="Vazifa nomi"
              className={cn(fieldCls, "flex-1")}
              maxLength={120}
            />
            <Button type="submit" disabled={!title.trim()} aria-label="Vazifa qo'shish">
              <Plus size={16} className="sm:mr-1.5" /> <span className="hidden sm:inline">Qo&apos;shish</span>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <button
                key={c.v}
                type="button"
                aria-pressed={choice === c.v}
                onClick={() => setChoice(c.v)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  choice === c.v
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {c.label}
              </button>
            ))}
            {choice === "custom" && (
              <input
                type="date"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                aria-label="Muddat sanasi"
                className={cn(fieldCls, "h-8 w-auto rounded-lg py-0 text-xs")}
              />
            )}
            <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
            <input
              list="pl-subjects"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Fan (ixtiyoriy)"
              aria-label="Fan"
              className={cn(fieldCls, "h-8 w-40 rounded-lg py-0 text-xs")}
              maxLength={60}
            />
            <datalist id="pl-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
            <button
              type="button"
              aria-pressed={high}
              onClick={() => setHigh((h) => !h)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                high
                  ? "border-orange-500 bg-orange-500/15 text-orange-700 dark:text-orange-300"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              <Flame size={12} /> Muhim
            </button>
          </div>
        </form>
      </Panel>

      {openCount === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={done.length ? "Hammasi bajarildi!" : "Hozircha vazifa yo'q"}
          text={done.length ? "Ajoyib ish. Yangi vazifa qo'shing yoki dam oling." : "Topshiriq, laboratoriya yoki referat — muddati bilan yozib qo'ying, hech narsani unutmaysiz."}
        />
      ) : (
        TASK_GROUP_ORDER.map((key) =>
          groups[key].length ? (
            <TaskGroup key={key} group={key} tasks={groups[key]} now={now} onToggle={onToggle} onEdit={onEdit} />
          ) : null,
        )
      )}

      {done.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowDone((s) => !s)}
              aria-expanded={showDone}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronDown size={15} className={cn("transition-transform", !showDone && "-rotate-90")} />
              Bajarilganlar ({done.length})
            </button>
            {showDone && (
              <ConfirmButton onConfirm={onClearDone} confirmLabel="Ha, tozalash" className="h-8 rounded-lg px-3 text-xs">
                Tozalash
              </ConfirmButton>
            )}
          </div>
          {showDone && (
            <ul className="mt-2 space-y-1.5">
              {done.map((t) => (
                <TaskRow key={t.id} t={t} now={now} onToggle={onToggle} onEdit={onEdit} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function TaskGroup({
  group, tasks, now, onToggle, onEdit,
}: { group: TaskGroupKey; tasks: Task[]; now: Date; onToggle: (id: string) => void; onEdit: (t: Task) => void }) {
  return (
    <section>
      <h2
        className={cn(
          "mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider",
          group === "overdue" ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
        )}
      >
        {TASK_GROUP_LABEL[group]}
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal">{tasks.length}</span>
      </h2>
      <ul className="space-y-1.5">
        {tasks.map((t) => <TaskRow key={t.id} t={t} now={now} onToggle={onToggle} onEdit={onEdit} />)}
      </ul>
    </section>
  );
}

function TaskRow({
  t, now, onToggle, onEdit,
}: { t: Task; now: Date; onToggle: (id: string) => void; onEdit: (t: Task) => void }) {
  const overdue = !t.done && t.due && parseISODate(t.due) < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return (
    <li className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm">
      <button
        onClick={() => onToggle(t.id)}
        role="checkbox"
        aria-checked={t.done}
        aria-label={t.done ? `"${t.title}" ni bajarilmagan deb belgilash` : `"${t.title}" ni bajarildi deb belgilash`}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          t.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40 hover:border-blue-500",
        )}
      >
        {t.done && <Check size={14} strokeWidth={3} />}
      </button>
      <button onClick={() => onEdit(t)} className="min-w-0 flex-1 text-left" aria-label={`"${t.title}" ni tahrirlash`}>
        <span className={cn("block truncate text-sm font-medium", t.done ? "text-muted-foreground line-through" : "text-foreground")}>
          {t.title}
        </span>
        {(t.subject || t.due) && (
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {t.subject && <span className="rounded-md bg-muted px-1.5 py-px font-medium">{t.subject}</span>}
            {t.due && (
              <span className={cn(overdue && "font-semibold text-red-600 dark:text-red-400")}>
                {formatShortDate(parseISODate(t.due))}
              </span>
            )}
          </span>
        )}
      </button>
      {t.priority === "high" && !t.done && <Flame size={15} className="shrink-0 text-orange-500" aria-label="Muhim" />}
    </li>
  );
}

function TaskDialog({
  task, subjects, onClose, onSave, onDelete,
}: {
  task: Task;
  subjects: string[];
  onClose: () => void;
  onSave: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [subject, setSubject] = useState(task.subject ?? "");
  const [due, setDue] = useState(task.due ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Vazifani tahrirlash">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return setError("Vazifa nomini kiriting.");
            onSave({ ...task, title: title.trim(), subject: subject.trim() || undefined, due: due || undefined, priority });
          }}
        >
          <Field label="Nomi *">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldCls} maxLength={120} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Fan">
              <input list="pl-subjects-edit" value={subject} onChange={(e) => setSubject(e.target.value)} className={fieldCls} maxLength={60} />
              <datalist id="pl-subjects-edit">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="Muddat">
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={fieldCls} />
            </Field>
          </div>
          <Segmented<Priority>
            label="Muhimlik"
            value={priority}
            onChange={setPriority}
            options={[{ value: "normal", label: "Oddiy" }, { value: "high", label: "Muhim" }]}
          />
          <FormError text={error} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <ConfirmButton onConfirm={() => onDelete(task.id)}>
              <Trash2 size={15} /> O&apos;chirish
            </ConfirmButton>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none">Bekor qilish</Button>
              <Button type="submit" className="flex-1 sm:flex-none">Saqlash</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Exams
// ─────────────────────────────────────────────────────────────────────────

function ExamsTab({
  now, exams, onPick, onAdd,
}: { now: Date; exams: Exam[]; onPick: (e: Exam) => void; onAdd: () => void }) {
  const [showPast, setShowPast] = useState(false);
  const up = upcomingExams(exams, now);
  const past = pastExams(exams, now);

  if (exams.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Imtihonlar qo'shilmagan"
        text="Oraliq, yakuniy yoki DTM sanasini kiriting — qancha kun qolganini ko'rib turasiz."
        action={<Button onClick={onAdd}><Plus size={16} className="mr-1.5" /> Imtihon qo&apos;shish</Button>}
      />
    );
  }

  return (
    <div className="space-y-4">
      {up.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Yaqin imtihonlar yo&apos;q.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {up.map((e, i) => {
            const cd = examCountdown(e, now);
            return (
              <li key={e.id}>
                <button
                  onClick={() => onPick(e)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/60",
                    i === 0 ? "border-amber-500/40" : "border-border",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl",
                      cd.urgent ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                    )}
                  >
                    {cd.days <= 1 ? (
                      <span className="text-sm font-bold leading-tight">{cd.label}</span>
                    ) : (
                      <>
                        <span className="font-display text-2xl font-extrabold leading-none tabular-nums">{cd.days}</span>
                        <span className="text-[10px] font-semibold uppercase">kun</span>
                      </>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{e.subject}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{EXAM_LABEL[e.type]}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      <span>{formatShortDate(parseISODate(e.date))}{e.time ? `, ${e.time}` : ""}</span>
                      {e.room && <span className="inline-flex items-center gap-1"><MapPin size={11} />{e.room}</span>}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {past.length > 0 && (
        <div>
          <button
            onClick={() => setShowPast((s) => !s)}
            aria-expanded={showPast}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronDown size={15} className={cn("transition-transform", !showPast && "-rotate-90")} />
            O&apos;tgan imtihonlar ({past.length})
          </button>
          {showPast && (
            <ul className="mt-2 space-y-1.5">
              {past.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => onPick(e)}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-left text-sm opacity-70 hover:opacity-100"
                  >
                    <span className="truncate font-medium text-foreground">{e.subject}</span>
                    <span className="ml-3 shrink-0 text-xs text-muted-foreground">{formatShortDate(parseISODate(e.date))}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ExamDialog({
  exam, subjects, onClose, onSave, onDelete,
}: {
  exam: Exam | null;
  subjects: string[];
  onClose: () => void;
  onSave: (e: Exam) => void;
  onDelete: (id: string) => void;
}) {
  const [subject, setSubject] = useState(exam?.subject ?? "");
  const [type, setType] = useState<ExamType>(exam?.type ?? "final");
  const [date, setDate] = useState(exam?.date ?? "");
  const [time, setTime] = useState(exam?.time ?? "");
  const [room, setRoom] = useState(exam?.room ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={exam ? "Imtihonni tahrirlash" : "Yangi imtihon"}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!subject.trim()) return setError("Fan yoki imtihon nomini kiriting.");
            if (!date) return setError("Imtihon sanasini tanlang.");
            onSave({
              id: exam?.id ?? uid(),
              subject: subject.trim(),
              type,
              date,
              time: time || undefined,
              room: room.trim() || undefined,
            });
          }}
        >
          <Field label="Fan / imtihon nomi *">
            <input
              autoFocus={!exam}
              list="ex-subjects"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="masalan, Oliy matematika"
              className={fieldCls}
              maxLength={80}
            />
            <datalist id="ex-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
          </Field>
          <Field label="Turi">
            <select value={type} onChange={(e) => setType(e.target.value as ExamType)} className={fieldCls}>
              {(Object.keys(EXAM_LABEL) as ExamType[]).map((k) => <option key={k} value={k}>{EXAM_LABEL[k]}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sana *">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
            </Field>
            <Field label="Vaqt">
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={fieldCls} />
            </Field>
          </div>
          <Field label="Xona / manzil">
            <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="masalan, 3-bino, 215" className={fieldCls} maxLength={60} />
          </Field>
          <FormError text={error} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {exam ? <ConfirmButton onConfirm={() => onDelete(exam.id)}><Trash2 size={15} /> O&apos;chirish</ConfirmButton> : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none">Bekor qilish</Button>
              <Button type="submit" className="flex-1 sm:flex-none">Saqlash</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
