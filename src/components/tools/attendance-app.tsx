"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Minus, Pencil, Plus, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useHydrated, useLocalStore } from "@/lib/store";
import { toolById } from "@/lib/toolkit/tools";
import { uid } from "@/lib/toolkit/time";
import { EMPTY_TIMETABLE, TIMETABLE_KEY } from "@/lib/toolkit/timetable";
import {
  ATTENDANCE_KEY, DEFAULT_LIMIT_PCT, EMPTY_ATTENDANCE, PAIR_HOURS, statusOf,
  type AttendanceSubject, type Risk,
} from "@/lib/toolkit/attendance";
import {
  ConfirmButton, EmptyState, Field, FormError, NumInput, Panel, Skeleton, ToolHeader, fieldCls,
} from "./ui";

const RISK: Record<Risk, { bar: string; chip: string; label: string }> = {
  ok:     { bar: "bg-emerald-500", chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", label: "Xavfsiz" },
  warn:   { bar: "bg-amber-500",   chip: "bg-amber-500/10 text-amber-700 dark:text-amber-400",       label: "Ehtiyot bo'ling" },
  danger: { bar: "bg-red-500",     chip: "bg-red-500/10 text-red-600 dark:text-red-400",             label: "Chegaradan oshdi" },
};

export default function AttendanceApp() {
  const tool = toolById("attendance");
  const hydrated = useHydrated();
  const [data, setData] = useLocalStore(ATTENDANCE_KEY, EMPTY_ATTENDANCE);
  const [timetable] = useLocalStore(TIMETABLE_KEY, EMPTY_TIMETABLE);
  const [editing, setEditing] = useState<AttendanceSubject | "new" | null>(null);

  const patch = (id: string, fn: (s: AttendanceSubject) => AttendanceSubject) =>
    setData((p) => ({ subjects: p.subjects.map((s) => (s.id === id ? fn(s) : s)) }));

  const rows = useMemo(
    () => data.subjects.map((s) => ({ s, st: statusOf(s) })),
    [data.subjects],
  );
  const atRisk = rows.filter((r) => r.st.risk !== "ok").length;
  const timetableSubjects = useMemo(
    () => Array.from(new Set(timetable.classes.map((c) => c.subject))).filter((n) => !data.subjects.some((s) => s.name === n)),
    [timetable, data.subjects],
  );

  return (
    <>
      <ToolHeader
        tool={tool}
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus size={16} className="mr-1.5" /> Fan qo&apos;shish
          </Button>
        }
      />

      {!hydrated ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-40" />
        </div>
      ) : data.subjects.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={UserCheck}
            title="Davomatni kuzatishni boshlang"
            text="Har bir fan uchun jami soat va ruxsat etilgan qoldirish ulushini kiriting. Dars qoldirganingizda bir tugma bilan belgilang — imtihonga ruxsat chegarasiga qancha qolganini ko'rasiz."
            action={<Button onClick={() => setEditing("new")}><Plus size={16} className="mr-1.5" /> Birinchi fanni qo&apos;shish</Button>}
          />
          {timetableSubjects.length > 0 && (
            <Panel>
              <p className="mb-2 text-sm font-medium text-foreground">Dars jadvalingizdagi fanlardan tez qo&apos;shish</p>
              <div className="flex flex-wrap gap-2">
                {timetableSubjects.map((n) => (
                  <button
                    key={n}
                    onClick={() =>
                      setData((p) => ({
                        subjects: [...p.subjects, { id: uid(), name: n, totalHours: 72, missedHours: 0, limitPct: DEFAULT_LIMIT_PCT }],
                      }))
                    }
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    + {n}
                  </button>
                ))}
              </div>
            </Panel>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4",
              atRisk > 0 ? "border-amber-500/40 bg-amber-500/10" : "border-emerald-500/30 bg-emerald-500/10",
            )}
            role="status"
          >
            {atRisk > 0 ? (
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-400" />
            ) : (
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">
                {atRisk > 0 ? `${atRisk} ta fan bo'yicha qoldirish chegarasiga yaqinlashdingiz` : "Hamma fanlar bo'yicha davomatingiz xavfsiz"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Bu shaxsiy hisoblagich. Rasmiy davomat universitet tizimida (masalan, HEMIS) yuritiladi va qoidalar universitetga qarab farq qiladi.
              </p>
            </div>
          </div>

          <ul className="grid gap-3 md:grid-cols-2">
            {rows.map(({ s, st }) => (
              <li key={s.id}>
                <Panel className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-foreground">{s.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        Jami {s.totalHours} soat · ruxsat {s.limitPct}% ({st.allowed} soat)
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", RISK[st.risk].chip)}>
                        {RISK[st.risk].label}
                      </span>
                      <button
                        onClick={() => setEditing(s)}
                        aria-label={`${s.name} ni tahrirlash`}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={st.allowed}
                      aria-valuenow={Math.min(s.missedHours, st.allowed)}
                      aria-label={`${s.name}: qoldirilgan ${s.missedHours} soat, ruxsat ${st.allowed} soat`}
                      className="h-2.5 overflow-hidden rounded-full bg-muted"
                    >
                      <div className={cn("h-full rounded-full transition-all duration-500", RISK[st.risk].bar)} style={{ width: `${Math.max(st.used * 100, s.missedHours > 0 ? 4 : 0)}%` }} />
                    </div>
                    <div className="mt-2 flex items-baseline justify-between text-sm">
                      <span className="tabular-nums text-foreground">
                        <b className="text-lg">{s.missedHours}</b>
                        <span className="text-muted-foreground"> / {st.allowed} soat qoldirilgan</span>
                      </span>
                      <span className={cn("text-xs font-medium tabular-nums", st.risk === "danger" ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                        {st.risk === "danger"
                          ? `${st.over} soat oshib ketdi`
                          : `yana ${st.left} soat qoldirish mumkin`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => patch(s.id, (x) => ({ ...x, missedHours: x.missedHours + PAIR_HOURS }))}
                    >
                      <Plus size={14} className="mr-1" /> Qoldirdim ({PAIR_HOURS} soat)
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={s.missedHours === 0}
                      aria-label="Oxirgi belgini bekor qilish"
                      title="Bekor qilish"
                      onClick={() => patch(s.id, (x) => ({ ...x, missedHours: Math.max(0, x.missedHours - PAIR_HOURS) }))}
                    >
                      <Minus size={14} />
                    </Button>
                  </div>
                </Panel>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing && (
        <SubjectDialog
          key={editing === "new" ? "new" : editing.id}
          subject={editing === "new" ? null : editing}
          suggestions={timetableSubjects}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            setData((p) => ({
              subjects: p.subjects.some((x) => x.id === s.id) ? p.subjects.map((x) => (x.id === s.id ? s : x)) : [...p.subjects, s],
            }));
            setEditing(null);
          }}
          onDelete={(id) => {
            setData((p) => ({ subjects: p.subjects.filter((x) => x.id !== id) }));
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function SubjectDialog({
  subject, suggestions, onClose, onSave, onDelete,
}: {
  subject: AttendanceSubject | null;
  suggestions: string[];
  onClose: () => void;
  onSave: (s: AttendanceSubject) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(subject?.name ?? "");
  const [total, setTotal] = useState<number | null>(subject?.totalHours ?? 72);
  const [missed, setMissed] = useState<number | null>(subject?.missedHours ?? 0);
  const [limit, setLimit] = useState<number | null>(subject?.limitPct ?? DEFAULT_LIMIT_PCT);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={subject ? "Fanni tahrirlash" : "Yangi fan"} description="Soatlar akademik soatda hisoblanadi (1 juftlik = 2 soat).">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return setError("Fan nomini kiriting.");
            if (total === null || !Number.isInteger(total) || total < 1 || total > 1000) return setError("Jami soat 1 dan 1000 gacha butun son bo'lsin.");
            if (limit === null || limit <= 0 || limit > 100) return setError("Ruxsat etilgan ulush 1–100% oralig'ida bo'lsin.");
            if (missed === null || !Number.isInteger(missed) || missed < 0) return setError("Qoldirilgan soat 0 yoki undan katta butun son bo'lsin.");
            onSave({ id: subject?.id ?? uid(), name: name.trim(), totalHours: total, missedHours: missed, limitPct: limit });
          }}
        >
          <Field label="Fan nomi *">
            <input
              autoFocus={!subject}
              list="at-subjects"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="masalan, Ingliz tili"
              className={fieldCls}
              maxLength={80}
            />
            <datalist id="at-subjects">{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Jami soat">
              <NumInput value={total} onChange={setTotal} placeholder="72" />
            </Field>
            <Field label="Qoldirilgan">
              <NumInput value={missed} onChange={setMissed} placeholder="0" />
            </Field>
            <Field label="Ruxsat, %">
              <NumInput value={limit} onChange={setLimit} placeholder="25" />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Ruxsat etilgan ulush universitet va fanga qarab farq qiladi — o&apos;zingizning nizomingizdagi qiymatni kiriting.
          </p>
          <FormError text={error} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {subject ? <ConfirmButton onConfirm={() => onDelete(subject.id)}>O&apos;chirish</ConfirmButton> : <span />}
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
