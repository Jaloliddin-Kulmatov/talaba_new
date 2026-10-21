import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yangiliklar — universitet va ta'lim xabarlari",
  description: "Qabul, grant, stipendiya va universitetlardagi yangiliklar — talabalar uchun qisqa va tushunarli.",
  alternates: { canonical: "/news" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
