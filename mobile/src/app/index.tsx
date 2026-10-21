import React from "react";
import { Redirect } from "expo-router";
import { usePrefs } from "@/lib/prefs";
import { useAuth } from "@/lib/auth";

export default function Index() {
  const { prefs } = usePrefs();
  const { loading } = useAuth();
  if (!prefs || loading) return null;          // the splash screen is still showing
  return <Redirect href={prefs.welcomed ? "/(tabs)" : "/welcome"} />;
}
