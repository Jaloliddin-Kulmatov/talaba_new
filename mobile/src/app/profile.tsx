import React, { useCallback, useEffect, useState } from "react";
import { Alert, Platform, Switch, View } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { Avatar, Btn, Card, Chips, ErrorBox, Field, Row, Screen, SectionTitle, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { kv } from "@/lib/storage";
import { registerForPush, unregisterPush } from "@/lib/push";
import { scheduleClassReminders } from "@/lib/reminders";
import { useSynced } from "@/lib/synced";
import { setPrefs } from "@/lib/prefs";
import { useTheme } from "@/lib/theme";
import { REGIONS } from "@/data/uz";
import { EMPTY_TIMETABLE, TIMETABLE_KEY } from "@shared/toolkit/timetable";
import type { CvMeta } from "@/types";

const REMIND_KEY = "talaba:class-reminder-min";
const MINUTES = [{ id: "0", label: "O'chiq" }, { id: "10", label: "10 daq." }, { id: "15", label: "15 daq." }, { id: "30", label: "30 daq." }];

export default function Profile() {
  const t = useTheme();
  const router = useRouter();
  const { user, logout, updateProfile, refresh, deleteAccount } = useAuth();
  const synced = useSynced();
  const [name, setName] = useState(user?.name ?? "");
  const [region, setRegion] = useState(user?.region ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remind, setRemind] = useState("0");
  const [cv, setCv] = useState<CvMeta | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { kv.get<number>(REMIND_KEY, 0).then((m) => setRemind(String(m))); }, []);
  // the account may finish loading after this screen opened (e.g. a reload straight onto /profile)
  useEffect(() => { if (user) { setName(user.name); setRegion(user.region ?? ""); } }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const loadCv = useCallback(async () => { if (user) { const r = await api.get<{ cv: CvMeta | null }>("/cv"); setCv(r.data?.cv ?? null); } }, [user]);
  useEffect(() => { loadCv(); }, [loadCv]);

  if (!user) {
    return (
      <Screen>
        <Txt variant="title">Mehmon</Txt>
        <Txt tone="muted">Hisob ochsangiz — savol berish, klubga qo'shilish, xabar yozish va ma'lumotlarni sinxronlash mumkin.</Txt>
        <Btn label="Ro'yxatdan o'tish" onPress={() => router.push("/register")} />
        <Btn label="Kirish" kind="soft" onPress={() => router.push("/login")} />
      </Screen>
    );
  }

  const save = async () => {
    setBusy(true); setMsg(null); setError(null);
    const e = await updateProfile({ name: name.trim(), region });
    setBusy(false);
    if (e) setError(e); else setMsg("Saqlandi.");
  };

  const setReminder = async (id: string) => {
    setRemind(id);
    await kv.set(REMIND_KEY, Number(id));
    if (Number(id) > 0) {
      const status = await registerForPush();        // asks for notification permission
      if (status === "denied") { setError("Bildirishnomalarga ruxsat berilmagan. Telefon sozlamalaridan yoqing."); }
    }
    const n = await scheduleClassReminders(synced.get(TIMETABLE_KEY, EMPTY_TIMETABLE), Number(id));
    setMsg(Number(id) > 0 ? `${n} ta eslatma rejalashtirildi.` : "Eslatmalar o'chirildi.");
  };

  const pickCv = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    if (a.size && a.size > 2 * 1024 * 1024) { setError("Fayl juda katta (ko'pi bilan 2 MB)."); return; }
    setBusy(true); setError(null);
    const r = await api.upload<{ cv: CvMeta }>("/cv", { uri: a.uri, name: a.name, mimeType: a.mimeType, webFile: Platform.OS === "web" ? (a.file as Blob | undefined) : undefined });
    setBusy(false);
    if (r.data) { setCv(r.data.cv); setMsg("CV yuklandi."); } else setError(r.error);
  };

  const confirmDelete = () => Alert.alert("Hisobni o'chirish", "Profil, savollar, xabarlar, CV va sinxronlangan ma'lumotlar butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.", [
    { text: "Bekor qilish", style: "cancel" },
    { text: "Butunlay o'chirish", style: "destructive", onPress: async () => { const e = await deleteAccount(); if (e) setError(e); else router.replace("/(tabs)"); } },
  ]);

  return (
    <Screen>
      <Row gap={14}><Avatar name={user.name} size={56} /><View style={{ flex: 1 }}><Txt variant="h2">{user.name}</Txt><Txt variant="small" tone="muted">{user.email}</Txt>{user.university ? <Txt variant="caption" tone="subtle">{user.university}</Txt> : null}</View></Row>
      {msg && <Txt variant="small" tone="success" style={{ fontWeight: "700" }}>{msg}</Txt>}
      <ErrorBox text={error} />

      <SectionTitle>Profil</SectionTitle>
      <Card style={{ gap: 10 }}>
        <Field label="Ism va familiya" value={name} onChangeText={setName} />
        <Txt variant="small" tone="muted" style={{ fontWeight: "600" }}>Viloyat</Txt>
        <Chips options={REGIONS.map((r) => ({ id: r, label: r }))} value={region} onChange={setRegion} />
        <Btn label="Saqlash" loading={busy} onPress={save} />
      </Card>

      <SectionTitle>Bildirishnomalar</SectionTitle>
      <Card style={{ gap: 10 }}>
        <Txt variant="h3">Dars eslatmasi</Txt>
        <Txt variant="caption" tone="subtle">Dars boshlanishidan oldin telefon o'zi eslatadi (internetsiz ham ishlaydi).</Txt>
        <Chips options={MINUTES} value={remind} onChange={setReminder} />
        <Btn label="Xabar va javoblar uchun push yoqish" kind="soft" small icon="notifications-outline" onPress={async () => {
          const s = await registerForPush();
          setMsg(s === "ok" ? "Push yoqildi." : s === "denied" ? "Ruxsat berilmadi." : s === "simulator" ? "Push faqat haqiqiy telefonda ishlaydi." : "Push hozircha mavjud emas (ishlab chiqish build'i kerak).");
        }} />
        <Row style={{ justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}><Txt variant="h3">Yangi ishlar haqida xat</Txt></View>
          <Switch value={user.job_alerts_enabled} trackColor={{ true: t.primary }} accessibilityLabel="Yangi ishlar haqida xat"
            onValueChange={async (on) => { await api.post("/admin/jobs/alerts", { enabled: on }); setPrefs({ alerts: on }); refresh(); }} />
        </Row>
      </Card>

      <SectionTitle>CV fayli</SectionTitle>
      <Card style={{ gap: 8 }}>
        <Txt variant="small" tone="muted">{cv ? `${cv.filename} · ${(cv.size / 1024).toFixed(0)} KB` : "PDF yoki Word (.docx), 2 MB gacha. Faqat siz ko'ra olasiz."}</Txt>
        <Row><Btn small label={cv ? "Almashtirish" : "Yuklash"} icon="cloud-upload-outline" onPress={pickCv} />
          {cv && <Btn small kind="danger" label="O'chirish" onPress={async () => { await api.del("/cv"); setCv(null); }} />}</Row>
      </Card>

      <SectionTitle>Sinxronlash</SectionTitle>
      <Card style={{ gap: 8 }}>
        <Txt variant="small" tone="muted">Jadval, GPA va vazifalar hisobingiz orqali saytdagi bilan bir xil.</Txt>
        {synced.lastError ? <Txt variant="small" tone="danger">{synced.lastError}</Txt> : null}
        <Btn small kind="soft" label="Hozir sinxronlash" icon="sync-outline" loading={synced.syncing} onPress={() => synced.sync()} />
      </Card>

      <Btn label="Chiqish" kind="ghost" onPress={async () => { await unregisterPush(); await logout(); router.replace("/(tabs)"); }} />
      <Btn label="Hisobni o'chirish" kind="danger" small onPress={confirmDelete} />
    </Screen>
  );
}
