import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Btn, Card, Ico, Field, Row, Screen, SectionTitle, Txt, Empty, Badge } from "@/components/ui";
import { useSynced } from "@/lib/synced";
import { EMPTY_PLANNER, EXAM_LABEL, PLANNER_KEY, TASK_GROUP_LABEL, TASK_GROUP_ORDER, examCountdown, groupTasks, upcomingExams, type PlannerData, type Task } from "@shared/toolkit/planner";
import { uid } from "@shared/toolkit/time";

export default function Planner() {
  const synced = useSynced();
  const data = synced.get<PlannerData>(PLANNER_KEY, EMPTY_PLANNER);
  const now = new Date();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examDate, setExamDate] = useState("");

  const save = (next: PlannerData) => synced.set(PLANNER_KEY, next);
  const toggle = (id: string) => save({ ...data, tasks: data.tasks.map((t) => t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : undefined } : t) });
  const addTask = () => {
    if (!title.trim()) return;
    const t: Task = { id: uid(), title: title.trim(), due: /^\d{4}-\d{2}-\d{2}$/.test(due.trim()) ? due.trim() : undefined, priority: "normal", done: false };
    save({ ...data, tasks: [...data.tasks, t] }); setTitle(""); setDue("");
  };
  const addExam = () => {
    if (!examSubject.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(examDate.trim())) return;
    save({ ...data, exams: [...data.exams, { id: uid(), subject: examSubject.trim(), type: "midterm", date: examDate.trim() }] });
    setExamSubject(""); setExamDate("");
  };

  const open = groupTasks(data.tasks.filter((t) => !t.done), now);
  const done = data.tasks.filter((t) => t.done);
  const exams = upcomingExams(data.exams, now);

  return (
    <Screen>
      <Card style={{ gap: 8 }}>
        <Field label="Yangi vazifa" value={title} onChangeText={setTitle} placeholder="Masalan: Algebra uy ishi" />
        <Field label="Muddat (ixtiyoriy)" value={due} onChangeText={setDue} placeholder="2026-10-20" hint="YYYY-OO-KK ko'rinishida" />
        <Btn label="Qo'shish" icon="add" disabled={!title.trim()} onPress={addTask} />
      </Card>

      {data.tasks.length === 0 && <Empty icon="checkbox-outline" title="Vazifalar yo'q" text="Yuqoridan birinchi vazifani qo'shing." />}
      {TASK_GROUP_ORDER.map((g) => open[g].length > 0 && (
        <View key={g} style={{ gap: 8 }}>
          <SectionTitle>{TASK_GROUP_LABEL[g]}</SectionTitle>
          {open[g].map((t) => (
            <Pressable key={t.id} onPress={() => toggle(t.id)} accessibilityRole="checkbox" accessibilityState={{ checked: false }} accessibilityLabel={t.title}>
              <Card><Row gap={12}><Ico name="square-outline" size={22} tone="primary" /><View style={{ flex: 1 }}><Txt>{t.title}</Txt>{t.due ? <Txt variant="caption" tone="subtle">{t.due}</Txt> : null}</View></Row></Card>
            </Pressable>
          ))}
        </View>
      ))}
      {done.length > 0 && (
        <View style={{ gap: 8 }}>
          <SectionTitle>Bajarilgan</SectionTitle>
          {done.slice(0, 10).map((t) => (
            <Pressable key={t.id} onPress={() => toggle(t.id)} accessibilityRole="checkbox" accessibilityState={{ checked: true }} accessibilityLabel={t.title}>
              <Card><Row gap={12}><Ico name="checkbox" size={22} tone="success" /><Txt tone="muted" style={{ flex: 1, textDecorationLine: "line-through" }}>{t.title}</Txt></Row></Card>
            </Pressable>
          ))}
          <Btn small kind="ghost" label="Bajarilganlarni tozalash" onPress={() => save({ ...data, tasks: data.tasks.filter((t) => !t.done) })} />
        </View>
      )}

      <SectionTitle>Imtihonlar</SectionTitle>
      {exams.map((e) => {
        const c = examCountdown(e, now);
        return (
          <Card key={e.id}>
            <Row style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}><Txt variant="h3">{e.subject}</Txt><Txt variant="small" tone="muted">{EXAM_LABEL[e.type]} · {e.date}{e.time ? ` ${e.time}` : ""}</Txt></View>
              <Badge label={c.label} tone={c.urgent ? "danger" : "primary"} />
            </Row>
            <Btn small kind="danger" label="O'chirish" style={{ marginTop: 8, alignSelf: "flex-start" }} onPress={() => save({ ...data, exams: data.exams.filter((x) => x.id !== e.id) })} />
          </Card>
        );
      })}
      <Card style={{ gap: 8 }}>
        <Field label="Imtihon fani" value={examSubject} onChangeText={setExamSubject} />
        <Field label="Sana" value={examDate} onChangeText={setExamDate} placeholder="2026-12-20" hint="YYYY-OO-KK ko'rinishida" />
        <Btn label="Imtihon qo'shish" kind="soft" disabled={!examSubject.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(examDate.trim())} onPress={addExam} />
      </Card>
    </Screen>
  );
}
