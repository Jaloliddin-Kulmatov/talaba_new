"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import { Briefcase, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "Part-time ish topish",
    color: "text-orange-500 dark:text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    items: [
      {
        q: "Qayerdan qisman bandlik (part-time) ish topish mumkin?",
        a: "TALABA'ning Ishlar bo'limida talabalar jadvaliga mos ish e'lonlarini topishingiz mumkin — schedule_compatible belgisi qaysi ta'lim shakli (kunduzgi/sirtqi/kechki) uchun qulay ekanini ko'rsatadi.",
      },
      {
        q: "Kunduzgi bo'lim talabasi bo'lsam, ishlashim mumkinmi?",
        a: "Ha, ko'plab kompaniyalar moslashuvchan yoki kechki grafikda ishlashni taklif qiladi. Lekin dars jadvalingiz bilan to'qnashmasligiga ishonch hosil qiling — ba'zi hollarda dekanatdan ruxsatnoma olish talab qilinishi mumkin.",
      },
    ]
  },
  {
    title: "Mehnat huquqlari",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    items: [
      {
        q: "Mehnat shartnomasi tuzish shartmi?",
        a: "Ha, rasmiy ishga joylashishda yozma mehnat shartnomasi tuzilishi kerak — bu maosh, ish vaqti va huquqlaringizni himoya qiladi. Og'zaki kelishuvlarga tayanmang.",
      },
      {
        q: "Maosh to'lanmasa yoki huquqlarim buzilsa nima qilishim kerak?",
        a: "Avvalo ish beruvchi bilan yozma ravishda muloqot qiling. Muammo hal bo'lmasa, Mehnat vazirligining mehnat.uz portali orqali murojaat qilish yoki tegishli davlat mehnat inspeksiyasiga shikoyat berish mumkin.",
      },
      {
        q: "Amaliyot (stajirovka) ham rasmiylashtiriladimi?",
        a: "Ko'p hollarda amaliyot universitet bilan kelishilgan holda amalga oshiriladi va alohida amaliyot shartnomasi yoki universitet yo'llanmasi asosida rasmiylashtiriladi. Aniq tartibni kafedra yoki amaliyot bo'limidan so'rang.",
      },
    ]
  },
];

export default function ParttimePage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-orange-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <Link href="/support" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft size={13} /> Yordam bo'limiga qaytish
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                <Briefcase size={18} className="text-orange-500" />
              </div>
              <div>
                <Badge variant="warning" className="text-[10px] mb-1">3 ta qo'llanma</Badge>
                <h1 className="text-2xl font-bold text-foreground">Part-time ish va mehnat huquqlari</h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-2">Qisman bandlik, mehnat shartnomasi va huquqlaringiz haqida.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">
            {sections.map(section => (
              <div key={section.title} className={`rounded-2xl border ${section.border} ${section.bg} overflow-hidden`}>
                <div className="px-5 py-3.5 border-b border-inherit">
                  <h2 className={`text-sm font-bold ${section.color}`}>{section.title}</h2>
                </div>
                <div className="divide-y divide-border/50">
                  {section.items.map(item => (
                    <div key={item.q} className="bg-card/60">
                      <button
                        className="w-full flex items-center justify-between px-5 py-3.5 text-left gap-3 hover:bg-muted/30 transition-colors"
                        onClick={() => setOpen(open === item.q ? null : item.q)}
                      >
                        <span className="text-sm font-medium text-foreground">{item.q}</span>
                        <ChevronDown size={15} className={`text-muted-foreground shrink-0 transition-transform ${open === item.q ? "rotate-180" : ""}`} />
                      </button>
                      {open === item.q && (
                        <div className="px-5 pb-4">
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/70 leading-relaxed">
                <strong className="text-foreground">Eslatma:</strong> Mehnat qonunchiligi o'zgarishi mumkin. Aniq va joriy ma'lumot uchun mehnat.uz rasmiy portaliga murojaat qiling.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <CheckCircle2 size={16} className="text-emerald-500 mb-2" />
              <h3 className="text-xs font-semibold text-foreground mb-1">Ish qidiryapsizmi?</h3>
              <p className="text-xs text-muted-foreground mb-3">Talaba jadvaliga mos e'lonlarni Ishlar bo'limida ko'ring.</p>
              <Link href="/jobs" className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 hover:bg-emerald-500/15 transition-colors">
                Ishlarga o'tish <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
