import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import HeaderActions from "@/components/header-actions";
import { useTheme } from "@/lib/theme";

type IconPair = [React.ComponentProps<typeof Ionicons>["name"], React.ComponentProps<typeof Ionicons>["name"]];
const ICONS: Record<string, IconPair> = {
  index: ["home", "home-outline"],
  jobs: ["briefcase", "briefcase-outline"],
  clubs: ["people", "people-outline"],
  chat: ["chatbubbles", "chatbubbles-outline"],
  guide: ["compass", "compass-outline"],
};

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: t.card },
        headerTintColor: t.text,
        headerTitleStyle: { fontWeight: "800" },
        headerShadowVisible: false,
        headerRight: () => <HeaderActions />,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.subtle,
        tabBarStyle: { backgroundColor: t.tabBar, borderTopColor: t.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneStyle: { backgroundColor: t.bg },
        tabBarIcon: ({ focused, color, size }) => {
          const [on, off] = ICONS[route.name] ?? ICONS.index;
          return <Ionicons name={focused ? on : off} size={size} color={color as string} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Bosh sahifa", headerTitle: "TALABA" }} />
      <Tabs.Screen name="jobs" options={{ title: "Ishlar", headerTitle: "Ish va amaliyot" }} />
      <Tabs.Screen name="clubs" options={{ title: "Klublar", headerTitle: "Klublar" }} />
      <Tabs.Screen name="chat" options={{ title: "Chat", headerTitle: "Savol-javob" }} />
      <Tabs.Screen name="guide" options={{ title: "Hayot", headerTitle: "Hayot va yordam" }} />
    </Tabs>
  );
}
