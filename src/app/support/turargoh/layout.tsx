import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talabalar turargohi va ijara",
  description: "Yotoqxonaga joylashish va ijaraga uy topish bo'yicha qo'llanma.",
  alternates: { canonical: "/support/turargoh" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
