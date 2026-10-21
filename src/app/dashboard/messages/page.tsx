import { Suspense } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import MessagesApp from "@/components/messages/messages-app";

export default function MessagesPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <MessagesApp />
      </Suspense>
    </DashboardLayout>
  );
}
