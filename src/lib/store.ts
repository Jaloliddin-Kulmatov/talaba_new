"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed store for the student toolkit.
 *
 * - SSR-safe: the server snapshot is always `initial`, the client re-renders
 *   with the saved value right after hydration (no hydration mismatch).
 * - Same-tab and cross-tab sync (custom event + the native `storage` event).
 * - Survives storage being unavailable (Safari private mode, quota errors):
 *   values are mirrored in memory so the UI keeps working for the session.
 *
 * All keys are namespaced `talaba:` — the auth token (`talaba_token`) and the
 * theme (`talaba-theme`) deliberately don't match, so backups never include them.
 */

export const STORE_PREFIX = "talaba:";

/** Keys mirrored to the account when signed in (must match SYNC_KEYS in backend/routes/sync.py). */
export const SYNC_KEYS = [
  "talaba:timetable:v1",
  "talaba:gpa:v1",
  "talaba:planner:v1",
  "talaba:focus:v1",
  "talaba:attendance:v1",
] as const;
export const SYNC_META_KEY = "talaba:sync-meta";     // { [key]: last local edit time (ms) }
export const SYNC_STATE_KEY = "talaba:sync-state";   // { lastSyncedAt?, error? } — shown in the UI
export const SYNC_BACKUP_KEY = "talaba:sync-backup"; // local copies replaced by a newer cloud copy
export const SYNC_OWNER_KEY = "talaba:sync-owner";   // which account the local toolkit data belongs to

/** Per-device sync bookkeeping. Never part of a backup file: restoring another device's owner/timestamps would break sync. */
const BOOKKEEPING = new Set<string>([SYNC_META_KEY, SYNC_STATE_KEY, SYNC_BACKUP_KEY, SYNC_OWNER_KEY]);

const memory = new Map<string, string>();
const parsed = new Map<string, { raw: string | null; value: unknown }>();
const listeners = new Set<() => void>();

function readRaw(key: string): string | null {
  try {
    const v = window.localStorage.getItem(key);
    if (v !== null) return v;
  } catch {
    /* storage unavailable — fall through to memory */
  }
  return memory.get(key) ?? null;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith(STORE_PREFIX)) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function snapshot<T>(key: string, initial: T): T {
  const raw = readRaw(key);
  const hit = parsed.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = initial;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = initial;
    }
  }
  parsed.set(key, { raw, value });
  return value;
}

function setRaw(key: string, raw: string) {
  memory.set(key, raw);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    /* quota / private mode — memory copy keeps the session working */
  }
}

const writeListeners = new Set<(key: string) => void>();
/** Called after the student edits a synced key (not when the sync engine applies cloud data). */
export function onLocalWrite(cb: (key: string) => void) {
  writeListeners.add(cb);
  return () => { writeListeners.delete(cb); };
}

/** Remove all synced toolkit data + sync bookkeeping from this device (used when a different account signs in). */
export function clearSyncedData() {
  for (const k of [...SYNC_KEYS, SYNC_META_KEY, SYNC_STATE_KEY, SYNC_BACKUP_KEY]) {
    memory.delete(k);
    parsed.delete(k);
    try { window.localStorage.removeItem(k); } catch { /* ignore */ }
  }
  emit();
}

export function readStore<T>(key: string): T | null {
  const raw = readRaw(key);
  if (raw === null) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}
export const getSyncMeta = (): Record<string, number> => readStore<Record<string, number>>(SYNC_META_KEY) ?? {};
export function setSyncMeta(key: string, t: number) {
  setRaw(SYNC_META_KEY, JSON.stringify({ ...getSyncMeta(), [key]: t }));
}

export function writeStore<T>(key: string, value: T, opts: { fromSync?: boolean; t?: number } = {}) {
  setRaw(key, JSON.stringify(value));
  if ((SYNC_KEYS as readonly string[]).includes(key)) {
    setSyncMeta(key, opts.t ?? Date.now());
    if (!opts.fromSync) writeListeners.forEach((cb) => cb(key));
  }
  emit();
}

/**
 * `initial` MUST be a stable reference (a module-level constant): it is
 * returned as-is until something is saved, and React compares snapshots by
 * identity.
 */
export function useLocalStore<T>(key: string, initial: T) {
  const value = useSyncExternalStore(
    subscribe,
    () => snapshot(key, initial),
    () => initial,
  );

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = snapshot(key, initial);
      writeStore(key, typeof next === "function" ? (next as (p: T) => T)(prev) : next);
    },
    [key, initial],
  );

  return [value, set] as const;
}

/** False during SSR and the hydration pass, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// ── Backup / restore ───────────────────────────────────────────────────

export interface Backup {
  app: "talaba";
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

export function exportBackup(): Backup {
  const data: Record<string, unknown> = {};
  const keys = new Set<string>(memory.keys());
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k) keys.add(k);
    }
  } catch {
    /* ignore */
  }
  keys.forEach((k) => {
    if (!k.startsWith(STORE_PREFIX) || BOOKKEEPING.has(k)) return;
    const raw = readRaw(k);
    if (raw === null) return;
    try {
      data[k] = JSON.parse(raw);
    } catch {
      /* skip corrupt entries */
    }
  });
  return { app: "talaba", version: 1, exportedAt: new Date().toISOString(), data };
}

/** Returns the number of keys restored, or throws a user-facing Error. */
export function importBackup(text: string): number {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Fayl noto'g'ri formatda. TALABA zaxira faylini tanlang.");
  }
  const b = json as Partial<Backup> | null;
  if (!b || b.app !== "talaba" || typeof b.data !== "object" || b.data === null) {
    throw new Error("Bu TALABA zaxira fayli emas.");
  }
  let n = 0;
  for (const [k, v] of Object.entries(b.data)) {
    if (!k.startsWith(STORE_PREFIX) || BOOKKEEPING.has(k)) continue; // never touch anything outside our namespace, or sync bookkeeping
    const raw = JSON.stringify(v);
    setRaw(k, raw);
    if ((SYNC_KEYS as readonly string[]).includes(k)) { setSyncMeta(k, Date.now()); writeListeners.forEach((cb) => cb(k)); }
    n++;
  }
  emit();
  return n;
}
