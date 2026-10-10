"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import { Search, ChevronDown, Sparkles, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface FAQ {
  q: string;
  a: string;
  category: string;
  tags?: string[];
}

const FAQS: FAQ[] = [
  // Qabul
  {
    category: "Qabul",
    q: "DTM'ga qanday tayyorgarlik ko'rish kerak?",
    a: "Tanlagan yo'nalishingiz bo'yicha fanlarni chuqur o'rganish, oldingi yillar test namunalarini ishlash va vaqtni to'g'ri taqsimlashni mashq qilish tavsiya etiladi. Rasmiy tayyorgarlik materiallari va namunaviy testlar my.dtm.uz saytida mavjud.",
    tags: ["DTM", "tayyorgarlik"],
  },
  {
    category: "Qabul",
    q: "Grant balli har yili o'zgaradimi?",
    a: "Ha, grant chegara balli har yili yo'nalish, abituriyentlar soni va bo'sh o'rinlarga qarab o'zgaradi. Aniq raqamni oldindan bilib bo'lmaydi, lekin oldingi 2-3 yillik statistikani solishtirib taxminiy tasavvur hosil qilish mumkin.",
    tags: ["grant", "DTM", "ball"],
  },
  {
    category: "Qabul",
    q: "Hujjatlarni qachon va qayerga topshirish kerak?",
    a: "Hujjatlar odatda DTM natijalari e'lon qilingandan so'ng, tanlangan universitet qabul komissiyasiga topshiriladi. Aniq muddatlarni har yili DTM va universitetning rasmiy e'lonlaridan kuzatib boring.",
    tags: ["hujjat", "qabul"],
  },
  // Stipendiya
  {
    category: "Stipendiya",
    q: "Kontraktdan grantga qanday o'tish mumkin?",
    a: "Semestr yakunlangandan so'ng yuqori akademik ko'rsatkichga ega talabalar dekanatga ariza topshirib, bo'sh grant o'rinlariga tanlov asosida o'tishi mumkin. Barcha fanlardan yuqori baho olish muhim, chunki tanlov boshqa nomzodlar bilan reyting asosida bo'ladi.",
    tags: ["kontrakt", "grant", "o'tish"],
  },
  {
    category: "Stipendiya",
    q: "Stipendiya kartasini qanday olish mumkin?",
    a: "Birinchi semestrda universitet talabalar bilan birgalikda Uzcard yoki Humo plastik kartasini rasmiylashtirishga yordam beradi. Karta orqali oylik stipendiya to'lovlarini olasiz.",
    tags: ["stipendiya", "karta", "bank"],
  },
  {
    category: "Stipendiya",
    q: "Pulni uyga qanday jo'natish yoki qabul qilish mumkin?",
    a: "Click, Payme kabi ilovalar orqali tez va qulay pul o'tkazmalarini amalga oshirish mumkin. Bank orqali o'tkazmalar ham mavjud, lekin komissiya va muddatlar farq qilishi mumkin.",
    tags: ["pul o'tkazma", "moliya"],
  },
  // Turargoh
  {
    category: "Turargoh",
    q: "Yotoqxonaga hujjat topshirish uchun nima kerak?",
    a: "Pasport nusxasi, qabul haqidagi ma'lumotnoma va ba'zan ijtimoiy holat to'g'risidagi hujjat kerak bo'ladi. Ariza universitetning talabalar turargohi bo'limiga topshiriladi — birinchi haftalarda murojaat qilish tavsiya etiladi, chunki joylar cheklangan.",
    tags: ["yotoqxona", "turargoh", "hujjat"],
  },
  {
    category: "Turargoh",
    q: "Ijaraga uy olishda qanday ehtiyot choralarini ko'rish kerak?",
    a: "Har doim yozma shartnoma tuzing, uy egasining hujjatlarini tekshiring va kommunal to'lovlar kim zimmasida ekanini oldindan aniqlashtiring. Bir nechta variantni solishtirib ko'rish foydali.",
    tags: ["ijara", "uy"],
  },
  // Harbiy
  {
    category: "Harbiy",
    q: "Harbiy hisobga qo'yish uchun qayerga borish kerak?",
    a: "Yashash manzilingiz bo'yicha tuman (shahar) harbiy komissariatiga o'zingiz murojaat qilasiz. Pasport, harbiy guvohnoma (agar mavjud bo'lsa) va qabul haqidagi ma'lumotnoma kerak bo'ladi.",
    tags: ["harbiy hisob", "komissariat"],
  },
  {
    category: "Harbiy",
    q: "Boshqa shaharga ko'chib o'tsam, harbiy hisobni yangilashim kerakmi?",
    a: "Ha, yashash manzili o'zgarganda harbiy hisobni yangi manzil bo'yicha qayta rasmiylashtirish kerak. Buning uchun eski va yangi harbiy komissariatga murojaat qiling.",
    tags: ["harbiy hisob", "manzil"],
  },
  // Transport
  {
    category: "Transport",
    q: "Toshkent metrosidan qanday foydalanish mumkin?",
    a: "Yagona transport kartasi orqali metro, avtobus va marshrutkalarda foydalanish mumkin. Kartani metro bekatlarida yoki belgilangan nuqtalarda to'ldirish mumkin.",
    tags: ["metro", "transport", "Toshkent"],
  },
  {
    category: "Transport",
    q: "Talabalar uchun transport chegirmasi bormi?",
    a: "Ba'zi hududlarda talaba guvohnomasi bilan chegirmali tarifdan foydalanish mumkin. Aniq shartlarni mahalliy transport tashkiloti yoki universitet talabalar bo'limidan so'rab bilasiz.",
    tags: ["chegirma", "transport"],
  },
  // Til
  {
    category: "Til",
    q: "IELTS/TOEFL nima uchun kerak?",
    a: "Bu sertifikatlar xalqaro almashinuv dasturlari, qo'shimcha stipendiyalar va yuqori maoshli part-time ish topishda katta afzallik beradi. Ko'p qo'shma ta'lim dasturlari ham til sertifikatini talab qiladi.",
    tags: ["IELTS", "TOEFL", "til"],
  },
  {
    category: "Til",
    q: "Bepul tayyorgarlik resurslari bormi?",
    a: "Ha — universitet til markazlaridagi bepul kurslar, shuningdek British Council va IELTS Liz kabi onlayn manbalar orqali mustaqil tayyorlanish mumkin.",
    tags: ["til", "tayyorgarlik"],
  },
  // Part-time
  {
    category: "Part-time",
    q: "Qisman bandlik ishni qayerdan topsam bo'ladi?",
    a: "TALABA'ning Ishlar bo'limida jadvalingizga mos (kunduzgi/sirtqi/kechki) e'lonlarni filtrlab topishingiz mumkin. Har bir e'londa AI tomonidan aniqlangan \"talabalarga qulaylik\" belgisi ham ko'rsatiladi.",
    tags: ["ish", "part-time"],
  },
  {
    category: "Part-time",
    q: "Ishga kirishda mehnat shartnomasi shartmi?",
    a: "Ha, rasmiy ishga joylashishda yozma mehnat shartnomasi tuzilishi kerak. Bu maosh, ish vaqti va huquqlaringizni himoya qiladi — og'zaki kelishuvlarga tayanmang.",
    tags: ["mehnat shartnomasi", "huquq"],
  },
];

