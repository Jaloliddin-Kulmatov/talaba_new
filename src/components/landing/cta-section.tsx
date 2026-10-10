"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, LayoutDashboard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { PLATFORM_STATS } from "@/lib/constants";

const ctaPoints = [
  "Barcha talabalar uchun bepul",
  "Universitet email orqali tasdiqlash",
  "Bank kartasi talab qilinmaydi",
  "AI yordamchi ham mavjud",
];

export default function CtaSection() {
  const { user } = useAuth();
  if (user) return null;

  const activeStudents =
    PLATFORM_STATS.find((s) => s.label === "Faol talabalar")?.value ?? "10,000+";

  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-emerald-500/10 p-10 sm:p-16 text-center">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs font-medium text-blue-700 dark:text-blue-300 mb-6">
              <Sparkles size={11} />
              {activeStudents} talaba allaqachon qo&apos;shildi
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
              Talabalik safaringiz
              <br />
              <span className="gradient-text">shu yerdan boshlanadi</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Bugun bepul hisob oching. Universitet hamjamiyatingizga qo&apos;shiling, ish toping
              va talabalik hayotingiz uchun AI yordamidan foydalaning.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Button size="xl" asChild className="w-full sm:w-auto">
                <Link href="/register">
                  Bepul hisob ochish
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild className="w-full sm:w-auto">
                <Link href="/community">
                  Klublarni ko&apos;rish
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {ctaPoints.map((point) => (
                <div key={point} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
