import React, { useState } from "react";
import { View } from "react-native";
import { Btn, Card, Chips, Field, Row, Screen, Txt } from "@/components/ui";
import { useSynced } from "@/lib/synced";
import { EMPTY_GPA, GPA_KEY, fmtGpa, statsFor, type Course, type GpaData, type Semester } from "@shared/toolkit/gpa";
import { uid } from "@shared/toolkit/time";

const num = (s: string): number | null => { const n = Number(s.trim().replace(",", ".")); return s.trim() === "" || !Number.isFinite(n) ? null : n; };

export default function Gpa() {
  const synced = useSynced();
  const data = synced.get<GpaData>(GPA_KEY, EMPTY_GPA);
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("");
  const [score, setScore] = useState("");

  const mode = data.mode;
  const sems = data[mode];
  const save = (next: GpaData) => synced.set(GPA_KEY, next);
  const setSems = (next: Semester[]) => save({ ...data, [mode]: next });

  const sem: Semester = sems[0] ?? { id: uid(), name: "1-semestr", courses: [] };
  const addCourse = () => {
    const c: Course = { id: uid(), name: name.trim() || "Fan", credits: num(credits), score: num(score) };
    setSems([{ ...sem, courses: [...sem.courses, c] }, ...sems.slice(1)]);
    setName(""); setCredits(""); setScore("");
  };
  const stats = statsFor(mode, data.uz5Input, sems);
  const hint = mode === "uz5" ? (data.uz5Input === "points" ? "0–100 ball" : "2–5 baho") : "0–4.0 ball";

  return (
    <Screen>
      <Chips options={[{ id: "uz5", label: "5 ballik" }, { id: "us4", label: "4.0 shkala" }]} value={mode} onChange={(m) => save({ ...data, mode: m })} />
      {mode === "uz5" && <Chips options={[{ id: "points", label: "Ball (0–100)" }, { id: "grade", label: "Baho (2–5)" }]} value={data.uz5Input} onChange={(i) => save({ ...data, uz5Input: i })} />}

      <Card style={{ alignItems: "center", gap: 8, paddingVertical: 20 }}>
        <Txt variant="caption" tone="subtle">Umumiy GPA</Txt>
        <Txt style={{ fontSize: 44, lineHeight: 56, paddingTop: 6, fontWeight: "800" }} tone="primary">{fmtGpa(stats.gpa)}</Txt>
        <Txt variant="small" tone="muted">{stats.count} ta fan · {stats.credits} kredit · {stats.earned} kredit o'tilgan</Txt>
      </Card>

      {sem.courses.map((c) => (
        <Card key={c.id}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}><Txt variant="h3">{c.name}</Txt><Txt variant="small" tone="muted">{c.credits ?? "—"} kredit · {c.score ?? "—"}</Txt></View>
            <Btn small kind="danger" label="O'chirish" onPress={() => setSems([{ ...sem, courses: sem.courses.filter((x) => x.id !== c.id) }, ...sems.slice(1)])} />
          </Row>
        </Card>
      ))}

      <Card style={{ gap: 8 }}>
        <Field label="Fan nomi" value={name} onChangeText={setName} />
        <Row>
          <Field style={{ flex: 1 }} label="Kredit" value={credits} onChangeText={setCredits} keyboardType="decimal-pad" />
          <Field style={{ flex: 1 }} label="Natija" value={score} onChangeText={setScore} keyboardType="decimal-pad" hint={hint} />
        </Row>
        <Btn label="Fan qo'shish" icon="add" disabled={num(credits) === null || num(score) === null} onPress={addCourse} />
      </Card>
    </Screen>
  );
}
