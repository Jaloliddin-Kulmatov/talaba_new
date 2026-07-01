"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import { Home, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "Talabalar turargohi (yotoqxona)",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    items: [
      {
        q: "Yotoqxonaga qanday joylashish mumkin?",
        a: "Qabul yakunlangandan so'ng universitetning talabalar turargohi bo'limiga ariza topshirasiz — odatda o'quv yili boshlanishidan oldin, sentyabr oyida. Kerakli hujjatlar: pasport nusxasi, qabul haqidagi ma'lumotnoma, fotosuratlar. Uzoq viloyatdan kelganlarga va imtiyozli toifadagi talabalarga ustuvorlik beriladi.",
      },
      {
        q: "Yotoqxona narxi qancha bo'ladi?",
        a: "Narx universitet va xona turiga qarab farq qiladi (odatda bir necha talaba bir xonada joylashadi). Aniq narxni turargoh bo'limidan so'rab bilasiz — ko'pincha oylik yoki semestrlik to'lov shaklida amalga oshiriladi.",
      },
      {
        q: "Joy yetmasa nima qilish kerak?",
        a: "Ba'zi universitetlarda talabalar soni yotoqxona sig'imidan ko'p bo'lishi mumkin. Bunday holatda navbat ro'yxatiga yoziladi yoki universitet tomonidan tavsiya etilgan xususiy ijaraga yo'naltiriladi. Dekanat yoki talabalar bo'limi bilan muntazam aloqada bo'lish foydali.",
      },
    ]
  },
  {
    title: "Ijaraga uy topish",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    items: [
      {
        q: "Ijaraga uy izlashda nimalarga e'tibor berish kerak?",
        a: "Shartnomani yozma ravishda tuzing, ijara haqi va kommunal to'lovlar kim zimmasida ekanini oldindan aniqlashtiring. Uy egasining pasporti va mulkka egalik hujjatini so'rashdan tortinmang. Bir nechta variantni solishtirib ko'rish tavsiya etiladi.",
      },
      {
        q: "Bir necha talaba birga ijaraga uy olishi mumkinmi?",
        a: "Ha, bu keng tarqalgan amaliyot — xarajatlarni bo'lishish orqali arzonroq va qulayroq uy topish mumkin. Barcha ishtirokchilar shartnomada ko'rsatilgani ma'qul, kelishmovchiliklarning oldini olish uchun.",
      },
      {
        q: "Qaysi tumanlar talabalar orasida mashhur?",
        a: "Bu universitetingiz joylashgan hududga bog'liq — odatda kampusga yaqin tumanlarda ijara narxi biroz yuqoriroq, lekin transport vaqtini tejaydi. Hamjamiyat bo'limidagi viloyatdoshlaringiz orqali mahalliy tavsiyalar olishingiz mumkin.",
      },
    ]
  },
];

const quickLinks = [
  { label: "OLX.uz — ijaraga e'lonlar", url: "https://www.olx.uz", note: "olx.uz" },
];

export default function TurargohPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-emerald-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <Link href="/support" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft size={13} /> Yordam bo'limiga qaytish
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Home size={18} className="text-emerald-500" />
              </div>
              <div>
                <Badge variant="success" className="text-[10px] mb-1">4 ta qo'llanma</Badge>
                <h1 className="text-2xl font-bold text-foreground">Talabalar turargohi va ijara</h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-2">Yotoqxonaga joylashish va ijaraga uy topish bo'yicha to'liq qo'llanma.</p>
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
                <strong className="text-foreground">Eslatma:</strong> Yotoqxona narxlari va joylar soni universitetdan universitetga farq qiladi. Aniq va joriy ma'lumot uchun har doim o'z universitetingiz talabalar turargohi bo'limiga murojaat qiling.
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
                  { label: "Yotoqxonaga ariza topshirish", time: "Sentyabr boshi" },
                  { label: "Ijara shartnomasi rasmiylashtirish", time: "1–3 kun" },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-muted-foreground">
                    <span>{r.label}</span>
                    <span className="text-foreground font-medium">{r.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3">Foydali havolalar</h3>
              <div className="space-y-2">
                {quickLinks.map(l => (
                  <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-start justify-between gap-2 group">
                    <div>
                      <p className="text-xs font-medium text-blue-500 dark:text-blue-400 group-hover:underline">{l.label}</p>
                      <p className="text-[10px] text-muted-foreground">{l.note}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <CheckCircle2 size={16} className="text-emerald-500 mb-2" />
              <h3 className="text-xs font-semibold text-foreground mb-1">Shaxsiy yordam kerakmi?</h3>
              <p className="text-xs text-muted-foreground mb-3">Viloyatdoshlaringizdan maslahat olish uchun hamjamiyat bo'limiga qo'shiling.</p>
              <Link href="/community" className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 hover:bg-emerald-500/15 transition-colors">
                Hamjamiyatga o'tish <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
