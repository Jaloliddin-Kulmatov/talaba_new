// NOTE: Uzbekistan's higher-education system reorganizes fairly often
// (institutes upgrading to university status, mergers). This list covers
// well-established, stable-named institutions across every viloyat, but
// should be reviewed/refreshed periodically — especially `website` values,
// which are best-effort and should be verified before relying on them.
export const UNIVERSITIES = [
  // ── Toshkent shahri ───────────────────────────────────────────
  { id: "nuu",        name: "O'zbekiston Milliy universiteti",              shortName: "NUU",     color: "#1a56db", city: "Toshkent", region: "Toshkent shahri", students: 22000, intl: false, featured: true,  website: "https://nuu.uz" },
  { id: "tatu",       name: "Toshkent axborot texnologiyalari universiteti", shortName: "TATU",    color: "#0369A1", city: "Toshkent", region: "Toshkent shahri", students: 15000, intl: false, featured: true,  website: "https://tatu.uz" },
  { id: "tdiu",       name: "Toshkent davlat iqtisodiyot universiteti",      shortName: "TDIU",    color: "#166534", city: "Toshkent", region: "Toshkent shahri", students: 13000, intl: false, featured: true,  website: "https://tsue.uz" },
  { id: "tdyu",       name: "Toshkent davlat yuridik universiteti",          shortName: "TDYU",    color: "#7C2D12", city: "Toshkent", region: "Toshkent shahri", students: 6000,  intl: false, featured: false, website: "" },
  { id: "tdtu",       name: "Toshkent davlat texnika universiteti",          shortName: "TDTU",    color: "#1E3A5F", city: "Toshkent", region: "Toshkent shahri", students: 18000, intl: false, featured: false, website: "" },
  { id: "tta",        name: "Toshkent tibbiyot akademiyasi",                 shortName: "TTA",     color: "#B91C1C", city: "Toshkent", region: "Toshkent shahri", students: 9000,  intl: false, featured: true,  website: "https://tma.uz" },
  { id: "uzswlu",     name: "O'zbekiston jahon tillari universiteti",        shortName: "UzJTU",   color: "#6B21A8", city: "Toshkent", region: "Toshkent shahri", students: 8000,  intl: false, featured: false, website: "" },
  { id: "uwed",       name: "Jahon iqtisodiyoti va diplomatiya universiteti",shortName: "JIDU",    color: "#0C4A6E", city: "Toshkent", region: "Toshkent shahri", students: 3200,  intl: false, featured: false, website: "" },
  { id: "tmi",        name: "Toshkent moliya instituti",                    shortName: "TMI",     color: "#92400E", city: "Toshkent", region: "Toshkent shahri", students: 4200,  intl: false, featured: false, website: "" },
  { id: "tdshu",      name: "Toshkent davlat sharqshunoslik universiteti",   shortName: "TDShU",   color: "#065F46", city: "Toshkent", region: "Toshkent shahri", students: 4800,  intl: false, featured: false, website: "" },
  { id: "taqi",       name: "Toshkent arxitektura-qurilish instituti",       shortName: "TAQI",    color: "#78716C", city: "Toshkent", region: "Toshkent shahri", students: 7500,  intl: false, featured: false, website: "" },
  { id: "tkti",       name: "Toshkent kimyo-texnologiya instituti",          shortName: "TKTI",    color: "#0891B2", city: "Toshkent", region: "Toshkent shahri", students: 5200,  intl: false, featured: false, website: "" },
  { id: "tashiit",    name: "Toshkent temir yo'l muhandislari instituti",    shortName: "TashIIT", color: "#374151", city: "Toshkent", region: "Toshkent shahri", students: 6000,  intl: false, featured: false, website: "" },
  { id: "tdpu",       name: "Toshkent davlat pedagogika universiteti",       shortName: "TDPU",    color: "#9D174D", city: "Toshkent", region: "Toshkent shahri", students: 10500, intl: false, featured: false, website: "" },
  // `intl: true` here means a foreign-branch or private international-partner
  // campus (the domestic-audience analog of ICOM's "many international
  // students" flag), not a public state university.
  { id: "wiut",       name: "Vestminster xalqaro universiteti Toshkentda",   shortName: "WIUT",    color: "#1D4ED8", city: "Toshkent", region: "Toshkent shahri", students: 3400,  intl: true,  featured: true,  website: "https://wiut.uz" },
  { id: "inha-tsh",   name: "Inha universiteti Toshkentda",                 shortName: "Inha Tashkent", color: "#003876", city: "Toshkent", region: "Toshkent shahri", students: 1200, intl: true,  featured: true,  website: "" },
  { id: "turin-tsh",  name: "Turin politexnika universiteti Toshkentda",     shortName: "Turin Tashkent", color: "#B45309", city: "Toshkent", region: "Toshkent shahri", students: 900,  intl: true,  featured: false, website: "" },
  { id: "amity-tsh",  name: "Amity universiteti Toshkentda",                shortName: "Amity Tashkent", color: "#7C2D12", city: "Toshkent", region: "Toshkent shahri", students: 700,  intl: true,  featured: false, website: "" },
  { id: "mdis-tsh",   name: "MDIS Toshkent",                                shortName: "MDIS",    color: "#0C4A6E", city: "Toshkent", region: "Toshkent shahri", students: 500,  intl: true,  featured: false, website: "" },

  // ── Toshkent viloyati ─────────────────────────────────────────
  { id: "chirchiq",   name: "Chirchiq davlat pedagogika universiteti",       shortName: "ChDPU",   color: "#166534", city: "Chirchiq", region: "Toshkent viloyati", students: 6500, intl: false, featured: false, website: "" },

  // ── Samarqand viloyati ────────────────────────────────────────
  { id: "samdu",      name: "Samarqand davlat universiteti",                shortName: "SamDU",   color: "#1E3A8A", city: "Samarqand", region: "Samarqand viloyati", students: 17000, intl: false, featured: true,  website: "" },
  { id: "sammu",      name: "Samarqand davlat tibbiyot universiteti",       shortName: "SamDTU",  color: "#B91C1C", city: "Samarqand", region: "Samarqand viloyati", students: 8000,  intl: false, featured: false, website: "" },
  { id: "samqi",      name: "Samarqand davlat arxitektura-qurilish instituti", shortName: "SamQI", color: "#78716C", city: "Samarqand", region: "Samarqand viloyati", students: 5000, intl: false, featured: false, website: "" },
  { id: "samau",      name: "Samarqand qishloq xo'jaligi universiteti",     shortName: "SamAU",   color: "#166534", city: "Samarqand", region: "Samarqand viloyati", students: 6200,  intl: false, featured: false, website: "" },
  { id: "samchti",    name: "Samarqand davlat chet tillar instituti",       shortName: "SamChTI", color: "#6B21A8", city: "Samarqand", region: "Samarqand viloyati", students: 3800,  intl: false, featured: false, website: "" },

  // ── Buxoro viloyati ───────────────────────────────────────────
  { id: "buxdu",      name: "Buxoro davlat universiteti",                   shortName: "BuxDU",   color: "#0369A1", city: "Buxoro", region: "Buxoro viloyati", students: 12000, intl: false, featured: true,  website: "" },
  { id: "buxti",      name: "Buxoro davlat tibbiyot instituti",             shortName: "BuxDTI",  color: "#B91C1C", city: "Buxoro", region: "Buxoro viloyati", students: 4500,  intl: false, featured: false, website: "" },
  { id: "buxmti",     name: "Buxoro muhandislik-texnologiya instituti",     shortName: "BuxMTI",  color: "#92400E", city: "Buxoro", region: "Buxoro viloyati", students: 4000,  intl: false, featured: false, website: "" },

  // ── Farg'ona viloyati ─────────────────────────────────────────
  { id: "fardu",      name: "Farg'ona davlat universiteti",                 shortName: "FarDU",   color: "#166534", city: "Farg'ona", region: "Farg'ona viloyati", students: 14000, intl: false, featured: true, website: "" },
  { id: "farpi",      name: "Farg'ona politexnika instituti",               shortName: "FarPI",   color: "#0C4A6E", city: "Farg'ona", region: "Farg'ona viloyati", students: 7000,  intl: false, featured: false, website: "" },
  { id: "qdpi",       name: "Qo'qon davlat pedagogika instituti",           shortName: "QDPI",    color: "#9D174D", city: "Qo'qon", region: "Farg'ona viloyati", students: 5000, intl: false, featured: false, website: "" },

  // ── Andijon viloyati ──────────────────────────────────────────
  { id: "anddu",      name: "Andijon davlat universiteti",                  shortName: "AndDU",   color: "#1D4ED8", city: "Andijon", region: "Andijon viloyati", students: 13500, intl: false, featured: true, website: "" },
  { id: "andti",      name: "Andijon davlat tibbiyot instituti",            shortName: "AndDTI",  color: "#B91C1C", city: "Andijon", region: "Andijon viloyati", students: 4200,  intl: false, featured: false, website: "" },
  { id: "andqxai",    name: "Andijon qishloq xo'jaligi va agrotexnologiyalar instituti", shortName: "AndQXAI", color: "#166534", city: "Andijon", region: "Andijon viloyati", students: 3600, intl: false, featured: false, website: "" },

  // ── Namangan viloyati ─────────────────────────────────────────
  { id: "namdu",      name: "Namangan davlat universiteti",                 shortName: "NamDU",   color: "#0891B2", city: "Namangan", region: "Namangan viloyati", students: 12500, intl: false, featured: true, website: "" },
  { id: "nammqi",     name: "Namangan muhandislik-qurilish instituti",      shortName: "NamMQI",  color: "#78716C", city: "Namangan", region: "Namangan viloyati", students: 4800,  intl: false, featured: false, website: "" },
  { id: "nammti",     name: "Namangan muhandislik-texnologiya instituti",   shortName: "NamMTI",  color: "#92400E", city: "Namangan", region: "Namangan viloyati", students: 5200,  intl: false, featured: false, website: "" },

  // ── Qashqadaryo viloyati ──────────────────────────────────────
  { id: "qardu",      name: "Qarshi davlat universiteti",                   shortName: "QarDU",   color: "#B45309", city: "Qarshi", region: "Qashqadaryo viloyati", students: 11000, intl: false, featured: false, website: "" },
  { id: "qarmii",     name: "Qarshi muhandislik-iqtisodiyot instituti",     shortName: "QarMII",  color: "#0C4A6E", city: "Qarshi", region: "Qashqadaryo viloyati", students: 4000, intl: false, featured: false, website: "" },

  // ── Surxondaryo viloyati ──────────────────────────────────────
  { id: "terdu",      name: "Termiz davlat universiteti",                   shortName: "TerDU",   color: "#166534", city: "Termiz", region: "Surxondaryo viloyati", students: 9500, intl: false, featured: false, website: "" },
  { id: "termti",     name: "Termiz muhandislik-texnologiya instituti",     shortName: "TerMTI",  color: "#78716C", city: "Termiz", region: "Surxondaryo viloyati", students: 3200, intl: false, featured: false, website: "" },

  // ── Xorazm viloyati ───────────────────────────────────────────
  { id: "urdu",       name: "Urganch davlat universiteti",                  shortName: "UrDU",    color: "#0369A1", city: "Urganch", region: "Xorazm viloyati", students: 10200, intl: false, featured: false, website: "" },

  // ── Navoiy viloyati ───────────────────────────────────────────
  { id: "navdtu",     name: "Navoiy davlat konchilik va texnologiyalar universiteti", shortName: "NDKTU", color: "#92400E", city: "Navoiy", region: "Navoiy viloyati", students: 8000, intl: false, featured: false, website: "" },
  { id: "navdpi",     name: "Navoiy davlat pedagogika instituti",           shortName: "NavDPI",  color: "#9D174D", city: "Navoiy", region: "Navoiy viloyati", students: 4500, intl: false, featured: false, website: "" },

  // ── Jizzax viloyati ───────────────────────────────────────────
  { id: "jizpi",      name: "Jizzax politexnika instituti",                 shortName: "JizPI",   color: "#0C4A6E", city: "Jizzax", region: "Jizzax viloyati", students: 5000, intl: false, featured: false, website: "" },
  { id: "jizdpu",     name: "Jizzax davlat pedagogika universiteti",        shortName: "JizDPU",  color: "#166534", city: "Jizzax", region: "Jizzax viloyati", students: 6000, intl: false, featured: false, website: "" },

  // ── Sirdaryo viloyati ─────────────────────────────────────────
  { id: "guldu",      name: "Guliston davlat universiteti",                 shortName: "GulDU",   color: "#1D4ED8", city: "Guliston", region: "Sirdaryo viloyati", students: 8200, intl: false, featured: false, website: "" },

  // ── Qoraqalpog'iston Respublikasi ─────────────────────────────
  { id: "nukdpi",     name: "Ajiniyoz nomidagi Nukus davlat pedagogika instituti", shortName: "NukDPI", color: "#78716C", city: "Nukus", region: "Qoraqalpog'iston Respublikasi", students: 5500, intl: false, featured: false, website: "" },
  { id: "qqdu",       name: "Berdaq nomidagi Qoraqalpoq davlat universiteti", shortName: "QQDU",   color: "#0891B2", city: "Nukus", region: "Qoraqalpog'iston Respublikasi", students: 9000, intl: false, featured: true, website: "" },
];

