"use client";

import { useState } from "react";
import { MapPin, Star, Loader2, Navigation, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";

import { API_BASE } from "@/lib/config";
type Restaurant = {
  name: string;
  type: string;
  price: string;
  rating: number;
  note: string;
  emoji: string;
};

type Results = {
  milliy: Restaurant[];
  boshqa: Restaurant[];
};

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
  return CITIES.reduce((best, c) => {
    const dLat = ((c.lat - lat) * Math.PI) / 180;
    const dLng = ((c.lng - lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((c.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const bd = (() => {
      const dLat2 = ((best.lat - lat) * Math.PI) / 180;
      const dLng2 = ((best.lng - lng) * Math.PI) / 180;
      const a2 = Math.sin(dLat2 / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((best.lat * Math.PI) / 180) * Math.sin(dLng2 / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));
    })();
    return d < bd ? c : best;
  }).city;
}

function RestaurantCard({ r, accent }: { r: Restaurant; accent: string }) {
  return (
    <div className={`p-4 rounded-2xl border bg-card transition-colors group hover:${accent}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{r.emoji}</span>
        <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
          <Star size={11} className="fill-amber-500" />
          {r.rating}
        </div>
      </div>
      <h4 className="text-sm font-bold text-foreground leading-tight mb-0.5">{r.name}</h4>
      <p className="text-[11px] text-muted-foreground mb-1">{r.type}</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{r.note}</p>
      <span className="text-xs font-semibold text-emerald-500">{r.price}</span>
    </div>
  );
}

export default function NearbyRestaurants() {
  const { user } = useAuth();
  const [state, setState] = useState<"idle" | "locating" | "loading" | "done" | "error">("idle");
  const [results, setResults] = useState<Results | null>(null);
  const [city, setCity] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function fetchRecommendations(cityName: string, region: string) {
    setState("loading");
    const token = typeof window !== "undefined" ? localStorage.getItem("talaba_token") : null;
    const res = await fetch(`${API_BASE}/ai/restaurants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ city: cityName, region }),
    });
    if (!res.ok) { setErrorMsg("Tavsiyalarni yuklab bo'lmadi."); setState("error"); return; }
    const json = await res.json();
    if (json.error) { setErrorMsg(json.error); setState("error"); return; }
    setResults(json);
    setState("done");
  }

  function detect() {
    if (!navigator.geolocation) { setErrorMsg("Geolokatsiya qo'llab-quvvatlanmaydi."); setState("error"); return; }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = nearestCity(pos.coords.latitude, pos.coords.longitude);
        setCity(c);
        fetchRecommendations(c, user?.region || "");
      },
      () => { setErrorMsg("Joylashuvga ruxsat berilmadi. Brauzer sozlamalaridan yoqing."); setState("error"); },
      { timeout: 8000 }
    );
  }

  function reset() { setState("idle"); setResults(null); setCity(""); setErrorMsg(""); }

  if (state === "idle") {
    return (
      <div className="mt-6 p-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
            <MapPin size={18} className="text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Yaqin atrofdagi taomxonalar</p>
            <p className="text-xs text-muted-foreground">
              {user?.region
                ? `Milliy va ${user.region} taomlari yaqin atrofda`
                : "Milliy va boshqa taomlar yaqin atrofda"}
            </p>
          </div>
        </div>
        <button
          onClick={detect}
          className="sm:ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors shrink-0"
        >
          <Navigation size={13} />
          Taomxona topish
        </button>
      </div>
    );
  }

  if (state === "locating" || state === "loading") {
    return (
      <div className="mt-6 p-5 rounded-2xl border border-border bg-card flex items-center gap-3">
        <Loader2 size={18} className="text-orange-500 animate-spin" />
        <p className="text-sm text-muted-foreground">
          {state === "locating" ? "Joylashuvingiz aniqlanmoqda…" : `${city} shahridan taomxonalar qidirilmoqda…`}
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mt-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{errorMsg}</p>
        <button onClick={reset} className="text-xs text-orange-500 hover:underline shrink-0">Qayta urinish</button>
      </div>
    );
  }

  if (!results) return null;

  const regionLabel = user?.region || "boshqa";

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-5">
        <MapPin size={14} className="text-orange-500" />
        <p className="text-sm font-semibold text-foreground">
          <span className="text-orange-500">{city}</span> yaqinida
          {user?.region && <span className="text-muted-foreground font-normal"> · {user.region} uchun moslashtirilgan</span>}
        </p>
        <button onClick={reset} className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
          <RefreshCw size={11} /> yangilash
        </button>
      </div>

      {/* Milliy tanlovlar */}
      {results.milliy?.length > 0 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">🇺🇿 Milliy tanlovlar</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {results.milliy.map((r) => (
              <RestaurantCard key={r.name} r={r} accent="border-orange-500/30" />
            ))}
          </div>
        </>
      )}

      {/* Boshqa taomlar */}
      {results.boshqa?.length > 0 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            🌍 {regionLabel} va boshqa taomlar
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.boshqa.map((r) => (
              <RestaurantCard key={r.name} r={r} accent="border-blue-500/30" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
