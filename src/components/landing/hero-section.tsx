"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Users, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import MemberCount from "@/components/landing/member-count";

export default function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden mesh-gradient">
      <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[480px] h-[480px] rounded-full bg-blue-600/8 dark:bg-blue-600/12 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[360px] h-[360px] rounded-full bg-violet-600/6 dark:bg-violet-600/10 blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center py-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/8 text-xs font-medium text-blue-600 dark:text-blue-400 mb-8 animate-fade-in">
          <Sparkles size={12} />
          Hozircha O'zbekiston universitetlaridagi talabalarga xizmat ko'rsatmoqda
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-extrabold tracking-tight leading-[1.06] mb-6 animate-slide-up">
          <span className="text-foreground">O'zbek talabalari uchun</span>
          <br />
          <span className="gradient-text">yagona</span>
          <br />
          <span className="text-foreground">platforma</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Hamjamiyat, ish e&apos;lonlari, qabul va DTM bo&apos;yicha yo&apos;l-yo&apos;riq, turargoh, stipendiya
          va AI yordamchi — kerakli hamma narsa bir joyda.
        </p>

        {/* CTAs — change based on auth state */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          {user ? (
            <>
              <Button size="xl" asChild className="w-full sm:w-auto shadow-[0_4px_24px_rgba(37,99,235,0.4)] hover:shadow-[0_4px_32px_rgba(37,99,235,0.6)]">
                <Link href="/dashboard">
                  <LayoutDashboard size={17} className="mr-2" />
                  Boshqaruv paneliga o&apos;tish
                  <ArrowRight size={17} className="ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild className="w-full sm:w-auto">
                <Link href="/community">
                  <Users size={16} className="mr-2 text-blue-600" />
                  Klublarni ko&apos;rish
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button size="xl" asChild className="w-full sm:w-auto shadow-[0_4px_24px_rgba(37,99,235,0.4)] hover:shadow-[0_4px_32px_rgba(37,99,235,0.6)]">
                <Link href="/register">
                  Bepul boshlash
                  <ArrowRight size={17} className="ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild className="w-full sm:w-auto">
                <Link href="/community">
                  <Users size={16} className="mr-2 text-blue-600" />
                  Klublarni ko&apos;rish
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Sign-in nudge for logged-out users */}
        {!user && (
          <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Hisobingiz bormi?{" "}
            <Link href="/login?force=1" className="text-blue-500 hover:text-blue-400 font-semibold underline underline-offset-2 transition-colors">
              Kirish
            </Link>
          </p>
        )}

        {/* Live member count */}
        <MemberCount />

        {/* NUU badge */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Badge variant="violet" className="text-xs px-3 py-1 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            O&apos;zbekiston Milliy universiteti (NUU)dan boshlanmoqda · Toshkent, O&apos;zbekiston
          </Badge>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
