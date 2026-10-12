import type { Metadata } from "next";
import ToolsShell from "@/components/tools/tools-shell";
import TimetableApp from "@/components/tools/timetable-app";

export const metadata: Metadata = {
  title: "Dars jadvali — toq/juft hafta, Telegramga ulashish",
  description: "Talabalar uchun bepul dars jadvali: toq va juft hafta, hozirgi va keyingi dars, Telegramga ulashish va kalendarga qo'shish. Ro'yxatdan o'tish shart emas.",
  alternates: { canonical: "/tools/timetable" },
};

export default function Page() {
  return (
    <ToolsShell>
      <TimetableApp />
    </ToolsShell>
  );
}
