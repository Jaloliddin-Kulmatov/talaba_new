import type { Metadata } from "next";
import ToolsShell from "@/components/tools/tools-shell";
import ToolsHub from "@/components/tools/tools-hub";

export const metadata: Metadata = {
  title: "Talaba asboblari — jadval, GPA, vazifalar, fokus, davomat",
  description:
    "O'zbek talabalari uchun bepul asboblar: dars jadvali, GPA kalkulyator, vazifa va imtihon rejalashtiruvchi, fokus taymer va davomat nazorati. Ro'yxatdan o'tish shart emas.",
  alternates: { canonical: "https://talaba.uz/tools" },
};

export default function Page() {
  return (
    <ToolsShell>
      <ToolsHub />
    </ToolsShell>
  );
}
