import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Harbiy hisob",
  description: "Harbiy komissariatda ro'yxatdan o'tish tartibi bo'yicha qo'llanma.",
  alternates: { canonical: "https://talaba.uz/support/harbiy" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
