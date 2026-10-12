import type { Metadata } from "next";
import ToolsShell from "@/components/tools/tools-shell";
import AttendanceApp from "@/components/tools/attendance-app";

export const metadata: Metadata = {
  title: "Davomat nazorati — qoldirilgan soatlar hisobi",
  description: "Har bir fan bo'yicha qoldirilgan soatlarni kuzating va imtihonga ruxsat chegarasiga qancha qolganini bilib turing.",
  alternates: { canonical: "/tools/attendance" },
};

export default function Page() {
  return (
    <ToolsShell>
      <AttendanceApp />
    </ToolsShell>
  );
}
