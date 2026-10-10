import type { Metadata } from "next";
import ToolsShell from "@/components/tools/tools-shell";
import MarketApp from "@/components/community/market-app";

export const metadata: Metadata = {
  title: "Talaba bozori — kitob, konspekt va jihozlar",
  description: "Talabalar uchun e'lonlar: kitob, konspekt, elektronika va turargoh jihozlarini sotib oling yoki soting.",
  alternates: { canonical: "https://talaba.uz/market" },
};

export default function Page() {
  return (
    <ToolsShell>
      <MarketApp />
    </ToolsShell>
  );
}
