"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import { GraduationCap, ChevronDown, ChevronRight, ExternalLink, AlertCircle, CheckCircle2, ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "DTM (Davlat Test Markazi)",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    items: [
      {
        q: "DTM nima va u qanday ishlaydi?",
        a: "DTM — oliy ta'lim muassasalariga qabul qilish uchun o'tkaziladigan davlat test sinovi. Test odatda ikki bosqichdan iborat: yo'nalish bo'yicha maxsus fan(lar) va umumiy tayyorgarlik fani. Natijalar to'plangan ball asosida qabul reytingi tuziladi.",
      },
      {
        q: "Ro'yxatdan qanday o'tish mumkin?",
        a: "Ro'yxatdan o'tish rasmiy my.dtm.uz portali orqali amalga oshiriladi. Pasport ma'lumotlari, tanlangan yo'nalish(lar) va test topshirish markazini ko'rsatishingiz kerak bo'ladi. Muddatlar har yili e'lon qilinadi — rasmiy portaldan kuzatib boring.",
      },
      {
        q: "Bir nechta yo'nalishga hujjat topshirish mumkinmi?",
        a: "Ha, odatda bir nechta yo'nalish/universitetga ustuvorlik tartibida hujjat topshirish imkoniyati mavjud. Aniq tartib va cheklovlar har yili qabul qoidalarida belgilanadi.",
      },
    ]
  },
  {
    title: "Grant va kontrakt statusi",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    items: [
      {
        q: "Grant va kontrakt o'rtasidagi farq nima?",
        a: "Grant — davlat tomonidan to'liq yoki qisman moliyalashtiriladigan bepul ta'lim o'rni, DTM natijasi bo'yicha eng yuqori ball to'plaganlarga beriladi. Kontrakt — talaba o'zi (yoki oilasi) to'lov qiladigan ta'lim shakli. Ikkalasida ham diplom bir xil, farq faqat moliyalashtirish shaklida.",
      },
      {
        q: "Kontraktdan grantga o'tish mumkinmi?",
        a: "Ha, ko'p universitetlarda semestr yakunlangandan so'ng yuqori akademik ko'rsatkichga ega talabalar bo'sh grant o'rinlariga o'tish uchun ariza topshirishi mumkin. Tanlov reyting asosida bo'ladi, shuning uchun barcha fanlardan yuqori baho olish muhim.",
      },
    ]
  },
  {
    title: "Hujjat topshirish",
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    items: [
      {
        q: "Qabul uchun qanday hujjatlar kerak bo'ladi?",
        a: "Odatda: pasport yoki tug'ilganlik guvohnomasi nusxasi, o'rta ta'lim to'g'risidagi hujjat (attestat), fotosuratlar va DTM natijasi to'g'risidagi ma'lumotnoma talab qilinadi. Aniq ro'yxatni tanlagan universitetning qabul komissiyasidan tasdiqlab oling — yo'nalishga qarab farq qilishi mumkin.",
      },
      {
        q: "Xorijiy oliygohlar bilan qo'shma dasturlarga qabul boshqachami?",
        a: "Ba'zi qo'shma ta'lim dasturlari (masalan xorijiy universitet filiallari) alohida imtihon yoki suhbat, ba'zan esa chet tili bilim darajasini tasdiqlovchi sertifikat (IELTS/TOEFL) talab qilishi mumkin. Bunday holatlarda tanlagan muassasaning rasmiy qabul qoidalarini oldindan o'rganib chiqing.",
      },
    ]
  },
];

const quickLinks = [
  { label: "DTM rasmiy portali", url: "https://my.dtm.uz", note: "my.dtm.uz" },
  { label: "Yagona davlat xizmatlari portali", url: "https://my.gov.uz", note: "my.gov.uz" },
];

export default function QabulPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-blue-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <Link href="/support" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft size={13} /> Yordam bo'limiga qaytish
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <GraduationCap size={18} className="text-blue-500" />
              </div>
              <div>
                <Badge variant="violet" className="text-[10px] mb-1">4 ta qo'llanma</Badge>
                <h1 className="text-2xl font-bold text-foreground">Qabul, DTM va status</h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-2">DTM, hujjat topshirish va grant/kontrakt statusi haqida bilishingiz kerak bo'lgan hamma narsa.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main content */}
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
                <strong className="text-foreground">Eslatma:</strong> Qabul qoidalari va DTM chegara ballari har yili o'zgarishi mumkin. Ariza topshirishdan oldin har doim my.dtm.uz rasmiy saytidagi joriy talablarni tekshirib ko'ring.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Clock size={12} className="text-muted-foreground" /> Taxminiy muddatlar
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: "DTM natijalari e'lon qilinishi", time: "1–2 hafta" },
                  { label: "Hujjat topshirish", time: "2–3 hafta" },
                  { label: "Kontraktdan grantga o'tish", time: "Semestr yakunida" },
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
                  <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start justify-between gap-2 group">
                    <div>
                      <p className="text-xs font-medium text-blue-500 dark:text-blue-400 group-hover:underline">{l.label}</p>
                      <p className="text-[10px] text-muted-foreground">{l.note}</p>
                    </div>
                    <ExternalLink size={11} className="text-muted-foreground/40 mt-0.5 shrink-0" />
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <CheckCircle2 size={16} className="text-emerald-500 mb-2" />
              <h3 className="text-xs font-semibold text-foreground mb-1">Shaxsiy yordam kerakmi?</h3>
              <p className="text-xs text-muted-foreground mb-3">AI yordamchidan so'rang yoki tezkor javoblar uchun FAQ bo'limini ko'ring.</p>
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
