import type { Metadata } from "next";

import { SITE_URL } from "@/lib/config";
export const metadata: Metadata = {
  title: "Bog'lanish",
  description: "TALABA jamoasi bilan bog'laning: savol, taklif va hamkorlik.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
