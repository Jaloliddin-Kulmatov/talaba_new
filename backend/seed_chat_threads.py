"""
Seed data — example Q&A threads (with answers) so the Chat page isn't empty
on first visit. All authored by the TALABA system user. See
_seed_chat_threads() in app.py for how this list is consumed.

`scope`: "" = global (visible to every student), or a lowercase university
token (matches the `university` field convention used elsewhere) = visible
only inside that university's chat.
"""

CHAT_THREAD_SEEDS = [
    {
        "title": "DTM'da qancha ball to'plash kerak — kontrakt yoki grantga o'tish uchun chegara qanday?",
        "scope": "",
        "content": (
            "Bu yil DTM'ga tayyorlanyapman. Tanlagan yo'nalishimda o'tgan yili "
            "grant chegarasi qancha bo'lganini va bu yil o'zgarishi mumkinmi, "
            "bilmoqchiman. Kontrakt narxi ham qimmatlashadimi?"
        ),
        "answers": [
            (
                "Chegara ballari har yili yo'nalish va abituriyentlar soniga qarab "
                "o'zgaradi, shuning uchun aniq raqamni oldindan bilib bo'lmaydi. "
                "Lekin DTM rasmiy sayti har bir bosqichdan keyin statistikani "
                "e'lon qiladi — o'tgan 2-3 yillik chegaralarni solishtirib, "
                "taxminiy tasavvur hosil qilishingiz mumkin."
            ),
            (
                "Men o'tgan yili xuddi shu tashvishda edim. Maslahatim: faqat "
                "grant balliga umid qilmang, kontrakt narxi va to'lov imkoniyatlarini "
                "ham oldindan aniqlashtirib qo'ying, chunki ba'zi yo'nalishlarda "
                "1-2 ball farqi ko'p narsani hal qiladi."
            ),
        ],
    },
    {
        "title": "Kontraktdan grantga o'tish uchun qanday hujjatlar kerak?",
        "scope": "",
        "content": (
            "2-kursman, birinchi semestrni faqat a'lo baholarga tugatdim. "
            "Kontraktdan grantga o'tish arizasini qachon va qanday topshirish "
            "kerak? Dekanatga borishdan oldin qanday hujjatlar tayyorlashim kerak?"
        ),
        "answers": [
            (
                "Odatda semestr yakunlanib, baholar rasmiylashtirilgandan keyin "
                "dekanatga ariza yozasiz. Zaruriy hujjatlar: ariza, baholar "
                "ko'chirmasi (zachyotka nusxasi) va ba'zan ijtimoiy holat "
                "to'g'risidagi ma'lumotnoma (agar imtiyozli bo'lsangiz). Aniq "
                "ro'yxatni dekanatdan so'rab tasdiqlab oling — universitetdan "
                "universitetga farq qilishi mumkin."
            ),
            (
                "Muhim jihat: bo'sh grant o'rinlari sonига qarab tanlov bo'ladi, "
                "ya'ni faqat a'lo baho yetarli emas, boshqa nomzodlar bilan "
                "reyting asosida solishtiriladi. Shuning uchun barcha semestrlarda "
                "yuqori ko'rsatkichni saqlashga harakat qiling."
            ),
        ],
    },
    {
        "title": "Yotoqxonaga joylashish uchun hujjatlarni qachon topshirish kerak?",
        "scope": "nuu",
        "content": (
            "Boshqa viloyatdanman, birinchi kursga qabul qilindim. Yotoqxonaga "
            "joylashish uchun hujjatlarni qachon va qayerga topshirish kerak? "
            "Kechikib qolsam joy qolmasligi mumkinmi?"
        ),
        "answers": [
            (
                "Qabul yakunlangandan so'ng universitet talabalar bo'limi "
                "(turargoh bo'limi) orqali arizalar qabul qilinadi — odatda "
                "sentyabr boshida. Kechiktirmasdan, birinchi haftadayoq borib "
                "ro'yxatdan o'tganingiz ma'qul, chunki joylar cheklangan va "
                "uzoq viloyatdan kelganlarga ustuvorlik beriladi."
            ),
        ],
    },
    {
        "title": "Stipendiya to'lovi kechikyapti — bu normalmi?",
        "scope": "",
        "content": (
            "Bu oy stipendiyamiz hali kelmadi, boshqa guruhdoshlarim ham "
            "shunday deyishyapti. Bunday kechikish odatiy holmi, qachongacha "
            "kutish kerak va agar uzoq davom etsa kimga murojaat qilish kerak?"
        ),
        "answers": [
            (
                "Kechikish, afsuski, ayrim oylarda uchrab turadi — odatda "
                "moliyaviy hisob-kitoblar bilan bog'liq texnik sabablarga ko'ra. "
                "1-2 haftagacha kutish odatiy hol, lekin undan uzoq cho'zilsa "
                "guruh sardori orqali dekanatga murojaat qiling."
            ),
            (
                "Menda ham shunday bo'lgan, 3 hafta kechikkan edi. Talabalar "
                "bo'limiga shaxsan borib so'raganimdan keyin tezroq hal bo'ldi — "
                "faqat kutib o'tirmang, so'rab tekshirish foydali."
            ),
        ],
    },
    {
        "title": "Harbiy hisobga qo'yish uchun qayerga murojaat qilishim kerak?",
        "scope": "",
        "content": (
            "Bu yil universitetga qabul qilindim, hali harbiy hisobga "
            "qo'yilmaganman. Jarayon qanday kechadi va qaysi hujjatlar kerak? "
            "Universitet o'zi yordam beradimi yoki mustaqil harakat qilishim kerakmi?"
        ),
        "answers": [
            (
                "Odatda yashash manzilingiz bo'yicha tuman harbiy komissariatiga "
                "o'zingiz murojaat qilishingiz kerak — pasport, o'qishga qabul "
                "haqidagi ma'lumotnoma va harbiy guvohnoma (agar bo'lsa) kerak "
                "bo'ladi. Ba'zi universitetlar birinchi kurs talabalari uchun "
                "guruh bo'lib borish tashkil qiladi, dekanatdan so'rab ko'ring."
            ),
        ],
    },
    {
        "title": "IELTS 6.5 olsam qanday stipendiya/almashinuv imkoniyatlari ochiladi?",
        "scope": "",
        "content": (
            "IELTS'ga tayyorlanyapman, maqsadim 6.5 yoki undan yuqori ball. "
            "Bu ball bilan chet elga almashinuv dasturlariga yoki qo'shimcha "
            "stipendiyalarga hujjat topshira olamanmi? Qaysi dasturlarni tavsiya "
            "qilasiz?"
        ),
        "answers": [
            (
                "6.5 ball ko'p almashinuv dasturlari (Erasmus+, ba'zi qo'shma "
                "dasturlar) uchun yetarli minimal chegara hisoblanadi, lekin "
                "har bir dastur o'z talablariga ega, ba'zilari 7.0 talab qiladi. "
                "Xalqaro aloqalar bo'limiga (universitetingizda mavjud bo'lsa) "
                "murojaat qilib, joriy e'lonlar ro'yxatini so'rang."
            ),
            (
                "Men shu ball bilan bir semestrlik almashinuv dasturiga hujjat "
                "topshirgan edim. Motivatsion xat va professor tavsiyanomasi "
                "ham muhim rol o'ynaydi — faqat til balliga tayanmang."
            ),
        ],
    },
    {
        "title": "Qishloqdan kelgan birinchi kurs talabasiman — Toshkentda qanday moslashish mumkin?",
        "scope": "",
        "content": (
            "Farg'ona vodiysidan Toshkentga o'qishga keldim, shahar hayotiga "
            "hali to'liq o'rganmadim. Transport, oziq-ovqat va vaqtni "
            "rejalashtirish bo'yicha amaliy maslahatlar bera olasizlarmi?"
        ),
        "answers": [
            (
                "Birinchi haftadayoq metro/avtobus uchun talabalar chegirmali "
                "transport kartasini rasmiylashtirib oling — bu xarajatni sezilarli "
                "kamaytiradi. Bozor va supermarketlarda narxlar farq qiladi, "
                "shuning uchun mahalliy bozorlardan xarid qilishni o'rganib oling."
            ),
            (
                "Eng muhimi — o'z viloyatdoshlaringiz jamiyatiga qo'shiling "
                "(masalan shu ilovadagi hamjamiyat bo'limida bor), ular sizga "
                "tez orada juda ko'p amaliy narsalarni o'rgatib qo'yishadi."
            ),
        ],
    },
]
