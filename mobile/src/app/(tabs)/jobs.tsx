import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Switch, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Chips, Empty, ErrorBox, Loading, Row, Screen, Txt, Card } from "@/components/ui";
import { JobRow } from "@/components/job-row";
import { normalizeJob } from "@/lib/jobs";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useSynced } from "@/lib/synced";
import { skillsFromField, usePrefs } from "@/lib/prefs";
import { useTheme, radius } from "@/lib/theme";
import { EMPTY_SKILLS, SKILLS_KEY } from "@shared/toolkit/skills";
import { EMPTY_TIMETABLE, TIMETABLE_KEY, weeklyClassHours } from "@shared/toolkit/timetable";
import { scoreJob } from "@shared/toolkit/matching";
import type { Job } from "@/types";

type Cat = "all" | "Qisman bandlik" | "Amaliyot" | "Masofaviy" | "To'liq stavka" | "Tadqiqot";
type Sort = "new" | "match";
const CATS: { id: Cat; label: string }[] = [
  { id: "all", label: "Barchasi" }, { id: "Qisman bandlik", label: "Part-time" }, { id: "Amaliyot", label: "Amaliyot" },
  { id: "Masofaviy", label: "Masofaviy" }, { id: "To'liq stavka", label: "To'liq stavka" }, { id: "Tadqiqot", label: "Tadqiqot" },
];

const norm = (s: string | null | undefined) => (s || "").toLowerCase().replace(/[-_]/g, " ");

export default function Jobs() {
  const t = useTheme();
  const router = useRouter();
  const { user, refresh } = useAuth();
  const { prefs } = usePrefs();
  const synced = useSynced();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat>("all");
  const [sort, setSort] = useState<Sort>("new");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const r = await api.get<{ jobs: Job[] }>("/admin/jobs");
    if (r.data) { setJobs(r.data.jobs.map(normalizeJob)); setError(null); } else { setError(r.error); setJobs((j) => j ?? []); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const skillsDoc = synced.get(SKILLS_KEY, EMPTY_SKILLS);
  const skills = skillsDoc.skills.length ? skillsDoc.skills : skillsFromField(prefs?.field ?? "");
  const classHours = weeklyClassHours(synced.get(TIMETABLE_KEY, EMPTY_TIMETABLE));

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = (jobs ?? []).filter((j) => {
      if (needle && !(j.title.toLowerCase().includes(needle) || j.company.toLowerCase().includes(needle))) return false;
      if (cat === "all") return true;
      if (cat === "Masofaviy") return norm(j.type) === "masofaviy" || (j.location || "").includes("Onlayn");
      return norm(j.type) === norm(cat);
    });
    const scored = filtered.map((job) => ({ job, score: skills.length ? scoreJob(job, skills, { classHoursPerWeek: classHours }).score : 0 }));
    if (sort === "match") scored.sort((a, b) => b.score - a.score);
    return scored;
  }, [jobs, q, cat, sort, skills, classHours]);

  const toggleAlerts = async (on: boolean) => {
    if (!user) { router.push("/login"); return; }
    await api.post("/admin/jobs/alerts", { enabled: on });
    await refresh();
  };

  return (
    <Screen refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <TextInput
        value={q} onChangeText={setQ} placeholder="Lavozim yoki kompaniya" placeholderTextColor={t.subtle} accessibilityLabel="Ishlarni qidirish"
        style={{ backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: t.text }}
      />
      <Chips options={CATS} value={cat} onChange={setCat} />
      <Chips options={[{ id: "new" as Sort, label: "Yangilari" }, { id: "match" as Sort, label: "Menga mos" }]} value={sort} onChange={setSort} />
      {sort === "match" && skills.length === 0 && (
        <Txt variant="caption" tone="subtle">“Menga mos” saralash uchun Asboblar → Ko'nikmalar bo'limiga ko'nikmalaringizni kiriting (yoki sohani tanlang).</Txt>
      )}

      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Txt variant="h3">Yangi ishlar haqida xat</Txt>
            <Txt variant="caption" tone="subtle">Har kuni 10:00 da, faqat sizga mos yangi ish bo'lsa.</Txt>
          </View>
          <Switch value={!!user?.job_alerts_enabled} onValueChange={toggleAlerts} accessibilityLabel="Yangi ishlar haqida xat" trackColor={{ true: t.primary }} />
        </Row>
      </Card>

      <ErrorBox text={error} onRetry={load} />
      {jobs === null ? <Loading /> : shown.length === 0 ? (
        <Empty icon="briefcase-outline" title="Ish topilmadi" text="Qidiruv yoki filtrni o'zgartirib ko'ring." />
      ) : (
        shown.map(({ job, score }) => <JobRow key={job.id} job={job} match={sort === "match" ? score : undefined} />)
      )}
    </Screen>
  );
}
