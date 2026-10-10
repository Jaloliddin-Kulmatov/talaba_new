import type { Metadata } from "next";
import ToolsShell from "@/components/tools/tools-shell";
import GpaApp from "@/components/tools/gpa-app";

export const metadata: Metadata = {
  title: "GPA kalkulyator — 5 ballik va 4.0 shkala",
  description: "O'zbekiston talabalari uchun GPA kalkulyator: 5 ballik tizim, 100 ballik reyting, 4.0 shkala va maqsadli GPA uchun kerakli baho hisobi.",
  alternates: { canonical: "https://talaba.uz/tools/gpa" },
};

export default function Page() {
  return (
    <ToolsShell>
      <GpaApp />
    </ToolsShell>
  );
}
