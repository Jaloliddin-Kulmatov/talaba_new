import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kirish va ro'yxatdan o'tish",
  description: "TALABA hisobingizga kiring yoki bepul ro'yxatdan o'ting: jadval, klublar, ish va AI yordamchi.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main>{children}</main>;
}
