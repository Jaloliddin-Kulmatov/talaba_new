import type { Skill } from "./skills";
import { LEVEL_LABEL } from "./skills";

export const CV_KEY = "talaba:cv:v1";

export type CvLang = "uz" | "en" | "ru";
export type CvTemplate = "ats" | "modern";

export interface Edu { id: string; school: string; degree: string; from: string; to: string }
export interface Exp { id: string; org: string; role: string; from: string; to: string; desc: string }
export interface Proj { id: string; name: string; link: string; desc: string }
export interface Lang { id: string; name: string; level: string }

export interface CvData {
  lang: CvLang;
  template: CvTemplate;
  accent: string;
  fullName: string;
  title: string;
  email: string;
  phone: string;
  telegram: string;
  city: string;
  summary: string;
  education: Edu[];
  experience: Exp[];
  projects: Proj[];
  languages: Lang[];
  extraSkills: string;
  includeTrackedSkills: boolean;
}

export const EMPTY_CV: CvData = {
  lang: "uz", template: "ats", accent: "#2563eb",
  fullName: "", title: "", email: "", phone: "", telegram: "", city: "", summary: "",
  education: [], experience: [], projects: [], languages: [], extraSkills: "", includeTrackedSkills: true,
};

export const ACCENTS = ["#2563eb", "#0891b2", "#059669", "#7c3aed", "#e11d48", "#334155"];

export const HEADINGS: Record<CvLang, Record<"summary" | "education" | "experience" | "projects" | "skills" | "languages" | "contact" | "present", string>> = {
  uz: { summary: "Men haqimda", education: "Ta'lim", experience: "Tajriba", projects: "Loyihalar", skills: "Ko'nikmalar", languages: "Tillar", contact: "Aloqa", present: "hozir" },
  en: { summary: "Summary", education: "Education", experience: "Experience", projects: "Projects", skills: "Skills", languages: "Languages", contact: "Contact", present: "present" },
  ru: { summary: "О себе", education: "Образование", experience: "Опыт работы", projects: "Проекты", skills: "Навыки", languages: "Языки", contact: "Контакты", present: "по настоящее время" },
};
export const LANG_LABEL: Record<CvLang, string> = { uz: "O'zbekcha", en: "English", ru: "Русский" };
export const LEVEL_OPTIONS: Record<CvLang, string[]> = {
  uz: ["Ona tili", "Erkin", "Yaxshi", "O'rta", "Boshlang'ich"],
  en: ["Native", "Fluent", "Advanced", "Intermediate", "Basic"],
  ru: ["Родной", "Свободно", "Продвинутый", "Средний", "Базовый"],
};

export function skillList(cv: CvData, tracked: Skill[]): string[] {
  const extra = cv.extraSkills.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  const own = cv.includeTrackedSkills
    ? [...tracked].sort((a, b) => b.level - a.level).map((s) => (s.level >= 3 ? `${s.name} (${LEVEL_LABEL[s.level]})` : s.name))
    : [];
  return Array.from(new Set([...own, ...extra]));
}

export interface Completeness { pct: number; tips: string[] }

export function completeness(cv: CvData, skillCount: number): Completeness {
  const checks: [boolean, string][] = [
    [cv.fullName.trim().length > 2, "To'liq ismingizni yozing."],
    [cv.title.trim().length > 2, "Qaysi lavozim/amaliyotga murojaat qilayotganingizni yozing."],
    [!!(cv.email.trim() || cv.phone.trim()), "Email yoki telefon raqamingizni kiriting."],
    [cv.summary.trim().length >= 60, "«Men haqimda» qismini 2–3 jumla (kamida 60 belgi) qilib yozing."],
    [cv.education.length > 0, "Ta'lim ma'lumotini qo'shing."],
    [cv.experience.length + cv.projects.length > 0, "Kamida bitta tajriba yoki loyiha qo'shing — amaliyotchi uchun o'quv loyihasi ham bo'ladi."],
    [skillCount >= 3, "Kamida 3 ta ko'nikma ko'rsating."],
    [cv.languages.length > 0, "Biladigan tillaringizni qo'shing."],
  ];
  const done = checks.filter(([ok]) => ok).length;
  return { pct: Math.round((done / checks.length) * 100), tips: checks.filter(([ok]) => !ok).map(([, t]) => t) };
}

export function period(from: string, to: string, present: string): string {
  const a = from.trim(), b = to.trim();
  if (!a && !b) return "";
  return `${a || "…"} – ${b || present}`;
}
