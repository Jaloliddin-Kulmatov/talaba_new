import { api } from "@/lib/api";

export interface ReminderPrefs { classMin: number; exams: boolean; tasks: boolean }
export const DEFAULT_PREFS: ReminderPrefs = { classMin: 15, exams: true, tasks: true };
export const CLASS_MIN_CHOICES = [5, 10, 15, 20, 30, 45, 60];

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}
export const isIOS = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

function keyToBytes(b64: string): Uint8Array {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready));
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

export type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

export async function serverStatus(endpoint: string) {
  return api.get<{ subscribed: boolean; prefs: ReminderPrefs | null; configured: boolean }>(`/push/status?endpoint=${encodeURIComponent(endpoint)}`);
}

export async function enablePush(prefs: ReminderPrefs): Promise<Result<PushSubscription>> {
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, error: "Bildirishnomalarga ruxsat berilmadi." };

  const key = await api.get<{ key: string }>("/push/key");
  if (key.error || !key.data) {
    return { ok: false, error: key.status === 503 ? "Eslatmalar hozircha serverda sozlanmagan." : key.error ?? "Serverga ulanib bo'lmadi." };
  }
  const reg = await registration();
  let sub: PushSubscription;
  try {
    sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(key.data.key) as BufferSource }));
  } catch {
    return { ok: false, error: "Brauzer obunani yaratolmadi. Qayta urinib ko'ring." };
  }
  const res = await api.post("/push/subscribe", { subscription: sub.toJSON(), prefs });
  if (res.error) {
    await sub.unsubscribe().catch(() => {});   // keep the browser and the server in agreement
    return { ok: false, error: res.error };
  }
  return { ok: true, data: sub };
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  await api.delete("/push/subscribe", { endpoint: sub.endpoint });
  await sub.unsubscribe().catch(() => {});
}

export const savePrefs = (endpoint: string, prefs: Partial<ReminderPrefs>) => api.patch<{ prefs: ReminderPrefs }>("/push/prefs", { endpoint, prefs });
export const sendTest = (endpoint: string) => api.post<{ message: string }>("/push/test", { endpoint });
