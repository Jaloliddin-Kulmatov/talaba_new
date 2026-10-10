import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Universitet klublari va hamjamiyatlar",
  description: "O'zbekiston universitetlaridagi klublar va viloyat hamjamiyatlariga qo'shiling: tadbirlar, e'lonlar va yangiliklar.",
  alternates: { canonical: "https://talaba.uz/community" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
