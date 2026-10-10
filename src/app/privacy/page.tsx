import React from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

const sections = [
  {
    id: "data",
    title: "Qanday ma'lumotlarni to'playmiz",
    body: `Biz TALABA'ni ishga tushirish uchun zarur bo'lgan ma'lumotlarnigina to'playmiz: ro'yxatdan o'tishda ismingiz, email manzilingiz, universitetingiz, viloyatingiz va grant/kontrakt turi. Shuningdek, xizmatni ko'rsatish uchun siz yaratgan kontentni — postlar, klub a'zoligi, ish arizalari va AI chat tarixini — saqlaymiz.`,
  },
  {
    id: "use",
    title: "Undan qanday foydalanamiz",
    body: `Ma'lumotlaringiz tajribangizni shaxsiylashtirish (tegishli ish o'rinlari, klublar va tavsiyalarni ko'rsatish), platformani ishga tushirish va sizga muhim xizmat yangilanishlarini yuborish uchun ishlatiladi. Biz ma'lumotlaringizni uchinchi tomonlarga sotmaymiz.`,
  },
  {
    id: "ai",
    title: "AI suhbatlari",
    body: `AI chat xabarlari javob yaratish uchun Groq'ga (AI provayderimiz) yuboriladi. Suhbat kontekstini ta'minlash uchun so'nggi chat tarixingizni serverlarimizda saqlaymiz. Tarixingizni istalgan vaqtda boshqaruv paneli sozlamalaridan tozalashingiz mumkin.`,
  },
  {
    id: "cookies",
    title: "Cookie fayllar",
    body: `Sizni tizimga kirgan holda saqlash uchun brauzeringizning localStorage'ida bitta autentifikatsiya tokenidan foydalanamiz. Uchinchi tomon kuzatuv yoki reklama cookie fayllaridan foydalanmaymiz. Tizimdan chiqqaningizda sessiya tokeningiz tozalanadi.`,
  },
  {
    id: "security",
    title: "Xavfsizlik",
    body: `Parollar bcrypt yordamida xeshlanadi va hech qachon ochiq matnda saqlanmaydi. Barcha ma'lumotlar HTTPS orqali uzatiladi. JWT sessiya tokeningiz avtomatik ravishda muddati tugaydi. Agar ruxsatsiz kirishdan shubhalansangiz, darhol parolingizni o'zgartiring va biz bilan bog'laning.`,
  },
  {
    id: "rights",
    title: "Sizning huquqlaringiz",
    body: `Ma'lumotlaringiz nusxasini so'rashingiz, profilingizni istalgan vaqtda Sozlamalarda yangilashingiz yoki jaloliddinqulmatov12@gmail.com orqali biz bilan bog'lanib hisobingizni o'chirishni so'rashingiz mumkin. O'chirish so'rovlarini 7 ish kuni ichida bajaramiz.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-foreground mb-2">Maxfiylik siyosati</h1>
            <p className="text-xs text-muted-foreground">Oxirgi yangilanish: 2026-yil iyul · TALABA</p>
          </div>

          <div className="space-y-8">
            {sections.map((s) => (
              <div key={s.id} id={s.id}>
                <h2 className="text-sm font-bold text-foreground mb-2">{s.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-4 rounded-xl border border-border bg-card">
            <p className="text-xs text-muted-foreground">
              Ushbu siyosat bo&apos;yicha savollaringiz bormi?{" "}
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
