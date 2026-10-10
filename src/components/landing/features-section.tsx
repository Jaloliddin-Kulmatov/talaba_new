import React from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  GraduationCap,
  Globe,
  Sparkles,
  Shield,
  MessageSquare,
  Bell,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Users,
    color: "from-blue-500 to-violet-500",
    badge: "Hamjamiyat",
    title: "Talabalar hamjamiyat platformasi",
    description:
      "O'zbekistondagi barcha universitetlar talabalari bilan bog'laning. Tajriba almashing, savol bering va tarmog'ingizni kengaytiring.",
    highlights: ["Universitet asosidagi kanallar", "Real vaqtda guruh chatlari", "Talabalar uchun tarmoq tadbirlari", "Muhokama lentalari"],
    href: "/community",
  },
  {
    icon: GraduationCap,
    color: "from-violet-500 to-purple-500",
    badge: "Elchilar",
    title: "Universitet elchilari tizimi",
    description:
      "Har bir kampusdan tasdiqlangan elchilar muhim e'lonlar, tadbirlar, stipendiya xabarlari va favqulodda bildirishnomalarni yetkazib beradi.",
    highlights: ["Tasdiqlangan kampus vakillari", "Favqulodda ogohlantirishlar", "Stipendiya bo'yicha xabarnomalar", "Rasmiy tadbirlar ro'yxati"],
    href: "/universities",
  },
  {
    icon: Briefcase,
    color: "from-blue-500 to-cyan-500",
    badge: "Karyera",
    title: "Ish va amaliyot platformasi",
    description:
      "Talabalar uchun AI yordamida ish moslashtirish. Dars jadvaliga moslik, maosh, joylashuv va ish soatlari bo'yicha filtrlang.",
    highlights: ["Dars jadvaliga mos ish filtri", "AI yordamida ish moslashtirish", "300+ faol e'lon", "Tadqiqot imkoniyatlari"],
    href: "/jobs",
  },
  {
    icon: Globe,
    color: "from-emerald-500 to-teal-500",
    badge: "Yordam",
    title: "Talabalarga yordam qo'llanmalari",
    description:
      "Har bir muammo uchun bosqichma-bosqich qo'llanmalar — qabul va DTM, turargoh, stipendiya, harbiy hisob va boshqalar.",
    highlights: ["Qabul va DTM qo'llanmalari", "Turargohga joylashish", "Stipendiya va moliya yordami", "Harbiy hisobga olish yordami"],
    href: "/support",
  },
  {
    icon: Sparkles,
    color: "from-amber-500 to-orange-500",
    badge: "AI",
    title: "AI yordamida ishlaydigan yordamchi",
    description:
      "O'zbekistondagi talaba hayoti uchun shaxsiy AI yo'riqchingiz. Tezkor javoblar, aqlli tavsiyalar va yo'naltirish.",
    highlights: ["24/7 ishlaydigan AI chatbot", "Qabul, DTM va turargoh bo'yicha javoblar", "Shaxsiylashtirilgan tavsiyalar", "Aqlli onboarding"],
    href: "/dashboard/ai",
  },
  {
    icon: Shield,
    color: "from-pink-500 to-rose-500",
    badge: "Xavfsizlik",
    title: "Xavfsiz universitet autentifikatsiyasi",
    description:
      "Universitet email orqali tasdiqlash, OAuth bilan kirish va kelajakda SSO qo'llab-quvvatlash. Shaxsingiz tasdiqlangan va himoyalangan.",
    highlights: ["Universitet email tasdiqlash", "Google/Apple OAuth", "Ikki bosqichli autentifikatsiya", "Maxfiylikni himoya qilish"],
    href: "/register",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 relative overflow-hidden" id="features">
      {/* Background accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="default" className="mb-4 text-xs px-4 py-1">
            Kerak bo&apos;lgan hamma narsa
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Talabalik safarining har bosqichi uchun
            <span className="gradient-text"> yaratilgan</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Universitetga hujjat topshirishdan tortib, karyerangizni boshlashgacha — TALABA har bir bosqichda yoningizda.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                href={feature.href}
                className="group relative p-6 rounded-2xl bg-card border border-border shadow-sm hover:border-blue-500/30 hover:shadow-card transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-r ${feature.color} opacity-10 blur-2xl`} />
                </div>

                {/* Icon */}
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} mb-4 shadow-lg`}>
                  <Icon size={20} className="text-white" />
                </div>

                <Badge variant="outline" className="text-[10px] mb-3">
                  {feature.badge}
                </Badge>

                <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {feature.description}
                </p>

                <ul className="space-y-1.5">
                  {feature.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-blue-400 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-1 mt-5 text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Batafsil
                  <ArrowRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
