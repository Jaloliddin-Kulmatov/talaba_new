"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import {
  GraduationCap, Home, CreditCard, Shield, Train, BookOpen, Briefcase,
  ArrowRight, Sparkles, Clock, ThumbsUp, ChevronRight, ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const categories = [
  {
    id: "qabul",
    icon: GraduationCap,
    title: "Qabul, DTM va status",
    description: "DTM, hujjat topshirish, grant/kontrakt statusi",
    bg: "bg-blue-500/10",
    text: "text-blue-500 dark:text-blue-400",
    guides: 4,
    popular: true,
  },
  {
    id: "turargoh",
    icon: Home,
    title: "Talabalar turargohi va ijara",
    description: "Yotoqxonaga joylashish, ijaraga uy topish",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500 dark:text-emerald-400",
    guides: 4,
    popular: true,
  },
  {
    id: "stipendiya",
    icon: CreditCard,
    title: "Stipendiya va moliya",
    description: "Stipendiya to'lovlari, bank hisobi ochish",
    bg: "bg-violet-500/10",
    text: "text-violet-500 dark:text-violet-400",
    guides: 4,
    popular: false,
  },
  {
    id: "harbiy",
    icon: Shield,
    title: "Harbiy hisob",
    description: "Harbiy komissariatda ro'yxatdan o'tish",
    bg: "bg-rose-500/10",
    text: "text-rose-500 dark:text-rose-400",
    guides: 3,
    popular: true,
  },
  {
    id: "transport",
    icon: Train,
    title: "Transport",
    description: "Metro, avtobus, talaba chegirmalari",
    bg: "bg-amber-500/10",
    text: "text-amber-500 dark:text-amber-400",
    guides: 3,
    popular: false,
  },
  {
    id: "til",
    icon: BookOpen,
    title: "Til va ko'nikmalar",
    description: "IELTS/TOEFL tayyorgarligi, sertifikatlar",
    bg: "bg-cyan-500/10",
    text: "text-cyan-500 dark:text-cyan-400",
    guides: 3,
    popular: false,
  },
  {
    id: "parttime",
    icon: Briefcase,
    title: "Part-time ish va mehnat huquqlari",
    description: "Qisman bandlik, mehnat shartnomasi, huquqlar",
    bg: "bg-orange-500/10",
    text: "text-orange-500 dark:text-orange-400",
    guides: 3,
    popular: false,
  },
];

const popularGuides = [
  {
    title: "DTM'ga tayyorgarlik va grant/kontrakt chegarasi qanday belgilanadi?",
    category: "Qabul", readTime: 6, helpful: 1240, href: "/support/qabul",
    answer: "DTM natijasi bo'yicha har bir yo'nalish uchun alohida chegara balli belgilanadi — bu chegara har yili abituriyentlar soni va band o'rinlarga qarab o'zgaradi. Rasmiy ma'lumot va ro'yxatdan o'tish my.dtm.uz portali orqali amalga oshiriladi. Test 2 bosqichda (fan bo'yicha va tarix/tilshunoslik) o'tkaziladi.",
  },
  {
    title: "Talabalar turargohiga qanday joylashish mumkin?",
    category: "Turargoh", readTime: 5, helpful: 980, href: "/support/turargoh",
    answer: "Qabul yakunlangandan so'ng universitetning talabalar turargohi bo'limiga ariza topshirasiz. Kerakli hujjatlar: pasport nusxasi, qabul haqidagi ma'lumotnoma va ba'zan ijtimoiy holat to'g'risidagi hujjat (agar imtiyozli toifadan bo'lsangiz). Joylar cheklangan, shuning uchun birinchi haftalarda ariza topshirish tavsiya etiladi.",
  },
  {
    title: "Stipendiya qachon va qanday to'lanadi?",
    category: "Stipendiya", readTime: 4, helpful: 890, href: "/support/stipendiya",
    answer: "Grant asosida o'qiyotgan talabalarga har oyda stipendiya to'lanadi, miqdori akademik ko'rsatkichlarga (a'lo/yaxshi baholar) qarab farq qilishi mumkin. To'lovlar odatda talabaning Uzcard yoki Humo plastik kartasiga o'tkaziladi — karta hali yo'q bo'lsa, birinchi semestrda universitet orqali rasmiylashtiriladi.",
  },
  {
    title: "Harbiy hisobga qo'yish tartibi qanday?",
    category: "Harbiy", readTime: 5, helpful: 1560, href: "/support/harbiy",
    answer: "Universitetga qabul qilingan yigitlar yashash manzili bo'yicha tuman harbiy komissariatiga o'zi murojaat qilib, harbiy hisobga qo'yilishi kerak. Kerakli hujjatlar: pasport, harbiy guvohnoma (agar mavjud bo'lsa) va qabul haqidagi ma'lumotnoma. Ko'chib o'tganingizda (masalan, viloyatdan Toshkentga) hisobni yangi manzil bo'yicha qayta rasmiylashtirish kerak bo'ladi.",
  },
  {
    title: "Talabalar uchun transport chegirmasi qanday olinadi?",
    category: "Transport", readTime: 3, helpful: 740, href: "/support/transport",
    answer: "Talaba guvohnomangiz bilan jamoat transportida chegirmali tarifdan foydalanish imkoniyati mavjud — aniq shartlar shahar transport tashkilotiga qarab farqlanadi, shuning uchun mahalliy transport kompaniyasi yoki universitet talabalar bo'limidan tafsilotlarni so'rab bilasiz.",
  },
  {
    title: "IELTS/TOEFL nima uchun kerak va qanday tayyorlanish mumkin?",
    category: "Til", readTime: 6, helpful: 1020, href: "/support/til",
    answer: "IELTS/TOEFL sertifikatlari xalqaro almashinuv dasturlari, qo'shimcha stipendiyalar va ba'zi qo'shma ta'lim dasturlariga kirish uchun talab qilinadi. Universitetlarning til markazlarida tayyorgarlik kurslari mavjud, shuningdek onlayn bepul resurslar (British Council, IELTS Liz) orqali mustaqil tayyorlanish mumkin.",
  },
];

