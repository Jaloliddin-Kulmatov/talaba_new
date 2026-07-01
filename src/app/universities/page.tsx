"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { UNIVERSITIES, REGIONS } from "@/lib/constants";
import { Users, MapPin, ExternalLink, Search, Star, CheckCircle2, GraduationCap, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import AmbassadorModal from "@/components/ui/ambassador-modal";

const REGION_FILTERS = ["Barchasi", ...REGIONS.map(r => r.name)];

const NUU_INFO = {
  location: "Toshkent shahri, O'zbekiston",
  website: "https://nuu.uz",
  programs: ["Bakalavriat", "Magistratura", "Doktorantura (PhD)", "Qo'shma ta'lim dasturlari"],
  tips: [
    "Xalqaro aloqalar bo'limi orqali almashinuv dasturlari va grantlar haqida so'rab bilasiz.",
    "Yotoqxonaga hujjat topshirish odatda o'quv yili boshida, sentyabr oyida qabul qilinadi.",
    "Har bir fakultetda talabalar kengashi mavjud — masalalaringiz bo'yicha ular orqali ham murojaat qilishingiz mumkin.",
    "Universitet kutubxonasidan barcha talabalar bepul foydalanishi mumkin.",
  ],
};

export default function UniversitiesPage() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("Barchasi");
  const [showAmbassador, setShowAmbassador] = useState(false);

  const filtered = UNIVERSITIES.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.shortName.toLowerCase().includes(search.toLowerCase()) ||
      u.city.toLowerCase().includes(search.toLowerCase()) ||
      u.region.toLowerCase().includes(search.toLowerCase());
    const matchRegion = region === "Barchasi" || u.region === region;
    return matchSearch && matchRegion;
  });

  const nuu = UNIVERSITIES.find(u => u.id === "nuu")!;
  const nuuInFilter = filtered.some(u => u.id === "nuu");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {showAmbassador && <AmbassadorModal onClose={() => setShowAmbassador(false)} />}
      <main className="pt-16">

        {/* Hero */}
        <div className="border-b border-border bg-gradient-to-b from-blue-50 via-emerald-50/40 to-transparent dark:from-blue-950/30 dark:via-emerald-950/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 text-center">
            <Badge variant="violet" className="mb-4 text-xs px-3 py-1">Universitetlar tarmog'i</Badge>
            <h1 className="text-4xl font-extrabold text-foreground mb-3">O'zbekiston universitetlari qo'llanmasi</h1>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8 text-sm leading-relaxed">
              To'g'ri universitetni toping, talabalar bilan bog'laning va kampus hayotida yo'l toping.
              Barcha viloyatlar bo'ylab.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm">
              {[
                { value: `${UNIVERSITIES.length}+`, label: "Universitet", color: "text-violet-500 dark:text-violet-400" },
                { value: "10,000+", label: "Talaba", color: "text-blue-600 dark:text-blue-400" },
                { value: `${REGIONS.length}`, label: "Viloyat", color: "text-cyan-600 dark:text-cyan-400" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

          {/* NUU spotlight */}
          {nuuInFilter && <div className="mb-12 rounded-3xl border border-blue-500/30 bg-card overflow-hidden shadow-sm">
            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-[0_4px_20px_rgba(37,99,235,0.4)]">
                  NUU
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-foreground">O'zbekiston Milliy universiteti</h2>
                    <Badge variant="new" className="text-[10px] gap-1"><Star size={8} className="fill-current" /> Yetakchi ilmgoh</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">NUU · Toshkent shahri</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-2 space-y-4">
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    NUU — O'zbekistonning eng yirik va qadimiy davlat universitetlaridan biri bo'lib, tabiiy fanlar, gumanitar fanlar va ijtimoiy-iqtisodiy yo'nalishlarda kuchli dasturlarga ega. Poytaxt Toshkentda joylashgan bo'lib, mamlakatning turli burchaklaridan kelgan talabalar uchun katta ilmiy hamjamiyat yaratadi.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Users, label: `${nuu.students.toLocaleString()}+ talaba`, color: "text-blue-600 dark:text-blue-400" },
                      { icon: MapPin, label: "Toshkent shahri", color: "text-violet-500 dark:text-violet-400" },
                      { icon: GraduationCap, label: "Ko'plab fakultet va yo'nalishlar", color: "text-cyan-600 dark:text-cyan-400" },
                      { icon: Globe, label: "Almashinuv va qo'shma dasturlar", color: "text-emerald-600 dark:text-emerald-400" },
                    ].map(({ icon: Icon, label, color }) => (
                      <div key={label} className="flex items-center gap-2 text-xs text-foreground/70">
                        <Icon size={13} className={color} />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <h3 className="text-xs font-semibold text-foreground mb-2">Tezkor ma'lumot</h3>
                  <div className="flex items-start gap-2 text-foreground/70">
                    <MapPin size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{NUU_INFO.location}</span>
                  </div>
                  <a href={NUU_INFO.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                    <ExternalLink size={11} /> Rasmiy sayt →
                  </a>
                </div>
              </div>

              {/* Programs */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Mavjud dasturlar</p>
                <div className="flex flex-wrap gap-2">
                  {NUU_INFO.programs.map(p => (
                    <span key={p} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400">{p}</span>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500 dark:text-emerald-400" /> Talabalar uchun maslahatlar
                </p>
                <ul className="space-y-2">
                  {NUU_INFO.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-foreground/70 flex gap-2">
                      <span className="text-muted-foreground shrink-0">·</span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex gap-3">
                <Link href="/community" className="text-xs px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium">
                  NUU hamjamiyatini ko'rish
                </Link>
                <Link href="/jobs" className="text-xs px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  Toshkentdagi ishlarni topish
                </Link>
              </div>
            </div>
          </div>}

          {/* Search + region filter */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="max-w-sm">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Universitetlarni qidiring..."
                icon={<Search size={15} />}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {REGION_FILTERS.map(r => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    region === r
                      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/40"
                      : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            {region === "Barchasi" ? "Barcha universitetlar" : region} ({filtered.length})
          </h2>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(uni => (
              <a
                key={uni.id}
                href={uni.website || "/universities"}
                target={uni.website ? "_blank" : undefined}
                rel={uni.website ? "noopener noreferrer" : undefined}
                className="group p-5 rounded-2xl border border-border bg-card hover:border-blue-500/30 hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 block"
              >
                <div className="h-0.5 w-10 rounded-full mb-4" style={{ backgroundColor: uni.color }} />

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {uni.shortName}
                      </h3>
                      {uni.intl && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">Xorijiy filial</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">{uni.name}</p>
                  </div>
                  <ExternalLink size={12} className="text-muted-foreground/40 group-hover:text-blue-500 transition-colors mt-0.5 shrink-0" />
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin size={10} />
                    <span>{uni.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={10} />
                    <span>{uni.students.toLocaleString()} talaba</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5">{uni.region}</p>
              </a>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <GraduationCap size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Qidiruvingizga mos universitet topilmadi.</p>
            </div>
          )}

          {/* Ambassador CTA */}
          <div className="mt-12 relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/40 dark:to-blue-950/40 p-8 text-center">
            <Star size={28} className="text-violet-400/50 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">Elchi bo'ling</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-5">
              Universitetingizni TALABA'da vakillik qiling. Talabalarga yordam bering, tarmog'ingizni kengaytiring va e'tirof qozoning.
            </p>
            <button onClick={() => setShowAmbassador(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              Elchilikka ariza berish <Star size={13} />
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
