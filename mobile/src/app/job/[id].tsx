import React, { useEffect, useState } from "react";
import { Linking, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Badge, Btn, Card, ErrorBox, Loading, Row, Screen, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/time";
import { typeLabel } from "@/lib/jobs";
import { deadlineInfo } from "@shared/deadline";
import type { Job } from "@/types";

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ job: Job }>(`/admin/jobs/${id}`).then((r) => { if (r.data) setJob(r.data.job); else setError(r.error); });
  }, [id]);

  const apply = async () => {
    if (!job?.apply_link) return;
    api.post(`/admin/jobs/${job.id}/apply-click`, {});      // fire and forget: counts the click
    Linking.openURL(job.apply_link).catch(() => setError("Havolani ochib bo'lmadi."));
  };

  const dl = deadlineInfo(job?.deadline);
  if (!job) return <Screen><ErrorBox text={error} />{!error && <Loading rows={2} height={120} />}</Screen>;

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Txt variant="title">{job.title}</Txt>
        <Txt tone="muted">{job.company}{job.location ? ` · ${job.location}` : ""}</Txt>
      </View>
      <Row style={{ flexWrap: "wrap" }} gap={6}>
        {job.type ? <Badge label={typeLabel(job.type)} /> : null}
        {job.student_friendly === "ha" ? <Badge label="Talabaga qulay" tone="success" /> : null}
        {job.salary ? <Badge label={job.salary} tone="violet" /> : null}
        <Badge label={dl.label} tone={dl.tone === "soon" || dl.tone === "today" || dl.tone === "expired" ? "danger" : dl.tone === "ok" ? "warn" : "primary"} icon="time-outline" />
      </Row>
      <Txt variant="caption" tone="subtle">E'lon qilingan: {timeAgo(job.created_at)} · {job.apply_count} marta ariza bosildi</Txt>
      {job.student_friendly_note ? <Txt variant="small" tone="muted">{job.student_friendly_note}</Txt> : null}
      {job.description ? <Card><Txt variant="h3">Tavsif</Txt><Txt style={{ marginTop: 6 }}>{job.description}</Txt></Card> : null}
      {job.requirements.length > 0 && (
        <Card>
          <Txt variant="h3">Talablar</Txt>
          {job.requirements.map((r, i) => <Txt key={i} style={{ marginTop: 4 }}>• {r}</Txt>)}
        </Card>
      )}
      <ErrorBox text={error} />
      {job.apply_link ? <Btn label="Ariza topshirish" icon="open-outline" onPress={apply} /> : null}
    </Screen>
  );
}
