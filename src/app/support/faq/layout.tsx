import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ko'p so'raladigan savollar",
  description: "Talabalar eng ko'p so'raydigan savollarga qisqa javoblar.",
  alternates: { canonical: "https://talaba.uz/support/faq" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
