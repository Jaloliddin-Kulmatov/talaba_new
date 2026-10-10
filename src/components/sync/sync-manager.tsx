"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { SYNC_OWNER_KEY, clearSyncedData, onLocalWrite, readStore, writeStore } from "@/lib/store";
import { syncNow } from "@/lib/sync";

/**
 * Keeps the toolkit data of a signed-in student in sync with their account.
 * Renders nothing. Signed-out visitors are never synced — their data stays on the device.
 */
export default function SyncManager() {
  const { user } = useAuth();
  const uid = user?.id;

  useEffect(() => {
    if (!uid) return;

    // A different account on a shared device must never inherit (or upload) the previous account's data.
    const owner = readStore<number>(SYNC_OWNER_KEY);
    if (owner !== null && owner !== uid) clearSyncedData();
    writeStore(SYNC_OWNER_KEY, uid);

    let timer: number | undefined;
    const run = () => { void syncNow(); };
    run(); // on sign-in / app open

    const off = onLocalWrite(() => {          // debounce bursts of edits
      window.clearTimeout(timer);
      timer = window.setTimeout(run, 3000);
    });
    const onVisible = () => { if (document.visibilityState === "visible") run(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", run);
    return () => {
      off();
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", run);
    };
  }, [uid]);

  return null;
}
