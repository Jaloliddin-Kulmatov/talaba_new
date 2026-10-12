import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Til va ko'nikmalar — IELTS/TOEFL",
  description: "IELTS, TOEFL va boshqa til sertifikatlariga tayyorgarlik bo'yicha qo'llanma.",
  alternates: { canonical: "/support/til" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
