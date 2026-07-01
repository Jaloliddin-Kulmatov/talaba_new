"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import { BookOpen, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "IELTS / TOEFL",
    color: "text-cyan-500 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    items: [
      {
        q: "IELTS/TOEFL nima uchun kerak?",
        a: "Bu sertifikatlar xalqaro almashinuv dasturlari, qo'shimcha stipendiyalar, ba'zi qo'shma ta'lim dasturlariga kirish va yuqori maoshli part-time ish topishda katta afzallik beradi.",
      },
      {
        q: "Qanday tayyorlanish mumkin?",
        a: "Universitetlarning til markazlarida tayyorgarlik kurslari mavjud. Bundan tashqari, British Council, IELTS Liz kabi bepul onlayn resurslar orqali mustaqil tayyorlanish ham mumkin. Muntazam mashq qilish eng muhim omil hisoblanadi.",
      },
      {
        q: "Test qayerda va qachon topshiriladi?",
        a: "IELTS va TOEFL testlari Toshkentdagi rasmiy test markazlarida muntazam ravishda o'tkaziladi. Ro'yxatdan o'tish va aniq sanalarni tegishli test provayderining rasmiy sayti orqali tekshiring.",
      },
    ]
  },
  {
    title: "Boshqa ko'nikmalar",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    items: [
      {
        q: "Dasturlash yoki IT ko'nikmalarini qayerdan o'rganish mumkin?",
        a: "Ko'plab universitetlarda dasturlash klublari faoliyat yuritadi (Klublar bo'limidan qidiring). Bundan tashqari IT Park va boshqa tashkilotlar bepul yoki arzon onlayn kurslarni muntazam e'lon qiladi.",
      },
    ]
  },
];

export default function TilPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-cyan-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <Link href="/support" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft size={13} /> Yordam bo'limiga qaytish
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                <BookOpen size={18} className="text-cyan-500" />
              </div>
              <div>
                <Badge variant="cyan" className="text-[10px] mb-1">3 ta qo'llanma</Badge>
                <h1 className="text-2xl font-bold text-foreground">Til va ko'nikmalar</h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-2">IELTS/TOEFL tayyorgarligi va boshqa foydali ko'nikmalar.</p>
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
                <strong className="text-foreground">Eslatma:</strong> Test narxlari va topshirish sanalari o'zgarib turadi — har doim rasmiy test provayderi saytidan tasdiqlang.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <CheckCircle2 size={16} className="text-emerald-500 mb-2" />
              <h3 className="text-xs font-semibold text-foreground mb-1">Shaxsiy yordam kerakmi?</h3>
              <p className="text-xs text-muted-foreground mb-3">AI yordamchidan so'rang yoki FAQ bo'limini ko'ring.</p>
              <Link href="/support/faq" className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:bg-emerald-500/15 transition-colors">
                FAQ'ga o'tish <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
