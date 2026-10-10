import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kundalik hayot — ovqatlanish va yaqin joylar",
  description: "Talabalar uchun arzon ovqatlanish va kampus atrofidagi foydali joylar.",
  alternates: { canonical: "https://talaba.uz/daily-life" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
