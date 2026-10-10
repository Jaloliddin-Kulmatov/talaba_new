import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Foydalanish shartlari",
  description: "TALABA platformasidan foydalanish shartlari va qoidalari.",
  alternates: { canonical: "https://talaba.uz/terms" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
