import type { Metadata } from "next";
import ToolsShell from "@/components/tools/tools-shell";
import LostFoundApp from "@/components/community/lostfound-app";

export const metadata: Metadata = {
  title: "Yo'qolgan va topilgan buyumlar",
  description: "Kampusda yo'qotgan yoki topgan buyumlaringiz haqida e'lon bering.",
  alternates: { canonical: "/lost-found" },
};

export default function Page() {
  return (
    <ToolsShell>
      <LostFoundApp />
    </ToolsShell>
  );
}