const categoryLabels: Record<string, "default" | "success" | "cyan" | "warning" | "violet"> = {
  Stipendiya: "violet",
  Qabul: "default",
  Harbiy: "warning",
  Turargoh: "success",
  Transport: "warning",
  Til: "cyan",
};

export default function SupportPage() {
  const router = useRouter();
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const askAI = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/dashboard/ai?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {/* Hero — AI-first ask box */}
        <div className="relative bg-gradient-to-b from-blue-50 via-emerald-50/40 to-transparent dark:from-blue-950/30 dark:via-emerald-950/20 border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 text-center">
            <Badge variant="default" className="mb-4 text-xs px-3 py-1 gap-1.5">
              <Sparkles size={11} className="text-violet-500 dark:text-violet-400" /> AI yordamida talabalarga qo'llab-quvvatlash
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Talabalik hayoti haqida
              <span className="gradient-text"> istalgan savolni bering</span>
            </h1>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-sm sm:text-base">
              Qabul, stipendiya, turargoh, harbiy hisob, transport. AI yordamchimizdan darhol,
              shaxsiylashtirilgan javob oling — yoki quyidagi qo'llanmalarni ko'rib chiqing.
            </p>

            {/* AI search box — actually routes to /dashboard/ai */}
            <form
              onSubmit={(e) => { e.preventDefault(); askAI(query); }}
              className="max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-2 bg-card border border-border focus-within:border-blue-500/50 rounded-2xl p-2 transition-colors">
                <div className="pl-2 text-muted-foreground">
                  <Sparkles size={18} className="text-blue-500" />
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={'TALABA AI-dan so\'ring… masalan: "Stipendiya qachon to\'lanadi?"'}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none px-2 h-10"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  disabled={!query.trim()}
                >
                  AI'dan so'rash <ArrowRight size={13} />
                </Button>
              </div>
            </form>

            {/* Quick example chips */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[
                "Grant va kontrakt farqi",
                "Turargohga hujjat topshirish",
                "Harbiy hisobga qo'yish",
                "Stipendiya kechikishi",
                "Talaba transport chegirmasi",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => askAI(q)}
                  className="text-[11px] px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:border-blue-500/30 hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          {/* Categories */}
          <h2 className="text-lg font-bold text-foreground mb-5">Kategoriya bo'yicha ko'rish</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  href={`/support/${cat.id}`}
                  className="group p-5 rounded-2xl border border-border bg-card hover:border-blue-500/20 hover:bg-accent/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`h-10 w-10 rounded-xl ${cat.bg} flex items-center justify-center`}>
                      <Icon size={18} className={cat.text} />
                    </div>
                    {cat.popular && (
                      <Badge variant="new" className="text-[10px] px-1.5">Mashhur</Badge>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{cat.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground/70">{cat.guides} ta qo'llanma</span>
                    <ChevronRight size={13} className="text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Popular guides */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">Eng foydali qo'llanmalar</h2>
              <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 gap-1">
                Barchasini ko'rish <ArrowRight size={13} />
              </Button>
            </div>
            <div className="space-y-2">
              {popularGuides.map((guide) => (
                <div
                  key={guide.title}
                  className="rounded-xl border border-border bg-card overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenGuide(openGuide === guide.title ? null : guide.title)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-accent/40 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {guide.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <Badge
                          variant={categoryLabels[guide.category] ?? "default"}
                          className="text-[10px]"
                        >
                          {guide.category}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={10} />
                          {guide.readTime} daqiqa o'qish
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ThumbsUp size={10} />
                          {guide.helpful.toLocaleString()} kishi foydali deb topgan
                        </span>
                      </div>
                    </div>
                    <ChevronDown size={15} className={`text-muted-foreground shrink-0 transition-transform ${openGuide === guide.title ? "rotate-180" : ""}`} />
                  </button>

                  {openGuide === guide.title && (
                    <div className="px-4 pb-4 border-t border-border bg-muted/20">
                      <p className="text-sm text-muted-foreground leading-relaxed pt-3">{guide.answer}</p>
                      <Link
                        href={guide.href}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline transition-colors font-medium"
                      >
                        {guide.category} bo'limini to'liq ko'rish <ChevronRight size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Emergency contacts */}
          <div className="mt-12 p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              🚨 O'zbekistonda favqulodda raqamlar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Yagona qutqaruv xizmati", number: "112", icon: "🚨" },
                { label: "Politsiya", number: "102", icon: "👮" },
                { label: "Tez tibbiy yordam", number: "103", icon: "🚑" },
                { label: "Yong'in xizmati", number: "101", icon: "🚒" },
              ].map(({ label, number, icon }) => (
                <a
                  key={label}
                  href={`tel:${number}`}
                  className="flex flex-col items-center p-4 rounded-xl bg-card border border-border hover:border-red-500/30 hover:bg-red-500/5 transition-all text-center"
                >
                  <span className="text-2xl mb-1">{icon}</span>
                  <span className="text-lg font-bold text-red-500">{number}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
