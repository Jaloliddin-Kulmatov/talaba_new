import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Linking, Platform, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Avatar, Badge, Btn, Card, Empty, ErrorBox, Ico, Loading, Row, Screen, Segmented, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { radius, useTheme } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import { formatEventWhen, googleCalendarUrl, localInputToIso, type ClubEvent } from "@shared/events";
import type { Club, ClubMessage } from "@/types";

type Tab = "events" | "chat" | "about";

export default function ClubDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("events");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await api.get<{ club: Club }>(`/clubs/${id}`);
    if (r.data) setClub(r.data.club); else setError(r.error);
  }, [id]);
  useEffect(() => { load(); }, [load, user?.id]);

  if (!club) return <Screen><ErrorBox text={error} />{!error && <Loading rows={2} height={120} />}</Screen>;

  const member = club.is_creator || club.my_status === "approved";
  const canManage = club.is_creator || user?.role === "admin";

  const join = async () => {
    if (!user) { router.push("/login"); return; }
    setBusy(true);
    const r = await api.post<{ message: string }>(`/clubs/${club.id}/request`, {});
    setBusy(false);
    if (r.error && r.status !== 409) setError(r.error); else setError(null);
    load();
  };
  const leave = async () => { setBusy(true); await api.post(`/clubs/${club.id}/leave`, {}); setBusy(false); load(); };

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll={tab !== "chat"} padded style={{ flex: 1 }}>
        <View style={{ gap: 4 }}>
          <Txt variant="title">{club.name}</Txt>
          <Txt variant="small" tone="muted">{club.member_count} a'zo{club.university ? ` · ${club.university}` : ""}</Txt>
        </View>
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          {club.is_creator ? <Badge label="Siz egasisiz" tone="violet" /> : member ? <Badge label="A'zo" tone="success" /> : club.my_status === "pending" ? <Badge label="So'rov yuborilgan" tone="warn" /> : null}
        </Row>
        <ErrorBox text={error} />
        {!member && club.my_status !== "pending" && <Btn label="Qo'shilish so'rovi" icon="person-add-outline" loading={busy} onPress={join} />}
        {member && !club.is_creator && <Btn label="Klubdan chiqish" kind="ghost" small loading={busy} onPress={leave} />}
        <Segmented options={[{ id: "events" as Tab, label: "Tadbirlar" }, { id: "chat" as Tab, label: "Chat" }, { id: "about" as Tab, label: "Ma'lumot" }]} value={tab} onChange={setTab} />
        {tab === "events" && <Events clubId={club.id} canManage={canManage} />}
        {tab === "about" && <About club={club} member={member} />}
        {tab === "chat" && <Chat clubId={club.id} member={member} meId={user?.id} />}
      </Screen>
    </View>
  );
}

