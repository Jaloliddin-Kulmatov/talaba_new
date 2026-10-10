"use client";

import { useState } from "react";
import {
  MapPin, Navigation, Loader2, RefreshCw, ChevronRight,
  Hospital, Landmark, Pill, Building2, ShoppingCart,
  Wallet, Coffee, Stethoscope, Train, Store,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import NearbyRestaurants from "./nearby-restaurants";

/**
 * NearbyPlaces — "find important locations near you" widget.
 *
 * One-click access to the most useful places a student needs in Uzbekistan,
 * opened in Yandex Maps (the most widely used map/search service in
 * Uzbekistan and the CIS region). Search deep-links work on web and open
 * the native app on mobile when installed.
 */

type Category = {
  key: string;
  label: string;
  desc: string;
  query: string;       // Yandex Maps search query (Uzbek/Russian recommended)
  Icon: LucideIcon;
  color: string;       // tailwind text colour
  bg: string;          // tailwind bg colour
};

const CATEGORIES: Category[] = [
  {
    key: "hospital",
    label: "Shifoxona",
    desc: "Yaqin atrofdagi davlat va xususiy shifoxonalar",
    query: "shifoxona",
    Icon: Hospital,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
  },
  {
    key: "pharmacy",
    label: "Dorixona",
    desc: "24 soatlik dorixonalar",
    query: "dorixona",
    Icon: Pill,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    key: "bank",
    label: "Bank",
    desc: "Talaba uchun karta ochish, pul o'tkazmalari",
    query: "bank",
    Icon: Landmark,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    key: "govservices",
    label: "Davlat xizmatlari markazi",
    desc: "Hujjatlar, ro'yxatdan o'tish va boshqa rasmiy ishlar",
    query: "davlat xizmatlari markazi",
    Icon: Building2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    key: "market",
    label: "Do'kon",
    desc: "Supermarket va kundalik xaridlar",
    query: "supermarket",
    Icon: ShoppingCart,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    key: "atm",
    label: "Bankomat",
    desc: "Naqd pul yechish va karta xizmatlari",
    query: "bankomat",
    Icon: Wallet,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    key: "bozor",
    label: "Bozor",
    desc: "Arzon va sifatli mahsulotlar uchun mahalliy bozor",
    query: "bozor",
    Icon: Store,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    key: "cafe",
    label: "Coworking / o'quv kafesi",
    desc: "Wi-Fi, elektr rozetkalari, tinch muhit",
    query: "coworking",
    Icon: Coffee,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    key: "clinic",
    label: "Poliklinika",
    desc: "Oddiy tashxis va davolash uchun yaqin poliklinika",
    query: "poliklinika",
    Icon: Stethoscope,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    key: "metro",
    label: "Metro bekati",
    desc: "Eng yaqin metro kirish joyini toping",
    query: "metro bekati",
    Icon: Train,
    color: "text-blue-600",
    bg: "bg-blue-600/10",
  },
];

const CITIES: { city: string; lat: number; lng: number }[] = [
  { city: "Toshkent",  lat: 41.2995, lng: 69.2401 },
  { city: "Samarqand", lat: 39.6270, lng: 66.9750 },
  { city: "Buxoro",    lat: 39.7747, lng: 64.4286 },
  { city: "Andijon",   lat: 40.7821, lng: 72.3442 },
  { city: "Farg'ona",  lat: 40.3864, lng: 71.7864 },
  { city: "Namangan",  lat: 40.9983, lng: 71.6726 },
  { city: "Nukus",     lat: 42.4531, lng: 59.6103 },
  { city: "Qarshi",    lat: 38.8606, lng: 65.7891 },
  { city: "Termiz",    lat: 37.2242, lng: 67.2783 },
  { city: "Urganch",   lat: 41.5500, lng: 60.6333 },
];

function nearestCity(lat: number, lng: number) {
  const R = 6371;
  const dist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const x = Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };
  let best = CITIES[0];
  let bestD = dist({ lat, lng }, best);
  for (const c of CITIES.slice(1)) {
    const d = dist({ lat, lng }, c);
    if (d < bestD) { best = c; bestD = d; }
  }
  return best.city;
}

function yandexMapSearchUrl(query: string, near?: string) {
  const q = near ? `${near} ${query}` : query;
  return `https://yandex.uz/maps/?text=${encodeURIComponent(q)}`;
}

export default function NearbyPlaces() {
  const { user } = useAuth();
  const [city, setCity] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const detect = () => {
    if (!navigator.geolocation) {
      setError("Bu qurilmada geolokatsiya qo'llab-quvvatlanmaydi.");
      return;
    }
    setError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = nearestCity(pos.coords.latitude, pos.coords.longitude);
        setCity(c);
        setLocating(false);
      },
      () => {
        setError("Joylashuvga ruxsat berilmadi. Har qanday kategoriyani bosib qidirishingiz mumkin.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <section id="nearby" className="space-y-5">
      {/* ── Header card ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-blue-500/5 to-emerald-500/5 p-5 sm:p-6">
        <div className="flex items-start gap-4 flex-col sm:flex-row sm:items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center shrink-0">
            <MapPin size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground mb-0.5">Yaqin atrofdagi joylarni toping</h2>
            <p className="text-xs text-muted-foreground">
              {city ? (
                <>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{city}</span> yaqinidagi joylar ko'rsatilmoqda.
                  Kategoriyani bosib Yandex Xaritalarni oching.
                </>
              ) : (
                <>Talaba sifatida eng ko'p kerak bo'ladigan joylarga bir bosishda kirish.</>
              )}
            </p>
          </div>
          {!city ? (
            <button
              onClick={detect}
              disabled={locating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0 disabled:opacity-60"
            >
              {locating ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
              {locating ? "Aniqlanmoqda…" : "Joylashuvimdan foydalanish"}
            </button>
          ) : (
            <button
              onClick={() => { setCity(null); setError(""); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <RefreshCw size={12} /> O'zgartirish
            </button>
          )}
        </div>
        {error && (
          <p className="mt-3 text-[11px] text-amber-500">{error}</p>
        )}
      </div>

      {/* ── Categories grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {CATEGORIES.map((c) => {
          const href = yandexMapSearchUrl(c.query, city ?? undefined);
          return (
            <a
              key={c.key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-3 p-4 lg:p-5 rounded-2xl border border-border bg-card hover:border-blue-500/40 hover:shadow-md transition-all min-h-[152px]"
            >
              <div className={`w-11 h-11 rounded-2xl ${c.bg} ${c.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <c.Icon size={20} strokeWidth={2.25} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">{c.label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-1 line-clamp-2">{c.desc}</p>
              </div>
              <div className="flex items-center text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                Yandex Xaritada ochish <ChevronRight size={11} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          );
        })}
      </div>

      {/* ── AI personalised restaurant picks (kept) ─────────────── */}
      <div className="pt-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          ✨ {user?.region || "Siz"} uchun AI tanlovlari
        </p>
        <NearbyRestaurants />
      </div>
    </section>
  );
}
