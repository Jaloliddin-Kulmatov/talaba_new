import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";
import { EAS_PROJECT_ID } from "./config";
import { kv } from "./storage";

/** Show notifications that arrive while the app is open. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

/** Maps the website paths the backend puts in a notification to the app's screens. */
export function routeForUrl(url?: string | null): string | null {
  if (!url) return null;
  const m = /^\/dashboard\/messages\?with=(\d+)/.exec(url);
  if (m) return `/messages/${m[1]}`;
  const q = /^\/chat\/(\d+)/.exec(url);
  if (q) return `/question/${q[1]}`;
  return null;
}

async function ensureChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", { name: "Xabarnomalar", importance: Notifications.AndroidImportance.HIGH });
  }
}

/** Asks permission and registers this phone for message / answer pushes. Returns a short status for the settings screen. */
export async function registerForPush(): Promise<"ok" | "denied" | "simulator" | "unavailable"> {
  try {
    if (!Device.isDevice) return "simulator";
    await ensureChannel();
    const cur = await Notifications.getPermissionsAsync();
    let status = cur.status;
    if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return "denied";
    const { data: token } = await Notifications.getExpoPushTokenAsync(EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : undefined);
    const r = await api.post("/push/device", { token, platform: Platform.OS === "ios" ? "ios" : "android" });
    if (r.error) return "unavailable";
    await kv.set("talaba:push-token", token);
    return "ok";
  } catch {
    return "unavailable";   // e.g. Expo Go on Android, or no project id yet
  }
}

export async function unregisterPush() {
  const token = await kv.get<string | null>("talaba:push-token", null);
  if (token) { await api.del("/push/device", { token }); await kv.del("talaba:push-token"); }
}
