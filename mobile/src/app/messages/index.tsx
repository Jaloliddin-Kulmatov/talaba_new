import React, { useCallback, useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Avatar, Btn, Card, Empty, ErrorBox, Loading, Row, Screen, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { radius, useTheme } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import type { Convo, Person } from "@/types";

export default function Messages() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [convos, setConvos] = useState<Convo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Person[] | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const r = await api.get<{ conversations: Convo[] }>("/messages/conversations");
    if (r.data) { setConvos(r.data.conversations); setError(null); } else { setError(r.error); setConvos((c) => c ?? []); }
  }, [user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return; }
    const id = setTimeout(async () => { const r = await api.get<{ users: Person[] }>(`/messages/users?q=${encodeURIComponent(q.trim())}`); setResults(r.data?.users ?? []); }, 300);
    return () => clearTimeout(id);
  }, [q]);

  if (!user) return <Screen><Empty icon="chatbubble-ellipses-outline" title="Xabarlar uchun kiring" action={<Btn label="Kirish" onPress={() => router.push("/login")} />} /></Screen>;

  return (
    <Screen refreshing={false} onRefresh={load}>
      <TextInput value={q} onChangeText={setQ} placeholder="Talabani ism bo'yicha qidiring" placeholderTextColor={t.subtle} accessibilityLabel="Talabani qidirish"
        style={{ backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: t.text }} />
      <ErrorBox text={error} onRetry={load} />
      {results !== null ? (
        results.length === 0 ? <Txt tone="muted" style={{ textAlign: "center", padding: 16 }}>Hech kim topilmadi.</Txt> : results.map((p) => (
          <Pressable key={p.id} onPress={() => router.push(`/messages/${p.id}`)} accessibilityRole="button" accessibilityLabel={p.name}>
            <Card><Row gap={12}><Avatar name={p.name} /><View style={{ flex: 1 }}><Txt variant="h3">{p.name}</Txt><Txt variant="caption" tone="subtle">{p.university}</Txt></View></Row></Card>
          </Pressable>
        ))
      ) : convos === null ? <Loading /> : convos.length === 0 ? (
        <Empty icon="chatbubble-ellipses-outline" title="Hali xabarlar yo'q" text="Yuqoridan talabani qidirib suhbat boshlang yoki savol-javobda “Xabar yozish” tugmasini bosing." />
      ) : convos.map((c) => (
        <Card key={c.user.id} onPress={() => router.push(`/messages/${c.user.id}`)} accessibilityLabel={`${c.user.name}${c.unread ? `, ${c.unread} ta o'qilmagan` : ""}`}>
          <Row gap={12}>
            <Avatar name={c.user.name} />
            <View style={{ flex: 1 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <Txt variant="h3" numberOfLines={1} style={{ flex: 1 }}>{c.user.name}</Txt>
                <Txt variant="caption" tone="subtle">{timeAgo(c.last.created_at)}</Txt>
              </Row>
              <Row style={{ justifyContent: "space-between" }}>
                <Txt variant="small" tone={c.unread ? "text" : "muted"} numberOfLines={1} style={{ flex: 1, fontWeight: c.unread ? "700" : "400" }}>{c.last.mine ? "Siz: " : ""}{c.last.body}</Txt>
                {c.unread > 0 && <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: t.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 }}><Txt variant="caption" tone="onPrimary" style={{ fontWeight: "800" }}>{c.unread}</Txt></View>}
              </Row>
            </View>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}
