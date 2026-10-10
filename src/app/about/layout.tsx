import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TALABA haqida",
  description: "TALABA — O'zbek talabalari uchun yagona platforma: g'oya, maqsad va jamoa.",
  alternates: { canonical: "https://talaba.uz/about" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
