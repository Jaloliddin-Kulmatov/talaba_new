import React from "react";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const team = [
  { name: "Kulmatov Jaloliddin", role: "Asoschi & CEO", country: "🇺🇿 O'zbekiston", bio: "TALABA'ni O'zbekistondagi talabalar uchun klublar, ish topish va qabul/DTM bo'yicha yordamni bir joyga jamlash zarurligini ko'rib qurdi." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-blue-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
            <Badge variant="violet" className="mb-4 text-xs">Bizning maqsadimiz</Badge>
            <h1 className="text-4xl font-extrabold text-foreground mb-4">Talabalar tomonidan,<br />talabalar uchun qurilgan</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              TALABA bitta talabaning universitet klublarini topish, ish qidirish, qabul va DTM jarayonlarini
              tushunish qanchalik qiyin ekanligidan norozi bo&apos;lishidan boshlandi. Biz o&apos;zimiz orzu qilgan platformani quryapmiz.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-16">

          {/* Story */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Tarixi</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>Universitetga kirgan har bir talabaga qo&apos;llanma berilmaydi. Birinchi haftalaringiz qaysi klubga qo&apos;shilish, turargohga qanday joylashish, stipendiya va bank hisobini qanday ochish, dars jadvaliga mos part-time ish qayerdan topish va o&apos;xshash vaziyatdagi boshqa talabalar bilan qanday tanishishni o&apos;rganib o&apos;tadi.</p>
              <p>TALABA aynan shuni hal qilish uchun qurildi. Bugun O&apos;zbekiston Milliy universiteti (NUU)dan boshlab, biz o&apos;zbek talabalari uchun eng mukammal platformani yaratmoqdamiz — hamjamiyat, ish topish, qabul/DTM bo&apos;yicha yo&apos;l-yo&apos;riq, AI yordami va boshqa hamma narsa.</p>
              <p>Maqsadimiz oddiy: talabalik hayotining birinchi yilini, hamma narsa qanday ishlashini allaqachon biladigan joyga kelgandek his qildirish.</p>
            </div>
          </div>

          {/* Team */}
          <div id="careers">
            <h2 className="text-xl font-bold text-foreground mb-6">Jamoa</h2>
            <div className="grid gap-4">
              {team.map(member => (
                <div key={member.name} className="p-6 rounded-2xl border border-border bg-card flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {member.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-foreground">{member.name}</h3>
                      <span className="text-xs text-muted-foreground">{member.country}</span>
                    </div>
                    <p className="text-xs text-blue-500 font-medium mb-2">{member.role}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              ))}
              <div className="p-6 rounded-2xl border border-dashed border-border text-center">
                <p className="text-sm text-muted-foreground mb-3">Biz o&apos;sib bormoqdamiz. TALABA&apos;ni qurishga yordam berishni xohlaysizmi?</p>
                <Link href="/contact" className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 font-medium">
                  Biz bilan bog&apos;laning <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Values */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2"><Heart size={18} className="text-rose-500" /> Bizning qadriyatlarimiz</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "Avvalo talabalar", desc: "Biz yaratadigan har bir funksiya haqiqiy talaba muammosidan boshlanadi. Ortiqcha murakkablikni o'zidan-o'zi qo'shmaymiz." },
                { title: "To'liq halollik", desc: "Biz haqiqiy ma'lumot beramiz, reklama gaplarini emas. Agar biror narsa qiyin bo'lsa, buni ochiq aytamiz." },
                { title: "Hamjamiyat asosida", desc: "Eng yaxshi javoblar buni o'z boshidan kechirgan talabalardan keladi. Biz ularning bilimlarini kengroq yetkazamiz." },
                { title: "Ochiq va inklyuziv", desc: "TALABA — O'zbekistondagi har bir universitet va har bir yo'nalishdagi barcha talabalar uchun." },
              ].map(v => (
                <div key={v.title} className="p-5 rounded-2xl border border-border bg-card">
                  <h3 className="text-sm font-bold text-foreground mb-2">{v.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
