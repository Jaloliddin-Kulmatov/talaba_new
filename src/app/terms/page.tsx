import React from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

const sections = [
  {
    title: "Qabul qilish",
    body: `TALABA hisobini ochish orqali siz ushbu shartlarga rozilik bildirasiz. TALABA — O'zbekistonda o'qiydigan talabalar uchun platforma. Platformadan foydalanish uchun O'zbekiston universitetida o'qiyotgan yoki hujjat topshirayotgan bo'lishingiz kerak.`,
  },
  {
    title: "Sizning hisobingiz",
    body: `Login ma'lumotlaringiz xavfsizligini ta'minlash sizning javobgarligingizda. Ro'yxatdan o'tishda aniq ma'lumot berishingiz shart. Har bir shaxs uchun bitta hisob — takroriy hisoblar o'chirilishi mumkin. Hisob ochish uchun kamida 16 yoshda bo'lishingiz kerak.`,
  },
  {
    title: "Joylashtirgan kontentingiz",
    body: `TALABA'da yaratgan kontentingiz sizga tegishli. Post joylashtirish orqali siz bizga uni platformada ko'rsatish uchun litsenziya berasiz. Spam, dezinformatsiya, ta'qib yoki O'zbekiston qonunchiligini buzadigan kontent joylashtirmaslikka rozilik bildirasiz. Biz ushbu qoidalarni buzadigan kontentni o'chirib tashlashimiz mumkin.`,
  },
  {
    title: "AI Yordamchi",
    body: `TALABA AI'si talabalar uchun umumiy yo'l-yo'riq beradi. U universitetingizning tegishli bo'limi, yurist yoki davlat idoralarining rasmiy maslahatini almashtirmaydi. Qabul, DTM va boshqa muhim rasmiy ma'lumotlarni har doim rasmiy manbalardan tekshiring.`,
  },
  {
    title: "Ish o'rinlari va elchilar dasturi",
    body: `TALABA ma'lumot maqsadida ish o'rinlari va amaliyot imkoniyatlarini ro'yxatlaydi. Biz bandlikni kafolatlamaymiz va biror ish beruvchini tavsiya qilmaymiz. Elchilik arizalari jamoamiz tomonidan ko'rib chiqiladi va biz har qanday arizani tasdiqlash yoki rad etish huquqini o'zimizda saqlaymiz.`,
  },
  {
    title: "Hisobni tugatish",
    body: `Siz istalgan vaqtda hisobingizni o'chirishingiz mumkin. Biz ushbu shartlarni buzadigan hisoblarni to'xtatib qo'yishimiz yoki tugatishimiz mumkin. Hisob tugatilgandan so'ng, o'chirishni so'ramagan holda ommaviy postlaringiz ko'rinishda qolishi mumkin.`,
  },
  {
    title: "Javobgarlik cheklovi",
    body: `TALABA "bor holicha" taqdim etiladi. Biz platformada topilgan kontent, jumladan AI javoblari asosida qabul qilgan qarorlaringiz uchun javobgar emasmiz. Elonlar, qo'llanmalar yoki hamjamiyat postlarining aniqligi bo'yicha kafolat bermaymiz.`,
  },
  {
    title: "Shartlarga o'zgartirishlar",
    body: `Biz ushbu shartlarni yangilashimiz mumkin. Muhim o'zgarishlar haqida sizni email yoki ilova ichidagi bildirishnoma orqali xabardor qilamiz. O'zgarishlardan keyin platformadan foydalanishni davom ettirish yangilangan shartlarni qabul qilganingizni anglatadi.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-foreground mb-2">Foydalanish shartlari</h1>
            <p className="text-xs text-muted-foreground">Oxirgi yangilanish: 2026-yil iyul · TALABA</p>
          </div>

          <div className="space-y-8">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="text-sm font-bold text-foreground mb-2">{s.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-4 rounded-xl border border-border bg-card">
            <p className="text-xs text-muted-foreground">
              Savollaringiz bormi?{" "}
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
