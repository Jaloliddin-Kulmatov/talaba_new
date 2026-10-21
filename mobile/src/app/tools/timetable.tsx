import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Btn, Card, Chips, Empty, ErrorBox, Field, Row, Screen, Txt, Badge } from "@/components/ui";
import { useSynced } from "@/lib/synced";
import { scheduleClassReminders } from "@/lib/reminders";
import { kv } from "@/lib/storage";
import {
  EMPTY_TIMETABLE, KIND_LABEL, TIMETABLE_KEY, WEEK_LABEL, classesOn, parityOf, validateClass,
  type ClassEntry, type TimetableData, type WeekSel,
} from "@shared/toolkit/timetable";
import { DAYS_FULL, DAYS_SHORT, dayIndex, uid } from "@shared/toolkit/time";

const REMIND_KEY = "talaba:class-reminder-min";

export default function Timetable() {
  const synced = useSynced();
  const data = synced.get<TimetableData>(TIMETABLE_KEY, EMPTY_TIMETABLE);
  const today = new Date();
  const [day, setDay] = useState(String(dayIndex(today)));
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ subject: "", room: "", start: "09:00", end: "10:20", weeks: "all" as WeekSel });
  const [error, setError] = useState<string | null>(null);

  const parity = parityOf(today, data.anchor);
  const list = useMemo(() => classesOn(data, Number(day), parity).sort((a, b) => a.start.localeCompare(b.start)), [data, day, parity]);

  const save = (next: TimetableData) => {
    synced.set(TIMETABLE_KEY, next);
    kv.get<number>(REMIND_KEY, 0).then((m) => scheduleClassReminders(next, m).catch(() => 0));
  };

  const add = () => {
    const err = validateClass({ subject: f.subject, start: f.start, end: f.end });
    if (err) { setError(err); return; }
    const entry: ClassEntry = { id: uid(), subject: f.subject.trim(), room: f.room.trim() || undefined, day: Number(day), start: f.start, end: f.end, color: "blue", kind: "lecture", weeks: f.weeks };
    save({ ...data, classes: [...data.classes, entry] });
    setF({ ...f, subject: "", room: "" }); setError(null); setAdding(false);
  };

  return (
    <Screen>
      <Row style={{ justifyContent: "space-between" }}>
        <Txt tone="muted">Hozir: <Txt style={{ fontWeight: "700" }}>{parity === "odd" ? "toq" : "juft"} hafta</Txt></Txt>
        <Btn small kind="ghost" label="Toq/juft almashtirish" onPress={() => save({ ...data, anchor: { monday: data.anchor?.monday ?? "2026-01-05", odd: parity !== "odd" ? true : false } })} />
      </Row>
      <Chips options={DAYS_SHORT.map((d, i) => ({ id: String(i), label: d }))} value={day} onChange={setDay} />
      <Txt variant="h3">{DAYS_FULL[Number(day)]}</Txt>

      {list.length === 0 ? <Empty icon="calendar-outline" title="Bu kunda dars yo'q" /> : list.map((c) => (
        <Card key={c.id}>
          <Row style={{ justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Txt variant="h3">{c.subject}</Txt>
              <Txt variant="small" tone="muted">{c.start}–{c.end}{c.room ? ` · ${c.room}-xona` : ""}{c.teacher ? ` · ${c.teacher}` : ""}</Txt>
            </View>
            <Badge label={c.weeks === "all" ? KIND_LABEL[c.kind] : WEEK_LABEL[c.weeks]} />
          </Row>
          <Btn small kind="danger" label="O'chirish" style={{ marginTop: 8, alignSelf: "flex-start" }} onPress={() => save({ ...data, classes: data.classes.filter((x) => x.id !== c.id) })} />
        </Card>
      ))}

      <Btn label={adding ? "Bekor qilish" : "Dars qo'shish"} icon={adding ? "close" : "add"} kind="soft" onPress={() => setAdding(!adding)} />
      {adding && (
        <Card style={{ gap: 10 }}>
          <Field label="Fan nomi" value={f.subject} onChangeText={(v) => setF({ ...f, subject: v })} />
          <Row><Field style={{ flex: 1 }} label="Boshlanishi" value={f.start} onChangeText={(v) => setF({ ...f, start: v })} placeholder="09:00" />
            <Field style={{ flex: 1 }} label="Tugashi" value={f.end} onChangeText={(v) => setF({ ...f, end: v })} placeholder="10:20" /></Row>
          <Field label="Xona" value={f.room} onChangeText={(v) => setF({ ...f, room: v })} />
          <Chips options={(["all", "odd", "even"] as WeekSel[]).map((w) => ({ id: w, label: WEEK_LABEL[w] }))} value={f.weeks} onChange={(w) => setF({ ...f, weeks: w })} />
          <ErrorBox text={error} />
          <Btn label="Saqlash" onPress={add} />
        </Card>
      )}
    </Screen>
  );
}
