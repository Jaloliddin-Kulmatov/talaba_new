"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import { CreditCard, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "Stipendiya",
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    items: [
      {
        q: "Stipendiyani kim oladi va miqdori qanday belgilanadi?",
        a: "Grant asosida o'qiyotgan talabalar har oyda stipendiya oladi. Miqdori akademik ko'rsatkichlarga (imtihon natijalari, o'zlashtirish darajasi) qarab farq qilishi mumkin — yuqori ball to'plagan talabalar ko'proq stipendiya olishi mumkin.",
      },
      {
        q: "Stipendiya to'lovi kechiksa nima qilish kerak?",
        a: "Ayrim oylarda texnik sabablarga ko'ra kechikish uchrashi mumkin. 1-2 haftadan ortiq davom etsa, guruh sardori orqali yoki shaxsan talabalar bo'limiga murojaat qiling.",
      },
      {
        q: "Qo'shimcha grant va stipendiya dasturlari bormi?",
        a: "Ba'zi xalqaro tashkilotlar va universitetlar alohida iqtidorli talabalar uchun qo'shimcha grant/stipendiya dasturlarini e'lon qiladi. Bunday imkoniyatlarni universitetning xalqaro aloqalar bo'limi orqali kuzatib boring.",
      },
    ]
  },
  {
    title: "Bank hisobi va to'lovlar",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    items: [
      {
        q: "Talaba bank kartasini qanday ochish mumkin?",
        a: "Uzcard yoki Humo plastik kartasini istalgan bank filialida pasport bilan ochishingiz mumkin. Ko'p universitetlar birinchi semestrda talabalar uchun stipendiya kartasini rasmiylashtirishga yordam beradi.",
      },
      {
        q: "Onlayn to'lov va pul o'tkazmalari uchun qaysi ilovalar qulay?",
        a: "Click va Payme — kommunal to'lovlar, mobil balans va onlayn xaridlar uchun keng qo'llaniladigan ilovalar. Uzum Bank kabi raqamli banklar orqali ham hisob ochish va boshqarish mumkin.",
      },
      {
        q: "Talabalar uchun moliyaviy savodxonlik bo'yicha maslahat bormi?",
        a: "Ha — oylik xarajatlaringizni oldindan rejalashtirish, keraksiz kreditlardan qochish va daromad-xarajat balansini kuzatib borish tavsiya etiladi. Ba'zi universitetlarda talabalar uchun moliyaviy savodxonlik bo'yicha klublar ham mavjud.",
      },
    ]
  },
];

export default function StipendiyaPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-violet-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <Link href="/support" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft size={13} /> Yordam bo'limiga qaytish
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <CreditCard size={18} className="text-violet-500" />
              </div>
              <div>
                <Badge variant="violet" className="text-[10px] mb-1">4 ta qo'llanma</Badge>
                <h1 className="text-2xl font-bold text-foreground">Stipendiya va moliya</h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-2">Stipendiya to'lovlari, bank hisobi ochish va moliyaviy savodxonlik.</p>
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
                <strong className="text-foreground">Eslatma:</strong> Stipendiya miqdori va to'lov tartibi universitetga qarab farq qilishi mumkin. Aniq raqamlarni talabalar bo'limi yoki buxgalteriyadan tasdiqlab oling.
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
                  { label: "Oylik stipendiya to'lovi", time: "Har oy" },
                  { label: "Kartani rasmiylashtirish", time: "1-semestr, 1–2 hafta" },
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
              <Link href="/support/faq" className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 hover:bg-emerald-500/15 transition-colors">
                FAQ'ga o'tish <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