function About({ club, member }: { club: Club; member: boolean }) {
  return (
    <View style={{ gap: 10 }}>
      <Card><Txt>{club.description || "Tavsif kiritilmagan."}</Txt></Card>
      {club.meeting_time ? <Row><Ico name="time-outline" /><Txt>{club.meeting_time}</Txt></Row> : null}
      {club.location ? <Row><Ico name="location-outline" /><Txt>{club.location}</Txt></Row> : null}
      {member && club.telegram_link ? <Btn label="Telegram guruhi" icon="paper-plane-outline" kind="soft" onPress={() => Linking.openURL(club.telegram_link!)} /> : null}
      {member && club.contact ? <Txt variant="small" tone="muted">Aloqa: {club.contact}</Txt> : null}
      {!member && (club.telegram_link === null) ? <Txt variant="caption" tone="subtle">Telegram havolasi va aloqa ma'lumotlari faqat a'zolarga ko'rinadi.</Txt> : null}
      {club.website ? <Btn label="Veb-sayt" kind="ghost" small onPress={() => Linking.openURL(club.website)} /> : null}
    </View>
  );
}

function Events({ clubId, canManage }: { clubId: number; canManage: boolean }) {
  const t = useTheme();
  const [events, setEvents] = useState<ClubEvent[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", when: "", location: "" });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api.get<{ events: ClubEvent[] }>(`/clubs/${clubId}/events`);
    setEvents(r.data ? r.data.events : []);
  }, [clubId]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    // "2026-10-20 18:30" typed by the organiser, in Tashkent time (UTC+5)
    const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(form.when.trim());
    const iso = m ? localInputToIso(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+05:00`) : null;
    if (!iso) { setError("Sana va vaqtni 2026-10-20 18:30 ko'rinishida yozing."); return; }
    setError(null);
    const r = await api.post(`/clubs/${clubId}/events`, { title: form.title, location: form.location, starts_at: iso });
    if (r.error) { setError(r.error); return; }
    setForm({ title: "", when: "", location: "" }); setAdding(false); load();
  };

  const input = { backgroundColor: t.input, borderColor: t.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, color: t.text, fontSize: 15 } as const;

  return (
    <View style={{ gap: 10 }}>
      {canManage && <Btn label={adding ? "Bekor qilish" : "Tadbir qo'shish"} icon={adding ? "close" : "add"} kind="soft" small onPress={() => setAdding(!adding)} />}
      {adding && (
        <Card style={{ gap: 8 }}>
          <TextInput style={input} placeholder="Tadbir nomi" placeholderTextColor={t.subtle} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} accessibilityLabel="Tadbir nomi" />
          <TextInput style={input} placeholder="2026-10-20 18:30 (Toshkent vaqti)" placeholderTextColor={t.subtle} value={form.when} onChangeText={(v) => setForm({ ...form, when: v })} accessibilityLabel="Sana va vaqt" />
          <TextInput style={input} placeholder="Joyi" placeholderTextColor={t.subtle} value={form.location} onChangeText={(v) => setForm({ ...form, location: v })} accessibilityLabel="Joyi" />
          <ErrorBox text={error} />
          <Btn label="Saqlash" disabled={form.title.trim().length < 3 || !form.when} onPress={create} />
        </Card>
      )}
      {events === null ? <Loading rows={2} /> : events.length === 0 ? (
        <Empty icon="calendar-outline" title="Kelgusi tadbirlar yo'q" text={canManage ? "Birinchi tadbirni qo'shing." : "Klub tadbir qo'shganda shu yerda ko'rinadi."} />
      ) : events.map((e) => (
        <Card key={e.id}>
          <Txt variant="small" tone="primary" style={{ fontWeight: "700" }}>{formatEventWhen(e.starts_at)}</Txt>
          <Txt variant="h3">{e.title}</Txt>
          {e.location ? <Txt variant="small" tone="muted">{e.location}</Txt> : null}
          {e.description ? <Txt style={{ marginTop: 4 }}>{e.description}</Txt> : null}
          <Row style={{ marginTop: 8 }}>
            <Btn label="Kalendarga qo'shish" kind="ghost" small icon="calendar-outline" onPress={() => Linking.openURL(googleCalendarUrl(e))} />
            {canManage && <Btn label="O'chirish" kind="danger" small onPress={async () => { await api.del(`/clubs/${clubId}/events/${e.id}`); load(); }} />}
          </Row>
        </Card>
      ))}
    </View>
  );
}

function Chat({ clubId, member, meId }: { clubId: number; member: boolean; meId?: number }) {
  const t = useTheme();
  const [msgs, setMsgs] = useState<ClubMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const last = useRef(0);

  const pull = useCallback(async () => {
    const r = await api.get<{ messages: ClubMessage[] }>(`/clubs/${clubId}/chat?after=${last.current}`);
    if (r.data && r.data.messages.length) {
      last.current = Math.max(last.current, ...r.data.messages.map((m) => m.id));
      setMsgs((cur) => [...cur, ...r.data!.messages.filter((m) => !cur.some((c) => c.id === m.id))]);
    }
  }, [clubId]);

  useEffect(() => {
    if (!member) return;
    pull();
    const id = setInterval(pull, 5000);
    return () => clearInterval(id);
  }, [member, pull]);

  if (!member) return <Empty icon="lock-closed-outline" title="Chat faqat a'zolar uchun" text="Klubga qo'shiling — so'rovingiz tasdiqlangach chat ochiladi." />;

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    const r = await api.post(`/clubs/${clubId}/chat`, { content });
    if (r.error) { setError(r.error); return; }
    setText(""); setError(null); pull();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ gap: 8 }}>
      <FlatList
        data={msgs} keyExtractor={(m) => String(m.id)} scrollEnabled={false}
        ListEmptyComponent={<Txt tone="muted" style={{ textAlign: "center", padding: 24 }}>Birinchi xabarni yozing.</Txt>}
        renderItem={({ item }) => {
          const mine = item.user_id === meId;
          return (
            <Row style={{ justifyContent: mine ? "flex-end" : "flex-start", alignItems: "flex-end", marginBottom: 8 }}>
              {!mine && <Avatar name={item.author_name} size={28} />}
              <View style={{ maxWidth: "78%", backgroundColor: mine ? t.primary : t.card, borderColor: t.border, borderWidth: mine ? 0 : 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 }}>
                {!mine && <Txt variant="caption" tone="subtle" style={{ fontWeight: "700" }}>{item.author_name}</Txt>}
                <Txt tone={mine ? "onPrimary" : "text"}>{item.content}</Txt>
                <Txt variant="caption" style={{ color: mine ? "#dbeafe" : t.subtle, textAlign: "right" }}>{timeAgo(item.created_at)}</Txt>
              </View>
            </Row>
          );
        }}
      />
      <ErrorBox text={error} />
      <Row>
        <TextInput value={text} onChangeText={setText} placeholder="Xabar yozing…" placeholderTextColor={t.subtle} accessibilityLabel="Xabar" maxLength={1000}
          style={{ flex: 1, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, color: t.text, fontSize: 15 }} onSubmitEditing={send} />
        <Btn label="Yuborish" small onPress={send} disabled={!text.trim()} />
      </Row>
    </KeyboardAvoidingView>
  );
}
