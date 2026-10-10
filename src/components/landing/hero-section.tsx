"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Calculator, LayoutDashboard, Sparkles, Timer, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import MemberCount from "@/components/landing/member-count";

export default function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden mesh-gradient pt-28 pb-16 lg:pt-36 lg:pb-24">
      <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[480px] h-[480px] rounded-full bg-blue-600/10 dark:bg-blue-600/12 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[360px] h-[360px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 blur-[90px] pointer-events-none" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        {/* ── Copy ── */}
        <div className="text-center lg:text-left">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-700 animate-fade-in dark:text-blue-300">
            <Sparkles size={12} />
            Hozircha O&apos;zbekiston universitetlaridagi talabalarga xizmat ko&apos;rsatmoqda
          </div>

          <h1 className="font-display text-[40px] font-extrabold leading-[1.08] tracking-tight animate-slide-up sm:text-6xl lg:text-[64px]">
            <span className="text-foreground">O&apos;zbek talabalari uchun</span>
            <br />
            <span className="gradient-text">yagona platforma</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground animate-slide-up lg:mx-0"
            style={{ animationDelay: "0.1s" }}
          >
            Dars jadvali, GPA, vazifalar va davomat — ro&apos;yxatdan o&apos;tmasdan. Hamjamiyat, ish va amaliyot,
            qabul/DTM, turargoh va AI yordamchi — hammasi bir joyda.
          </p>

          <div
            className="mt-9 flex flex-col items-center gap-3 animate-slide-up sm:flex-row lg:justify-start justify-center"
            style={{ animationDelay: "0.15s" }}
          >
            {user ? (
              <>
                <Button size="xl" asChild className="w-full sm:w-auto">
                  <Link href="/dashboard">
                    <LayoutDashboard size={17} className="mr-2" />
                    Boshqaruv paneliga o&apos;tish
                    <ArrowRight size={17} className="ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild className="w-full sm:w-auto">
                  <Link href="/tools">Asboblarni ochish</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="xl" asChild className="w-full sm:w-auto">
                  <Link href="/register">
                    Bepul boshlash
                    <ArrowRight size={17} className="ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild className="w-full sm:w-auto">
                  <Link href="/tools">
                    <CalendarDays size={16} className="mr-2 text-blue-600" />
                    Asboblarni sinab ko&apos;rish
                  </Link>
                </Button>
              </>
            )}
          </div>

          <div
            className="mt-6 flex flex-wrap items-center justify-center gap-2 animate-fade-in lg:justify-start"
            style={{ animationDelay: "0.25s" }}
          >
            <span className="text-xs text-muted-foreground">Ro&apos;yxatdan o&apos;tmasdan:</span>
            {[
              { href: "/tools/timetable", icon: CalendarDays, label: "Dars jadvali" },
              { href: "/tools/gpa", icon: Calculator, label: "GPA" },
              { href: "/tools/focus", icon: Timer, label: "Fokus taymer" },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-blue-500/40 hover:bg-accent"
              >
                <Icon size={12} className="text-blue-600 dark:text-blue-400" />
                {label}
              </Link>
            ))}
          </div>

          {!user && (
            <p className="mt-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
              Hisobingiz bormi?{" "}
              <Link href="/login?force=1" className="font-semibold text-blue-600 underline underline-offset-2 transition-colors hover:text-blue-500 dark:text-blue-400">
                Kirish
              </Link>
            </p>
          )}

          <MemberCount />

          <div className="mt-6 animate-fade-in lg:text-left" style={{ animationDelay: "0.4s" }}>
            <Badge variant="violet" className="gap-1.5 px-3 py-1 text-xs">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              O&apos;zbekiston Milliy universiteti (NUU)dan boshlanmoqda · Toshkent
            </Badge>
          </div>
        </div>

        {/* ── Product preview ── */}
        <HeroPreview />
      </div>
    </section>
  );
}

/** Illustrative mock of the app — sample data, labelled as such. */
function HeroPreview() {
  const classes = [
    { time: "08:30", end: "09:50", name: "Oliy matematika", room: "204-xona", bar: "bg-blue-500", live: true },
    { time: "10:00", end: "11:20", name: "Ingliz tili", room: "117-xona", bar: "bg-emerald-500" },
    { time: "11:30", end: "12:50", name: "Dasturlash asoslari", room: "Lab 3", bar: "bg-violet-500" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[420px] animate-fade-in" style={{ animationDelay: "0.2s" }} aria-hidden>
      {/* main card */}
      <div className="relative rounded-3xl border border-border bg-card p-5 shadow-[0_24px_60px_-20px_rgba(37,99,235,0.35)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bugun</p>
            <p className="font-display text-lg font-bold text-foreground">payshanba, 9-oktabr</p>
          </div>
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-medium text-foreground">Toq hafta</span>
        </div>
        <ul className="space-y-2.5">
          {classes.map((c) => (
            <li
              key={c.name}
              className={`flex items-stretch gap-3 rounded-2xl border p-3 ${c.live ? "border-emerald-500/50 bg-emerald-500/[0.06]" : "border-border bg-background"}`}
            >
              <div className="flex w-12 shrink-0 flex-col justify-between text-[11px] tabular-nums">
                <span className="font-semibold text-foreground">{c.time}</span>
                <span className="text-muted-foreground">{c.end}</span>
              </div>
              <span className={`w-1 shrink-0 rounded-full ${c.bar}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                  {c.live && (
                    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Hozir</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.room}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right text-[10px] text-muted-foreground/70">Namuna ma&apos;lumotlar</p>
      </div>

      {/* floating: GPA */}
      <div className="absolute -right-2 -top-8 animate-float rounded-2xl border border-border bg-card px-4 py-3 shadow-card sm:-right-8">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">GPA</p>
        <p className="font-display text-2xl font-extrabold tabular-nums text-violet-600 dark:text-violet-400">
          4.62<span className="text-xs font-semibold text-muted-foreground"> / 5</span>
        </p>
      </div>

      {/* floating: exam countdown */}
      <div className="absolute -bottom-7 -left-2 flex animate-float items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card [animation-delay:1.5s] sm:-left-8">
        <span className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
          <span className="font-display text-lg font-extrabold leading-none">12</span>
          <span className="text-[8px] font-semibold uppercase">kun</span>
        </span>
        <div>
          <p className="text-xs font-semibold text-foreground">Yakuniy imtihon</p>
          <p className="text-[11px] text-muted-foreground">Fizika</p>
        </div>
      </div>

      {/* floating: focus */}
      <div className="absolute -bottom-3 -right-2 hidden animate-float items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5 shadow-card [animation-delay:3s] sm:flex sm:-right-6">
        <Timer size={16} className="text-emerald-600 dark:text-emerald-400" />
        <span className="font-display text-base font-bold tabular-nums text-foreground">25:00</span>
      </div>
    </div>
  );
}
