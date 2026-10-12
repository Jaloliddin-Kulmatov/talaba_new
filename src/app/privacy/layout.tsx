import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maxfiylik siyosati",
  description: "TALABA shaxsiy ma'lumotlaringizni qanday yig'adi, saqlaydi va himoya qiladi.",
  alternates: { canonical: "/privacy" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
