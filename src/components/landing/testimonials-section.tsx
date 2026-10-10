import React from "react";
import { Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Malika",
    role: "2-kurs talabasi",
    university: "Toshkent axborot texnologiyalari universiteti",
    region: "Toshkent shahri",
    text: "TALABA orqali o'z fakultetimdagi dasturlash klubini topdim va bir haftada a'zo bo'ldim. Undan oldin bunday klublar borligini ham bilmasdim — endi har hafta loyihalar ustida birga ishlaymiz.",
    initials: "MA",
  },
  {
    name: "Sardor",
    role: "3-kurs talabasi",
    university: "Samarqand davlat universiteti",
    region: "Samarqand viloyati",
    text: "Ish e'lonlari bo'limida dars jadvalimga mos part-time ish topdim — filtr aynan darslardan keyingi soatlarga to'g'ri keladigan ishlarni ko'rsatdi. Endi o'qishimga xalaqit bermay pul topyapman.",
    initials: "SA",
  },
  {
    name: "Dilnoza",
    role: "Magistrant",
    university: "O'zbekiston Milliy universiteti",
    region: "Toshkent shahri",
    text: "AI yordamchidan stipendiya hujjatlarini qanday topshirishni so'radim va bir necha soniyada aniq javob oldim. Har safar dekanatga qatnashning hojati qolmadi.",
    initials: "DI",
  },
  {
    name: "Javohir",
    role: "1-kurs talabasi",
    university: "Farg'ona davlat universiteti",
    region: "Farg'ona viloyati",
    text: "Turargohga joylashish bo'yicha qadam-baqadam qo'llanma bo'lmaganida, birinchi haftam butunlay boshqacha o'tardi. Qaysi hujjatlar kerakligini oldindan bilib, hammasini bir kunda hal qildim.",
    initials: "JA",
  },
  {
    name: "Nodira",
    role: "4-kurs talabasi",
    university: "Andijon davlat universiteti",
    region: "Andijon viloyati",
    text: "Hamjamiyat bo'limida boshqa kurslardagi talabalar bilan tanishib, dars materiallari va imtihon tayyorgarligi bo'yicha maslahat almashamiz. Universitet elchisi doim foydali e'lonlar joylaydi.",
    initials: "NO",
  },
  {
    name: "Bekzod",
    role: "2-kurs talabasi",
    university: "Buxoro davlat universiteti",
    region: "Buxoro viloyati",
    text: "Harbiy hisobga olish haqidagi qo'llanma tufayli qayerga borishim va qanday hujjat topshirishim kerakligini oldindan bilib oldim. Navbatda his qilgan sarosima butunlay yo'qoldi.",
    initials: "BE",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden" id="testimonials">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.04] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-foreground mb-3">
            Talabalar
            <span className="gradient-text"> tomonidan sevilgan</span>
          </h2>
          <p className="text-muted-foreground">TALABA'dan foydalanayotgan talabalarning fikrlari</p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="break-inside-avoid p-6 rounded-2xl bg-card border border-border shadow-sm hover:border-blue-500/30 transition-all duration-300 group"
            >
              <Quote size={24} className="text-blue-500/40 mb-3" />

              <p className="text-sm text-muted-foreground leading-relaxed mb-5 group-hover:text-foreground/80 transition-colors">
                &ldquo;{t.text}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback className="text-xs">{t.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.role} · {t.university}
                  </p>
                  <p className="text-xs text-muted-foreground/60">{t.region}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
