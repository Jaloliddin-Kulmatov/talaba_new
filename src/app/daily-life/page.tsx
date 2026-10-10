import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import NearbyPlaces from "@/components/daily-life/nearby-places";
import {
  Train, ShoppingBag, Wifi,
  Smartphone, DollarSign, Heart,
  Sparkles, Users, ArrowRight, ExternalLink, Sun,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ── Data ───────────────────────────────────────────────────── */

const transport = [
  { emoji: "💳", title: "Transport kartasi",  body: "Metro, avtobus va marshrutkalarda ishlaydi. Talaba guvohnomasi bilan chegirmali tarif mavjud.", link: "https://yandex.uz/maps/?text=metro%20bekati" },
  { emoji: "🗺️", title: "Yandex Xaritalar / 2GIS", body: "Real vaqtda yo'nalish va transport ma'lumotlari uchun eng qulay ilovalar.",         link: "https://yandex.uz/maps" },
  { emoji: "🎓", title: "Talaba chegirmasi",  body: "Ba'zi transport turlarida talaba guvohnomasi bilan chegirma olish mumkin.",                 link: "" },
  { emoji: "🚄", title: "Afrosiyob",          body: "Toshkent–Samarqand–Buxoro yo'nalishida tezyurar poyezd. Bayram oldidan oldindan bron qiling.", link: "https://railway.uz" },
];

const essentials = [
  { emoji: "🏪", name: "Korzinka / Havas", note: "Supermarket tarmoqlari — kundalik oziq-ovqat va ehtiyojlar.",  link: "" },
  { emoji: "📦", name: "Uzum Market",      note: "Kechqurun buyurtma bering, ko'pincha ertasi kuni yetkaziladi.", link: "https://uzum.com" },
  { emoji: "🥕", name: "Bozor",            note: "Meva-sabzavot uchun eng arzon narxlar mahalliy bozorlarda.",   link: "" },
  { emoji: "🛋️", name: "OLX.uz",          note: "Ishlatilgan buyumlar — ko'chib o'tganda mebel uchun ajoyib.",  link: "https://www.olx.uz" },
  { emoji: "📶", name: "Aeroportda SIM",   note: "Beeline/Ucell/UMS aeroportda ro'yxatdan o'tkaziladi.",         link: "" },
  { emoji: "💬", name: "Mobil operatorlar",note: "Talabalar uchun arzon tarif rejalari mavjud.",                 link: "" },
];

const apps = [
  { icon: "🗺️", name: "Yandex Xaritalar / 2GIS", note: "Navigatsiya — yo'nalish va transport uchun.",        link: "https://yandex.uz/maps" },
  { icon: "🚕", name: "Yandex Go / inDrive",      note: "Taksi va yo'l xizmatlari — bitta ilovada.",          link: "" },
  { icon: "🍜", name: "Uzum Tezkor",              note: "Oziq-ovqat va tez yetkazib berish xizmati.",         link: "https://uzum.com" },
  { icon: "📦", name: "Uzum Market",              note: "Onlayn xarid — deyarli hamma narsa uchun.",          link: "https://uzum.com" },
  { icon: "💳", name: "Click / Payme",            note: "Onlayn to'lovlar va kommunal xizmatlar uchun.",      link: "https://click.uz" },
  { icon: "🈳", name: "Google Translate",         note: "Tarjima — kundalik muloqot uchun foydali.",          link: "" },
];

const seasons = [
  { emoji: "🌸", s: "Bahor", m: "Mar–May", t: "10–25°C", tip: "Yoqimli va gullab-yashnagan fasl. Kechqurunlari sovuqroq bo'lishi mumkin." },
  { emoji: "☀️", s: "Yoz",   m: "Iyun–Avg", t: "30–42°C", tip: "Juda issiq va quruq. Ko'p suv iching, soatlab quyoshda yurmang." },
  { emoji: "🍂", s: "Kuz",   m: "Sen–Noy", t: "12–28°C", tip: "Eng yoqimli fasl — tiniq havo, mo'l hosil." },
  { emoji: "❄️", s: "Qish",  m: "Dek–Fev", t: "-5–8°C",  tip: "Sovuq, ba'zan qorli. Issiq kiyinib chiqing." },
];

const budget = [
  { item: "Turargoh (umumiy)",       range: "300,000–600,000 so'm" },
  { item: "Talabalar oshxonasi",     range: "400,000–700,000 so'm" },
  { item: "Oziq-ovqat",              range: "500,000–900,000 so'm" },
  { item: "Transport",               range: "100,000–200,000 so'm" },
  { item: "Mobil aloqa",             range: "30,000–70,000 so'm" },
  { item: "Ijtimoiy / dam olish",    range: "100,000–300,000 so'm" },
];

const tips = [
  { emoji: "👞", tip: "Uyga kirishda poyabzalni yechish odat hisoblanadi." },
  { emoji: "🙏", tip: "Kattalardan biror narsa olishda ikki qo'l bilan olish hurmat belgisi." },
  { emoji: "🍵", tip: "Choy quyishda avval boshqalarga, keyin o'zingizga quying." },
  { emoji: "🥘", tip: "Dasturxonga birinchi bo'lib odatda katta yoshdagilar taklif qilinadi." },
];

/* ── Page ───────────────────────────────────────────────────── */

export default function DailyLifePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-24 md:pb-0">

        {/* Hero — compact */}
        <div className="border-b border-border bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/15">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12 text-center">
            <Badge variant="default" className="mb-3 text-xs px-3 py-1 gap-1.5">
              <Heart size={11} className="text-rose-600 dark:text-rose-400" /> Talaba hayoti
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
              Talabalik hayoti, <span className="gradient-text">soddalashtirilgan</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Faqat kerakli narsalar — joylar, transport, ilovalar va byudjet.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">

          {/* ── 1. Find nearby ─────── */}
          <NearbyPlaces />

          {/* ── 2. Transport ──────────────────────────────────── */}
          <Section icon={Train} color="text-blue-500" bg="bg-blue-500/10" title="Transport">
            <div className="grid sm:grid-cols-2 gap-2.5">
              {transport.map((t) => (
                <SimpleCard key={t.title} emoji={t.emoji} title={t.title} body={t.body} link={t.link} />
              ))}
            </div>
          </Section>

          {/* ── 3. Essentials ─────────────────────────────────── */}
          <Section icon={ShoppingBag} color="text-pink-500" bg="bg-pink-500/10" title="Kundalik ehtiyojlar va xaridlar">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {essentials.map((s) => (
                <SimpleCard key={s.name} emoji={s.emoji} title={s.name} body={s.note} link={s.link} />
              ))}
            </div>
          </Section>

          {/* ── 4. Essential apps ─────────────────────────────── */}
          <Section icon={Smartphone} color="text-emerald-500" bg="bg-emerald-500/10" title="Zarur ilovalar">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {apps.map((a) => (
                a.link ? (
                  <a
                    key={a.name}
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col gap-1.5 p-3.5 rounded-2xl border border-border bg-card hover:border-emerald-500/30 transition-colors"
                  >
                    <span className="text-2xl">{a.icon}</span>
                    <p className="text-sm font-semibold text-foreground leading-tight">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{a.note}</p>
                  </a>
                ) : (
                  <div
                    key={a.name}
                    className="flex flex-col gap-1.5 p-3.5 rounded-2xl border border-border bg-card"
                  >
                    <span className="text-2xl">{a.icon}</span>
                    <p className="text-sm font-semibold text-foreground leading-tight">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{a.note}</p>
                  </div>
                )
              ))}
            </div>
          </Section>

          {/* ── 5. Budget ─────────────────────────────────────── */}
          <Section icon={DollarSign} color="text-amber-500" bg="bg-amber-500/10" title="Oylik byudjet">
            <div className="rounded-2xl border border-emerald-500/20 bg-card overflow-hidden">
              <div className="divide-y divide-border">
                {budget.map((b) => (
                  <div key={b.item} className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-xs text-foreground">{b.item}</span>
                    <span className="text-xs font-semibold text-emerald-500">{b.range}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-emerald-500/5 border-t border-emerald-500/15 flex justify-between items-center">
                <span className="text-xs font-bold text-foreground">Oylik jami</span>
                <span className="text-sm font-extrabold text-emerald-500">1,430,000 – 2,370,000 so'm</span>
              </div>
            </div>
          </Section>

          {/* ── 6. Quick tips ─── */}
          <Section icon={Sun} color="text-blue-500" bg="bg-blue-500/10" title="Tezkor maslahatlar">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
              {seasons.map((s) => (
                <div key={s.s} className="p-3 rounded-2xl border border-border bg-card text-center">
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <p className="text-sm font-bold text-foreground">{s.s}</p>
                  <p className="text-[10px] text-muted-foreground mb-1">{s.m} · {s.t}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">{s.tip}</p>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {tips.map((c) => (
                <div key={c.tip} className="flex items-start gap-2 p-2.5 rounded-xl border border-border bg-card">
                  <span className="text-base shrink-0">{c.emoji}</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{c.tip}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── CTA ───────────────────────────────────────────── */}
          <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/8 to-emerald-500/5 p-7 text-center">
            <p className="text-base font-bold text-foreground mb-1">Aniq savolingiz bormi?</p>
            <p className="text-muted-foreground text-xs mb-5">AI yordamchimiz va talabalar hamjamiyati 24/7 shu yerda.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link href="/dashboard/ai" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                <Sparkles size={14} /> AI'dan so'rash <ArrowRight size={13} />
              </Link>
              <Link href="/community" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors">
                <Users size={14} /> Hamjamiyatdan so'rash
              </Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ── Small building blocks ─────────────────────────────────── */

function Section({
  icon: Icon, color, bg, title, children,
}: {
  icon: React.ElementType; color: string; bg: string; title: string; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
          <Icon size={16} />
        </div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SimpleCard({ emoji, title, body, link }: { emoji: string; title: string; body: string; link?: string }) {
  const content = (
    <>
      <span className="text-xl shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {link && <ExternalLink size={10} className="text-muted-foreground" />}
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{body}</p>
      </div>
    </>
  );
  return link ? (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-blue-500/30 transition-colors"
    >
      {content}
    </a>
  ) : (
    <div className="flex gap-3 p-3.5 rounded-2xl border border-border bg-card">{content}</div>
  );
}
