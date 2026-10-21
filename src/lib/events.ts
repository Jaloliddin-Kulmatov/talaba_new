/** Club-event helpers. Pure and dependency-free, shared by the website and the phone app. */

export interface ClubEvent {
  id: number;
  club_id: number;
  club_name: string;
  title: string;
  description: string;
  starts_at: string;   // ISO, UTC
  location: string;
  is_mine: boolean;
}

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const TASHKENT_OFFSET_MS = 5 * 3600 * 1000;   // UTC+5 all year, no daylight saving

/** The wall-clock parts in Tashkent for a UTC instant. */
export function tashkentParts(iso: string) {
  const d = new Date(new Date(iso).getTime() + TASHKENT_OFFSET_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate(), h: d.getUTCHours(), min: d.getUTCMinutes() };
}

/** "12-oktabr, 18:30" (Tashkent time). */
export function formatEventTime(iso: string): string {
  const p = tashkentParts(iso);
  return `${p.day}-${MONTHS[p.m]}, ${String(p.h).padStart(2, "0")}:${String(p.min).padStart(2, "0")}`;
}

/** "Bugun 18:30" / "Ertaga 09:00" / "12-oktabr, 18:30" relative to `now`. */
export function formatEventWhen(iso: string, now: Date = new Date()): string {
  const e = tashkentParts(iso);
  const n = tashkentParts(now.toISOString());
  const dayDiff = Math.round((Date.UTC(e.y, e.m, e.day) - Date.UTC(n.y, n.m, n.day)) / 86400000);
  const hm = `${String(e.h).padStart(2, "0")}:${String(e.min).padStart(2, "0")}`;
  if (dayDiff === 0) return `Bugun ${hm}`;
  if (dayDiff === 1) return `Ertaga ${hm}`;
  return formatEventTime(iso);
}

/** `<input type="datetime-local">` value (device-local, "2026-10-12T18:30") → ISO UTC for the API. */
export function localInputToIso(value: string): string | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const gcalStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** "Add to Google Calendar" link; events default to a one-hour slot. */
export function googleCalendarUrl(e: Pick<ClubEvent, "title" | "description" | "location" | "starts_at" | "club_name">): string {
  const start = new Date(e.starts_at);
  const end = new Date(start.getTime() + 3600 * 1000);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${gcalStamp(start)}/${gcalStamp(end)}`,
    details: [e.club_name, e.description].filter(Boolean).join("\n"),
    location: e.location || "",
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
