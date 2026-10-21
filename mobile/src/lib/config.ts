import Constants from "expo-constants";
import { Platform } from "react-native";

/** Where the Flask backend lives. */
function resolveApi(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  if (__DEV__) {
    // Expo tells us the dev machine's address; the phone and the computer share a Wi-Fi network.
    const host = Constants.expoConfig?.hostUri?.split(":")[0];
    if (host && Platform.OS !== "web") return `http://${host}:5001/api`;
    return "http://localhost:5001/api";
  }
  return "https://talaba.uz/api";
}

export const API_BASE = resolveApi();
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL?.trim() || "https://talaba.uz").replace(/\/+$/, "");
export const EAS_PROJECT_ID = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() || undefined;
