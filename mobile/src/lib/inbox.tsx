import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { api } from "./api";
import { useAuth } from "./auth";

/** Number of unread direct messages; refreshed every 30 s while the app is open, and whenever it comes back to the foreground. */
export function useUnread(): { count: number; refresh: () => void } {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setCount(0); return; }
    const r = await api.get<{ count: number }>("/messages/unread-count");
    if (r.data) setCount(r.data.count);
  }, [user]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") refresh(); });
    return () => { clearInterval(id); sub.remove(); };
  }, [refresh]);

  return { count, refresh };
}
