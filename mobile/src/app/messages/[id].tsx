import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Btn, ErrorBox, Ico, Row, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { radius, useTheme } from "@/lib/theme";
import { timeAgo } from "@/lib/time";
import type { Msg, Thread } from "@/types";

export default function ThreadScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [thread, setThread] = useState<Thread | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const last = useRef(0);
  const list = useRef<FlatList<Msg>>(null);

  const pull = useCallback(async (first: boolean) => {
    const r = await api.get<Thread>(`/messages/with/${id}${first ? "" : `?after=${last.current}`}`);
    if (!r.data) { if (first) setError(r.error); return; }
    const d = r.data;
    if (d.messages.length) last.current = Math.max(last.current, ...d.messages.map((m) => m.id));
    setThread((cur) => first || !cur ? d : { ...cur, blocked: d.blocked, blocked_me: d.blocked_me, messages: [...cur.messages.filter((m) => !d.messages.some((n) => n.id === m.id)), ...d.messages] });
  }, [id]);

  useEffect(() => {
    last.current = 0; setThread(null); pull(true);
    const timer = setInterval(() => pull(false), 5000);
    return () => clearInterval(timer);
  }, [pull]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true); setError(null);
    const r = await api.post<{ message: Msg }>(`/messages/with/${id}`, { body });
    setSending(false);
    if (!r.data) { setError(r.error); return; }
    setText(""); last.current = Math.max(last.current, r.data.message.id);
    setThread((cur) => cur ? { ...cur, messages: [...cur.messages, r.data!.message] } : cur);
  };

  const toggleBlock = async () => {
    if (!thread) return;
    if (thread.blocked) { await api.del(`/messages/block/${id}`); pull(true); return; }
    Alert.alert("Bloklash", `${thread.user.name} sizga xabar yoza olmaydi.`, [
      { text: "Bekor qilish", style: "cancel" },
      { text: "Bloklash", style: "destructive", onPress: async () => { await api.post(`/messages/block/${id}`); pull(true); } },
    ]);
  };
  const report = () => Alert.alert("Shikoyat qilish", `${thread?.user.name} haqida administratorga xabar beramizmi?`, [
    { text: "Bekor qilish", style: "cancel" },
    { text: "Shikoyat yuborish", style: "destructive", onPress: async () => { const r = await api.post<{ message: string }>(`/messages/report/${id}`, { reason: "Chatdagi qoidabuzarlik" }); Alert.alert(r.error || r.data?.message || "Yuborildi"); } },
  ]);

  const closed = thread?.blocked || thread?.blocked_me;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: thread?.user.name ?? "Suhbat" }} />
      {thread && (
        <Row style={{ paddingHorizontal: 12, paddingVertical: 6, justifyContent: "flex-end" }} gap={4}>
          <Btn small kind="ghost" label={thread.blocked ? "Blokdan chiqarish" : "Bloklash"} icon="ban-outline" onPress={toggleBlock} />
          <Btn small kind="ghost" label="Shikoyat" icon="flag-outline" onPress={report} />
        </Row>
      )}
      <FlatList
        ref={list} data={thread?.messages ?? []} keyExtractor={(m) => String(m.id)} contentContainerStyle={{ padding: 12, gap: 8 }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={thread ? <Txt tone="muted" style={{ textAlign: "center", padding: 24 }}>Birinchi xabarni yozing.</Txt> : undefined}
        renderItem={({ item }) => (
          <View style={{ alignItems: item.mine ? "flex-end" : "flex-start" }}>
            <View style={{ maxWidth: "80%", backgroundColor: item.mine ? t.primary : t.card, borderColor: t.border, borderWidth: item.mine ? 0 : 1, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 8 }}>
              <Txt tone={item.mine ? "onPrimary" : "text"}>{item.body}</Txt>
              <Row style={{ justifyContent: "flex-end" }} gap={4}>
                <Txt variant="caption" style={{ color: item.mine ? "#dbeafe" : t.subtle }}>{timeAgo(item.created_at)}</Txt>
                {item.mine && <Ico name={item.read ? "checkmark-done" : "checkmark"} size={13} tone="subtle" />}
                {item.mine && <Txt variant="caption" style={{ color: "#dbeafe" }}>{item.read ? "O'qildi" : "Yuborildi"}</Txt>}
              </Row>
            </View>
          </View>
        )}
      />
      <View style={{ padding: 10, borderTopColor: t.border, borderTopWidth: 1, backgroundColor: t.card, gap: 6 }}>
        <ErrorBox text={error} />
        {closed ? <Txt variant="small" tone="muted" style={{ textAlign: "center" }}>{thread?.blocked ? "Siz bu foydalanuvchini bloklagansiz." : "Bu foydalanuvchiga xabar yubora olmaysiz."}</Txt> : (
          <Row>
            <TextInput value={text} onChangeText={setText} placeholder="Xabar yozing…" placeholderTextColor={t.subtle} accessibilityLabel="Xabar" maxLength={1000} onSubmitEditing={send}
              style={{ flex: 1, backgroundColor: t.input, borderColor: t.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, color: t.text, fontSize: 15 }} />
            <Btn label="Yuborish" small onPress={send} loading={sending} disabled={!text.trim()} />
          </Row>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
