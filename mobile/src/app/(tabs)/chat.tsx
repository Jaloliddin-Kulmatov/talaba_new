import React, { useCallback, useEffect, useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Badge, Btn, Card, Chips, Empty, ErrorBox, Ico, Loading, Row, Screen, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { radius, useTheme } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import type { Question } from "@/types";

type Filter = "all" | "unanswered";

export default function Chat() {
  const t = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const r = await api.get<{ posts: Question[] }>("/chat/posts");
    if (r.data) { setPosts(r.data.posts); setError(null); } else { setError(r.error); setPosts((p) => p ?? []); }
  }, []);
  useEffect(() => { load(); }, [load, user?.id]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (posts ?? []).filter((p) => (filter === "all" || p.answer_count === 0) && (!needle || p.title.toLowerCase().includes(needle) || p.content.toLowerCase().includes(needle)));
  }, [posts, q, filter]);

  const ask = () => (user ? router.push("/question/new") : router.push("/login"));

  return (
    <Screen refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <Btn label="Savol berish" icon="add-circle-outline" onPress={ask} />
      <TextInput value={q} onChangeText={setQ} placeholder="Savollarni qidiring" placeholderTextColor={t.subtle} accessibilityLabel="Savollarni qidirish"
        style={{ backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: t.text }} />
      <Chips options={[{ id: "all" as Filter, label: "Hammasi" }, { id: "unanswered" as Filter, label: "Javobsiz" }]} value={filter} onChange={setFilter} />
      <ErrorBox text={error} onRetry={load} />
      {posts === null ? <Loading /> : shown.length === 0 ? (
        <Empty icon="chatbubbles-outline" title="Savollar topilmadi" text="Birinchi bo'lib savol bering — hamjamiyat javob beradi." />
      ) : shown.map((p) => (
        <Card key={p.id} onPress={() => router.push(`/question/${p.id}`)} accessibilityLabel={p.title}>
          <Row style={{ marginBottom: 4 }} gap={6}>
            {p.solved && <Badge label="Hal qilindi" tone="success" icon="checkmark-circle" />}
            {p.scope ? <Badge label="Faqat universitet" tone="violet" /> : null}
          </Row>
          <Txt variant="h3">{p.title}</Txt>
          <Txt variant="small" tone="muted" numberOfLines={2} style={{ marginTop: 2 }}>{p.content}</Txt>
          <Row style={{ marginTop: 8, justifyContent: "space-between" }}>
            <Txt variant="caption" tone="subtle">{p.author_name}{p.author_university ? ` · ${p.author_university}` : ""} · {timeAgo(p.created_at)}</Txt>
            <Row gap={4}><Ico name="chatbubble-outline" size={14} tone="subtle" /><Txt variant="caption" tone="subtle">{p.answer_count}</Txt></Row>
          </Row>
        </Card>
      ))}
      <View style={{ height: 8 }} />
    </Screen>
  );
}
