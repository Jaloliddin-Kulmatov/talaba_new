import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Badge, Card, Row, Txt } from "@/components/ui";
import { timeAgo } from "@/lib/time";
import { typeLabel } from "@/lib/jobs";
import { deadlineInfo } from "@shared/deadline";
import type { Job } from "@/types";

export function JobRow({ job, match }: { job: Job; match?: number }) {
  const router = useRouter();
  const dl = deadlineInfo(job.deadline);
  return (
    <Card onPress={() => router.push(`/job/${job.id}`)} accessibilityLabel={`${job.title}, ${job.company}`}>
      <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="h3">{job.title}</Txt>
          <Txt variant="small" tone="muted">{job.company}{job.location ? ` · ${job.location}` : ""}</Txt>
        </View>
        {match !== undefined && match > 0 && <Badge label={`${match}% mos`} tone="success" icon="sparkles" />}
      </Row>
      <Row style={{ marginTop: 8, flexWrap: "wrap" }} gap={6}>
        {job.type ? <Badge label={typeLabel(job.type)} /> : null}
        {job.isNew ? <Badge label="Yangi" tone="warn" /> : null}
        {job.student_friendly === "ha" ? <Badge label="Talabaga qulay" tone="success" /> : null}
        {dl.tone === "soon" || dl.tone === "today" ? <Badge label={dl.label} tone="danger" icon="time-outline" /> : null}
        {job.salary ? <Txt variant="caption" tone="muted">{job.salary}</Txt> : null}
        <Txt variant="caption" tone="subtle">{timeAgo(job.created_at)}</Txt>
      </Row>
    </Card>
  );
}
