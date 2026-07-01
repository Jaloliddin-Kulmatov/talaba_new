"""
Curated fallback internship/part-time job listings for TALABA.

Mirrors ICOM's `jeonju_jobs.py` pattern: a hand-maintained list seeded at boot
(see `_seed_talaba_jobs()` in app.py) so the Jobs page is populated and useful
immediately, independent of whether the live hh.uz scraper (`scrapers/hh_uz.py`)
can reach `api.hh.ru` from the current host.

IMPORTANT — these are ILLUSTRATIVE placeholder listings, not scraped-and-verified
live postings. Each `apply_link` points at the REAL homepage/careers page of a
real, well-known company operating in Uzbekistan (verified reachable), but the
specific role/description/deadline text below is representative content for a
typical opening at that company, not a copy of one confirmed-live posting.
Treat this list as a starting point: an admin should replace these with actual
current openings (via the admin panel or a verified scrape) as soon as
possible after launch — do not present this list to users as verified-live
without that follow-up.
"""

TALABA_JOBS = [
    {
        "title": "Frontend dasturchi (stajyor)",
        "company": "Uzum",
        "location": "Toshkent",
        "type": "internship",
        "salary": "Kelishilgan holda",
        "description": (
            "Uzum Market va Uzum Bank mahsulotlari uchun frontend jamoasida "
            "stajirovka. React asosidagi loyihalarda ishlash, kod review'larda "
            "qatnashish va real foydalanuvchi interfeyslarini ishlab chiqishda "
            "tajriba orttirish imkoniyati."
        ),
        "requirements": (
            "JavaScript/TypeScript asoslari\nReact haqida umumiy tushuncha\n"
            "Git bilan ishlay olish\nO'qish bilan birga moslashuvchan grafikda ishlash imkoniyati"
        ),
        "schedule_compatible": "kunduzgi, sirtqi, kechki",
        "deadline": "",
        "tags": "React, JavaScript, Frontend",
        "apply_link": "https://uzum.com/uz/careers",
        "student_friendly": "ha",
        "student_friendly_note": "Stajirovka dasturi talabalar uchun moslashuvchan grafik bilan.",
    },
    {
        "title": "Mijozlarga xizmat ko'rsatish bo'yicha mutaxassis (qisman bandlik)",
        "company": "Beeline Uzbekistan",
        "location": "Toshkent",
        "type": "part-time",
        "salary": "Soatbay to'lov",
        "description": (
            "Beeline call-markazida mijozlarning savollariga javob berish, "
            "tarif va xizmatlar bo'yicha maslahat berish. Kechki va dam olish "
            "kunlari smenalar mavjud — talabalar uchun qulay."
        ),
        "requirements": (
            "Yaxshi muloqot ko'nikmalari\nO'zbek va rus tillarini bilish\n"
            "Kompyuterda ishlay olish"
        ),
        "schedule_compatible": "kunduzgi, sirtqi, kechki",
        "deadline": "",
        "tags": "Call-markaz, Mijozlar xizmati",
        "apply_link": "https://beeline.uz/uz/about/vacancies",
        "student_friendly": "ha",
        "student_friendly_note": "Kechki smenalar va qisman bandlik talabalarga mos.",
    },
    {
        "title": "Frontend/Backend dasturchi (stajyor)",
        "company": "EPAM Systems",
        "location": "Toshkent",
        "type": "internship",
        "salary": "Kelishilgan holda",
        "description": (
            "EPAM'ning O'zbekistondagi ofisida xalqaro loyihalar ustida ishlash "
            "imkoniyati beruvchi stajirovka dasturi. Mentorlik, kod review va "
            "amaliy loyihalar orqali professional o'sish."
        ),
        "requirements": (
            "Dasturlash tillaridan birini bilish (Java, Python, JavaScript)\n"
            "Algoritmlar va ma'lumotlar tuzilmalari asoslari\nInglizcha o'rta darajada"
        ),
        "schedule_compatible": "kunduzgi, sirtqi",
        "deadline": "",
        "tags": "Java, Python, Stajirovka",
        "apply_link": "https://www.epam.com/careers",
        "student_friendly": "ha",
        "student_friendly_note": "Stajirovka dasturi universitet jadvaliga moslashtiriladi.",
    },
    {
        "title": "IT loyihalar uchun startap hamkori/stajyor",
        "company": "IT Park Uzbekistan",
        "location": "Toshkent",
        "type": "internship",
        "salary": "Loyihaga bog'liq",
        "description": (
            "IT Park rezidenti kompaniyalar tomonidan e'lon qilingan qisqa "
            "muddatli loyihalarda ishtirok etish, startaplar bilan tanishish "
            "va IT ekotizimida tajriba orttirish imkoniyati."
        ),
        "requirements": (
            "Dasturlash yoki loyiha boshqaruviga qiziqish\nJamoada ishlay olish"
        ),
        "schedule_compatible": "barchasi",
        "deadline": "",
        "tags": "Startap, IT Park, Loyiha",
        "apply_link": "https://itpark.uz",
        "student_friendly": "unclear",
        "student_friendly_note": "Grafik rezident kompaniyaga qarab farq qiladi.",
    },
    {
        "title": "Marketing bo'limi assistenti (qisman bandlik)",
        "company": "Artel Electronics",
        "location": "Toshkent",
        "type": "part-time",
        "salary": "Kelishilgan holda",
        "description": (
            "Artel'ning marketing jamoasida ijtimoiy tarmoqlar kontenti, "
            "bozor tahlili va reklama kampaniyalarini kuzatishda yordam berish."
        ),
        "requirements": (
            "Ijtimoiy tarmoqlar bilan yaxshi tanish\nCanva yoki shunga o'xshash "
            "dizayn vositalaridan foydalana olish\nMarketingga qiziqish"
        ),
        "schedule_compatible": "kunduzgi, sirtqi, kechki",
        "deadline": "",
        "tags": "SMM, Marketing",
        "apply_link": "https://artel.uz",
        "student_friendly": "ha",
        "student_friendly_note": "Qisman bandlik va moslashuvchan soatlar taklif etiladi.",
    },
    {
        "title": "Mobil ilova sinovchisi (QA stajyor)",
        "company": "Click",
        "location": "Toshkent",
        "type": "internship",
        "salary": "Kelishilgan holda",
        "description": (
            "Click to'lov tizimi mobil ilovalarini sinovdan o'tkazish, "
            "xatoliklarni aniqlash va QA jamoasi bilan ishlash bo'yicha "
            "boshlang'ich darajadagi stajirovka."
        ),
        "requirements": (
            "Diqqatga e'tiborli bo'lish\nAsosiy IT savodxonlik\n"
            "QA sohasiga qiziqish (tajriba shart emas)"
        ),
        "schedule_compatible": "kunduzgi, sirtqi, kechki",
        "deadline": "",
        "tags": "QA, Testing, Fintex",
        "apply_link": "https://click.uz",
        "student_friendly": "ha",
        "student_friendly_note": "Stajyorlar uchun moslashuvchan jadval mavjud.",
    },
    {
        "title": "Mijozlar bilan ishlash bo'yicha operator (kechki smena)",
        "company": "Payme",
        "location": "Toshkent",
        "type": "part-time",
        "salary": "Soatbay to'lov",
        "description": (
            "Payme qo'llab-quvvatlash markazida foydalanuvchilarning savollariga "
            "javob berish. Kechki va tungi smenalar mavjud, kunduzi darsga "
            "qatnaydigan talabalar uchun mos."
        ),
        "requirements": (
            "Yaxshi muloqot ko'nikmalari\nStress ostida ishlay olish"
        ),
        "schedule_compatible": "kunduzgi, sirtqi",
        "deadline": "",
        "tags": "Fintex, Qo'llab-quvvatlash",
        "apply_link": "https://payme.uz",
        "student_friendly": "ha",
        "student_friendly_note": "Kechki/tungi smenalar aynan talabalar uchun moslashtirilgan.",
    },
    {
        "title": "Bank filiali operatsion bo'limi stajyori",
        "company": "Ipak Yo'li Bank",
        "location": "Toshkent",
        "type": "internship",
        "salary": "Kelishilgan holda",
        "description": (
            "Bank filialida kunlik operatsion jarayonlar, mijozlarga xizmat "
            "ko'rsatish va hujjat aylanishi bilan tanishish imkoniyatini "
            "beruvchi stajirovka dasturi."
        ),
        "requirements": (
            "Moliya yoki iqtisodiyot yo'nalishida tahsil olayotgan bo'lish "
            "afzallik\nDiqqatga e'tiborli va intizomli bo'lish"
        ),
        "schedule_compatible": "sirtqi",
        "deadline": "",
        "tags": "Bank, Moliya, Stajirovka",
        "apply_link": "https://ipakyulibank.uz",
        "student_friendly": "unclear",
        "student_friendly_note": "Bank ish kunlari kunduzgi jadval bilan to'qnashishi mumkin.",
    },
    {
        "title": "Ijtimoiy tarmoqlar menejeri yordamchisi (remote, qisman)",
        "company": "Korzinka",
        "location": "Toshkent (masofaviy mumkin)",
        "type": "remote",
        "salary": "Kelishilgan holda",
        "description": (
            "Korzinka' ning ijtimoiy tarmoqlaridagi kontent rejasini tuzishda, "
            "postlar tayyorlashda va statistikani kuzatishda yordam berish."
        ),
        "requirements": (
            "Ijtimoiy tarmoqlarda faol foydalanuvchi bo'lish\nMatn yozish "
            "ko'nikmalari"
        ),
        "schedule_compatible": "barchasi",
        "deadline": "",
        "tags": "SMM, Remote, Kontent",
        "apply_link": "https://korzinka.uz",
        "student_friendly": "ha",
        "student_friendly_note": "Masofaviy va qisman bandlik — jadval talabaga moslashadi.",
    },
    {
        "title": "Backend dasturchi (Python, stajyor)",
        "company": "Uzcard",
        "location": "Toshkent",
        "type": "internship",
        "salary": "Kelishilgan holda",
        "description": (
            "To'lov tizimlari sohasida backend xizmatlarini rivojlantirish "
            "jamoasida stajirovka. Real production kod bazasi bilan ishlash "
            "va mentor rahbarligida o'sish imkoniyati."
        ),
        "requirements": (
            "Python yoki Java asoslari\nSQL bilan ishlay olish\n"
            "Algoritmlarga qiziqish"
        ),
        "schedule_compatible": "kunduzgi, sirtqi",
        "deadline": "",
        "tags": "Python, Backend, Fintex",
        "apply_link": "https://uzcard.uz",
        "student_friendly": "ha",
        "student_friendly_note": "Stajirovka jadvali universitet darslariga moslashtiriladi.",
    },
    {
        "title": "HR bo'limi assistenti (qisman bandlik)",
        "company": "Ucell",
        "location": "Toshkent",
        "type": "part-time",
        "salary": "Kelishilgan holda",
        "description": (
            "Ucell HR jamoasida nomzodlar bilan bog'lanish, suhbatlarni "
            "rejalashtirish va hujjatlarni tartibga solishda yordam berish."
        ),
        "requirements": (
            "Tartibli va mas'uliyatli bo'lish\nMS Office dasturlarini bilish"
        ),
        "schedule_compatible": "kunduzgi, sirtqi, kechki",
        "deadline": "",
        "tags": "HR, Ofis ishi",
        "apply_link": "https://ucell.uz",
        "student_friendly": "ha",
        "student_friendly_note": "Qisman bandlik, moslashuvchan haftalik soatlar.",
    },
    {
        "title": "Ingliz tili repetitori (onlayn, qisman)",
        "company": "Preply / xususiy repetitorlik",
        "location": "Onlayn",
        "type": "remote",
        "salary": "Darsbay to'lov",
        "description": (
            "Boshlang'ich va o'rta darajadagi o'quvchilarga onlayn ingliz "
            "tili darslarini o'tish. To'liq moslashuvchan jadval — o'zingiz "
            "band bo'lgan vaqtlarni tanlaysiz."
        ),
        "requirements": (
            "IELTS 6.5+ yoki unga teng daraja\nO'qitish tajribasi (ixtiyoriy)"
        ),
        "schedule_compatible": "barchasi",
        "deadline": "",
        "tags": "Repetitorlik, Til, Remote",
        "apply_link": "https://preply.com",
        "student_friendly": "ha",
        "student_friendly_note": "To'liq moslashuvchan, o'z jadvali bo'yicha ishlash mumkin.",
    },
    {
        "title": "Ma'lumotlar tahlili (Data Analytics) stajyori",
        "company": "TBC Bank Uzbekistan",
        "location": "Toshkent",
        "type": "internship",
        "salary": "Kelishilgan holda",
        "description": (
            "Bank ichki ma'lumotlarini tahlil qilish, hisobotlar tayyorlash "
            "va SQL/Excel asosida boshlang'ich darajadagi tahliliy vazifalarni "
            "bajarish bo'yicha stajirovka."
        ),
        "requirements": (
            "Excel va asosiy statistika bilimi\nSQL asoslari (afzallik)\n"
            "Iqtisodiyot, matematika yoki IT yo'nalishida tahsil olish"
        ),
        "schedule_compatible": "sirtqi",
        "deadline": "",
        "tags": "Data Analytics, SQL, Bank",
        "apply_link": "https://tbcbank.uz",
        "student_friendly": "unclear",
        "student_friendly_note": "Bank ish kuni jadvali kunduzgi talabalar uchun qiyin bo'lishi mumkin.",
    },
    {
        "title": "Kontent yozuvchi / kopirayter (qisman, remote)",
        "company": "Xususiy IT kompaniyalar (frilanser platformalar orqali)",
        "location": "Onlayn",
        "type": "remote",
        "salary": "Loyihabay to'lov",
        "description": (
            "Veb-saytlar va ijtimoiy tarmoqlar uchun o'zbek va rus tillarida "
            "matn yozish. Loyiha asosida ishlash, o'z vaqtingizni o'zingiz "
            "boshqarasiz."
        ),
        "requirements": (
            "Yaxshi yozma nutq\nO'zbek va rus tillarida grammatik savodxonlik"
        ),
        "schedule_compatible": "barchasi",
        "deadline": "",
        "tags": "Kopirayting, Remote, Frilans",
        "apply_link": "https://hh.uz",
        "student_friendly": "ha",
        "student_friendly_note": "Loyiha asosida — to'liq moslashuvchan jadval.",
    },
    {
        "title": "Kichik biznes uchun SMM stajyori",
        "company": "Mahalliy startaplar (IT Park hamkorlik dasturi)",
        "location": "Toshkent",
        "type": "internship",
        "salary": "Kelishilgan holda",
        "description": (
            "Kichik va o'rta biznes egalari uchun Instagram/Telegram "
            "kanallarini boshqarish, kontent reja tuzish va statistika "
            "yuritishda amaliyot o'tash imkoniyati."
        ),
        "requirements": (
            "Ijtimoiy tarmoqlarga qiziqish\nCanva yoki Figma asoslari (afzallik)"
        ),
        "schedule_compatible": "kunduzgi, sirtqi, kechki",
        "deadline": "",
        "tags": "SMM, Startap, Stajirovka",
        "apply_link": "https://hh.uz/search/vacancy?text=SMM+stajyor",
        "student_friendly": "ha",
        "student_friendly_note": "Amaliyot dasturi talabalar jadvaliga moslashtirilgan.",
    },
]
