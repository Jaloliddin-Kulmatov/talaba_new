import type { Metadata } from "next";
import ToolsShell from "@/components/tools/tools-shell";
import FocusApp from "@/components/tools/focus-app";

export const metadata: Metadata = {
  title: "Fokus taymer — Pomodoro va o'qish statistikasi",
  description: "Pomodoro taymer: diqqat va tanaffus bosqichlari, kunlik o'qish vaqti, haftalik statistika va ketma-ket kunlar.",
  alternates: { canonical: "/tools/focus" },
};

export default function Page() {
  return (
    <ToolsShell>
      <FocusApp />
    </ToolsShell>
  );
}
