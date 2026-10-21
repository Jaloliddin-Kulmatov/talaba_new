import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/** Sign-in token: Keychain / Keystore on a phone, localStorage in a browser. Never throws. */
export const secure = {
  async get(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
      return await SecureStore.getItemAsync(key);
    } catch { return null; }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === "web") { localStorage.setItem(key, value); return; }
      await SecureStore.setItemAsync(key, value);
    } catch { /* storage unavailable: the user just has to sign in again next time */ }
  },
  async del(key: string): Promise<void> {
    try {
      if (Platform.OS === "web") { localStorage.removeItem(key); return; }
      await SecureStore.deleteItemAsync(key);
    } catch { /* ignore */ }
  },
};

/** Non-secret preferences and cached data. */
export const kv = {
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
  },
  async set(key: string, value: unknown): Promise<void> {
    try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  },
  async del(key: string): Promise<void> {
    try { await AsyncStorage.removeItem(key); } catch { /* ignore */ }
  },
};
