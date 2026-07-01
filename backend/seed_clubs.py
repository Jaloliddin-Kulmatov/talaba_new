"""
Seed data — viloyat (region) based student communities, plus a handful of
general campus-life communities not tied to any single region.

These become Club rows with club_type="community" (visible to every student,
regardless of which university or region they registered with). See
_seed_regional_communities() in app.py for how this list is consumed.

Category values are intentionally restricted to what the frontend's
COMMUNITY_CATEGORIES filter expects (see src/app/community/page.tsx):
"national community" | "religion & culture" | "support & community"
"""

SEED_CLUBS = [

    # ── Toshkent shahri va viloyati ─────────────────────────────────────────
    {
        "name": "Toshkent shahri talabalar jamiyati",
        "description": (
            "Toshkentda tug'ilib o'sgan va poytaxt oliy ta'lim muassasalarida o'qiydigan "
            "talabalarni birlashtiruvchi jamiyat. A'zolar boshqa viloyatlardan yangi ko'chib "
            "kelgan talabalarga shahar hayotiga moslashish, ijaraga uy topish va jamoat "
            "transportidan foydalanish bo'yicha maslahat berishadi. Har o'quv yili boshida "
            "birinchi kurs talabalari uchun \"Toshkentni tanishtirish\" sayohati uyushtiriladi."
        ),
        "category": "national community",
        "university": "",
        "meeting_time": "Har o'quv yili boshida va so'rov bo'yicha",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "Toshkent shahri",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "Toshkent viloyati talabalar uyushmasi",
        "description": (
            "Bo'stonliq, Zangiota, Qibray va Toshkent viloyatining boshqa tumanlaridan kelib, "
            "poytaxt oliygohlarida tahsil olayotgan talabalarni birlashtiruvchi uyushma. "
            "Hafta oxirlarida qishlog'iga qatnovchi talabalar o'rtasida transport va yo'lkira "
            "haqida ma'lumot almashinadi. Navro'z va Mustaqillik kuni arafasida "
            "qishloqdoshlar bilan uchrashuv kechalari tashkil etiladi."
        ),
        "category": "national community",
        "university": "",
        "meeting_time": "Har oyning oxirgi yakshanbasi",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "Toshkent viloyati",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },

    # ── Farg'ona vodiysi ─────────────────────────────────────────────────────
    {
        "name": "Andijonliklar jamiyati",
        "description": (
            "Andijon viloyatidan Toshkent va boshqa shaharlarga o'qishga kelgan talabalarni "
            "bir joyga jamlovchi jamiyat. A'zolar orasida qishloqqa birga yo'l yuradigan "
            "hamqishloqlarni topish, imtihon davrida konspekt almashish va ish qidirishda "
            "yordam berish odat tusiga kirgan. Har yili qovun sayli va Andijon pallasi "
            "an'analarini poytaxtda ham nishonlashadi."
        ),
        "category": "national community",
        "university": "",
        "meeting_time": "Har oyning birinchi shanbasi",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "Andijon",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "Farg'onaliklar jamiyati",
        "description": (
            "Farg'ona viloyatidan bo'lgan talabalarning norasmiy, ammo faol jamoasi. Yangi "
            "qabul qilingan farg'onalik talabalarga yotoqxonaga joylashish va hujjat topshirish "
            "jarayonida amaliy yordam ko'rsatiladi. Har chorakda o'zaro tanishuv kechalari "
            "(fatir, tandir kabob) uyushtiriladi."
        ),
        "category": "national community",
        "university": "",
        "meeting_time": "Har chorakda bir marta",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "Farg'ona",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "Namanganliklar jamiyati",
        "description": (
            "Namangan viloyatidan Toshkentdagi universitetlarga o'qishga kelgan talabalar "
            "uchun mo'ljallangan qo'llab-quvvatlash jamiyati. Semestr boshida yangi kelgan "
            "birinchi kurs talabalariga hujjatlashtirish, ro'yxatdan o'tish va yashash joyi "
            "masalalarida yo'l-yo'riq ko'rsatiladi. Yiliga ikki marta — Navro'z va yoz ta'tili "
            "oldidan — namanganlik talabalar uchrashuvi bo'lib o'tadi."
        ),
        "category": "national community",
        "university": "",
        "meeting_time": "Yiliga ikki marta (Navro'z va yoz ta'tili oldidan)",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "Namangan",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },

    # ── Zarafshon vodiysi ────────────────────────────────────────────────────
    {
        "name": "Samarqandliklar jamiyati",
        "description": (
            "Samarqand viloyatidan kelgan talabalarni birlashtiruvchi jamiyat, ko'proq o'zaro "
            "axborot almashishga urg'u beradi: stipendiya kechikkanda o'zaro qarz-yordam "
            "tizimi, bo'sh ish o'rinlari haqida xabar almashish. Ustozlar bayrami va Samarqand "
            "shahar kuni munosabati bilan yig'ilishlar tashkil qilinadi."
        ),
        "category": "national community",
        "university": "",
        "meeting_time": "Muhim sanalar oldidan (Ustozlar bayrami, Shahar kuni)",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "Samarqand",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "Buxoroliklar jamiyati",
        "description": (
            "Buxoro viloyatidan bo'lgan talabalar uchun mo'ljallangan jamiyat — asosiy maqsad "
            "birinchi kursdagi buxorolik talabalarga katta kurslardan mentor biriktirish. "
            "Imtihon mavsumida kutubxonada birgalikda tayyorgarlik ko'rish seanslari tashkil "
            "etiladi."
        ),
        "category": "national community",
        "university": "",
        "meeting_time": "Imtihon mavsumida haftalik",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "Buxoro",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "Navoiyliklar jamiyati",
        "description": (
            "Navoiy viloyatidan bo'lgan talabalarni birlashtiruvchi kichik, ammo faol jamiyat. "
            "A'zolar sanoat korxonalarida amaliyot va ishga joylashish imkoniyatlari haqida "
            "ma'lumot almashadi. Har semestr boshida yangi talabalarga yotoqxona va ro'yxatdan "
            "o'tish masalalarida yordam beriladi."
        ),
        "category": "national community",
        "university": "",
        "meeting_time": "Har semestr boshida",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "Navoiy",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },

    # ── Janubiy viloyatlar ───────────────────────────────────────────────────
    {
        "name": "Qashqadaryoliklar jamiyati",
        "description": (
            "Qashqadaryo viloyatidan kelib o'qiyotgan talabalarning o'zaro yordam tarmog'i. "
            "Ish beruvchilar bilan uchrashuv va amaliyot o'tash imkoniyatlari haqida "
            "ma'lumotlar almashiladi. Ramazon va Qurbon hayit kunlari birgalikda iftorlik va "
            "bayramona tadbirlar o'tkaziladi."
        ),
        "category": "national community",
        "university": "",
        "meeting_time": "Diniy bayramlar arafasida",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "Qashqadaryo",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "Surxondaryoliklar jamiyati",
        "description": (
            "Surxondaryo viloyatidan bo'lgan talabalarni birlashtiruvchi norasmiy jamiyat. "
            "Uzoq masofa tufayli kam-kam qishlog'iga qatnaydigan talabalar uchun yo'l "
            "xarajatlarini baham ko'rish va birga yo'l yurish odat tusiga kirgan. Har yili "
            "\"Surxon oqshomi\" nomli milliy taomlar kechasi tashkil qilinadi."
        ),
        "category": "national community",
        "university": "",
        "meeting_time": "Yiliga bir marta (\"Surxon oqshomi\")",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "Surxondaryo",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },

    # ── G'arbiy viloyatlar ───────────────────────────────────────────────────
    {
        "name": "Xorazmliklar jamiyati",
        "description": (
            "Xiva va Urganchdan kelib Toshkentda o'qiyotgan talabalarni bog'lovchi jamiyat. "
            "A'zolar bir-biriga viloyatga qaytish yo'l-transporti va turli tashkilotlardagi "
            "amaliyot imkoniyatlari haqida xabar berib turishadi. Yiliga bir marta xorazmcha "
            "lazgi va milliy raqs kechasi o'tkaziladi."
        ),
        "category": "national community",
        "university": "",
        "meeting_time": "Yiliga bir marta (milliy raqs kechasi)",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "Xorazm",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "Qoraqalpog'iston talabalari jamiyati",
        "description": (
            "Qoraqalpog'iston Respublikasidan Toshkent va boshqa shaharlarga o'qishga kelgan "
            "talabalarni birlashtiruvchi jamiyat. Uzoq masofa tufayli yuzaga keladigan "
            "qiyinchiliklarda (hujjatlashtirish, moslashish) yangi talabalarga tajribali "
            "qishloqdoshlar yordam beradi. Qoraqalpoq tili va madaniyatini asrab qolish "
            "maqsadida yiliga bir marta milliy bayram kechasi o'tkaziladi."
        ),
        "category": "national community",
        "university": "",
        "meeting_time": "Yiliga bir marta (milliy bayram kechasi)",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "Qoraqalpog'iston Respublikasi",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },

    # ── Markaziy viloyatlar ──────────────────────────────────────────────────
    {
        "name": "Jizzaxliklar jamiyati",
        "description": (
            "Jizzax viloyatidan kelgan talabalar uchun tashkil etilgan qo'llab-quvvatlash "
            "jamiyati. Poytaxtga endi kelgan talabalarga transport chiptalari, hujjat "
            "topshirish va turar-joy masalalarida amaliy maslahat beriladi. Har yili Navro'z "
            "bayrami arafasida qishloqdoshlar uchrashuvi tashkil qilinadi."
        ),
        "category": "national community",
        "university": "",
        "meeting_time": "Navro'z bayrami arafasida",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "Jizzax",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "Sirdaryoliklar jamiyati",
        "description": (
            "Guliston va Sirdaryo viloyatining boshqa tumanlaridan kelgan talabalarni "
            "bog'laydigan kichik jamoa. Semestr davomida konspekt va o'quv materiallari "
            "almashinuvi, imtihon oldidan birgalikda tayyorgarlik ko'rish amaliyoti mavjud. "
            "Yozgi ta'til oldidan qishlog'iga birgalikda qaytish uchun yo'lovchi guruhlari "
            "tuziladi."
        ),
        "category": "national community",
        "university": "",
        "meeting_time": "Imtihon mavsumida va yoz ta'tili oldidan",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "Sirdaryo",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },

    # ── Hududga bog'liq bo'lmagan umumiy jamiyatlar ─────────────────────────
    {
        "name": "Talabalar ilmiy jamiyati",
        "description": (
            "Turli oliygohlardagi talabalarni ilmiy-tadqiqot ishlariga jalb qilish maqsadida "
            "tuzilgan jamiyat. A'zolar o'z maqolalarini ilmiy davra suhbatlarida taqdim etadi, "
            "respublika miqyosidagi talabalar ilmiy konferensiyalariga birgalikda "
            "tayyorlanadi. Yangi tadqiqotchilar uchun maqola yozish va manbalardan foydalanish "
            "bo'yicha amaliy seminarlar o'tkaziladi."
        ),
        "category": "support & community",
        "university": "",
        "meeting_time": "Har oyning ikkinchi shanbasi",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "Volontyorlar harakati",
        "description": (
            "Turli yo'nalishdagi ijtimoiy loyihalarda qatnashishni istagan talabalarni "
            "birlashtiruvchi volontyorlik harakati. A'zolar bolalar uylariga tashrif, "
            "ekologik toza-hashar tadbirlari va qishki kiyim-kechak yig'ish aksiyalarida faol "
            "ishtirok etadi. Faol volontyorlarga harakat tomonidan tavsiyanoma beriladi, bu "
            "keyinchalik ish va grant arizalarida foydali bo'ladi."
        ),
        "category": "support & community",
        "university": "",
        "meeting_time": "Har oyda 1-2 marta, aksiyaga qarab",
        "location": "Turli hudud (aksiyaga qarab e'lon qilinadi)",
        "club_type": "community",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "Talabalar sport ittifoqi",
        "description": (
            "Turli oliygohlardan bo'lgan talabalarni futbol, voleybol va stol tennisi bo'yicha "
            "havaskor musobaqalarga jamlaydigan sport ittifoqi. Har oyda oliygohlararo do'stona "
            "uchrashuvlar tashkil etiladi, g'oliblarga diplom va sport buyumlari taqdim "
            "etiladi. Jismoniy tarbiya bilan shug'ullanishni odat qilishni istagan har qanday "
            "talaba qo'shilishi mumkin."
        ),
        "category": "support & community",
        "university": "",
        "meeting_time": "Har oyning uchinchi shanbasi",
        "location": "Turli sport majmualari (galma-gal)",
        "club_type": "community",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "Dasturchi talabalar hamjamiyati",
        "description": (
            "Dasturlash va IT sohasiga qiziqqan talabalarni birlashtiruvchi hamjamiyat. "
            "A'zolar hackathon va onlayn dasturlash musobaqalariga (masalan, Codeforces, "
            "LeetCode) birgalikda tayyorgarlik ko'radi, portfolio loyihalari ustida jamoaviy "
            "ishlaydi. Tajribali a'zolar yangi boshlovchilarga Python, JavaScript kabi "
            "tillarni o'rganishda mentorlik qiladi."
        ),
        "category": "support & community",
        "university": "",
        "meeting_time": "Har hafta, onlayn",
        "location": "Onlayn (Telegram/Discord orqali)",
        "club_type": "community",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "Kitobxon talabalar klubi",
        "description": (
            "Badiiy va ilmiy-ommabop adabiyotni sevuvchi talabalarni birlashtiruvchi kitob "
            "klubi. Har oyda bitta kitob tanlanib, uni o'qib chiqqach muhokama kechasi "
            "o'tkaziladi. Yoz ta'tili davomida \"Yozning eng yaxshi 5 kitobi\" ro'yxati "
            "tuziladi va a'zolar orasida kitob almashish tashkil etiladi."
        ),
        "category": "support & community",
        "university": "",
        "meeting_time": "Har oyning oxirgi payshanbasi",
        "location": "Onlayn (Telegram guruhida belgilanadi)",
        "club_type": "community",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
]
