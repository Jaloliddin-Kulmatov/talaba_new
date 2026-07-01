"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import { Shield, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "Harbiy hisobga qo'yish",
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    items: [
      {
        q: "Harbiy hisobga qo'yish uchun qayerga murojaat qilish kerak?",
        a: "Yashash manzilingiz bo'yicha tuman (shahar) harbiy komissariatiga o'zingiz murojaat qilishingiz kerak. Universitetga qabul qilingandan so'ng buni imkon qadar tezroq amalga oshirish tavsiya etiladi.",
      },
      {
        q: "Qanday hujjatlar kerak bo'ladi?",
        a: "Odatda: pasport, harbiy guvohnoma (agar avval ro'yxatdan o'tgan bo'lsangiz) va universitetga qabul qilinganligingiz to'g'risidagi ma'lumotnoma. Ba'zi hollarda fotosuratlar ham talab qilinishi mumkin.",
      },
      {
        q: "Viloyatdan Toshkentga (yoki boshqa shaharga) ko'chib o'tsam nima qilishim kerak?",
        a: "Yashash manzilingiz o'zgargach, harbiy hisobni yangi manzil bo'yicha qayta rasmiylashtirishingiz kerak bo'ladi — bu haqda avvalgi va yangi harbiy komissariatga murojaat qiling.",
      },
    ]
  },
  {
    title: "Talabalar uchun imtiyozlar",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    items: [
      {
        q: "Kunduzgi bo'limda o'qiyotgan talabalar uchun qanday imtiyozlar mavjud?",
        a: "Davlat tomonidan tasdiqlangan oliy ta'lim muassasasida kunduzgi bo'limda tahsil olayotgan talabalarga muddatli harbiy xizmatga chaqiruv bo'yicha ma'lum imtiyoz/kechiktirish tartibi qo'llanilishi mumkin. Aniq shartlar qonunchilikka bog'liq bo'lgani uchun harbiy komissariatdan tasdiqlab oling.",
      },
      {
        q: "Hujjatlarni kim tekshiradi va qachon?",
        a: "Universitet odatda birinchi kursda talabalarning harbiy hisobga qo'yilganligini tekshiradi va bu borada dekanat orqali xabardor qiladi. Talab qilingan hujjatlarni o'z vaqtida topshirish kelgusidagi muammolarning oldini oladi.",
      },
    ]
  },
];

export default function HarbiyPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-rose-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <Link href="/support" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft size={13} /> Yordam bo'limiga qaytish
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <Shield size={18} className="text-rose-500" />
              </div>
              <div>
                <Badge variant="warning" className="text-[10px] mb-1">3 ta qo'llanma</Badge>
                <h1 className="text-2xl font-bold text-foreground">Harbiy hisob</h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-2">Harbiy komissariatda ro'yxatdan o'tish tartibi va talabalar uchun muhim jihatlar.</p>
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
                <strong className="text-foreground">Eslatma:</strong> Harbiy majburiyat bilan bog'liq qonunchilik va tartib-qoidalar davlat tomonidan belgilanadi va o'zgarishi mumkin. Aniq va joriy ma'lumot uchun har doim o'z hududingiz harbiy komissariatiga murojaat qiling — bu sahifa faqat umumiy yo'l-yo'riq beradi.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Clock size={12} className="text-muted-foreground" /> Taxminiy muddatlar
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Hisobga qo'yish", time: "Qabuldan keyin tezroq" },
                  { label: "Manzil o'zgarganda qayta ro'yxatga olish", time: "Ko'chib o'tgach darhol" },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-muted-foreground">
                    <span>{r.label}</span>
                    <span className="text-foreground font-medium">{r.time}</span>
                  </div>
                ))}
              </div>
            </div>

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
