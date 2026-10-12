import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O'zbekiston universitetlari",
  description: "Davlat va xalqaro filial universitetlar ro'yxati: shahar, talabalar soni va rasmiy saytlar.",
  alternates: { canonical: "/universities" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
