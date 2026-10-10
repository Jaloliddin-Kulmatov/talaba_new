"use client";

import React, { useState, useMemo } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import JobCard from "@/components/jobs/job-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Sparkles, TrendingUp, CheckCircle2, MapPin, BellRing, BellOff, Loader2, X } from "lucide-react";
import { JOB_CATEGORIES, UNIVERSITIES } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { useLocalStore } from "@/lib/store";
import { EMPTY_SKILLS, SKILLS_KEY } from "@/lib/toolkit/skills";
import { EMPTY_TIMETABLE, TIMETABLE_KEY, weeklyClassHours } from "@/lib/toolkit/timetable";
import { rankJobs, scoreJob } from "@/lib/toolkit/matching";
import type { Job } from "@/types";

const ALERT_FIELDS = ["IT / Dasturlash", "Marketing", "Muhandislik", "Biznes / Boshqaruv", "Dizayn", "Moliya", "Tadqiqot", "Media / Kontent", "Savdo", "Barcha yo'nalishlar"];
const ALERT_LOCATIONS = ["Toshkent", "Samarqand", "Farg'ona vodiysi", "Buxoro", "Boshqa viloyat", "Butun O'zbekiston"];

const SCHEDULE_FILTERS = ["kunduzgi", "sirtqi", "kechki", "barchasi"];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function JobsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Barchasi");
  const [scheduleFilter, setScheduleFilter] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState(false);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"new" | "match" | "applied">("new");
  const [skillsData] = useLocalStore(SKILLS_KEY, EMPTY_SKILLS);
  const [timetable] = useLocalStore(TIMETABLE_KEY, EMPTY_TIMETABLE);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertsBusy, setAlertsBusy] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertField, setAlertField] = useState("Barcha yo'nalishlar");
  const [alertLocation, setAlertLocation] = useState("Butun O'zbekiston");

  // Resolve the user's university to a region (viloyat). Match by id, short
  // name, or full name so any of the values we save in user.university work.
  const myRegion = useMemo(() => {
    const uniId = (user?.university || "").trim();
    if (!uniId) return null;
    const lc = uniId.toLowerCase();
    const uni = UNIVERSITIES.find(
      (u) =>
        u.id.toLowerCase() === lc ||
        u.shortName.toLowerCase() === lc ||
        u.name.toLowerCase() === lc
    );
    if (!uni) return null;
    const keywords = [uni.city, uni.region].filter(Boolean).map((k) => k.toLowerCase());
    return { city: uni.city, region: uni.region, keywords };
  }, [user?.university]);

  React.useEffect(() => {
    fetch(`${API}/admin/jobs`)
      .then(r => r.json())
      .then(d => {
        if (d.jobs?.length) {
          const mapped: Job[] = d.jobs.map((j: {
            id: string; title: string; company: string; location: string; type: string;
            salary: string; description: string; requirements: string[]; schedule_compatible: string[];
            deadline: string; tags: string[]; isNew: boolean; apply_link: string;
            created_at?: string;
            student_friendly?: string; student_friendly_note?: string;
            apply_count?: number;
          }) => ({
            id: `db-${j.id}`, title: j.title, company: j.company, location: j.location || "",
            type: "internship" as Job["type"], salary: j.salary || "", description: j.description || "",
            requirements: j.requirements, scheduleCompatible: j.schedule_compatible,
            // Use the real creation timestamp from the DB so "Posted X ago"
            // shows the actual age instead of "just now" every render.
            postedAt: j.created_at || new Date().toISOString(),
            deadline: j.deadline,
            // applications = real click count from the backend, so cards
            // show "12 ta ariza" instead of always "0 ta ariza".
            applications: j.apply_count || 0,
            applyCount: j.apply_count || 0,
            tags: j.tags, isNew: j.isNew, isHot: false, isBookmarked: false,
            applyLink: j.apply_link || "",
            studentFriendly: (j.student_friendly || "") as Job["studentFriendly"],
            studentFriendlyNote: j.student_friendly_note || "",
          }));
          setAllJobs(mapped);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load the current user's alerts subscription state so the button can
  // render "Alerts on" vs "Enable Alerts" correctly on refresh.
  React.useEffect(() => {
    if (!user) { setAlertsEnabled(false); return; }
    const token = typeof window !== "undefined" ? localStorage.getItem("talaba_token") : null;
    if (!token) return;
    fetch(`${API}/admin/jobs/alerts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAlertsEnabled(!!d.enabled); })
      .catch(() => { /* harmless */ });
  }, [user]);

  // Top hiring companies — counted from currently-active jobs. Falls back
  // to nothing when the DB is empty (the sidebar block hides itself).
  const topCompanies = useMemo(() => {
    const tallies = new Map<string, number>();
    for (const j of allJobs) {
      const name = (j.company || "").trim();
      if (!name) continue;
      tallies.set(name, (tallies.get(name) || 0) + 1);
    }
    return Array.from(tallies.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, jobs]) => ({ name, jobs }));
  }, [allJobs]);

  const toggleAlerts = async () => {
    if (alertsBusy) return;
    if (!user) {
      window.location.href = "/login?force=1";
      return;
    }
    // If turning OFF — disable immediately, no modal needed
    if (alertsEnabled) {
      setAlertsBusy(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("talaba_token") : null;
        const res = await fetch(`${API}/admin/jobs/alerts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
          body: JSON.stringify({ enabled: false }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) setAlertsEnabled(!!data.enabled);
      } catch { /* keep last known state */ }
      finally { setAlertsBusy(false); }
      return;
    }
    // If turning ON — show preferences modal first
    setShowAlertModal(true);
  };

  const confirmAlerts = async () => {
    setShowAlertModal(false);
    setAlertsBusy(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("talaba_token") : null;
      const res = await fetch(`${API}/admin/jobs/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ enabled: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAlertsEnabled(!!data.enabled);
        // Save preferences to localStorage so we can display them
        localStorage.setItem("job_alert_field", alertField);
        localStorage.setItem("job_alert_location", alertLocation);
      }
    } catch { /* keep last known state */ }
    finally { setAlertsBusy(false); }
  };

  const toggleSchedule = (v: string) =>
    setScheduleFilter((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const filteredJobs = useMemo(() => allJobs.filter((job) => {
    const matchSearch = !search || job.title.toLowerCase().includes(search.toLowerCase()) || job.company.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "Barchasi" || job.type.toLowerCase().replace("-", " ") === activeCategory.toLowerCase() || (activeCategory === "Masofaviy" && job.location.includes("Onlayn"));
    const matchSchedule = scheduleFilter.length === 0 || scheduleFilter.some((v) => job.scheduleCompatible.includes(v));

    // Region filter: when on, keep only jobs whose location string contains
    // any of the user's region/city keywords.
    let matchRegion = true;
    if (regionFilter && myRegion) {
      const loc = (job.location || "").toLowerCase();
      matchRegion = myRegion.keywords.some((k) => loc.includes(k));
    }

    return matchSearch && matchCategory && matchSchedule && matchRegion;
  }), [allJobs, search, activeCategory, scheduleFilter, regionFilter, myRegion]);

  // "Menga mos" sorts by how well the student's tracked skills and class load fit each job.
  const matchOn = sortBy === "match";
  const classHours = useMemo(() => weeklyClassHours(timetable), [timetable]);
  const matches = useMemo(() => {
    const m = new Map<string, { score: number; reasons: string[] }>();
    if (!matchOn) return m;
    filteredJobs.forEach((job) => m.set(job.id, scoreJob(job, skillsData.skills, { classHoursPerWeek: classHours })));
    return m;
  }, [matchOn, filteredJobs, skillsData.skills, classHours]);
  const shownJobs = useMemo(() => {
    if (sortBy === "match") return rankJobs(filteredJobs, skillsData.skills, { classHoursPerWeek: classHours }).map((r) => r.job);
    if (sortBy === "applied") return [...filteredJobs].sort((a, b) => (b.applyCount ?? b.applications ?? 0) - (a.applyCount ?? a.applications ?? 0));
    return filteredJobs;
  }, [sortBy, filteredJobs, skillsData.skills, classHours]);

  React.useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("match") === "1") setSortBy("match");
  }, []);

  // Load saved alert preferences from localStorage on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const f = localStorage.getItem("job_alert_field");
    const l = localStorage.getItem("job_alert_location");
    if (f) setAlertField(f);
    if (l) setAlertLocation(l);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-0">
        {/* Page header */}
        <div className="border-b border-border bg-gradient-to-b from-muted/40 to-transparent">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="new" className="gap-1 text-xs">
                    <Sparkles size={10} />
                    AI yordamida moslashtirilgan
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Ish va amaliyot</h1>
                <p className="text-muted-foreground text-sm">
                  Yetakchi kompaniyalardagi haqiqiy amaliyot va ish o'rinlari — talabalar uchun tanlangan
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold gradient-text-primary">{allJobs.length || "—"}</div>
                  <div className="text-xs text-muted-foreground">E'lonlar</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <div className="text-xl font-bold text-emerald-500 dark:text-emerald-400">Haqiqiy</div>
                  <div className="text-xs text-muted-foreground">Ariza havolalari</div>
                </div>
              </div>
            </div>

            {/* Search + filters */}
            <div className="mt-6 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Lavozim, kompaniya yoki kalit so'z bo'yicha qidiring..."
                    icon={<Search size={15} />}
                    className="h-11"
                  />
                </div>
                <Button variant="glass" className="gap-2 h-11 px-4 shrink-0">
                  <SlidersHorizontal size={15} />
                  <span className="hidden sm:inline">Filtrlar</span>
                </Button>
              </div>

              {/* Category tabs */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {JOB_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeCategory === cat
                        ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40"
                        : "text-muted-foreground hover:text-foreground bg-muted/50 border border-border hover:border-blue-500/20"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Schedule + region filter pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  Jadvalga mos:
                </span>
                {SCHEDULE_FILTERS.map((v) => (
                  <button
                    key={v}
                    onClick={() => toggleSchedule(v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border capitalize ${
                      scheduleFilter.includes(v)
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "text-muted-foreground border-border hover:border-emerald-500/20 hover:text-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}

                {/* Mening viloyatim — only shown for signed-in users with a
                    recognised university. */}
                {myRegion && (
                  <>
                    <span className="text-xs text-muted-foreground/40 px-1">·</span>
                    <button
                      onClick={() => setRegionFilter((p) => !p)}
                      title={`${myRegion.city} (${myRegion.region}) yaqinidagi ishlarni ko'rsatish`}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5 ${
                        regionFilter
                          ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40"
                          : "text-muted-foreground border-border hover:border-blue-500/20 hover:text-foreground"
                      }`}
                    >
                      <MapPin size={11} />
                      Mening viloyatim · {myRegion.city}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main listings */}
            <div className="lg:col-span-3">
              {/* Job alerts — mobile only (desktop shows this in the sidebar) */}
              {user && (
                <div className={`lg:hidden p-4 rounded-2xl border mb-4 flex items-center justify-between gap-3 ${alertsEnabled ? "border-emerald-500/30 bg-emerald-500/5" : "border-blue-500/20 bg-blue-500/5"}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {alertsEnabled
                      ? <BellRing size={15} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
                      : <BellRing size={15} className="text-blue-500 dark:text-blue-400 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">
                        {alertsEnabled ? "Bildirishnomalar yoqilgan" : "Ish e'lonlari bildirishnomasi"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {alertsEnabled ? `${alertField} · ${alertLocation}` : "Profilingizga mos yangi ishlar haqida email orqali xabar oling"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={alertsEnabled ? "outline" : "default"}
                    className="shrink-0 text-xs gap-1.5"
                    onClick={toggleAlerts}
                    disabled={alertsBusy}
                  >
                    {alertsBusy ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : alertsEnabled ? (
                      <><BellOff size={12} /> O'chirish</>
                    ) : (
                      <><BellRing size={12} /> Yoqish</>
                    )}
                  </Button>
                </div>
              )}

              {/* Info banner */}
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 mb-5">
                <Sparkles size={18} className="text-violet-500 dark:text-violet-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Barcha e'lonlarda <span className="text-blue-600 dark:text-blue-400 font-bold">haqiqiy ariza havolalari</span> mavjud
                  </p>
                  <p className="text-xs text-muted-foreground">Kompaniyaning rasmiy karyera sahifasiga o'tish uchun "Ariza berish ↗" tugmasini bosing</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">{filteredJobs.length}</span> ta natija topildi
                </p>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "new" | "match" | "applied")}
                  aria-label="Saralash"
                  className="text-xs bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-muted-foreground focus:outline-none focus:border-blue-500/50"
                >
                  <option value="new">Eng so&apos;nggi</option>
                  <option value="match">Menga mos</option>
                  <option value="applied">Ko&apos;p ariza berilgan</option>
                </select>
              </div>

              {matchOn && (
                <div className="mb-4 rounded-2xl border border-blue-500/25 bg-blue-500/5 p-4 text-sm">
                  {skillsData.skills.length === 0 ? (
                    <p className="text-foreground">
                      Mos ishlarni ko&apos;rsatish uchun ko&apos;nikmalaringizni qo&apos;shing.{" "}
                      <Link href="/tools/skills" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">Ko&apos;nikmalarga o&apos;tish →</Link>
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      <b className="text-foreground">{skillsData.skills.length} ta ko&apos;nikmangiz</b>
                      {classHours > 0 ? <> va haftasiga <b className="text-foreground">{classHours} soat</b> dars jadvalingiz</> : null} asosida saralandi.{" "}
                      <Link href="/tools/skills" className="font-medium text-blue-600 hover:underline dark:text-blue-400">Ko&apos;nikmalarni tahrirlash</Link>
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {loading ? (
                  <div className="py-16 text-center text-muted-foreground text-sm">Ish e'lonlari yuklanmoqda…</div>
                ) : filteredJobs.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground text-sm">Filtrlaringizga mos e'lon topilmadi.</div>
                ) : (
                  shownJobs.map((job) => (
                    <JobCard key={job.id} job={job} match={matches.get(job.id)} />
                  ))
                )}
              </div>
            </div>

            {/* Sidebar — desktop only */}
            <div className="space-y-4 hidden lg:block">
              {/* Job alerts */}
              <div className={`p-5 rounded-2xl border ${alertsEnabled ? "border-emerald-500/30 bg-emerald-500/5" : "border-blue-500/20 bg-blue-500/5"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {alertsEnabled
                    ? <BellRing size={14} className="text-emerald-500 dark:text-emerald-400" />
                    : <TrendingUp size={14} className="text-blue-500 dark:text-blue-400" />}
                  <h3 className="text-sm font-semibold text-foreground">
                    {alertsEnabled ? "Bildirishnoma yoqilgan" : "Ish e'lonlari bildirishnomasi"}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {alertsEnabled
                    ? `${alertField} · ${alertLocation}`
                    : "Yo'nalishingiz va joylashuvingizga mos yangi e'lonlar haqida xabar oling."}
                </p>
                <Button
                  size="sm"
                  variant={alertsEnabled ? "outline" : "default"}
                  className="w-full text-xs gap-1.5"
                  onClick={toggleAlerts}
                  disabled={alertsBusy}
                >
                  {alertsBusy ? (
                    <><Loader2 size={12} className="animate-spin" /> Saqlanmoqda…</>
                  ) : alertsEnabled ? (
                    <><BellOff size={12} /> Bildirishnomani o'chirish</>
                  ) : (
                    <><BellRing size={12} /> Bildirishnomani yoqish</>
                  )}
                </Button>
              </div>

              {/* Top companies — computed from the live job list */}
              {topCompanies.length > 0 && (
                <div className="p-5 rounded-2xl border border-border bg-card">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Eng faol ish beruvchilar</h3>
                  <div className="space-y-2.5">
                    {topCompanies.map(({ name, jobs }) => (
                      <div key={name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-muted border border-border flex items-center justify-center text-xs font-bold text-foreground/60 shrink-0">
                            {name[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="text-xs font-medium text-muted-foreground truncate">{name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-border shrink-0">
                          {jobs} ta e'lon
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Salary guide */}
              <div className="p-5 rounded-2xl border border-border bg-card">
                <h3 className="text-sm font-semibold text-foreground mb-3">O'rtacha maosh ko'rsatkichi</h3>
                <div className="space-y-2">
                  {[
                    { type: "Qisman bandlik", range: "15–25 ming so'm/soat", color: "bg-blue-400" },
                    { type: "Amaliyot", range: "2–3.5 mln so'm/oy", color: "bg-cyan-400" },
                    { type: "Tadqiqot", range: "1.5–2.5 mln so'm/oy", color: "bg-violet-400" },
                    { type: "To'liq stavka", range: "4–8 mln so'm/oy", color: "bg-emerald-400" },
                  ].map(({ type, range, color }) => (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${color}`} />
                        <span className="text-muted-foreground">{type}</span>
                      </div>
                      <span className="font-medium text-foreground">{range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Job Alerts Preferences Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAlertModal(false)}>
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-blue-500/10 to-emerald-500/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center">
                  <BellRing size={15} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Bildirishnoma sozlamalari</h2>
                  <p className="text-[11px] text-muted-foreground">Mos yangi ishlar haqida sizga email yuboramiz</p>
                </div>
              </div>
              <button onClick={() => setShowAlertModal(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Field of interest */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block">Qiziqish yo'nalishi</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALERT_FIELDS.map(f => (
                    <button
                      key={f}
                      onClick={() => setAlertField(f)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                        alertField === f
                          ? "bg-blue-500/15 border-blue-500/40 text-blue-600"
                          : "bg-muted/50 border-border text-muted-foreground hover:border-blue-500/30 hover:text-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block">Afzal ko'rilgan joylashuv</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALERT_LOCATIONS.map(l => (
                    <button
                      key={l}
                      onClick={() => setAlertLocation(l)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                        alertLocation === l
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted/50 border-border text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={confirmAlerts}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <BellRing size={14} /> Bildirishnomani yoqish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
