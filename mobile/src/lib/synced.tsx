import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth";
import { kv } from "./storage";

/**
 * Cloud-synced student data (timetable, GPA, planner, skills …) — the same document the website syncs
 * through /api/sync. Each key is { v: value, t: last-edit time in ms }; the newer edit wins per key.
 * Works offline and signed-out too: edits stay on the phone and upload once there is a session.
 */
type Entry = { v: unknown; t: number };
type Doc = Record<string, Entry>;
const CACHE = "talaba:synced:v1";

interface SyncState {
  ready: boolean;
  syncing: boolean;
  get: <T>(key: string, fallback: T) => T;
  set: <T>(key: string, value: T) => void;
  sync: () => Promise<void>;
  lastError: string | null;
}
const Ctx = createContext<SyncState | null>(null);

/** Pure merge: for every key keep the entry with the larger timestamp. Exported for tests. */
export function mergeDocs(a: Doc, b: Doc): Doc {
  const out: Doc = { ...a };
  for (const [k, e] of Object.entries(b)) if (!out[k] || e.t > out[k].t) out[k] = e;
  return out;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [doc, setDoc] = useState<Doc>({});
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const docRef = useRef<Doc>({});
  const dirty = useRef<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback((next: Doc) => { docRef.current = next; setDoc(next); kv.set(CACHE, next); }, []);

  useEffect(() => { kv.get<Doc>(CACHE, {}).then((d) => { docRef.current = d; setDoc(d); setReady(true); }); }, []);

  const sync = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    // push everything we have (cheap; the server merges per key) and adopt anything newer from other devices
    const r = await api.put<{ data: Doc }>("/sync", { data: docRef.current });
    if (r.data) { commit(mergeDocs(docRef.current, r.data.data)); dirty.current.clear(); setLastError(null); }
    else setLastError(r.error);
    setSyncing(false);
  }, [user, commit]);

  // sync when the account becomes available
  useEffect(() => { if (ready && user) { sync(); } }, [ready, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback(<T,>(key: string, value: T) => {
    commit({ ...docRef.current, [key]: { v: value, t: Date.now() } });
    dirty.current.add(key);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { sync(); }, 1500);
  }, [commit, sync]);

  const get = useCallback(<T,>(key: string, fallback: T): T => (doc[key] ? (doc[key].v as T) : fallback), [doc]);

  const value = useMemo(() => ({ ready, syncing, get, set, sync, lastError }), [ready, syncing, get, set, sync, lastError]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSynced(): SyncState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSynced must be used inside <SyncProvider>");
  return c;
}
