import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Qabul, DTM va status",
  description: "DTM, hujjat topshirish va grant/kontrakt statusi bo'yicha qo'llanma.",
  alternates: { canonical: "https://talaba.uz/support/qabul" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
