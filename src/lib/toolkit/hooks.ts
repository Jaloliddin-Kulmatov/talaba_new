"use client";

import { useEffect, useState } from "react";

/**
 * Current time, refreshed every `ms` and whenever the tab becomes visible again.
 * `null` until mounted so server and first client render agree.
 */
export function useNow(ms = 30_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, ms);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ms]);
  return now;
}
