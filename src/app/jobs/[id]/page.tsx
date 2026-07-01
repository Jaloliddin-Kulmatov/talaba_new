"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Clock, DollarSign, CheckCircle2,
  Briefcase, Tag, Calendar, Loader2, AlertCircle, Building2, ExternalLink,
  Bookmark, BookmarkCheck, Globe, Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import { Bookmarks } from "@/lib/bookmarks";
import type { Job as JobType } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const typeConfig: Record<string, { label: string; variant: "default" | "success" | "cyan" | "warning" | "violet" }> = {
  "part-time":  { label: "Qisman bandlik", variant: "default" },
  internship:   { label: "Amaliyot",       variant: "cyan"    },
  research:     { label: "Tadqiqot",       variant: "violet"  },
  "full-time":  { label: "To'liq stavka",  variant: "success" },
  remote:       { label: "Masofaviy",      variant: "warning" },
};

const UZ_MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

interface JobDetail {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  requirements: string[];
  schedule_compatible: string[];
  deadline?: string;
  tags: string[];
  apply_link?: string;
  student_friendly?: "ha" | "yoq" | "unclear" | "";
  student_friendly_note?: string;
  apply_count?: number;
  isNew?: boolean;
  created_at: string;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    fetch(`${API}/admin/jobs/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject("Not found"))
      .then(d => {
        setJob(d.job);
        if (d.job) setBookmarked(Bookmarks.jobs.has(String(d.job.id)));
      })
      .catch(() => setError("E'lon topilmadi yoki endi mavjud emas."))
      .finally(() => setLoading(false));
  }, [id]);

  // Convert API shape (snake_case, numeric id) → bookmarks-store shape
  // (camelCase, string id) so the saved-jobs page can render them.
  const toBookmarkShape = (j: JobDetail): JobType => ({
    id: String(j.id),
    title: j.title,
    company: j.company,
    location: j.location,
    type: (j.type || "internship") as JobType["type"],
    salary: j.salary,
    description: j.description,
    requirements: j.requirements,
    scheduleCompatible: j.schedule_compatible,
    postedAt: j.created_at,
    deadline: j.deadline,
    applications: 0,
    tags: j.tags,
    isNew: j.isNew,
    applyLink: j.apply_link,
    studentFriendly: j.student_friendly,
    studentFriendlyNote: j.student_friendly_note,
  });

  const toggleBookmark = () => {
    if (!job) return;
    const nowSaved = Bookmarks.jobs.toggle(toBookmarkShape(job));
    setBookmarked(nowSaved);
  };

  const handleApply = () => {
    if (!job?.apply_link) return;
    // Fire-and-forget: bump the apply counter so cards/lists can show
    // "N ariza" reflecting real click-through, not a placeholder zero.
    fetch(`${API}/admin/jobs/${job.id}/apply-click`, { method: "POST" })
      .catch(() => { /* counter failure shouldn't block the apply jump */ });
    setJob((prev) => prev ? { ...prev, apply_count: (prev.apply_count || 0) + 1 } : prev);
    window.open(job.apply_link, "_blank", "noopener,noreferrer");
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center pt-40">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    </div>
  );

  if (error || !job) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 text-center">
        <AlertCircle size={32} className="text-muted-foreground/40 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-foreground mb-2">E'lon topilmadi</h1>
        <p className="text-sm text-muted-foreground mb-8">Bu e'lon muddati tugagan bo'lishi mumkin. Boshqa platformalarda ish qidirib ko'ring:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-8">
          {[
            { name: "hh.uz", sub: "HeadHunter O'zbekiston — eng yirik ish portali", url: "https://hh.uz", flag: "💼" },
            { name: "mehnat.uz", sub: "Davlat mehnat birjasi portali", url: "https://mehnat.uz", flag: "🇺🇿" },
            { name: "OLX.uz", sub: "Mahalliy e'lonlar va ish taxminlari", url: "https://www.olx.uz", flag: "📋" },
            { name: "LinkedIn", sub: "Xalqaro va ingliz tilidagi vakansiyalar", url: "https://www.linkedin.com/jobs", flag: "🌍" },
          ].map(site => (
            <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-blue-500/30 hover:bg-muted/50 transition-all group">
              <span className="text-2xl">{site.flag}</span>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{site.name}</p>
                <p className="text-xs text-muted-foreground">{site.sub}</p>
              </div>
              <ExternalLink size={13} className="text-muted-foreground/40 group-hover:text-blue-500 ml-auto shrink-0" />
            </a>
          ))}
        </div>

        <Link href="/jobs" className="text-sm px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors inline-block">
          ← TALABA ish e'lonlariga qaytish
        </Link>
      </div>
    </div>
  );

  const typeInfo = typeConfig[job.type] ?? { label: job.type, variant: "default" as const };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <div className="border-b border-border bg-gradient-to-b from-blue-500/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-5 transition-colors">
              <ArrowLeft size={13} /> Ish e'lonlariga qaytish
            </Link>

            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-border flex items-center justify-center text-xl font-bold text-foreground shrink-0">
                {job.company[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
                  {job.isNew && <Badge variant="new" className="text-[10px]">Yangi</Badge>}
                </div>
                <p className="text-sm text-muted-foreground font-medium mb-3">{job.company}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                  {job.salary && <span className="flex items-center gap-1"><DollarSign size={11} />{job.salary}</span>}
                  <span className="flex items-center gap-1"><Clock size={11} />{formatRelativeTime(job.created_at)}</span>
                  <span className="flex items-center gap-1"><Users size={11} />{job.apply_count || 0} ta ariza</span>
                  {job.deadline && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Calendar size={11} />
                      {(() => {
                        const m = job.deadline.match(/^(\d{4})-(\d{2})-(\d{2})/);
                        if (!m) return `Muddat: ${job.deadline}`;
                        const d = new Date(`${m[0]}T00:00:00Z`);
                        if (isNaN(d.getTime())) return `Muddat: ${job.deadline}`;
                        return `Muddati: ${d.getUTCDate()}-${UZ_MONTHS[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;
                      })()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
              {job.schedule_compatible.map(v => (
                <Badge key={v} variant="success" className="gap-1 text-xs capitalize">
                  <CheckCircle2 size={10} /> {v}
                </Badge>
              ))}
              {job.tags.map(t => (
                <Badge key={t} variant="outline" className="text-xs border-border">
                  <Tag size={9} className="mr-1" />{t}
                </Badge>
              ))}
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Briefcase size={14} className="text-blue-500" /> Vazifa tavsifi
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>

            {/* Requirements */}
            {job.requirements.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" /> Talablar
                </h2>

                {/* AI-detected schedule-friendliness banner — sits above the
                    requirements list so applicants can see at a glance whether
                    the schedule fits their studies. */}
                {job.student_friendly === "ha" && (
                  <div className="mb-3 flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-semibold text-emerald-500">Talaba jadvaliga mos</p>
                      {job.student_friendly_note && (
                        <p className="text-muted-foreground mt-0.5">{job.student_friendly_note}</p>
                      )}
                    </div>
                  </div>
                )}
                {job.student_friendly === "yoq" && (
                  <div className="mb-3 flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-semibold text-amber-500">To'liq kunlik, moslashuvsiz grafik</p>
                      {job.student_friendly_note && (
                        <p className="text-muted-foreground mt-0.5">{job.student_friendly_note}</p>
                      )}
                    </div>
                  </div>
                )}
                {job.student_friendly === "unclear" && (
                  <div className="mb-3 flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-muted/50 border border-border">
                    <AlertCircle size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-semibold text-foreground">Jadval moslashuvchanligi ko'rsatilmagan</p>
                      <p className="text-muted-foreground mt-0.5">
                        Ariza berishdan oldin ish beruvchi bilan bog'lanib tasdiqlang.
                      </p>
                    </div>
                  </div>
                )}

                <ul className="space-y-2">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                      <span className="text-emerald-500 mt-0.5 shrink-0">·</span>
                      <span className="leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent p-5">
              {job.apply_link ? (
                <Button
                  onClick={handleApply}
                  className="w-full mb-2 gap-2"
                  size="lg"
                >
                  Ariza berish <ExternalLink size={14} />
                </Button>
              ) : (
                <Button
                  className="w-full mb-2"
                  size="lg"
                  disabled
                  title="Ariza havolasi berilmagan — ish beruvchi bilan bevosita bog'laning"
                >
                  Ariza berish
                </Button>
              )}

              <button
                onClick={toggleBookmark}
                className={`w-full h-10 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  bookmarked
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/15"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-blue-500/30"
                }`}
                aria-pressed={bookmarked}
              >
                {bookmarked ? (
                  <><BookmarkCheck size={14} /> Saqlangan</>
                ) : (
                  <><Bookmark size={14} /> Keyinroq uchun saqlash</>
                )}
              </button>

              <p className="text-[11px] text-muted-foreground text-center mt-3">
                {job.apply_link
                  ? "\"Ariza berish\" ish beruvchining rasmiy sahifasini yangi oynada ochadi."
                  : "Ariza berish uchun ish beruvchi bilan bevosita bog'laning yoki veb-saytiga tashrif buyuring."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 size={12} className="text-muted-foreground" /> E'lon tafsilotlari
              </h3>
              {(() => {
                // Format an ISO date like "2026-08-15" into "15-avg, 2026".
                const fmtDeadline = (raw?: string) => {
                  if (!raw) return "Doimiy — istalgan vaqtda ariza bering";
                  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
                  if (!m) return raw;
                  const d = new Date(`${m[0]}T00:00:00Z`);
                  if (isNaN(d.getTime())) return raw;
                  return `${d.getUTCDate()}-${UZ_MONTHS[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;
                };
                const rows = [
                  { label: "Turi",     value: typeInfo.label },
                  { label: "Joylashuv",value: job.location },
                  { label: "Maosh",    value: job.salary || "Ko'rsatilmagan" },
                  { label: "Muddat",   value: fmtDeadline(job.deadline) },
                ];
                return rows.map(row => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="text-foreground font-medium text-right max-w-[60%]">{row.value}</span>
                  </div>
                ));
              })()}
            </div>

            {/* Schedule-friendliness status — explicit when we know, "Not clear"
                when AI couldn't determine. "yoq" rows are filtered out by the
                scraper, so this card never shows "not compatible". */}
            {(job.student_friendly || "") && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <Globe size={12} className="text-blue-500" /> Talabalar uchun moslik
                </h3>
                <div className={`flex items-start gap-2 text-xs ${
                  job.student_friendly === "ha"  ? "text-emerald-500" :
                  job.student_friendly === "yoq" ? "text-red-500" :
                  "text-amber-500"
                }`}>
                  {job.student_friendly === "ha" ? <CheckCircle2 size={12} className="shrink-0 mt-0.5" /> :
                   job.student_friendly === "yoq" ? <AlertCircle size={12} className="shrink-0 mt-0.5" /> :
                   <AlertCircle size={12} className="shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-medium text-foreground">
                      {job.student_friendly === "ha" ? "Talaba jadvaliga mos"
                       : job.student_friendly === "yoq" ? "Qattiq, to'liq kunlik grafik"
                       : "Aniq emas — ish beruvchi bilan bog'laning"}
                    </p>
                    {job.student_friendly_note && (
                      <p className="text-muted-foreground mt-1 leading-relaxed">{job.student_friendly_note}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-500" /> Mos ta'lim jadvali
              </h3>
              {job.schedule_compatible.length > 0 ? job.schedule_compatible.map(v => (
                <div key={v} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                  <span className="text-foreground capitalize">{v} talabalari ariza bera oladi</span>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground">Jadval moslashuvi haqida ish beruvchidan so'rang.</p>
              )}
            </div>

            <Link href="/jobs" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors justify-center">
              <ExternalLink size={11} /> Boshqa e'lonlarni ko'rish
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
