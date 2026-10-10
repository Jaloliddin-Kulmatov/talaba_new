import type { Metadata } from "next";
import ToolsShell from "@/components/tools/tools-shell";
import PlannerApp from "@/components/tools/planner-app";

export const metadata: Metadata = {
  title: "Vazifalar va imtihonlar rejalashtiruvchisi",
  description: "Topshiriq muddatlari va imtihongacha qolgan kunlarni bir joyda kuzating. Talabalar uchun bepul, ro'yxatdan o'tish shart emas.",
  alternates: { canonical: "https://talaba.uz/tools/planner" },
};

export default function Page() {
  return (
    <ToolsShell>
      <PlannerApp />
    </ToolsShell>
  );
}
