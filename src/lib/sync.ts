import { api } from "@/lib/api";
import {
  SYNC_BACKUP_KEY, SYNC_KEYS, SYNC_STATE_KEY, getSyncMeta, readStore, setSyncMeta, writeStore,
} from "@/lib/store";

export interface SyncState {
  lastSyncedAt?: string; // ISO
  error?: string;
  /** keys whose older local copy was replaced by a newer cloud copy on the last sync */
  replaced?: string[];
}

interface Entry { v: unknown; t: number }
interface ServerPayload { data: Record<string, Entry>; updated_at: string | null }

let running = false;
let queued = false;

const setState = (s: SyncState) => writeStore(SYNC_STATE_KEY, s);

/**
 * Two-way merge with the account copy, last-write-wins per key (by edit time).
 *  1. send everything we have, stamped with when it was last edited here
 *  2. the server keeps the newer copy of each key and returns the merged result
 *  3. adopt any key where the cloud copy is newer than ours
 * A local copy that gets replaced is kept in `talaba:sync-backup` so nothing is silently lost.
 */
export async function syncNow(): Promise<SyncState> {
  if (typeof window === "undefined") return {};
  if (running) { queued = true; return readStore<SyncState>(SYNC_STATE_KEY) ?? {}; }
  running = true;
  try {
    const meta = getSyncMeta();
    const payload: Record<string, Entry> = {};
    for (const key of SYNC_KEYS) {
      const v = readStore<unknown>(key);
      if (v !== null) payload[key] = { v, t: meta[key] ?? 1 }; // data from before sync existed counts as oldest
    }

    const res = await api.put<ServerPayload>("/sync", { data: payload });
    if (res.error || !res.data) {
      const st: SyncState = { ...(readStore<SyncState>(SYNC_STATE_KEY) ?? {}), error: res.status === 401 ? "Sinxronlash uchun qayta kiring." : res.error ?? "Sinxronlashda xatolik." };
      setState(st); return st;
    }

    const replaced: string[] = [];
    for (const key of SYNC_KEYS) {
      const srv = res.data.data[key];
      const localT = getSyncMeta()[key];
      if (payload[key] && localT === undefined) setSyncMeta(key, 1);
      if (!srv || srv.t <= (localT ?? (payload[key] ? 1 : 0))) continue;
      const local = readStore<unknown>(key);
      if (local !== null && JSON.stringify(local) !== JSON.stringify(srv.v)) {
        const backups = readStore<Record<string, { v: unknown; at: string }>>(SYNC_BACKUP_KEY) ?? {};
        writeStore(SYNC_BACKUP_KEY, { ...backups, [key]: { v: local, at: new Date().toISOString() } });
        replaced.push(key);
      }
      writeStore(key, srv.v, { fromSync: true, t: srv.t });
    }
    const st: SyncState = { lastSyncedAt: new Date().toISOString(), replaced: replaced.length ? replaced : undefined };
    setState(st); return st;
  } finally {
    running = false;
    if (queued) { queued = false; void syncNow(); }
  }
}
