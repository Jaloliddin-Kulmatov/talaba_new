import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Part-time ish va mehnat huquqlari",
  description: "Qisman bandlik, mehnat shartnomasi va talaba huquqlari haqida.",
  alternates: { canonical: "https://talaba.uz/support/parttime" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