// Uzbekistan's 12 viloyat + Toshkent shahri + Qoraqalpog'iston Respublikasi.
// Used for regional student communities (the domestic analog of ICOM's
// nationality-based communities). No official per-region flag emoji exists,
// so `flag` is left blank rather than fabricated.
export const REGIONS = [
  { code: "TSH", name: "Toshkent shahri", flag: "" },
  { code: "TV",  name: "Toshkent viloyati", flag: "" },
  { code: "AND", name: "Andijon", flag: "" },
  { code: "BUX", name: "Buxoro", flag: "" },
  { code: "FAR", name: "Farg'ona", flag: "" },
  { code: "JIZ", name: "Jizzax", flag: "" },
  { code: "NAM", name: "Namangan", flag: "" },
  { code: "NAV", name: "Navoiy", flag: "" },
  { code: "QAS", name: "Qashqadaryo", flag: "" },
  { code: "SAM", name: "Samarqand", flag: "" },
  { code: "SIR", name: "Sirdaryo", flag: "" },
  { code: "SUR", name: "Surxondaryo", flag: "" },
  { code: "XOR", name: "Xorazm", flag: "" },
  { code: "QQR", name: "Qoraqalpog'iston Respublikasi", flag: "" },
];

export const JOB_CATEGORIES = [
  "Barchasi",
  "Qisman bandlik",
  "Amaliyot",
  "Tadqiqot",
  "O'qituvchilik",
  "Masofaviy",
  "To'liq stavka",
];

