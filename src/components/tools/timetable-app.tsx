"use client";

import React, { useEffect, useMemo, useState } from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import {
  CalendarDays, CalendarPlus, Clock3, Copy, MapPin, Plus, Repeat, Send, Share2, UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useHydrated, useLocalStore } from "@/lib/store";
import { useNow } from "@/lib/toolkit/hooks";
import { toolById } from "@/lib/toolkit/tools";
import {
  DAYS_FULL, DAYS_SHORT, dayIndex, fmtMin, formatDuration, formatLongDate, mondayOf, toMin, uid,
} from "@/lib/toolkit/time";
import {
  COLORS, COLOR_KEYS, EMPTY_TIMETABLE, KIND_LABEL, PAIRS, TIMETABLE_KEY, WEEK_LABEL,
  anchorFor, buildICS, classesOn, layoutDay, nowStatus, parityOf, scheduleText, todaysClasses, validateClass,
  type ClassEntry, type ClassKind, type ColorKey, type Parity, type WeekSel,
} from "@/lib/toolkit/timetable";
import {
  EmptyState, Field, FormError, ConfirmButton, Notice, Panel, Segmented, Skeleton, ToolHeader, fieldCls, useNotice,
} from "./ui";

const HOUR_PX = 56;
const SHARE_URL = "https://talaba.uz/tools/timetable";

