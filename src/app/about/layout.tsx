import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TALABA haqida",
  description: "TALABA — O'zbek talabalari uchun yagona platforma: g'oya, maqsad va jamoa.",
  alternates: { canonical: "/about" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
