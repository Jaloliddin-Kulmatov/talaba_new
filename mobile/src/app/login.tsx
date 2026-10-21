import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Btn, ErrorBox, Field, Screen, Txt } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setError(null);
    const e = await login(email, password);
    setBusy(false);
    if (e) setError(e); else router.replace("/(tabs)");
  };

  return (
    <Screen>
      <Txt variant="title">Qaytib kelganingiz bilan!</Txt>
      <Txt tone="muted">Hisobingizga kiring — ma'lumotlaringiz telefon va saytda sinxron bo'ladi.</Txt>
      <ErrorBox text={error} />
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <Field label="Parol" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" onSubmitEditing={submit} />
      <Btn label="Kirish" loading={busy} disabled={!email.trim() || !password} onPress={submit} />
      <View style={{ alignItems: "center" }}>
        <Btn label="Hisobingiz yo'qmi? Ro'yxatdan o'ting" kind="ghost" small onPress={() => router.replace("/register")} />
      </View>
    </Screen>
  );
}