const CATEGORIES = ["Barchasi", "Qabul", "Stipendiya", "Turargoh", "Harbiy", "Transport", "Til", "Part-time"];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Barchasi");
  const [openAll, setOpenAll] = useState(false);

  const filtered = useMemo(() => {
    return FAQS.filter(f => {
      const matchCat = category === "Barchasi" || f.category === category;
      const q = search.toLowerCase();
      const matchSearch = !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q) || (f.tags || []).some(t => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const grouped = useMemo(() => {
    const map: Record<string, FAQ[]> = {};
    for (const f of filtered) {
      if (!map[f.category]) map[f.category] = [];
      map[f.category].push(f);
    }
    return map;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 text-center">
            <Badge variant="default" className="mb-4 text-xs px-3 py-1">
              <MessageSquare size={10} className="mr-1" /> Ko'p so'raladigan savollar
            </Badge>
            <h1 className="text-4xl font-extrabold text-foreground mb-3">
              Ko'p so'raladigan savollar
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              O'zbekiston talabalari uchun haqiqiy javoblar — qabul, stipendiya, turargoh va boshqa mavzularda.
            </p>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Savollarni qidiring... masalan: DTM, stipendiya, yotoqxona"
              icon={<Search size={15} />}
              className="max-w-lg mx-auto"
            />
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  category === cat
                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25"
                    : "border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {cat}
                {cat !== "Barchasi" && (
                  <span className="ml-1.5 text-muted-foreground">
                    {FAQS.filter(f => f.category === cat).length}
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={() => setOpenAll(!openAll)}
              className="ml-auto px-3.5 py-1.5 rounded-xl text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              {openAll ? "Barchasini yopish" : "Barchasini ochish"}
            </button>
          </div>

          {/* Results count */}
          {search && (
            <p className="text-xs text-muted-foreground mb-4">
              &quot;{search}&quot; bo'yicha {filtered.length} ta natija
            </p>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <MessageSquare size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Qidiruvingizga mos savol topilmadi.</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Boshqa kalit so'z bilan qidiring yoki AI yordamchidan so'rang.</p>
              <Link
                href="/dashboard/ai"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                <Sparkles size={13} /> TALABA AI-dan so'rash
              </Link>
            </div>
          )}

          {/* FAQ groups */}
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-8">
              {category === "Barchasi" && (
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{cat}</h2>
              )}
              <div className="space-y-2">
                {items.map((faq, i) => (
                  <OpenableFAQItem key={i} faq={faq} forceOpen={openAll} />
                ))}
              </div>
            </div>
          ))}

          {/* AI CTA */}
          <div className="mt-8 p-6 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/40 dark:to-emerald-950/40 text-center">
            <Sparkles size={24} className="text-blue-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">Hali ham savolingiz bormi?</h3>
            <p className="text-xs text-muted-foreground mb-4">
              TALABA AI talabalik hayoti haqida hamma narsani biladi. Istalgan savolni bering.
            </p>
            <Link
              href="/dashboard/ai"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Sparkles size={14} /> AI yordamchidan so'rash
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function OpenableFAQItem({ faq, forceOpen }: { faq: FAQ; forceOpen: boolean }) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = forceOpen || localOpen;

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${open ? "border-blue-500/30 bg-blue-500/4" : "border-border bg-card hover:border-border/80"}`}>
      <button
        onClick={() => setLocalOpen(!localOpen)}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-foreground leading-relaxed">{faq.q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 mt-0.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180 text-blue-500" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <div className="h-px bg-border mb-4" />
          <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
          {faq.tags && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {faq.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
