/** "hozirgina", "5 daqiqa oldin", "2 soat oldin", "3 kun oldin", then the date. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.round((now.getTime() - t) / 1000));
  if (s < 45) return "hozirgina";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} kun oldin`;
  const dt = new Date(t);
  return `${dt.getDate()}.${String(dt.getMonth() + 1).padStart(2, "0")}.${dt.getFullYear()}`;
}

export const firstName = (name?: string | null) => (name || "").trim().split(/\s+/)[0] || "talaba";
export const initials = (name: string) => name.split(/\s+/).map((w) => w[0] || "").join("").slice(0, 2).toUpperCase() || "?";
