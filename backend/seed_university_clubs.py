"""
Seed data — official-style clubs tied to specific real Uzbekistan
universities (the analog of ICOM's per-university clubs at JBNU/SNU/etc.).

These become Club rows with club_type="club" and a specific `university`
value. See _seed_university_clubs() in app.py for how this list is consumed.
"""

UNIVERSITY_CLUBS = [

    # ── O'zbekiston Milliy universiteti (NUU) ──────────────────────────────
    {
        "name": "NUU Dasturlash klubi",
        "description": (
            "O'zbekiston Milliy universiteti talabalari uchun dasturlash klubi. "
            "Har hafta algoritmlar va veb-dasturlash bo'yicha mashg'ulotlar o'tkaziladi, "
            "hackathon va startap loyihalarida jamoa bo'lib qatnashiladi."
        ),
        "category": "tech",
        "university": "O'zbekiston Milliy universiteti",
        "meeting_time": "Har chorshanba, 17:00",
        "location": "NUU Axborot texnologiyalari fakulteti binosi",
        "club_type": "club",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "NUU Debat klubi",
        "description": (
            "Ochiq debat formatida notiqlik san'ati va tanqidiy fikrlashni "
            "rivojlantiruvchi klub. A'zolar respublika va xalqaro debat "
            "musobaqalariga tayyorgarlik ko'rishadi."
        ),
        "category": "academic",
        "university": "O'zbekiston Milliy universiteti",
        "meeting_time": "Har juma, 16:00",
        "location": "NUU Bosh bino, 3-qavat",
        "club_type": "club",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "NUU Volontyorlar jamoasi",
        "description": (
            "Universitet va shahar miqyosidagi ijtimoiy tadbirlarda ishtirok "
            "etuvchi volontyorlik klubi — ekologik aksiyalar, bolalar uylariga "
            "tashriflar va donorlik kampaniyalari."
        ),
        "category": "volunteer",
        "university": "O'zbekiston Milliy universiteti",
        "meeting_time": "Oyiga bir marta, tadbirga qarab",
        "location": "Turli manzillar (Telegram guruhida e'lon qilinadi)",
        "club_type": "club",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },

    # ── Toshkent axborot texnologiyalari universiteti (TATU) ────────────────
    {
        "name": "TATU Robototexnika klubi",
        "description": (
            "Robototexnika va IoT loyihalari ustida ishlaydigan amaliy klub. "
            "A'zolar respublika miqyosidagi robototexnika olimpiadalariga "
            "tayyorgarlik ko'radi va o'z loyihalarini taqdim etadi."
        ),
        "category": "tech",
        "university": "Toshkent axborot texnologiyalari universiteti",
        "meeting_time": "Har seshanba va payshanba, 18:00",
        "location": "TATU Robototexnika laboratoriyasi",
        "club_type": "club",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "TATU Ingliz tili suhbat klubi",
        "description": (
            "Ingliz tilida erkin muloqot qilishni maqsad qilgan talabalar "
            "uchun haftalik suhbat klubi. Filmlar muhokamasi, mavzuli "
            "debatlar va IELTS speaking mashqlari o'tkaziladi."
        ),
        "category": "language",
        "university": "Toshkent axborot texnologiyalari universiteti",
        "meeting_time": "Har dushanba, 17:30",
        "location": "TATU Til markazi",
        "club_type": "club",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },

    # ── Toshkent davlat iqtisodiyot universiteti (TDIU) ─────────────────────
    {
        "name": "TDIU Startap va tadbirkorlik klubi",
        "description": (
            "Biznes-reja tuzish, startap g'oyalarini sinovdan o'tkazish va "
            "investorlar bilan uchrashuvlar tashkil etuvchi klub. Har semestrda "
            "ichki pitch-sessiya o'tkaziladi."
        ),
        "category": "academic",
        "university": "Toshkent davlat iqtisodiyot universiteti",
        "meeting_time": "Har oyning ikkinchi shanbasi",
        "location": "TDIU Biznes-inkubator markazi",
        "club_type": "club",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "TDIU Moliyaviy savodxonlik klubi",
        "description": (
            "Talabalarga shaxsiy moliyani boshqarish, investitsiya asoslari va "
            "bank xizmatlaridan foydalanish bo'yicha amaliy bilim beruvchi klub."
        ),
        "category": "academic",
        "university": "Toshkent davlat iqtisodiyot universiteti",
        "meeting_time": "Har chorshanba, 15:00",
        "location": "TDIU Moliya fakulteti binosi",
        "club_type": "club",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },

    # ── Samarqand davlat universiteti (SamDU) ───────────────────────────────
    {
        "name": "SamDU Tarix va meros klubi",
        "description": (
            "Samarqandning boy tarixiy merosini o'rganish va targ'ib qilishga "
            "bag'ishlangan klub — ekskursiyalar, ilmiy davra suhbatlari va "
            "mahalliy tarixchilar bilan uchrashuvlar."
        ),
        "category": "academic",
        "university": "Samarqand davlat universiteti",
        "meeting_time": "Har oyning birinchi payshanbasi",
        "location": "SamDU Tarix fakulteti",
        "club_type": "club",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "SamDU Volontyorlar harakati",
        "description": (
            "Shahar va universitet miqyosidagi ijtimoiy loyihalarda faol "
            "ishtirok etuvchi talabalar jamoasi — ko'chat ekish aksiyalari, "
            "qariyalar uyiga tashriflar."
        ),
        "category": "volunteer",
        "university": "Samarqand davlat universiteti",
        "meeting_time": "Oyiga bir marta",
        "location": "Turli manzillar",
        "club_type": "club",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },

    # ── Farg'ona davlat universiteti (FarDU) ────────────────────────────────
    {
        "name": "FarDU Dasturlash va IT klubi",
        "description": (
            "Farg'ona vodiysidagi yosh dasturchilarni birlashtiruvchi klub. "
            "Web-dasturlash, mobil ilovalar yaratish bo'yicha amaliy "
            "mashg'ulotlar va viloyat hackathonlarida ishtirok etish."
        ),
        "category": "tech",
        "university": "Farg'ona davlat universiteti",
        "meeting_time": "Har juma, 16:00",
        "location": "FarDU Kompyuter sinfi",
        "club_type": "club",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
    {
        "name": "FarDU Sport klubi",
        "description": (
            "Voleybol, futbol va yengil atletika bo'yicha universitet "
            "terma jamoalariga tayyorgarlik ko'radigan sport klubi. "
            "Yangi boshlovchilar ham qabul qilinadi."
        ),
        "category": "sports",
        "university": "Farg'ona davlat universiteti",
        "meeting_time": "Har seshanba va payshanba, 18:00",
        "location": "FarDU Sport majmuasi",
        "club_type": "club",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },

    # ── Andijon davlat universiteti (AndDU) ─────────────────────────────────
    {
        "name": "AndDU San'at va ijod klubi",
        "description": (
            "Rassomchilik, musiqa va teatr san'ati bilan shug'ullanadigan "
            "talabalar uchun ijodiy klub. Har semestrda universitet "
            "miqyosidagi ko'rgazma va konsert tashkil etiladi."
        ),
        "category": "arts",
        "university": "Andijon davlat universiteti",
        "meeting_time": "Har dushanba, 15:00",
        "location": "AndDU Madaniyat markazi",
        "club_type": "club",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },

    # ── Namangan davlat universiteti (NamDU) ────────────────────────────────
    {
        "name": "NamDU Ilmiy jamiyat",
        "description": (
            "Talabalarning ilmiy-tadqiqot ishlarini qo'llab-quvvatlovchi "
            "jamiyat — maqola yozish, konferensiyalarda qatnashish va "
            "ilmiy loyihalarni grant dasturlariga taqdim etishda yordam beradi."
        ),
        "category": "academic",
        "university": "Namangan davlat universiteti",
        "meeting_time": "Har oyning uchinchi seshanbasi",
        "location": "NamDU Ilmiy-tadqiqot bo'limi",
        "club_type": "club",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },

    # ── Buxoro davlat universiteti (BuxDU) ──────────────────────────────────
    {
        "name": "BuxDU Chet tillar klubi",
        "description": (
            "Ingliz, arab va fors tillarini o'rganuvchi talabalar uchun "
            "amaliyot klubi. Til almashish sessiyalari va xalqaro talabalar "
            "bilan onlayn suhbatlar tashkil etiladi."
        ),
        "category": "language",
        "university": "Buxoro davlat universiteti",
        "meeting_time": "Har chorshanba, 16:30",
        "location": "BuxDU Chet tillar fakulteti",
        "club_type": "club",
        "region": "",
        "contact": "",
        "telegram_link": "",
        "website": "",
    },
]
