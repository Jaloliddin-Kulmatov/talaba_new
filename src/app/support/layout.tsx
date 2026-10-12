import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Talabalar uchun yordam qo'llanmalari",
    template: "%s | TALABA",   // a plain-string title here would cancel the root template for every guide below
  },
  description: "Qabul va DTM, turargoh, stipendiya, harbiy hisob, transport, til sertifikatlari va part-time ish bo'yicha qadamma-qadam qo'llanmalar.",
  alternates: { canonical: "/support" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
