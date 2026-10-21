import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme";
import { useUnread } from "@/lib/inbox";

/** Messages (with unread badge) and profile, shown at the top right of every tab. */
export default function HeaderActions() {
  const t = useTheme();
  const router = useRouter();
  const { count } = useUnread();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingRight: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={count ? `Xabarlar, ${count} ta o'qilmagan` : "Xabarlar"} hitSlop={8}
        onPress={() => router.push("/messages")} style={{ padding: 6 }}>
        <Ionicons name="chatbubble-ellipses-outline" size={23} color={t.text} />
        {count > 0 && (
          <View style={{ position: "absolute", top: 0, right: 0, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: t.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
            <Text style={{ color: t.onPrimary, fontSize: 10, fontWeight: "800" }}>{count > 9 ? "9+" : count}</Text>
          </View>
        )}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Profil" hitSlop={8} onPress={() => router.push("/profile")} style={{ padding: 6 }}>
        <Ionicons name="person-circle-outline" size={26} color={t.text} />
      </Pressable>
    </View>
  );
}
