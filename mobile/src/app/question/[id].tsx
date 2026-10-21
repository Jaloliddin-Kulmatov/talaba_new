import React, { useCallback, useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Badge, Btn, Card, ErrorBox, Field, Loading, Row, Screen, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/lib/time";
import { useTheme } from "@/lib/theme";
import { relatedGuide } from "@shared/guide-topics";
import { SITE_URL } from "@/lib/config";
import * as WebBrowser from "expo-web-browser";
import type { Question } from "@/types";

export default function QuestionDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api.get<{ post: Question }>(`/chat/posts/${id}`);
    if (r.data) { setPost(r.data.post); setError(null); } else setError(r.error);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (!post) return <Screen><ErrorBox text={error} onRetry={load} />{!error && <Loading rows={2} height={120} />}</Screen>;

  const mine = user?.id === post.user_id;
  const guide = relatedGuide(`${post.title} ${post.content}`);

  const send = async () => {
    setBusy(true); setError(null);
    const r = await api.post(`/chat/posts/${post.id}/answers`, { content: reply.trim() });
    setBusy(false);
    if (r.error) { setError(r.error); return; }
    setReply(""); load();
  };
  const accept = async (answerId: number) => { await api.post(`/chat/posts/${post.id}/accept/${answerId}`); load(); };
  const report = (answerId: number) =>
    Alert.alert("Shikoyat qilish", "Bu javob qoidalarni buzadimi?", [
      { text: "Bekor qilish", style: "cancel" },
      { text: "Shikoyat yuborish", style: "destructive", onPress: async () => { const r = await api.post<{ message: string }>(`/chat/answers/${answerId}/report`, { reason: "Qoidabuzarlik" }); setNote(r.error || r.data?.message || null); load(); } },
    ]);
  const removeAnswer = async (answerId: number) => { await api.del(`/chat/answers/${answerId}`); load(); };
  const removePost = async () => { const r = await api.del(`/chat/posts/${post.id}`); if (!r.error) router.back(); else setError(r.error); };

  return (
    <Screen>
      <Card>
        <Row style={{ marginBottom: 6 }}>{post.solved && <Badge label="Hal qilindi" tone="success" icon="checkmark-circle" />}</Row>
        <Txt variant="h2">{post.title}</Txt>
        <Txt variant="caption" tone="subtle" style={{ marginVertical: 4 }}>{post.author_name}{post.author_university ? ` · ${post.author_university}` : ""} · {timeAgo(post.created_at)}</Txt>
        <Txt>{post.content}</Txt>
        {guide && <Btn label={`Foydali qo'llanma: ${guide.label}`} icon="book-outline" kind="soft" small style={{ marginTop: 10 }} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}${guide.href}`)} />}
        {mine && <Btn label="Savolni o'chirish" kind="danger" small style={{ marginTop: 8 }} onPress={removePost} />}
      </Card>

      <Txt variant="h3">{post.answer_count} ta javob</Txt>
      {note && <Txt variant="small" tone="muted">{note}</Txt>}
      {(post.answers ?? []).map((a) => {
        const best = post.accepted_answer_id === a.id;
        return (
          <Card key={a.id} style={best ? { borderColor: t.success, borderWidth: 1.5 } : undefined}>
            {best && <Badge label="Eng yaxshi javob" tone="success" icon="checkmark-circle" />}
            <Txt variant="caption" tone="subtle" style={{ marginVertical: 4 }}>{a.author_name}{a.author_university ? ` · ${a.author_university}` : ""} · {timeAgo(a.created_at)}</Txt>
            <Txt>{a.content}</Txt>
            {user && (
              <Row style={{ marginTop: 8, flexWrap: "wrap" }} gap={6}>
                {mine && <Btn small kind="ghost" icon="checkmark-circle-outline" label={best ? "Tanlovni bekor qilish" : "Eng yaxshi deb belgilash"} onPress={() => accept(a.id)} />}
                {user.id !== a.user_id && <Btn small kind="ghost" icon="mail-outline" label="Xabar yozish" onPress={() => router.push(`/messages/${a.user_id}`)} />}
                {user.id !== a.user_id && <Btn small kind="ghost" icon="flag-outline" label="Shikoyat" onPress={() => report(a.id)} />}
                {user.id === a.user_id && <Btn small kind="danger" label="O'chirish" onPress={() => removeAnswer(a.id)} />}
              </Row>
            )}
          </Card>
        );
      })}

      {user ? (
        <View style={{ gap: 8 }}>
          <Field label="Javobingiz" value={reply} onChangeText={setReply} multiline maxLength={3000} placeholder="Nima yordam bergani, foydali havolalar…" />
          <ErrorBox text={error} />
          <Btn label="Javob berish" loading={busy} disabled={!reply.trim()} onPress={send} />
        </View>
      ) : (
        <Btn label="Javob berish uchun kiring" onPress={() => router.push("/login")} />
      )}
    </Screen>
  );
}
