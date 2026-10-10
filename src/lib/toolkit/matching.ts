import type { Job } from "@/types";
import type { Skill } from "./skills";

export interface JobMatch {
  /** 0–100 */
  score: number;
  /** short, human-readable reasons shown on the job card */
  reasons: string[];
}

/** Common abbreviations/spellings so "JS" matches "JavaScript", etc. */
const ALIASES: Record<string, string[]> = {
  javascript: ["javascript", "js", "node", "nodejs", "react", "vue", "typescript"],
  python: ["python", "django", "flask", "pandas"],
  sql: ["sql", "postgres", "postgresql", "mysql"],
  excel: ["excel", "spreadsheet", "google sheets"],
  figma: ["figma", "ui/ux", "ui ux", "dizayn", "design"],
  canva: ["canva", "dizayn", "design"],
  ielts: ["ielts", "ingliz", "english"],
  "ingliz tili": ["ingliz", "english", "ielts"],
  "rus tili": ["rus tili", "rus", "russian"],
  smm: ["smm", "marketing", "kontent", "content", "instagram"],
  "ma'lumotlar tahlili": ["tahlil", "analyst", "analitik", "data", "ma'lumot"],
};

const norm = (s: string) => s.toLowerCase().replace(/[‘’`ʻʼ]/g, "'");

function hasTerm(text: string, term: string): boolean {
  // whole-word-ish: avoid "js" matching inside "jsonwebtoken"
  const esc = term.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9'])${esc}($|[^a-z0-9'])`, "i").test(text);
}

function termsFor(skillName: string): string[] {
  const k = norm(skillName).trim();
  return Array.from(new Set([k, ...(ALIASES[k] ?? [])]));
}

/**
 * Explainable job ↔ student fit. Skill hits in the title/tags count most, hits in the
 * requirements/description less; higher self-rated levels weigh more. Flexible-schedule
 * jobs get a nudge and rigid full-time ones are penalised for students with a heavy timetable.
 */
export function scoreJob(job: Job, skills: Skill[], opts: { classHoursPerWeek?: number } = {}): JobMatch {
  const title = norm(job.title);
  const tags = norm((job.tags || []).join(", "));
  const body = norm([...(job.requirements || []), job.description || ""].join("\n"));

  let raw = 0;
  const reasons: string[] = [];
  for (const sk of skills) {
    const weight = 0.7 + 0.15 * Math.max(1, Math.min(5, sk.level));
    let hit = 0;
    for (const t of termsFor(sk.name)) {
      if (hasTerm(tags, t) || hasTerm(title, t)) { hit = Math.max(hit, 3); break; }
      if (hasTerm(body, t)) hit = Math.max(hit, 1.5);
    }
    if (hit > 0) {
      raw += hit * weight;
      reasons.push(`${sk.name} ko'nikmangiz mos`);
    }
  }

  if (raw > 0 && job.studentFriendly === "ha") { raw += 1.5; reasons.push("Talaba grafigiga mos"); }
  else if (job.studentFriendly === "yoq") raw -= 2;
  if ((opts.classHoursPerWeek ?? 0) >= 12 && job.type === "full-time") raw -= 2;

  return { score: Math.max(0, Math.min(100, Math.round((raw / 6) * 100))), reasons: reasons.slice(0, 3) };
}

export function rankJobs<T extends Job>(jobs: T[], skills: Skill[], opts: { classHoursPerWeek?: number } = {}) {
  return jobs
    .map((job) => ({ job, match: scoreJob(job, skills, opts) }))
    .sort((a, b) => b.match.score - a.match.score);
}
