"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MessageSquarePlus, Search, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { UNIVERSITY_NAMES, serviceById, type CourseAgg, type Review } from "@/lib/community";
import { timeAgoUz } from "@/lib/toolkit/time";
import { ConfirmButton, EmptyState, Field, FormError, Segmented, Skeleton, ToolHeader, fieldCls } from "@/components/tools/ui";
import { LoginGate, ReportBox, StarInput, Stars } from "./ui";

type Sort = "top" | "count" | "new";
const DIFFICULTY = ["Juda oson", "Oson", "O'rtacha", "Qiyin", "Juda qiyin"];

const q = (o: Record<string, string>) => new URLSearchParams(Object.entries(o).filter(([, v]) => v)).toString();

export default function ReviewsApp() {
  const meta = serviceById("reviews");
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [university, setUniversity] = useState("");
  const [sort, setSort] = useState<Sort>("top");
  const [courses, setCourses] = useState<CourseAgg[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CourseAgg | null>(null);
  const [form, setForm] = useState<Partial<Review> | "new" | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let alive = true;
    setCourses(null);
    api.get<{ courses: CourseAgg[]; total: number }>(`/reviews/courses?${q({ q: debounced, university, sort })}`).then((r) => {
      if (!alive) return;
      if (r.error || !r.data) { setError(r.error ?? "Yuklab bo'lmadi."); setCourses([]); return; }
      setError(null); setCourses(r.data.courses); setTotal(r.data.total);
    });
    return () => { alive = false; };
  }, [debounced, university, sort, reload]);

  return (
    <>
      <ToolHeader
        tool={meta}
        actions={<Button onClick={() => setForm("new")}><MessageSquarePlus size={16} className="mr-1.5" /> Sharh yozish</Button>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Fan yoki o'qituvchi nomi"
            aria-label="Qidirish"
            className={cn(fieldCls, "pl-9")}
            maxLength={80}
          />
        </div>
        <select value={university} onChange={(e) => setUniversity(e.target.value)} aria-label="Universitet" className={cn(fieldCls, "sm:w-48")}>
          <option value="">Barcha universitetlar</option>
          {UNIVERSITY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Saralash" className={cn(fieldCls, "sm:w-44")}>
          <option value="top">Eng yuqori baho</option>
          <option value="count">Ko&apos;p sharhli</option>
          <option value="new">Yangi</option>
        </select>
      </div>

      <FormError text={error} />

      {courses === null ? (
        <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={MessageSquarePlus}
          title={debounced || university ? "Hech narsa topilmadi" : "Hali sharhlar yo'q"}
          text={debounced || university ? "Boshqa nom bilan qidirib ko'ring yoki birinchi sharhni o'zingiz yozing." : "Birinchi bo'lib fan yoki o'qituvchi haqida sharh qoldiring — keyingi talabalarga yordam bo'ladi."}
          action={<Button onClick={() => setForm("new")}>Sharh yozish</Button>}
        />
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground">{total} ta fan/o&apos;qituvchi</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {courses.map((c) => (
              <li key={`${c.subject}|${c.teacher}|${c.university}`}>
                <button
                  onClick={() => setDetail(c)}
                  className="flex h-full w-full flex-col rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-foreground">{c.subject}</h2>
                      <p className="truncate text-sm text-muted-foreground">{c.teacher || "O'qituvchi ko'rsatilmagan"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">{c.university}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="font-display text-2xl font-extrabold tabular-nums text-foreground">{c.rating.toFixed(1)}</span>
                    <Stars value={c.rating} />
                    <span className="text-xs text-muted-foreground">({c.count} sharh)</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {c.difficulty !== null && <span>Qiyinlik: <b className="text-foreground">{DIFFICULTY[Math.round(c.difficulty) - 1]}</b></span>}
                    {c.recommend !== null && <span>Tavsiya: <b className="text-foreground">{Math.round(c.recommend * 100)}%</b></span>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {detail && (
        <CourseDialog
          course={detail}
          viewerId={user?.id}
          onClose={() => setDetail(null)}
          onWrite={(r) => { setForm(r ?? { subject: detail.subject, teacher: detail.teacher, university: detail.university }); setDetail(null); }}
          onChanged={() => setReload((n) => n + 1)}
        />
      )}
      {form && (
        <ReviewForm
          initial={form === "new" ? {} : form}
          signedIn={!!user}
          defaultUniversity={user?.university}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); setReload((n) => n + 1); }}
        />
      )}
    </>
  );
}

// ── one course: its reviews ────────────────────────────────────────────

function CourseDialog({
  course, viewerId, onClose, onWrite, onChanged,
}: {
  course: CourseAgg; viewerId?: number; onClose: () => void; onWrite: (mine?: Review) => void; onChanged: () => void;
}) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const load = useCallback(async () => {
    const r = await api.get<{ reviews: Review[] }>(`/reviews?${q({ subject: course.subject, teacher: course.teacher, university: course.university })}`);
    setReviews(r.data?.reviews ?? []);
  }, [course]);
  useEffect(() => { void load(); }, [load, viewerId]);

  const mine = reviews?.find((r) => r.is_mine);
  const now = new Date();

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={course.subject} description={`${course.teacher || "O'qituvchi ko'rsatilmagan"} · ${course.university}`} className="sm:max-w-xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="font-display text-4xl font-extrabold tabular-nums text-foreground">{course.rating.toFixed(1)}</span>
          <div>
            <Stars value={course.rating} size={20} />
            <p className="text-xs text-muted-foreground">{course.count} ta sharh</p>
          </div>
          <Button className="ml-auto" size="sm" onClick={() => onWrite(mine)}>{mine ? "Sharhimni tahrirlash" : "Sharh yozish"}</Button>
        </div>

        {reviews === null ? (
          <Skeleton className="h-32" />
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className={cn("rounded-xl border p-3.5", r.is_mine ? "border-blue-500/30 bg-blue-500/5" : "border-border")}>
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={r.rating} size={14} />
                  <span className="text-xs text-muted-foreground">{r.is_mine ? "Siz" : "Anonim talaba"} · {timeAgoUz(r.created_at, now)}</span>
                  {r.recommend !== null && (
                    <span className={cn("ml-auto inline-flex items-center gap-1 text-xs font-medium", r.recommend ? "text-emerald-600" : "text-red-600")}>
                      {r.recommend ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />} {r.recommend ? "Tavsiya qiladi" : "Tavsiya qilmaydi"}
                    </span>
                  )}
                </div>
                {r.difficulty !== null && <p className="mt-1 text-xs text-muted-foreground">Qiyinlik: {DIFFICULTY[r.difficulty - 1]}</p>}
                {r.text && <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{r.text}</p>}
                <div className="mt-2 flex justify-end">
                  {r.is_mine ? (
                    <ConfirmButton
                      className="h-8 rounded-lg px-3 text-xs"
                      confirmLabel="Ha, o'chirish"
                      onConfirm={async () => { await api.delete(`/reviews/${r.id}`); await load(); onChanged(); }}
                    >
                      <Trash2 size={12} /> O&apos;chirish
                    </ConfirmButton>
                  ) : viewerId ? (
                    <ReportBox onSend={async (reason) => {
                      const res = await api.post<{ message: string }>(`/reviews/${r.id}/report`, { reason });
                      if (!res.error) onChanged();
                      return res.data?.message ?? res.error ?? "Yuborilmadi.";
                    }} />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {!viewerId && <LoginGate className="mt-4" text="Shikoyat qilish yoki sharh yozish uchun hisobingizga kiring." />}
      </DialogContent>
    </Dialog>
  );
}

// ── write / edit a review ──────────────────────────────────────────────

function ReviewForm({
  initial, signedIn, defaultUniversity, onClose, onSaved,
}: {
  initial: Partial<Review>; signedIn: boolean; defaultUniversity?: string; onClose: () => void; onSaved: () => void;
}) {
  const editing = !!initial.id;
  const [subject, setSubject] = useState(initial.subject ?? "");
  const [teacher, setTeacher] = useState(initial.teacher ?? "");
  const [university, setUniversity] = useState(initial.university ?? defaultUniversity ?? "");
  const [rating, setRating] = useState(initial.rating ?? 0);
  const [difficulty, setDifficulty] = useState(initial.difficulty ?? 0);
  const [recommend, setRecommend] = useState<"yes" | "no" | "none">(initial.recommend === true ? "yes" : initial.recommend === false ? "no" : "none");
  const [text, setText] = useState(initial.text ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setError("Umumiy bahoni (yulduzlar) tanlang.");
    setBusy(true); setError(null);
    const r = await api.post("/reviews", {
      subject, teacher, university, rating,
      difficulty: difficulty || null,
      recommend: recommend === "none" ? null : recommend === "yes",
      text,
    });
    setBusy(false);
    if (r.error) return setError(r.error);
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={editing ? "Sharhni tahrirlash" : "Sharh yozish"} description="Sharhingiz boshqa talabalarga anonim ko'rinadi.">
        {!signedIn ? (
          <LoginGate text="Sharh yozish uchun hisobingizga kiring — bu yolg'on va takroriy sharhlarning oldini oladi." />
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="Fan nomi *">
              <input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={editing} className={fieldCls} maxLength={120} placeholder="masalan, Oliy matematika" autoFocus={!editing} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="O'qituvchi">
                <input value={teacher} onChange={(e) => setTeacher(e.target.value)} disabled={editing} className={fieldCls} maxLength={120} placeholder="masalan, Karimov A." />
              </Field>
              <Field label="Universitet *">
                <input list="rv-unis" value={university} onChange={(e) => setUniversity(e.target.value)} disabled={editing} className={fieldCls} maxLength={120} placeholder="masalan, NUU" />
                <datalist id="rv-unis">{UNIVERSITY_NAMES.map((n) => <option key={n} value={n} />)}</datalist>
              </Field>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Umumiy baho *</span>
              <StarInput value={rating} onChange={setRating} label="Umumiy baho" />
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Qiyinlik darajasi</span>
              <div className="grid grid-cols-5 gap-1.5">
                {DIFFICULTY.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={difficulty === i + 1}
                    onClick={() => setDifficulty(difficulty === i + 1 ? 0 : i + 1)}
                    className={cn(
                      "rounded-lg border px-1 py-2 text-[11px] font-medium leading-tight transition-colors",
                      difficulty === i + 1 ? "border-blue-600 bg-blue-600 text-white" : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Boshqalarga tavsiya qilasizmi?</span>
              <Segmented size="sm" label="Tavsiya" value={recommend} onChange={setRecommend} options={[{ value: "yes", label: "Ha" }, { value: "no", label: "Yo'q" }, { value: "none", label: "Ko'rsatmayman" }]} />
            </div>
            <Field label="Fikringiz">
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={1000} className={cn(fieldCls, "h-auto py-2.5")} placeholder="Dars qanday o'tadi, imtihon, baholash — foydali ma'lumot yozing. Haqoratlardan saqlaning." />
              <span className="mt-1 block text-right text-[11px] text-muted-foreground">{text.length}/1000</span>
            </Field>
            <FormError text={error} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
              <Button type="submit" disabled={busy}>{editing ? "Saqlash" : "Yuborish"}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
