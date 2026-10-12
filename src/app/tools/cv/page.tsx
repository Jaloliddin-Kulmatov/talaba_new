import type { Metadata } from "next";
import ToolsShell from "@/components/tools/tools-shell";
import CvApp from "@/components/tools/cv-app";

export const metadata: Metadata = {
  title: "CV yaratuvchi — o'zbek, ingliz va rus tilida",
  description: "Talabalar uchun bepul CV yaratuvchi: ATS-ga mos shablon, PDF sifatida saqlash, o'zbek/ingliz/rus tillari.",
  alternates: { canonical: "/tools/cv" },
};

export default function Page() {
  return (
    <ToolsShell>
      <CvApp />
    </ToolsShell>
  );
}
