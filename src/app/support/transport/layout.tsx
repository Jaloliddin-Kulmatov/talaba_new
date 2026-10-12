import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transport va chegirmalar",
  description: "Metro, avtobus va talabalar uchun transport chegirmalari.",
  alternates: { canonical: "/support/transport" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
