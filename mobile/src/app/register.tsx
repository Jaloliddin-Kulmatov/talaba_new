import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Btn, Chips, ErrorBox, Field, Screen, Txt } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { FUNDING_TYPES, REGIONS, UNIVERSITIES } from "@/data/uz";

export default function Register() {
  const router = useRouter();
  const { register, updateProfile } = useAuth();
  const { prefs } = usePrefs();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [uni, setUni] = useState("");
  const [region, setRegion] = useState<string | null>(null);
  const [funding, setFunding] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const shownRegion = region ?? prefs?.city ?? "";
  const valid = name.trim().length >= 2 && /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const submit = async () => {
    setBusy(true); setError(null);
    const e = await register({ name: name.trim(), email, password, university: uni, region: shownRegion });
    if (e) { setBusy(false); setError(e); return; }
    if (funding) await updateProfile({ funding_type: funding });
    setBusy(false);
    router.replace("/(tabs)");
  };

  return (
    <Screen>
      <Txt variant="title">Hisob yaratish</Txt>
      <ErrorBox text={error} />
      <Field label="Ism va familiya" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <Field label="Parol" hint="Kamida 6 ta belgi" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
      <View style={{ gap: 6 }}>
        <Txt variant="small" tone="muted" style={{ fontWeight: "600" }}>Universitet</Txt>
        <Chips options={UNIVERSITIES.slice(0, 14).map((u) => ({ id: u.short, label: u.short }))} value={uni} onChange={setUni} />
      </View>
      <View style={{ gap: 6 }}>
        <Txt variant="small" tone="muted" style={{ fontWeight: "600" }}>Viloyat</Txt>
        <Chips options={REGIONS.map((r) => ({ id: r, label: r }))} value={shownRegion} onChange={setRegion} />
      </View>
      <View style={{ gap: 6 }}>
        <Txt variant="small" tone="muted" style={{ fontWeight: "600" }}>O'qish turi</Txt>
        <Chips options={FUNDING_TYPES.map((f) => ({ id: f.code, label: f.label }))} value={funding} onChange={setFunding} />
      </View>
      <Btn label="Ro'yxatdan o'tish" loading={busy} disabled={!valid} onPress={submit} />
      <View style={{ alignItems: "center" }}>
        <Btn label="Hisobingiz bormi? Kiring" kind="ghost" small onPress={() => router.replace("/login")} />
      </View>
    </Screen>
  );
}
