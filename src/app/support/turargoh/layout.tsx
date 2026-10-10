import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talabalar turargohi va ijara",
  description: "Yotoqxonaga joylashish va ijaraga uy topish bo'yicha qo'llanma.",
  alternates: { canonical: "https://talaba.uz/support/turargoh" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
