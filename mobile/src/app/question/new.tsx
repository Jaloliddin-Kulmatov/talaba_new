import React, { useState } from "react";
import { Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { Btn, ErrorBox, Field, Row, Screen, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import type { Question } from "@/types";

export default function NewQuestion() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [uniOnly, setUniOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setError(null);
    const r = await api.post<{ post: Question }>("/chat/posts", { title: title.trim(), content: content.trim(), scope: uniOnly ? "university" : "all" });
    setBusy(false);
    if (r.error || !r.data) { setError(r.error); return; }
    router.replace(`/question/${r.data.post.id}`);
  };

  return (
    <Screen>
      <ErrorBox text={error} />
      <Field label="Savol sarlavhasi" value={title} onChangeText={setTitle} maxLength={200} placeholder="Masalan: Yotoqxonaga qanday joylashaman?" />
      <Field label="Batafsil" value={content} onChangeText={setContent} multiline maxLength={3000} placeholder="Vaziyatingizni yozing…" />
      {user?.university ? (
        <Row style={{ justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Txt variant="h3">Faqat {user.university} talabalari</Txt>
            <Txt variant="caption" tone="subtle">Yoqilsa, savolni faqat universitetingiz talabalari ko'radi.</Txt>
          </View>
          <Switch value={uniOnly} onValueChange={setUniOnly} trackColor={{ true: t.primary }} accessibilityLabel="Faqat universitet talabalari" />
        </Row>
      ) : null}
      <Btn label="Joylash" loading={busy} disabled={title.trim().length < 5 || content.trim().length < 5} onPress={submit} />
    </Screen>
  );
}
