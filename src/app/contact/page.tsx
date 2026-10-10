import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Mail, MessageSquare, Globe, Send } from "lucide-react";

const channels = [
  {
    icon: MessageSquare,
    title: "Hamjamiyat forumi",
    desc: "Savol bering va bu yerdan o'tgan talabalardan javob oling.",
    action: "Hamjamiyatga o'tish",
    href: "/community",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Globe,
    title: "AI Yordamchi",
    desc: "Qabul, turargoh, stipendiya va kampus hayoti haqida tezkor javoblar oling.",
    action: "AI'dan so'rash",
    href: "/dashboard/ai",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Mail,
    title: "Email orqali yordam",
    desc: "Hisob muammolari, hamkorlik yoki boshqa savollar uchun.",
    action: "jaloliddinqulmatov12@gmail.com",
    href: "mailto:jaloliddinqulmatov12@gmail.com",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Send,
    title: "Telegram kanali",
    desc: "So'nggi yangiliklar, e'lonlar va tezkor javoblar uchun rasmiy kanalimizga qo'shiling.",
    action: "@talaba_uz",
    href: "https://t.me/talaba_uz",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-foreground mb-3">Bog&apos;lanish va yordam</h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Yordam berishga tayyormiz. Javobni eng tez oladigan usulni tanlang.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            {channels.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="p-5 rounded-2xl border border-border bg-card">
                  <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.color} flex items-center justify-center mb-3`}>
                    <Icon size={18} />
                  </div>
                  <h2 className="text-sm font-bold text-foreground mb-1">{c.title}</h2>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{c.desc}</p>
                  <Link href={c.href} className={`text-xs font-semibold ${c.color} hover:underline`}>
                    {c.action} →
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card text-center">
            <p className="text-sm font-semibold text-foreground mb-1">TALABA</p>
            <p className="text-xs text-muted-foreground mb-2">
              2026-yildan buyon O&apos;zbekiston talabalarini qo&apos;llab-quvvatlaymiz.
            </p>
            <p className="text-xs text-muted-foreground">
              Hamkorlik bo&apos;yicha murojaatlar:{" "}
              <a href="mailto:jaloliddinqulmatov12@gmail.com" className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300">
                jaloliddinqulmatov12@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
