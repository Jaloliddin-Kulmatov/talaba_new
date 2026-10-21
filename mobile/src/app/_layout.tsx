import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SyncProvider } from "@/lib/synced";
import { usePrefs } from "@/lib/prefs";
import { routeForUrl, registerForPush } from "@/lib/push";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Root() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SyncProvider>
          <Shell />
        </SyncProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function Shell() {
  const t = useTheme();
  const router = useRouter();
  const { loading, user } = useAuth();
  const { prefs } = usePrefs();

  useEffect(() => { if (!loading && prefs) SplashScreen.hideAsync().catch(() => {}); }, [loading, prefs]);

  // Tapping a notification opens the right screen.
  useEffect(() => {
    const open = (url: unknown) => { const r = routeForUrl(typeof url === "string" ? url : null); if (r) router.push(r); };
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => open(resp.notification.request.content.data?.url));
    Notifications.getLastNotificationResponseAsync().then((resp) => { if (resp) open(resp.notification.request.content.data?.url); }).catch(() => {});
    return () => sub.remove();
  }, [router]);

  // Once signed in, make sure this phone can receive message / answer notifications (a permission prompt appears the first time).
  useEffect(() => { if (user && prefs?.welcomed) registerForPush(); }, [user?.id, prefs?.welcomed]); // eslint-disable-line react-hooks/exhaustive-deps

  // The "yangi ishlar haqida xabar" choice from the welcome screens becomes real once there is an account.
  useEffect(() => {
    if (user && prefs?.alerts && !user.job_alerts_enabled) api.post("/admin/jobs/alerts", { enabled: true });
  }, [user?.id, prefs?.alerts]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <StatusBar style={t.isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.card },
          headerTintColor: t.text,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.bg },
          headerBackTitle: "Orqaga",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Kirish" }} />
        <Stack.Screen name="register" options={{ title: "Ro'yxatdan o'tish" }} />
        <Stack.Screen name="job/[id]" options={{ title: "Ish e'loni" }} />
        <Stack.Screen name="club/[id]" options={{ title: "Klub" }} />
        <Stack.Screen name="question/[id]" options={{ title: "Savol" }} />
        <Stack.Screen name="question/new" options={{ title: "Savol berish", presentation: "modal" }} />
        <Stack.Screen name="messages/index" options={{ title: "Xabarlar" }} />
        <Stack.Screen name="messages/[id]" options={{ title: "Suhbat" }} />
        <Stack.Screen name="profile" options={{ title: "Profil" }} />
        <Stack.Screen name="ai" options={{ title: "AI yordamchi" }} />
        <Stack.Screen name="tools/index" options={{ title: "Asboblar" }} />
        <Stack.Screen name="tools/timetable" options={{ title: "Dars jadvali" }} />
        <Stack.Screen name="tools/gpa" options={{ title: "GPA kalkulyator" }} />
        <Stack.Screen name="tools/planner" options={{ title: "Vazifalar va imtihonlar" }} />
      </Stack>
    </>
  );
}
