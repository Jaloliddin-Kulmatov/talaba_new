import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stipendiya va moliya",
  description: "Stipendiya to'lovlari va bank hisobi ochish bo'yicha qo'llanma.",
  alternates: { canonical: "https://talaba.uz/support/stipendiya" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
