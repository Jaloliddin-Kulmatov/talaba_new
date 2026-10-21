import { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/config";
const BASE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static high-priority pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                        lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/community`,         lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/chat`,              lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/jobs`,              lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/universities`,      lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/daily-life`,        lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/support`,           lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/news`,             lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/tools`,             lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/tools/timetable`,   lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/tools/gpa`,         lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/tools/planner`,     lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/tools/focus`,       lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/tools/skills`,      lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/tools/cv`,          lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/tools/attendance`,  lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/reviews`,           lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/market`,            lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/lost-found`,        lastModified: now, changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE}/support/qabul`,     lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/support/turargoh`,  lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/support/stipendiya`,lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/support/harbiy`,    lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/support/transport`, lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/support/til`,       lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/support/parttime`,  lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/support/faq`,       lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/login`,             lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/register`,          lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`,           lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms`,             lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];

  return staticPages;
}
