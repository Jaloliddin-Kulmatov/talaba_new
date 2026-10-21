import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Badge, Btn, Card, Ico, Row, Screen, SectionTitle, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useSynced } from "@/lib/synced";
import { skillsFromField, usePrefs } from "@/lib/prefs";
import { firstName, timeAgo } from "@/lib/time";
import { useTheme } from "@/lib/theme";
import { formatEventWhen, type ClubEvent } from "@shared/events";
import { EMPTY_TIMETABLE, TIMETABLE_KEY, nowStatus, todaysClasses } from "@shared/toolkit/timetable";
import { EMPTY_PLANNER, PLANNER_KEY, examCountdown, groupTasks, upcomingExams } from "@shared/toolkit/planner";
import { EMPTY_SKILLS, SKILLS_KEY } from "@shared/toolkit/skills";
import { scoreJob } from "@shared/toolkit/matching";
import type { Job, NewsItem } from "@/types";
import { JobRow } from "@/components/job-row";

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { prefs } = usePrefs();
  const synced = useSynced();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [news, setNews] = useState<NewsItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();

  const load = useCallback(async () => {
    const [j, e, n] = await Promise.all([
      api.get<{ jobs: Job[] }>("/admin/jobs"),
      api.get<{ events: ClubEvent[] }>("/clubs/events/upcoming"),
      api.get<{ items: NewsItem[] }>("/news?limit=1"),
    ]);
    if (j.data) setJobs(j.data.jobs);
    if (e.data) setEvents(e.data.events.slice(0, 3));
    if (n.data) setNews(n.data.items[0] ?? null);
  }, []);
  useEffect(() => { load(); }, [load, user?.id]);

  const refresh = async () => { setRefreshing(true); await Promise.all([load(), synced.sync()]); setRefreshing(false); };

  const timetable = synced.get(TIMETABLE_KEY, EMPTY_TIMETABLE);
  const planner = synced.get(PLANNER_KEY, EMPTY_PLANNER);
  const skillsDoc = synced.get(SKILLS_KEY, EMPTY_SKILLS);

  const today = todaysClasses(timetable, now);
  const status = nowStatus(today, now);
  const groups = groupTasks(planner.tasks.filter((x) => !x.done), now);
  const dueSoon = [...groups.overdue, ...groups.today, ...groups.tomorrow];
  const nextExam = upcomingExams(planner.exams, now)[0];

  const skills = skillsDoc.skills.length ? skillsDoc.skills : skillsFromField(prefs?.field ?? "");
  const picks = useMemo(() => {
    if (!skills.length) return [] as { job: Job; score: number }[];
    return jobs.map((job) => ({ job, score: scoreJob(job, skills).score })).filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score).slice(0, 3);
  }, [jobs, skills]);
  const fallbackJobs = picks.length ? [] : jobs.slice(0, 3);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={{ gap: 2 }}>
        <Txt variant="title">Salom, {firstName(user?.name)}!</Txt>
        <Txt tone="muted">{user ? "Bugun nimalar rejada?" : "Hisob ochib, jadval va vazifalaringizni sinxronlang."}</Txt>
      </View>

      {!user && (
        <Card style={{ backgroundColor: t.primarySoft, gap: 10 }}>
          <Txt variant="h3" style={{ color: t.onPrimarySoft }}>Hisobingiz bilan ko'proq imkoniyat</Txt>
          <Txt variant="small" style={{ color: t.onPrimarySoft }}>Savol berish, klubga qo'shilish, xabar yozish va ma'lumotlarni telefon ↔ sayt o'rtasida sinxronlash.</Txt>
          <Row>
            <Btn label="Ro'yxatdan o'tish" small onPress={() => router.push("/register")} />
            <Btn label="Kirish" small kind="ghost" onPress={() => router.push("/login")} />
          </Row>
        </Card>
      )}

      {/* Today */}
      <Card onPress={() => router.push("/tools/timetable")} accessibilityLabel="Bugungi darslar">
        <Row style={{ justifyContent: "space-between" }}>
          <Row><Ico name="calendar-outline" tone="primary" /><Txt variant="h3">Bugungi darslar</Txt></Row>
          <Ico name="chevron-forward" size={18} />
        </Row>
        {status.state === "empty" && <Txt tone="muted" style={{ marginTop: 6 }}>{timetable.classes.length ? "Bugun dars yo'q." : "Jadval hali kiritilmagan — qo'shish uchun bosing."}</Txt>}
        {status.state === "done" && <Txt tone="muted" style={{ marginTop: 6 }}>Bugungi darslar tugadi 🎉</Txt>}
        {status.state === "during" && <Txt style={{ marginTop: 6 }}><Txt style={{ fontWeight: "700" }}>{status.cls.subject}</Txt> davom etmoqda — {status.minsLeft} daqiqa qoldi</Txt>}
        {status.state === "next" && <Txt style={{ marginTop: 6 }}>Keyingi: <Txt style={{ fontWeight: "700" }}>{status.cls.subject}</Txt> · {status.cls.start}{status.cls.room ? ` · ${status.cls.room}-xona` : ""}</Txt>}
      </Card>

      {(dueSoon.length > 0 || nextExam) && (
        <Card onPress={() => router.push("/tools/planner")} accessibilityLabel="Vazifalar va imtihonlar">
          <Row style={{ justifyContent: "space-between" }}>
            <Row><Ico name="checkbox-outline" tone="primary" /><Txt variant="h3">Vazifalar va imtihon</Txt></Row>
            <Ico name="chevron-forward" size={18} />
          </Row>
          {dueSoon.slice(0, 3).map((x) => <Txt key={x.id} variant="small" style={{ marginTop: 6 }}>• {x.title}</Txt>)}
          {dueSoon.length > 3 && <Txt variant="caption" tone="subtle">va yana {dueSoon.length - 3} ta</Txt>}
          {nextExam && <Txt variant="small" tone="warn" style={{ marginTop: 8, fontWeight: "700" }}>{nextExam.subject}: {examCountdown(nextExam, now).label}</Txt>}
        </Card>
      )}

      {(picks.length > 0 || fallbackJobs.length > 0) && (
        <>
          <SectionTitle action={{ label: "Hammasi", onPress: () => router.push("/jobs") }}>{picks.length ? "Siz uchun ishlar" : "Yangi ishlar"}</SectionTitle>
          {picks.map(({ job, score }) => <JobRow key={job.id} job={job} match={score} />)}
          {fallbackJobs.map((job) => <JobRow key={job.id} job={job} />)}
        </>
      )}

      {events.length > 0 && (
        <>
          <SectionTitle>Klub tadbirlari</SectionTitle>
          {events.map((e) => (
            <Card key={e.id} onPress={() => router.push(`/club/${e.club_id}`)}>
              <Txt variant="small" tone="primary" style={{ fontWeight: "700" }}>{formatEventWhen(e.starts_at)}</Txt>
              <Txt variant="h3">{e.title}</Txt>
              <Txt variant="small" tone="muted">{e.club_name}{e.location ? ` · ${e.location}` : ""}</Txt>
            </Card>
          ))}
        </>
      )}

      {news && (
        <>
          <SectionTitle action={{ label: "Hammasi", onPress: () => router.push("/guide") }}>So'nggi yangilik</SectionTitle>
          <Card onPress={() => router.push("/guide")}>
            <Row style={{ marginBottom: 4 }}><Badge label={news.source || "Yangilik"} tone="success" icon="newspaper-outline" /></Row>
            <Txt variant="h3">{news.title}</Txt>
            <Txt variant="caption" tone="subtle" style={{ marginTop: 4 }}>{timeAgo(news.published_at)}</Txt>
          </Card>
        </>
      )}

      <Btn label="Barcha asboblar" kind="soft" icon="grid-outline" onPress={() => router.push("/tools")} />
    </Screen>
  );
}
