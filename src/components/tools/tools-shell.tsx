"use client";

import React from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/auth";

/**
 * The toolkit works without an account (data lives on the device), so signed-in
 * students get the dashboard chrome and visitors get the public site chrome.
 */
export default function ToolsShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) return <DashboardLayout>{children}</DashboardLayout>;
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-28 md:pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