export const FUNDING_TYPES = [
  { code: "grant", label: "Grant", compatible: true },
  { code: "kontrakt", label: "Kontrakt", compatible: true },
];

export const NAV_LINKS = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/community", label: "Hamjamiyat" },
  { href: "/jobs", label: "Ishlar" },
  { href: "/universities", label: "Universitetlar" },
  { href: "/support", label: "Hayot va yordam" },
];

export const SUPPORT_CATEGORIES = [
  { id: "qabul",     title: "Qabul, DTM va status",            icon: "GraduationCap", description: "DTM, hujjat topshirish, grant/kontrakt statusi" },
  { id: "turargoh",  title: "Talabalar turargohi va ijara",     icon: "Home",          description: "Yotoqxonaga joylashish va ijara qidirish" },
  { id: "stipendiya",title: "Stipendiya va moliya",             icon: "CreditCard",    description: "Stipendiya to'lovlari, bank hisobi ochish" },
  { id: "harbiy",    title: "Harbiy hisob",                     icon: "Shield",        description: "Harbiy komissariatda ro'yxatdan o'tish" },
  { id: "transport", title: "Transport",                        icon: "Train",         description: "Talabalar uchun transport chegirmalari" },
  { id: "til",       title: "Til va ko'nikmalar",               icon: "BookOpen",      description: "IELTS/TOEFL va boshqa sertifikatlar" },
  { id: "parttime",  title: "Part-time ish va mehnat huquqlari",icon: "Briefcase",     description: "Qisman bandlik, mehnat shartnomasi, huquqlar" },
];

export const PLATFORM_STATS = [
  { label: "Faol talabalar", value: "10,000+", suffix: "" },
  { label: "Hamkor universitetlar", value: `${UNIVERSITIES.length}+`, suffix: "" },
  { label: "Ish e'lonlari", value: "300+", suffix: "" },
  { label: "Qamrab olingan viloyatlar", value: `${REGIONS.length}`, suffix: "" },
];
