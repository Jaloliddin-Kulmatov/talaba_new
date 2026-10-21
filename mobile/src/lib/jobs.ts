import type { Job } from "@/types";

/** The shared matching module reads `studentFriendly` (the website's name for it); the API sends `student_friendly` ("ha" | "yoq" | "unclear"). */
export const normalizeJob = (j: Job): Job => ({ ...j, studentFriendly: j.student_friendly });
