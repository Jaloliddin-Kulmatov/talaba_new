import { PackageSearch, ShoppingBag, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { UNIVERSITIES } from "@/lib/constants";

export interface CommunityService {
  id: "reviews" | "market" | "lostfound";
  href: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
  gradient: string;
  tint: string;
}

export const COMMUNITY_SERVICES: CommunityService[] = [
  {
    id: "reviews", href: "/reviews", title: "Fan sharhlari",
    blurb: "Fan va o'qituvchilar haqida anonim sharhlar — tanlashdan oldin boshqa talabalar tajribasini bilib oling.",
    icon: Star, gradient: "from-yellow-500 to-amber-500", tint: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    id: "market", href: "/market", title: "Talaba bozori",
    blurb: "Kitob, konspekt, elektronika va turargoh jihozlarini sotib oling yoki soting.",
    icon: ShoppingBag, gradient: "from-fuchsia-500 to-pink-500", tint: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  },
  {
    id: "lostfound", href: "/lost-found", title: "Yo'qolgan va topilgan",
    blurb: "Kampusda yo'qotgan yoki topgan buyumlaringiz haqida e'lon bering.",
    icon: PackageSearch, gradient: "from-cyan-500 to-sky-500", tint: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
];
export const serviceById = (id: CommunityService["id"]) => COMMUNITY_SERVICES.find((s) => s.id === id) as CommunityService;

/** Short names match what students pick as their university on sign-up (e.g. "NUU"). */
export const UNIVERSITY_NAMES = UNIVERSITIES.map((u) => u.shortName);

export const MARKET_CATEGORIES = [
  { id: "kitob", label: "Kitoblar", emoji: "📚" },
  { id: "konspekt", label: "Konspektlar", emoji: "📝" },
  { id: "elektronika", label: "Elektronika", emoji: "💻" },
  { id: "turargoh", label: "Turargoh jihozlari", emoji: "🛏️" },
  { id: "kiyim", label: "Kiyim", emoji: "👕" },
  { id: "xizmat", label: "Xizmatlar", emoji: "🛠️" },
  { id: "boshqa", label: "Boshqa", emoji: "📦" },
] as const;
export const categoryOf = (id: string) => MARKET_CATEGORIES.find((c) => c.id === id);

export const CONDITIONS = [
  { id: "yangi", label: "Yangi" },
  { id: "yaxshi", label: "Yaxshi" },
  { id: "ishlatilgan", label: "Ishlatilgan" },
] as const;

/** null = to be agreed, 0 = free */
export function formatPrice(p: number | null): string {
  if (p === null) return "Kelishiladi";
  if (p === 0) return "Tekin";
  return `${p.toLocaleString("ru-RU")} so'm`;
}

export interface CourseAgg {
  subject: string; teacher: string; university: string; count: number;
  rating: number; difficulty: number | null; recommend: number | null;
}
export interface Review {
  id: number; subject: string; teacher: string; university: string; rating: number;
  difficulty: number | null; recommend: boolean | null; text: string; created_at: string; is_mine: boolean;
}
export interface MarketItem {
  id: number; title: string; description: string; category: string; condition: string; price: number | null;
  university: string; region: string; status: "active" | "sold" | "hidden"; seller_name: string;
  contact: string | null; created_at: string; is_mine: boolean;
}
export interface LostItem {
  id: number; kind: "lost" | "found"; title: string; description: string; place: string; happened_on: string;
  university: string; status: "open" | "resolved" | "hidden"; contact: string | null; created_at: string; is_mine: boolean;
}
