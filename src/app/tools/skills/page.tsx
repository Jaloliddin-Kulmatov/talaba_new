import type { Metadata } from "next";
import ToolsShell from "@/components/tools/tools-shell";
import SkillsApp from "@/components/tools/skills-app";

export const metadata: Metadata = {
  title: "Ko'nikmalar kuzatuvchisi — daraja, maqsad va mashq vaqti",
  description: "IELTS, dasturlash, Excel va boshqa ko'nikmalaringizni kuzating: daraja, maqsad, mashq vaqti va mos ish tavsiyalari.",
  alternates: { canonical: "https://talaba.uz/tools/skills" },
};

export default function Page() {
  return (
    <ToolsShell>
      <SkillsApp />
    </ToolsShell>
  );
}
