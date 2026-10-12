import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ish va amaliyot — talabalar uchun e'lonlar",
  description: "Talabalar uchun qisman bandlik, amaliyot va masofaviy ish e'lonlari — jadvalingiz va ko'nikmalaringizga mos tartibda.",
  alternates: { canonical: "/jobs" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
