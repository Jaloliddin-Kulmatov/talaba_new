import type { Job } from "@/types";

/** The shared matching module reads `studentFriendly` (the website's name for it); the API sends `student_friendly` ("ha" | "yoq" | "unclear"). */
export const normalizeJob = (j: Job): Job => ({ ...j, studentFriendly: j.student_friendly });

/** The backend stores internship | part-time | remote | full-time | research; students see Uzbek names. */
export const TYPE_LABEL: Record<string, string> = {
  internship: "Amaliyot", "part-time": "Part-time", remote: "Masofaviy", "full-time": "To'liq stavka", research: "Tadqiqot",
};
export const typeLabel = (t: string | null | undefined) => (t ? TYPE_LABEL[t] ?? t : "");
