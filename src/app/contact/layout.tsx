import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bog'lanish",
  description: "TALABA jamoasi bilan bog'laning: savol, taklif va hamkorlik.",
  alternates: { canonical: "https://talaba.uz/contact" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
