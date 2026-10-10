"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flame, Pause, Play, RotateCcw, SkipForward, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHydrated, useLocalStore } from "@/lib/store";
import { useNow } from "@/lib/toolkit/hooks";
import { toolById } from "@/lib/toolkit/tools";
import { DAYS_SHORT, dayIndex, uid } from "@/lib/toolkit/time";
import { EMPTY_TIMETABLE, TIMETABLE_KEY } from "@/lib/toolkit/timetable";
import {
  EMPTY_FOCUS, FOCUS_KEY, FOCUS_TIMER_KEY, INITIAL_TIMER, MODE_LABEL, PRESETS,
  fmtClock, fmtMinutes, lastDays, minutesOn, modeMs, presetById, streak,
  type FocusMode, type TimerState,
} from "@/lib/toolkit/focus";
import { Notice, Panel, Segmented, Skeleton, ToolHeader, fieldCls, useNotice } from "./ui";

const MODE_COLOR: Record<FocusMode, { stroke: string; text: string; bg: string }> = {
  focus: { stroke: "stroke-emerald-500", text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-600 hover:bg-emerald-700" },
  short: { stroke: "stroke-blue-500", text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-600 hover:bg-blue-700" },
  long: { stroke: "stroke-violet-500", text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-600 hover:bg-violet-700" },
};

export default function FocusApp() {
  const tool = toolById("focus");
  const hydrated = useHydrated();
  const now = useNow(60_000);
  const [log, setLog] = useLocalStore(FOCUS_KEY, EMPTY_FOCUS);
  const [timer, setTimer] = useLocalStore(FOCUS_TIMER_KEY, INITIAL_TIMER);
  const [timetable] = useLocalStore(TIMETABLE_KEY, EMPTY_TIMETABLE);
  const [notice, flash] = useNotice();

  const preset = presetById(timer.presetId);
  const running = timer.endAt !== null;

  // High-resolution clock only while running; derived from the end timestamp so
  // background-tab throttling can never make the countdown drift.
  const [, forceRender] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => forceRender((n) => n + 1), 250);
    return () => window.clearInterval(id);
  }, [running]);

  // Read the clock at render time so the first frame after Start is never stale.
  const remaining = running ? Math.max(0, (timer.endAt as number) - Date.now()) : timer.remainingMs;
  const total = modeMs(preset, timer.mode);

  // ── audio (unlocked on the Start click so the end-of-session beep is allowed) ──
  const audio = useRef<AudioContext | null>(null);
  const unlockAudio = () => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx && !audio.current) audio.current = new Ctx();
      void audio.current?.resume();
    } catch { /* audio is optional */ }
  };
  const beep = useCallback(() => {
    const ctx = audio.current;
    if (!ctx) return;
    [0, 0.28, 0.56].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.22);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.25);
    });
  }, []);

  // ── transitions ──
  const nextMode = useCallback((t: TimerState): { mode: FocusMode; cycle: number } => {
    if (t.mode !== "focus") return { mode: "focus", cycle: t.cycle };
    const cycle = t.cycle + 1;
    return { mode: cycle % 4 === 0 ? "long" : "short", cycle };
  }, []);

  const logSession = useCallback(
    (minutes: number, subject: string) => {
      if (minutes < 1) return;
      setLog((prev) => ({
        sessions: [...prev.sessions, { id: uid(), at: new Date().toISOString(), minutes, subject: subject.trim() || undefined }].slice(-500),
      }));
    },
    [setLog],
  );

  // Finish when the countdown hits zero.
  const finishing = useRef<number | null>(null);
  useEffect(() => {
    if (!running || remaining > 0) return;
    const endAt = timer.endAt as number;
    if (finishing.current === endAt) return; // already handled
    finishing.current = endAt;

    if (timer.mode === "focus") logSession(preset.focus, timer.subject);
    const nxt = nextMode(timer);
    setTimer({ ...timer, mode: nxt.mode, cycle: nxt.cycle, endAt: null, remainingMs: modeMs(preset, nxt.mode) });
    beep();
    flash(timer.mode === "focus" ? `${preset.focus} daqiqalik sessiya yakunlandi 🎉` : "Tanaffus tugadi — davom etamiz");
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([200, 100, 200]);
  }, [running, remaining, timer, preset, logSession, nextMode, setTimer, beep, flash]);

  // Tab title shows the countdown.
  useEffect(() => {
    if (!running) return;
    const prev = document.title;
    document.title = `${fmtClock(remaining)} · ${MODE_LABEL[timer.mode]} | TALABA`;
    return () => { document.title = prev; };
  }, [running, remaining, timer.mode]);

  // ── controls ──
  const start = () => {
    unlockAudio();
    setTimer({ ...timer, endAt: Date.now() + timer.remainingMs });
  };
  const pause = () => setTimer({ ...timer, endAt: null, remainingMs: Math.max(1000, (timer.endAt as number) - Date.now()) });
  const reset = () => setTimer({ ...timer, endAt: null, remainingMs: total });
  const stopEarly = () => {
    // log the time actually spent, then go to a fresh focus block
    const spent = Math.floor((total - remaining) / 60_000);
    logSession(spent, timer.subject);
    flash(spent >= 1 ? `${spent} daqiqa saqlandi` : "1 daqiqadan kam — saqlanmadi");
    setTimer({ ...timer, endAt: null, remainingMs: total });
  };
  const setMode = (mode: FocusMode) => setTimer({ ...timer, mode, endAt: null, remainingMs: modeMs(preset, mode) });
  // Skipping never counts as a completed session, so the cycle counter is untouched.
  const skip = () => setMode(timer.mode === "focus" ? "short" : "focus");
  const setPreset = (id: string) => {
    const p = presetById(id);
    setTimer({ ...timer, presetId: id, endAt: null, remainingMs: modeMs(p, timer.mode) });
  };

  // ── stats ──
  const stats = useMemo(() => {
    if (!now) return null;
    const week = lastDays(log, now, 7);
    return {
      today: minutesOn(log, now),
      week,
      weekTotal: week.reduce((s, d) => s + d.minutes, 0),
      streak: streak(log, now),
      recent: [...log.sessions].reverse().slice(0, 6),
    };
  }, [log, now]);

  const subjects = useMemo(() => Array.from(new Set(timetable.classes.map((c) => c.subject))), [timetable]);

  const pct = total > 0 ? 1 - remaining / total : 0;
  const R = 108;
  const C = 2 * Math.PI * R;
  const color = MODE_COLOR[timer.mode];
  const paused = !running && timer.remainingMs < total;

  return (
    <>
      <ToolHeader tool={tool} />

      {!hydrated ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-[460px]" />
          <Skeleton className="h-[460px]" />
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
          {/* ── Timer ── */}
          <Panel className="flex flex-col items-center py-6 sm:py-8">
            <Segmented<FocusMode>
              label="Rejim"
              value={timer.mode}
              onChange={setMode}
              options={(Object.keys(MODE_LABEL) as FocusMode[]).map((m) => ({ value: m, label: MODE_LABEL[m] }))}
              className={cn(running && "pointer-events-none opacity-50")}
            />

            <div className="relative mt-6 h-[260px] w-[260px] sm:h-[280px] sm:w-[280px]">
              <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90" aria-hidden>
                <circle cx="120" cy="120" r={R} fill="none" strokeWidth="10" className="stroke-muted" />
                <circle
                  cx="120" cy="120" r={R} fill="none" strokeWidth="10" strokeLinecap="round"
                  className={cn("transition-[stroke-dashoffset] duration-300 ease-linear", color.stroke)}
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - Math.max(0, Math.min(1, pct)))}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  role="timer"
                  aria-live="off"
                  className="font-display text-6xl font-extrabold tabular-nums tracking-tight text-foreground sm:text-[68px]"
                >
                  {fmtClock(remaining)}
                </span>
                <span className={cn("mt-1 text-sm font-semibold", color.text)}>
                  {running ? MODE_LABEL[timer.mode] : paused ? "To'xtatilgan" : "Tayyor"}
                </span>
                <span className="mt-2 flex gap-1.5" role="img" aria-label={`Joriy to'plam: ${timer.cycle % 4} / 4`}>
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i < timer.cycle % 4 ? "bg-emerald-500" : "bg-muted-foreground/25")} />
                  ))}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={reset}
                aria-label="Qayta boshlash"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={running ? pause : start}
                className={cn("flex h-16 min-w-[160px] items-center justify-center gap-2 rounded-full px-8 text-base font-semibold text-white shadow-lg transition-all active:scale-95", color.bg)}
              >
                {running ? <><Pause size={20} /> To&apos;xtatish</> : <><Play size={20} className="ml-0.5" /> {paused ? "Davom etish" : "Boshlash"}</>}
              </button>
              {timer.mode === "focus" && (running || paused) ? (
                <button
                  onClick={stopEarly}
                  aria-label="Tugatish va vaqtni saqlash"
                  title="Tugatish va o'qilgan vaqtni saqlash"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Square size={16} />
                </button>
              ) : (
                <button
                  onClick={skip}
                  aria-label="Keyingi bosqich"
                  disabled={running}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                >
                  <SkipForward size={18} />
                </button>
              )}
            </div>

            <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center">
              <input
                list="fo-subjects"
                value={timer.subject}
                onChange={(e) => setTimer({ ...timer, subject: e.target.value })}
                placeholder="Nima ustida ishlayapsiz? (ixtiyoriy)"
                aria-label="Fan"
                className={cn(fieldCls, "flex-1")}
                maxLength={60}
              />
              <datalist id="fo-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
              <Segmented
                size="sm"
                label="Vaqt oralig'i"
                value={preset.id}
                onChange={setPreset}
                options={PRESETS.map((p) => ({ value: p.id, label: p.label }))}
                className={cn(running && "pointer-events-none opacity-50")}
              />
            </div>
          </Panel>

          {/* ── Stats ── */}
          <div className="space-y-4">
            {!stats ? (
              <Skeleton className="h-64" />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Tile label="Bugun" value={fmtMinutes(stats.today)} />
                  <Tile label="7 kun" value={fmtMinutes(stats.weekTotal)} />
                  <Tile
                    label="Ketma-ket"
                    value={`${stats.streak} kun`}
                    icon={stats.streak > 0 ? <Flame size={13} className="text-orange-500" /> : undefined}
                  />
                </div>

                <Panel>
                  <h2 className="mb-3 text-sm font-semibold text-foreground">So&apos;nggi 7 kun</h2>
                  <WeekBars days={stats.week} />
                </Panel>

                <Panel>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground">So&apos;nggi sessiyalar</h2>
                    {log.sessions.length > 0 && (
                      <button
                        onClick={() => setLog({ sessions: [] })}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600"
                        title="Tarixni tozalash"
                      >
                        <Trash2 size={12} /> Tozalash
                      </button>
                    )}
                  </div>
                  {stats.recent.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Birinchi sessiyani boshlang.</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {stats.recent.map((s) => {
                        const d = new Date(s.at);
                        return (
                          <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                            <span className="min-w-0 truncate text-foreground">{s.subject || "Fan ko'rsatilmagan"}</span>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {DAYS_SHORT[dayIndex(d)]} {String(d.getHours()).padStart(2, "0")}:{String(d.getMinutes()).padStart(2, "0")} · {fmtMinutes(s.minutes)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Panel>
              </>
            )}
          </div>
        </div>
      )}
      <Notice text={notice} />
    </>
  );
}

function Tile({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-3 text-center shadow-sm">
      <p className="flex items-center justify-center gap-1 text-lg font-bold tabular-nums text-foreground">
        {icon}
        {value}
      </p>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function WeekBars({ days }: { days: { date: Date; minutes: number }[] }) {
  const max = Math.max(60, ...days.map((d) => d.minutes));
  return (
    <div className="flex h-32 items-end gap-2">
      {days.map((d, i) => {
        const isToday = i === days.length - 1;
        return (
          <div key={d.date.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[10px] tabular-nums text-muted-foreground">{d.minutes > 0 ? d.minutes : ""}</span>
            <div
              className={cn("w-full rounded-t-lg transition-all", isToday ? "bg-emerald-500" : "bg-emerald-500/35", d.minutes === 0 && "bg-muted")}
              style={{ height: `${Math.max(d.minutes === 0 ? 3 : 8, (d.minutes / max) * 100)}%` }}
              title={`${d.minutes} daqiqa`}
            />
            <span className={cn("text-[10px] font-medium", isToday ? "text-foreground" : "text-muted-foreground")}>
              {DAYS_SHORT[dayIndex(d.date)]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