export default function TimetableApp() {
  const tool = toolById("timetable");
  const hydrated = useHydrated();
  const now = useNow(30_000);
  const [data, setData] = useLocalStore(TIMETABLE_KEY, EMPTY_TIMETABLE);
  const [notice, flash] = useNotice();

  const [editing, setEditing] = useState<ClassEntry | "new" | null>(null);
  const [view, setView] = useState<"week" | "day">("week");
  const [viewParity, setViewParity] = useState<Parity | null>(null); // null = follow the current week
  const [selDay, setSelDay] = useState<number | null>(null);

  // Phones get the day agenda by default; the 6-column grid is too tight there.
  useEffect(() => {
    if (window.matchMedia("(max-width: 639px)").matches) setView("day");
  }, []);

  const ready = hydrated && now !== null;
  const currentParity: Parity = now ? parityOf(now, data.anchor) : "odd";
  const parity = viewParity ?? currentParity;
  const todayIdx = now ? dayIndex(now) : 0;
  const day = selDay ?? todayIdx;
  const isCurrentWeek = parity === currentParity;

  const todayList = useMemo(() => (now ? todaysClasses(data, now) : []), [data, now]);
  const status = useMemo(() => (now ? nowStatus(todayList, now) : ({ state: "empty" } as const)), [todayList, now]);

  const visibleCount = data.classes.filter((c) => c.weeks === "all" || c.weeks === parity).length;
  const showSunday = data.classes.some((c) => c.day === 6);

  // ── mutations ──
  const save = (c: ClassEntry) =>
    setData((prev) => ({
      ...prev,
      classes: prev.classes.some((x) => x.id === c.id)
        ? prev.classes.map((x) => (x.id === c.id ? c : x))
        : [...prev.classes, c],
    }));
  const remove = (id: string) => setData((prev) => ({ ...prev, classes: prev.classes.filter((x) => x.id !== id) }));
  const flipCurrentWeek = () => {
    if (!now) return;
    setData((prev) => ({ ...prev, anchor: anchorFor(now, currentParity === "odd" ? "even" : "odd") }));
    setViewParity(null);
    flash(`Bu hafta endi ${currentParity === "odd" ? "juft" : "toq"} hafta deb belgilandi`);
  };

  // ── sharing ──
  const text = scheduleText(data, parity);
  const shareTelegram = () =>
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    flash("Jadval nusxalandi");
  };
  const downloadICS = () => {
    const blob = new Blob([buildICS(data, new Date())], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "talaba-dars-jadvali.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash("Kalendar fayli yuklandi — uni oching");
  };

  return (
    <>
      <ToolHeader
        tool={tool}
        actions={
          <>
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button variant="outline" disabled={data.classes.length === 0}>
                  <Share2 size={15} className="mr-2" /> Ulashish
                </Button>
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Content
                  align="end"
                  sideOffset={8}
                  className="z-[110] min-w-[230px] rounded-xl border border-border bg-card p-1.5 shadow-xl"
                >
                  {[
                    { icon: Send, label: "Telegramda ulashish", onSelect: shareTelegram },
                    { icon: Copy, label: "Matn sifatida nusxalash", onSelect: copyText },
                    { icon: CalendarPlus, label: "Kalendarga (.ics)", onSelect: downloadICS },
                  ].map(({ icon: I, label, onSelect }) => (
                    <Menu.Item
                      key={label}
                      onSelect={onSelect}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground outline-none data-[highlighted]:bg-accent"
                    >
                      <I size={15} className="text-muted-foreground" /> {label}
                    </Menu.Item>
                  ))}
                </Menu.Content>
              </Menu.Portal>
            </Menu.Root>
            <Button onClick={() => setEditing("new")}>
              <Plus size={16} className="mr-1.5" /> Dars qo&apos;shish
            </Button>
          </>
        }
      />

      {!ready ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Now / next ── */}
          <NowCard
            status={status}
            now={now}
            total={data.classes.length}
            parity={currentParity}
            hasAnchor={!!data.anchor}
            onFlip={flipCurrentWeek}
            onConfirm={() => now && setData((p) => ({ ...p, anchor: anchorFor(now, currentParity) }))}
          />

          {data.classes.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Jadvalingiz hali bo'sh"
              text="Darslaringizni bir marta kiriting — keyin har kuni hozirgi va keyingi darsingiz ko'rinib turadi. Telegramga ulashish va kalendarga qo'shish ham mumkin."
              action={
                <Button onClick={() => setEditing("new")}>
                  <Plus size={16} className="mr-1.5" /> Birinchi darsni qo&apos;shish
                </Button>
              }
            />
          ) : (
            <>
              {/* ── Controls ── */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Segmented<Parity>
                  label="Hafta turi"
                  value={parity}
                  onChange={(v) => setViewParity(v === currentParity ? null : v)}
                  options={[
                    { value: "odd", label: <>Toq hafta{currentParity === "odd" && <Dot />}</> },
                    { value: "even", label: <>Juft hafta{currentParity === "even" && <Dot />}</> },
                  ]}
                />
                <Segmented<"week" | "day">
                  label="Ko'rinish"
                  size="sm"
                  value={view}
                  onChange={setView}
                  options={[
                    { value: "week", label: "Hafta" },
                    { value: "day", label: "Kun" },
                  ]}
                />
              </div>

              {view === "week" ? (
                <WeekGrid
                  data={data}
                  parity={parity}
                  now={now}
                  isCurrentWeek={isCurrentWeek}
                  showSunday={showSunday}
                  onPick={setEditing}
                />
              ) : (
                <DayAgenda
                  data={data}
                  parity={parity}
                  day={day}
                  setDay={setSelDay}
                  now={now}
                  isCurrentWeek={isCurrentWeek}
                  showSunday={showSunday}
                  onPick={setEditing}
                  onAdd={() => setEditing("new")}
                />
              )}

              {visibleCount === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  {parity === "odd" ? "Toq" : "Juft"} haftada darslar yo&apos;q.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {editing && (
        <ClassDialog
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          defaultDay={view === "day" ? day : todayIdx}
          existing={data.classes}
          onClose={() => setEditing(null)}
          onSave={(c) => {
            save(c);
            setEditing(null);
            flash("Saqlandi");
          }}
          onDelete={(id) => {
            remove(id);
            setEditing(null);
            flash("Dars o'chirildi");
          }}
        />
      )}
      <Notice text={notice} />
    </>
  );
}

const Dot = () => <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" title="Hozirgi hafta" />;

// ─────────────────────────────────────────────────────────────────────────
// Now / next banner
// ─────────────────────────────────────────────────────────────────────────

function NowCard({
  status, now, total, parity, hasAnchor, onFlip, onConfirm,
}: {
  status: ReturnType<typeof nowStatus>;
  now: Date | null;
  total: number;
  parity: Parity;
  hasAnchor: boolean;
  onFlip: () => void;
  onConfirm: () => void;
}) {
  let badge = "Bugun";
  let title = "";
  let sub = "";
  let accent = "from-slate-500/10 to-slate-500/0";
  if (status.state === "during") {
    badge = "Hozir dars";
    title = status.cls.subject;
    sub = `${[status.cls.room, `${formatDuration(status.minsLeft)} qoldi`].filter(Boolean).join(" · ")}`;
    accent = "from-emerald-500/15 to-emerald-500/0";
  } else if (status.state === "next") {
    badge = "Keyingi dars";
    title = status.cls.subject;
    sub = `${formatDuration(status.minsUntil)}dan keyin · ${status.cls.start}${status.cls.room ? ` · ${status.cls.room}` : ""}`;
    accent = "from-blue-500/15 to-blue-500/0";
  } else if (status.state === "done") {
    badge = "Bugun";
    title = "Bugungi darslar tugadi";
    sub = "Dam oling yoki vazifalar bilan shug'ullaning.";
    accent = "from-violet-500/15 to-violet-500/0";
  } else {
    title = total === 0 ? "Jadval bo'sh" : "Bugun dars yo'q";
    sub = total === 0 ? "Birinchi darsingizni qo'shing." : "Bugun bo'sh kun.";
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5")}>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", accent)} />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {badge}
            {now ? <span className="ml-2 font-normal normal-case tracking-normal">{formatLongDate(now)}</span> : null}
          </p>
          <p className="mt-1 truncate font-display text-xl font-bold text-foreground sm:text-2xl">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
            <Repeat size={12} className="text-muted-foreground" />
            Bu hafta: {parity === "odd" ? "toq" : "juft"}
          </span>
          {total > 0 && (
            <div className="flex items-center gap-3 text-[11px]">
              {!hasAnchor && (
                <button onClick={onConfirm} className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
                  Ha, to&apos;g&apos;ri
                </button>
              )}
              <button onClick={onFlip} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                {hasAnchor ? "Almashtirish" : "Aslida " + (parity === "odd" ? "juft" : "toq")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Week grid
// ─────────────────────────────────────────────────────────────────────────

function WeekGrid({
  data, parity, now, isCurrentWeek, showSunday, onPick,
}: {
  data: Parameters<typeof classesOn>[0];
  parity: Parity;
  now: Date | null;
  isCurrentWeek: boolean;
  showSunday: boolean;
  onPick: (c: ClassEntry) => void;
}) {
  const nDays = showSunday ? 7 : 6;
  const columns = Array.from({ length: nDays }, (_, d) => classesOn(data, d, parity));
  const all = columns.flat();

  let startH = 8;
  let endH = 18;
  if (all.length) {
    startH = Math.max(0, Math.min(8, Math.floor(Math.min(...all.map((c) => toMin(c.start))) / 60)));
    endH = Math.min(24, Math.max(18, Math.ceil(Math.max(...all.map((c) => toMin(c.end))) / 60)));
  }
  const hours = endH - startH;
  const bodyH = hours * HOUR_PX;

  const monday = now ? mondayOf(now) : null;
  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : -1;
  const todayIdx = now ? dayIndex(now) : -1;
  const nowTop = ((nowMin - startH * 60) / 60) * HOUR_PX;

  const cols = `44px repeat(${nDays}, minmax(0, 1fr))`;

  return (
    <Panel className="overflow-hidden p-0 sm:p-0">
      <div className="grid border-b border-border bg-muted/40" style={{ gridTemplateColumns: cols }}>
        <div />
        {Array.from({ length: nDays }, (_, d) => {
          const isToday = isCurrentWeek && d === todayIdx;
          const date = monday && isCurrentWeek ? new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + d) : null;
          return (
            <div key={d} className="py-2 text-center">
              <p className={cn("text-[11px] font-semibold uppercase tracking-wide", isToday ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
                {DAYS_SHORT[d]}
              </p>
              {date && (
                <p
                  className={cn(
                    "mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    isToday ? "bg-blue-600 text-white" : "text-foreground",
                  )}
                >
                  {date.getDate()}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid" style={{ gridTemplateColumns: cols }}>
        {/* time gutter */}
        <div className="relative" style={{ height: bodyH }}>
          {Array.from({ length: hours }, (_, i) => (
            <span
              key={i}
              className="absolute right-1.5 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
              style={{ top: i * HOUR_PX, display: i === 0 ? "none" : undefined }}
            >
              {fmtMin((startH + i) * 60)}
            </span>
          ))}
        </div>

        {columns.map((list, d) => {
          const isToday = isCurrentWeek && d === todayIdx;
          return (
            <div key={d} className={cn("relative border-l border-border/70", isToday && "bg-blue-500/[0.04]")} style={{ height: bodyH }}>
              {Array.from({ length: hours }, (_, i) => (
                <div key={i} className="absolute inset-x-0 border-t border-border/50" style={{ top: i * HOUR_PX }} />
              ))}

              {layoutDay(list).map(({ entry: c, lane, lanes }) => {
                const top = ((toMin(c.start) - startH * 60) / 60) * HOUR_PX;
                const h = Math.max(26, ((toMin(c.end) - toMin(c.start)) / 60) * HOUR_PX - 2);
                return (
                  <button
                    key={c.id}
                    onClick={() => onPick(c)}
                    aria-label={`${c.subject}, ${DAYS_FULL[c.day]} ${c.start}–${c.end}. Tahrirlash`}
                    className={cn(
                      "absolute overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-left text-[11px] leading-tight transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      COLORS[c.color].block,
                    )}
                    style={{
                      top: top + 1,
                      height: h,
                      left: `calc(${(lane / lanes) * 100}% + 2px)`,
                      width: `calc(${100 / lanes}% - 4px)`,
                    }}
                  >
                    <span className="block truncate font-semibold text-foreground">{c.subject}</span>
                    {h >= 44 && c.room ? <span className="block truncate text-muted-foreground">{c.room}</span> : null}
                    {h >= 58 ? (
                      <span className="block truncate text-muted-foreground tabular-nums">
                        {c.start}–{c.end}
                      </span>
                    ) : null}
                  </button>
                );
              })}

              {isToday && nowMin >= startH * 60 && nowMin <= endH * 60 && (
                <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: nowTop }}>
                  <span className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
                  <span className="h-px flex-1 bg-red-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Day agenda (phone-first)
// ─────────────────────────────────────────────────────────────────────────

function DayAgenda({
  data, parity, day, setDay, now, isCurrentWeek, showSunday, onPick, onAdd,
}: {
  data: Parameters<typeof classesOn>[0];
  parity: Parity;
  day: number;
  setDay: (d: number) => void;
  now: Date | null;
  isCurrentWeek: boolean;
  showSunday: boolean;
  onPick: (c: ClassEntry) => void;
  onAdd: () => void;
}) {
  const nDays = showSunday ? 7 : 6;
  const list = classesOn(data, day, parity);
  const todayIdx = now ? dayIndex(now) : -1;
  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : -1;

  return (
    <div className="space-y-3">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${nDays}, minmax(0, 1fr))` }}>
        {Array.from({ length: nDays }, (_, d) => {
          const has = classesOn(data, d, parity).length > 0;
          const active = d === day;
          const isToday = isCurrentWeek && d === todayIdx;
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              aria-pressed={active}
              aria-label={DAYS_FULL[d]}
              className={cn(
                "relative rounded-xl border py-2 text-center text-xs font-semibold transition-colors",
                active
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-border bg-card text-foreground hover:bg-accent",
              )}
            >
              {DAYS_SHORT[d]}
              <span
                className={cn(
                  "mx-auto mt-1 block h-1 w-1 rounded-full",
                  has ? (active ? "bg-white" : "bg-blue-500") : "bg-transparent",
                )}
              />
              {isToday && !active && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            </button>
          );
        })}
      </div>

      <h2 className="px-1 text-sm font-semibold text-foreground">
        {DAYS_FULL[day]}
        <span className="ml-2 font-normal text-muted-foreground">
          {list.length ? `${list.length} ta dars` : "dars yo'q"}
        </span>
      </h2>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">Bu kunga dars qo&apos;shilmagan.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onAdd}>
            <Plus size={14} className="mr-1" /> Dars qo&apos;shish
          </Button>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {list.map((c) => {
            const live = isCurrentWeek && day === todayIdx && toMin(c.start) <= nowMin && nowMin < toMin(c.end);
            return (
              <li key={c.id}>
                <button
                  onClick={() => onPick(c)}
                  className={cn(
                    "flex w-full items-stretch gap-3 rounded-2xl border bg-card p-3 text-left shadow-sm transition-colors hover:bg-accent/60",
                    live ? "border-emerald-500/60 ring-1 ring-emerald-500/30" : "border-border",
                  )}
                >
                  <div className="flex w-14 shrink-0 flex-col justify-between text-xs tabular-nums">
                    <span className="font-semibold text-foreground">{c.start}</span>
                    <span className="text-muted-foreground">{c.end}</span>
                  </div>
                  <span className={cn("w-1 shrink-0 rounded-full", COLORS[c.color].dot)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{c.subject}</p>
                      {live && (
                        <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          Hozir
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium">{KIND_LABEL[c.kind]}</span>
                      {c.room && (
                        <span className="inline-flex items-center gap-1"><MapPin size={11} />{c.room}</span>
                      )}
                      {c.teacher && (
                        <span className="inline-flex items-center gap-1"><UserRound size={11} />{c.teacher}</span>
                      )}
                      {c.weeks !== "all" && (
                        <span className="inline-flex items-center gap-1"><Repeat size={11} />{WEEK_LABEL[c.weeks]}</span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Add / edit dialog
// ─────────────────────────────────────────────────────────────────────────

function ClassDialog({
  initial, defaultDay, existing, onClose, onSave, onDelete,
}: {
  initial: ClassEntry | null;
  defaultDay: number;
  existing: ClassEntry[];
  onClose: () => void;
  onSave: (c: ClassEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [teacher, setTeacher] = useState(initial?.teacher ?? "");
  const [room, setRoom] = useState(initial?.room ?? "");
  const [day, setDay] = useState(initial?.day ?? defaultDay);
  const [start, setStart] = useState(initial?.start ?? "08:30");
  const [end, setEnd] = useState(initial?.end ?? "09:50");
  const [kind, setKind] = useState<ClassKind>(initial?.kind ?? "lecture");
  const [weeks, setWeeks] = useState<WeekSel>(initial?.weeks ?? "all");
  const [color, setColor] = useState<ColorKey>(initial?.color ?? COLOR_KEYS[existing.length % COLOR_KEYS.length]);
  const [colorTouched, setColorTouched] = useState(!!initial);
  const [error, setError] = useState<string | null>(null);

  const subjects = useMemo(() => Array.from(new Set(existing.map((c) => c.subject))), [existing]);

  const onSubject = (v: string) => {
    setSubject(v);
    // reuse the colour (and teacher) of an existing subject with the same name
    const match = existing.find((c) => c.subject.toLowerCase() === v.trim().toLowerCase());
    if (match && !colorTouched) setColor(match.color);
    if (match && !teacher && !initial) setTeacher(match.teacher ?? "");
  };

  const onStart = (v: string) => {
    setStart(v);
    if (toMin(end) <= toMin(v) && !Number.isNaN(toMin(v))) setEnd(fmtMin(Math.min(toMin(v) + 80, 23 * 60 + 59)));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateClass({ subject, start, end });
    if (err) return setError(err);
    onSave({
      id: initial?.id ?? uid(),
      subject: subject.trim(),
      teacher: teacher.trim() || undefined,
      room: room.trim() || undefined,
      day, start, end, kind, weeks, color,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={initial ? "Darsni tahrirlash" : "Yangi dars"} description="Dars vaqti, xonasi va hafta turini kiriting.">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Fan nomi *">
            <input
              autoFocus={!initial}
              list="tt-subjects"
              value={subject}
              onChange={(e) => onSubject(e.target.value)}
              placeholder="masalan, Oliy matematika"
              className={fieldCls}
              maxLength={80}
            />
            <datalist id="tt-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
          </Field>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Kun</span>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_SHORT.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={day === i}
                  aria-label={DAYS_FULL[i]}
                  onClick={() => setDay(i)}
                  className={cn(
                    "h-10 rounded-xl border text-xs font-semibold transition-colors",
                    day === i ? "border-blue-600 bg-blue-600 text-white" : "border-border bg-background text-foreground hover:bg-accent",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Boshlanishi">
                <input type="time" value={start} onChange={(e) => onStart(e.target.value)} className={fieldCls} />
              </Field>
              <Field label="Tugashi">
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={fieldCls} />
              </Field>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Namunaviy juftliklar:</span>
              {PAIRS.map((p) => (
                <button
                  key={p.n}
                  type="button"
                  title={`${p.start}–${p.end}`}
                  onClick={() => { setStart(p.start); setEnd(p.end); }}
                  className={cn(
                    "rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors",
                    start === p.start && end === p.end
                      ? "border-blue-600 bg-blue-600/10 text-blue-700 dark:text-blue-300"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {p.n}-juftlik
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Turi</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as ClassKind)} className={fieldCls}>
                {(Object.keys(KIND_LABEL) as ClassKind[]).map((k) => (
                  <option key={k} value={k}>{KIND_LABEL[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Qaysi haftalarda</span>
              <select value={weeks} onChange={(e) => setWeeks(e.target.value as WeekSel)} className={fieldCls}>
                {(Object.keys(WEEK_LABEL) as WeekSel[]).map((w) => (
                  <option key={w} value={w}>{WEEK_LABEL[w]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Xona">
              <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="masalan, 204-xona" className={fieldCls} maxLength={40} />
            </Field>
            <Field label="O'qituvchi">
              <input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="masalan, Karimov A." className={fieldCls} maxLength={60} />
            </Field>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Rang</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-label={COLORS[k].label}
                  aria-pressed={color === k}
                  onClick={() => { setColor(k); setColorTouched(true); }}
                  className={cn(
                    "h-8 w-8 rounded-full ring-offset-2 ring-offset-card transition-transform hover:scale-110",
                    COLORS[k].dot,
                    color === k && "ring-2 ring-foreground",
                  )}
                />
              ))}
            </div>
          </div>

          <FormError text={error} />

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
            {initial ? (
              <ConfirmButton onConfirm={() => onDelete(initial.id)}>O&apos;chirish</ConfirmButton>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                Bekor qilish
              </Button>
              <Button type="submit" className="flex-1 sm:flex-none">
                <Clock3 size={15} className="mr-1.5" /> Saqlash
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
