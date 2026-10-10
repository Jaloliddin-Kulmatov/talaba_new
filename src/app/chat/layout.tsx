import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talabalar savol-javob chati",
  description: "Boshqa talabalarga savol bering va tajriba ulashing: qabul, turargoh, stipendiya va o'qish haqida.",
  alternates: { canonical: "https://talaba.uz/chat" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
