import { useSyncExternalStore } from "react";
import { kv } from "./storage";
import type { Skill } from "@shared/toolkit/skills";

/** What the student told us on the welcome screens. Stored on the phone only (the city also goes to the profile). */
export interface Prefs {
  welcomed: boolean;
  goal: "internship" | "parttime" | "fulltime" | "explore" | "";
  field: string;
  languageLevel: string;
  city: string;
  /** wants a daily e-mail about new jobs (switched on at the server once signed in) */
  alerts: boolean;
}
export const DEFAULT_PREFS: Prefs = { welcomed: false, goal: "", field: "", languageLevel: "", city: "", alerts: false };
const KEY = "talaba:prefs:v1";

export const GOALS: { id: Prefs["goal"]; label: string }[] = [
  { id: "internship", label: "Amaliyot (stajirovka)" },
  { id: "parttime", label: "Part-time ish" },
  { id: "fulltime", label: "To'liq stavka" },
  { id: "explore", label: "Hozircha ko'rib chiqaman" },
];

/** Field → keywords the shared job-matching understands. */
export const FIELDS: { id: string; label: string; skills: string[] }[] = [
  { id: "it", label: "IT va dasturlash", skills: ["Python", "JavaScript", "SQL"] },
  { id: "marketing", label: "Marketing va SMM", skills: ["SMM", "Canva"] },
  { id: "design", label: "Dizayn", skills: ["Figma", "Canva"] },
  { id: "languages", label: "Tillar va tarjima", skills: ["IELTS", "Ingliz tili", "Rus tili"] },
  { id: "analytics", label: "Tahlil va moliya", skills: ["Excel", "Ma'lumotlar tahlili", "SQL"] },
  { id: "other", label: "Boshqa", skills: [] },
];

export const LANGUAGE_LEVELS = ["Boshlang'ich", "O'rta (B1)", "Yuqori (B2)", "IELTS 6.5+"];

/** Skills implied by the chosen field, in the shape the matching module expects. */
export function skillsFromField(field: string): Skill[] {
  const f = FIELDS.find((x) => x.id === field);
  return (f?.skills ?? []).map((name, i) => ({
    id: `pref-${i}`, name, category: "boshqa" as const, level: 3, goal: 4, logs: [], createdAt: "",
  }));
}

// A tiny shared store, so the welcome screens and the rest of the app always agree.
let current: Prefs | null = null;
let loading = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function load() {
  if (current || loading) return;
  loading = true;
  kv.get<Prefs>(KEY, DEFAULT_PREFS).then((p) => { current = { ...DEFAULT_PREFS, ...p }; loading = false; emit(); });
}

export function setPrefs(patch: Partial<Prefs>) {
  current = { ...(current ?? DEFAULT_PREFS), ...patch };
  kv.set(KEY, current);
  emit();
}

/** `null` until the saved preferences have been read. */
export function usePrefs() {
  const prefs = useSyncExternalStore(
    (cb) => { listeners.add(cb); load(); return () => { listeners.delete(cb); }; },
    () => current,
    () => current,
  );
  return { prefs, setPrefs };
}
